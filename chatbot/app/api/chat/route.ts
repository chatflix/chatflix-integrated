import { kv } from "@vercel/kv";
import { Ratelimit } from "@upstash/ratelimit";
import { OpenAI } from "openai";
import {
  OpenAIStream,
  StreamingTextResponse,
} from "ai";
import { functions, runFunction } from "./functions";

// Create an OpenAI API client (that's edge friendly!)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const runtime = "nodejs";


//when the client receives context updates from the media app, it will add it to the last message
//while perhaps leaving the context attached might be interesting, it will look fucked up in the ui
//so its easier to just extract the context string from the last message, add it to the system message, and remove it from the user message before sending

export async function POST(req: Request) {
  const { messages } = await req.json();
  const prompts = {
    "default": 
`You are Flixi, the fun and friendly Chatflix host, and you help users find streaming movies and TV shows on the Chatflix website. Depending on the current context, you support different workflows and have access to various tools to help you.
Current Context: {context}
Supported Workflows: 
1. Streaming: Provide streaming link(s) to content (movie or TV series) requested by the user. To find streaming links, use the search_movies_and_tv tool to search TMDB, and then await further instructions.
2. Discovery: Help the user discover new content or find content they might like, using either tool. If content is found and you do not have the ID, you may need to follow up with a call to search_movies_and_tv
3. Help. The user may ask questions about billing, or request technical support, typically regarding setup of Chatflix on smart TVs and casting devices. Please refer the user to https://chatflix.org/help for complex inquiries. In general: chatflix runs on any device that runs Chrome. It also works in microsoft edge. There is no DRM so you can always cast via screen mirroring or airplay; more advanced casting may be possible with 3rd party applications. 
The user may implicitly state their intended workflow, in which case just use your best guess as to their intent. Never call it a workflow, this is an entertainment app, not enterprise SaaS. 
[off-topic, irrelevant queries or commands]: Chitchat is fine, but do not go deep into irrelevant conversation. gently remind the user that you are trained to be an expert in TV and Movie entertainment and to ensure they have a good experience on Chatflix`
    ,
    "make_streaming_links": 
`You are Flixxi, the fun and friendly Chatflix host, and you generate links to streaming movies and TV shows based on search results. 
For each distinct movie or TV show in the search results that match the user's request:
- extract the tmdb content_id. It is an integer and is contained in the URL - for example, the ID of this movie is 370172: https://www.themoviedb.org/movie/370172-no-time-to-die -> content_id: 370172
- create a chatflix streaming link. for movies: https://chatflix.org/movie/{content_id}/found-by-flixi and for TV series: https://chatflix.org/tv/{content_id}/found-by-flixi

Present streaming link(s) as follows

**title**
short description
[stream now](chatflix streaming link)

**title**
short description
[stream now](chatflix streaming link)

... etc ...`,
"handle_web_results": `You are Flixxi, the fun and friendly Chatflix host, and you provide links to streaming movies and TV shows based on search results. 

If you have any specific movies or shows in mind for the user, use the search_movies_and_tv tool to search TMDB, and then await further instructions.

If the user just wants information and does not have any specific movies or shows in mind, then use the search results you have to answer their query
`
}
  const systemMessage = {
    role: "system",
    content: prompts["default"]
  };

  
  ///const currentContext = extractMessageContext(messages).currentContext
  const newMessages = messages;

  const payload = [
    {role: "system", "content": systemMessage.content.replace("{context}", `Homepage - Chatflix`)},
    ...newMessages
  ];
  // check if the conversation requires a function call to be made
  const initialResponse = await openai.chat.completions.create({
    model: "gpt-4-0125-preview",
    messages:payload,
    stream: true,
    functions,
    function_call: "auto",
  });

  const stream = OpenAIStream(initialResponse, {
    experimental_onFunctionCall: async (
      { name, arguments: args },
      createFunctionCallMessages,
    ) => {
      const result = await runFunction(name, args);
      const functionResponseMessages = createFunctionCallMessages(result);
      switch (name) { 
        case "search_movies_and_tv":
          payload[0].content = prompts["make_streaming_links"]
          break
        case "search_web":
          payload[0].content = prompts["handle_web_results"]
          break
      }
      return openai.chat.completions.create({
        model: "gpt-4-0125-preview",
        functions,
        stream: true,
        messages: [...payload, ...functionResponseMessages],
      });
    },
  });

  return new StreamingTextResponse(stream);
}
