require("dotenv/config")

  // Imports the Google Cloud client library
  const textToSpeech = require('@google-cloud/text-to-speech');

  // Import other required libraries
  const fs = require('fs');
  const util = require('util');
  // Creates a client
  const client = new textToSpeech.TextToSpeechClient();

  async function demoAllGoodVoices(text) {
    // Performs list voices request
    const [result] = await client.listVoices({languageCode: 'en-US'});
    const voices = result.voices.map(v => {
      return {
        name: v.name,
        ssmlGender: v.ssmlGender,
        naturalSampleRateHertz: v.naturalSampleRateHertz,
        languageCode: 'en-US'
      };
    });

    console.log('Voices:');
    for (const voice of voices) {
      console.log(`Name: ${voice.name}`); 
      console.log(`  SSML Voice Gender: ${voice.ssmlGender}`);
      console.log(`  Natural Sample Rate Hertz: ${voice.naturalSampleRateHertz}`);
    
      //now speak the text directly (output the audio to the speakers) using the current voice
        const request = {
        input: {text: text},
        // Select the voice by name.
        // Note: the voice can also be specified by name.
          voice:voice,
          audioConfig: {audioEncoding: 'MP3'},
        };
        const [response] = await client.synthesizeSpeech(request);
       //stream the binary output to the speaker
        const writeFile = util.promisify(fs.writeFile);
      await writeFile('output.mp3', response.audioContent, 'binary');
      console.log('Audio content written to file: output.mp3');

      //play the mp3
      const exec = require('child_process').exec;
      exec('mpg123 output.mp3', (err, stdout, stderr) => {
        if (err) {
          console.error(err);
        } else {
          console.log(stdout);
        }
      });

      //delete the mp3 and wait 5 seconds
      await new Promise(resolve => setTimeout(resolve, 5000));
      await exec('rm output.mp3', (err, stdout, stderr) => {
        if (err) {
          console.error(err);
        } else {
          console.log(stdout);
        }
      });
    }
  }

    

  async function quickStart() {
    // The text to synthesize
    const text = 'hello, world!';

    // Construct the request
    const request = {
      input: {text: text},
      // Select the language and SSML voice gender (optional)
      voice: {languageCode: 'en-US',name: 'en-US-Standard-C', ssmlGender: 'NEUTRAL'},
      // select the type of audio encoding
      audioConfig: {audioEncoding: 'MP3'},
    };

    // Performs the text-to-speech request
    const [response] = await client.synthesizeSpeech(request);
    // Write the binary audio content to a local file
    const writeFile = util.promisify(fs.writeFile);
    await writeFile('output.mp3', response.audioContent, 'binary');
    console.log('Audio content written to file: output.mp3');
  }

  //get the text to speak from the command line argument
  const text = process.argv[2] || "hello, world!";

  demoAllGoodVoices(text).then(console.log("done"));
  //quickStart().then(console.log("done")););