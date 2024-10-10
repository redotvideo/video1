export interface SceneDefinition {
	objects: SceneObject[];
}

export type SceneObject =
	| TextObject
	| ShapeObject
	| ImageObject
	| VideoObject
	| AudioObject
	| SubtitleObject;

export interface BaseSceneObject {
	type: 'text' | 'rect' | 'image' | 'video' | 'audio' | 'subtitle';
	startTime: number; // at which second the object appears
	endTime: number; // at which second the object disappears, has to be higher than startTime
	position: {x: number; y: number}; // 0,0 is center of video. If you have a 1920x1080 video, the top right corner is {x: 960, y: -540}.
	color: string; // hex code, or also just "white", "blue", etc.
	appearInAnimation?: AppearAnimation; // the animation that makes the object appear, e.g. a fade-in
	disappearAnimation?: AppearAnimation; // the animation that makes the object disappear, e.g. a fade-out
	animations?: Animation[]; // general animations, like scaling up or moving objects to specific coordinates
}

export interface AppearAnimation {
	type: 'fade' | 'scale';
	duration: number;
}

export type Length = number | `${number}%`;

export interface TextObject extends BaseSceneObject {
	type: 'text';
	fontSize: number; // from 10 to 200
	fontFamily: 'Roboto' | 'Luckiest Guy';
	textContent: string; // the actual text
}

export interface ShapeObject extends BaseSceneObject {
	type: 'rect';
	width: Length;
	height: Length;
}

export interface ImageObject extends BaseSceneObject {
	type: 'image';
	src: string;
	width?: Length; // Optional width and height for the image. You may want to specify only one of them to maintain the aspect ratio.
	height?: Length;
}

export interface VideoObject extends BaseSceneObject {
	type: 'video';
	src: string;
	videoStartTime?: number; // At which second the video should start playing. Defaults to 0.
	height?: Length; // Optional height for the video. You may want to specify only one of them to maintain the aspect ratio.
	width?: Length;
}

export interface AudioObject extends BaseSceneObject {
	type: 'audio';
	src: string;
	audioStartTime?: number; // At which second the audio should start playing. Defaults to 0.
}

export interface SubtitleObject {
	type: 'subtitle';
	startTime: number;
	words: VoiceoverAsset['properties']['words'];
}

export interface Animation {
	type: 'moveTo' | 'changeOpacity' | 'scale';
	options: MoveToAnimationOptions | OpacityAnimationOptions | ScaleAnimationOptions;
	startTime: number;
	endTime: number;
}

export interface MoveToAnimationOptions {
	x: number; // for x and y, we only indicate the diff with respect to the current position, not the absolute position, so this is relative to the actual position value
	y: number;
}

export interface OpacityAnimationOptions {
	targetOpacity: number;
}

export interface ScaleAnimationOptions {
	targetScale: number; // refers to the factor the size is scaled by, e.g. two means double of the original size
}

// Assets can be generated by instructions from the AI assistant

export type Asset = VoiceoverAsset | AiImageAsset | StockImageAsset | StockVideoAsset;

export interface VoiceoverAsset {
	type: 'voiceover';
	instructions: {
		text: string;
		voice: 'Sarah' | 'Michael';
	};
	properties: {
		filePath: string; // path to the audio file of the voiceover
		words: WordInfo[]; // word timestamps
	};
}

export interface AiImageAsset {
	type: 'ai_image';
	instructions: {
		prompt: string;
	};
	properties?: {
		filePath: string; // path to the audio file of the voiceover
	};
}
export interface StockImageAsset {
	type: 'stock_image';
	instructions: {
		prompt: string;
		orientation: 'horizontal' | 'vertical';
	};
	properties?: {
		filePath: string;
	};
}

export interface StockVideoAsset {
	type: 'stock_video';
	instructions: {
		prompt: string;
	};
	properties?: {
		filePath: string;
		duration: number;
		width: number;
		height: number;
	};
}

export interface WordInfo {
	word: string;
	start: number; // start time in seconds
	end: number;
}
