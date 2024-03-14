import { exec } from 'child_process';
const TOOLS_PATH = 'app/api/chat/external_tools/';
// Make the function async and return a Promise<string>
export async function ddg(query: string, maxResults: number): Promise<string> {
    // Construct the command to run the Python script with the given arguments
    const command = `${process.env.PYTHON_INTERPRETER} ${TOOLS_PATH}ddg.py "${query}" -n ${maxResults}`;
  
    // Return a Promise that resolves with the output of the Python script
    return new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          reject(`exec error: ${error}`);
          return;
        }
        if (stderr) {
          reject(`stderr: ${stderr}`);
          return;
        }
        console.log(stdout)
        resolve(stdout);
      });
    });
  }