'use server';

import OpenAI from 'openai';
import fs from 'fs/promises';
import path from 'path';


const FILES = ["./marketing.tsx", "./moving-object.tsx", "./stitch.tsx", "./subtitles.tsx"];

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

async function readExampleFiles(files: string[]): Promise<string> {
    const exampleDir = path.join(process.cwd(), 'examples');

    let examples = '';
    for (const file of files) {
            const content = await fs.readFile(path.join(exampleDir, file), 'utf-8');
            examples += `File: ${file}\n\`\`\`tsx\n${content}\n\`\`\`\n\n`;
    }

    return examples;
}


// { "objects": [ { "text": "Hello World", "fontSize": 50, "fontType": "Roboto", "startTime": 0, "endTime": 3, "appearInAnimation": { "type": "fade", "duration": 1 }, "disappearAnimation": { "type": "fade", "duration": 1 } } ] }
function buildInstruction(instruction: string, sceneState: any){
    const SYSTEM = `
You are an AI tasked with writing Revideo code to create videos. Revideo is a framework for programmatic video editing that lets you create videos with code. Here are a few example scenes that let you understand how to define videos with it:

${readExampleFiles(FILES)}

Here is a descripton of the video you are supposed to create:

${instruction}

Now write the code wrapped like this: \`\`\`tsx <your code> \`\`\`. It should have a default export of makeScene2D. IMPORTANT: Only use the dependencies present in the example scenes and nothing else!!!
`

return SYSTEM;
}




export async function sendInstructionToGPT(instruction: string, sceneState: any): Promise<any> {
    try {
        console.log("sending request");
        const chatCompletion = await openai.chat.completions.create({
            model: "o1-preview",
            messages: [
                { role: "user", content: buildInstruction(instruction, sceneState)}
            ],
        });

        console.log("prompt", buildInstruction(instruction, sceneState));
    
        console.log("response", chatCompletion.choices[0].message.content);

        if(!chatCompletion.choices[0].message.content){
            throw Error("empty response");
        }
    
        // Function to find the outermost JSON object
        function findOutermostJSON(str: string): string | null {
            let depth = 0;
            let start = -1;
            
            for (let i = 0; i < str.length; i++) {
                if (str[i] === '{') {
                    if (depth === 0) start = i;
                    depth++;
                } else if (str[i] === '}') {
                    depth--;
                    if (depth === 0 && start !== -1) {
                        return str.substring(start, i + 1);
                    }
                }
            }
            
            return null;
        }

        const jsonString = findOutermostJSON(chatCompletion.choices[0].message.content);
        if (jsonString) {
            const jsonResponse = JSON.parse(jsonString);
            return jsonResponse;
        } else {
            throw new Error('No valid JSON found in response');
        }
    } catch (error) {
        console.error('Error in sendInstructionToGPT:', error);
        throw new Error('Failed to process the instruction');
    }
}