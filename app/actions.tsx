'use server';

import OpenAI from 'openai';

const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});

// { "objects": [ { "text": "Hello World", "fontSize": 50, "fontType": "Roboto", "startTime": 0, "endTime": 3, "appearInAnimation": { "type": "fade", "duration": 1 }, "disappearAnimation": { "type": "fade", "duration": 1 } } ] }
function buildInstruction(instruction: string, sceneState: any) {
	const SYSTEM = `
You are an AI copilot embedded into a video editor. Users can chat with you to create and edit videos, and your job is to create a JSON video representation that is converted into an actual video. The video format is 1920x1080.

Here is the typescript scene definition:

\`\`\`
interface SceneDefinition {
	objects: SceneObject[];
}

type SceneObject = TextObject | ShapeObject | ImageObject | VideoObject;

interface BaseSceneObject {
	type: 'text' | 'rect' | 'image' | 'video';
	startTime: number; // at which second the object appears
	endTime: number; // at which second the object disappears, has to be higher than startTime
	position: {x: number; y: number}; // 0,0 is center of video. If you have a 1920x1080 video, the top right corner is {x: 960, y: -540}.
	color: string; // hex code, or also just "white", "blue", etc.
	appearInAnimation?: AppearAnimation; // the animation that makes the object appear, e.g. a fade-in
	disappearAnimation?: AppearAnimation; // the animation that makes the object disappear, e.g. a fade-out
	animations?: Animation[]; // general animations, like scaling up or moving objects to specific coordinates
}

interface AppearAnimation {
	type: 'fade' | 'scale';
	duration: number;
}

export type Length = number | \`\${number}%\`;

interface TextObject extends BaseSceneObject {
	type: 'text';
	fontSize: number; // from 10 to 200
	fontFamily: 'Roboto' | 'Luckiest Guy';
	textContent: string; // the actual text
}

interface ShapeObject extends BaseSceneObject {
	type: 'rect';
	width: Length;
	height: Length;
}

interface ImageObject extends BaseSceneObject {
	type: 'image';
	src: string;
	width?: Length; // Optional width and height for the image. You may want to specify only one of them to maintain the aspect ratio.
	height?: Length;
}

interface VideoObject extends BaseSceneObject {
	type: 'video';
	src: string;
	videoStartTime?: number; // At which second the video should start playing. Defaults to 0.
	duration: number; // For how long the video should play from the startTime in seconds.
	height?: Length; // Optional height for the video. You may want to specify only one of them to maintain the aspect ratio.
	width?: Length;
}

interface Animation {
	type: 'moveTo' | 'changeOpacity' | 'scale';
	options: MoveToAnimationOptions | OpacityAnimationOptions | ScaleAnimationOptions;
	startTime: number;
	endTime: number;
}

interface MoveToAnimationOptions {
	x: number; // for x and y, we only indicate the diff with respect to the current position, not the absolute position, so this is relative to the actual position value
	y: number;
}

interface OpacityAnimationOptions {
	targetOpacity: number;
}

interface ScaleAnimationOptions {
	targetScale: number; // refers to the factor the size is scaled by, e.g. two means double of the original size
}
\`\`\`

You have the following external srcs available for image and video objects:
Video:
- https://revideo-example-assets.s3.amazonaws.com/stars.mp4
Image:
- https://revideo-example-assets.s3.amazonaws.com/revideo-logo-white.png

Here is the initial state of the scene:

\`\`\`
${JSON.stringify(sceneState)}
\`\`\`

A user will provide an instruction. You should only return a JSON, importantly JSON representation of the scene which follows the type definition! Here is the user message:

${instruction}`;

	return SYSTEM;
}

export async function sendInstructionToGPT(instruction: string, sceneState: any): Promise<any> {
	try {
		const chatCompletion = await openai.chat.completions.create({
			model: 'o1-preview',
			messages: [{role: 'user', content: buildInstruction(instruction, sceneState)}],
		});

		console.log('response', chatCompletion.choices[0].message.content);

		if (!chatCompletion.choices[0].message.content) {
			throw Error('empty response');
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
