import { CompletionCreateParams } from "openai/resources/chat/index";
import { ddg } from "./external_tools/ddg";
export const functions: CompletionCreateParams.Function[] = [
  {
    name: "search_movies_and_tv",
    description:
      "Searches for movies, TV series, or both, on themoviedb.org (tmdb).",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Query to search for. Must be at least 3 characters long.",
        },
        limit: {
          type: "number",
          description: "The number of results to return. Defaults to 10.",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "search_web",
    description:
      "Search the web using DuckDuckGo. All normal query operators are supported",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Query to search for. Must be at least 3 characters long.",
        },
        limit: {
          type: "number",
          description: "The number of results to return. Defaults to 10.",
        },
      },
      required: ["query"],
    },
  }

];

async function search_movies_and_tv(query: any, limit: number = 15) {
  const response = await ddg(`${query} site:themoviedb.org`, limit);
  return response;
}
async function search_web(query: any, limit: number = 15) {
  const response = await ddg(`${query}`, limit);
  return response;
}

export async function runFunction(name: string, args: any) {
  switch (name) {
    case "search_movies_and_tv":
      return await search_movies_and_tv(args["query"], args["limit"]);
    case "search_web":
      return await search_web(args["query"], args["limit"]);
    default:
      return null;
  }
}
