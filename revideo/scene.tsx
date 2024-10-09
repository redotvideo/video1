/** @jsxImportSource @revideo/2d/lib */
import {Img, Layout, Rect, Txt, Video, View2D, makeScene2D} from '@revideo/2d';
import {all, Reference, createRef, useScene, chain, waitFor} from '@revideo/core';

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

export type Length = number | `${number}%`;

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

export default makeScene2D('main', function* (view) {
	// Get variables
	const sceneDescription = useScene().variables.get('sceneDefinition', {
		objects: [],
	})() as SceneDefinition;

	view.fill('white');

	const generators: any[] = [];

	console.log(sceneDescription);

	// Loop through each object in the sceneDescription
	for (const obj of sceneDescription.objects) {
		// Instead of executing showElement directly, push a generator function into the array
		generators.push(showElement(view, obj));
	}

	// Use yield* all() with the spread operator to execute all generator functions concurrently
	yield* all(...generators);
});

const objectTypes = {
	text: Txt,
	rect: Rect,
	image: Img,
	video: Video,
};

const appearAnimation = {
	fade: fadeIn,
	scale: scaleIn,
};

const disappearAnimation = {
	fade: fadeOut,
	scale: scaleOut,
};

function* showElement(view: View2D, object: SceneObject) {
	yield* waitFor(object.startTime);

	const durationToShow = getDurationToShow(object);
	const Component = objectTypes[object.type];

	const ref = createRef() as Reference<typeof Component>;

	let props: any = {
		x: object.position.x,
		y: object.position.y,
		ref,
	};

	// Add additional props for specific object types
	if (object.type === 'text') {
		props = {
			...props,
			text: object.textContent,
			fontSize: object.fontSize,
			fontFamily: object.fontFamily,
		};
	}
	if (object.type === 'rect') {
		props = {
			...props,
			width: object.width,
			height: object.height,
			fill: object.color,
		};
	}
	if (object.type === 'image') {
		props = {
			...props,
			src: object.src,
			...(object.width && {width: object.width}),
			...(object.height && {height: object.height}),
		};
	}
	if (object.type === 'video') {
		props = {
			...props,
			src: object.src,
			time: object.videoStartTime || 0,
			play: true,
			...(object.width && {width: object.width}),
			...(object.height && {height: object.height}),
		};
	}

	yield view.add(<Component {...props} />);

	const generators = [];

	if (object.animations) {
		generators.push(...buildAnimations(ref as any, object.animations, object));
	}

	if (object.appearInAnimation) {
		yield* appearAnimation[object.appearInAnimation.type](
			ref as any,
			object.appearInAnimation.duration,
		);
	}

	yield* all(...[waitFor(durationToShow)], ...generators);

	if (object.disappearAnimation) {
		yield* disappearAnimation[object.disappearAnimation.type](
			ref as any,
			object.disappearAnimation.duration,
		);
	}

	const refValue = ref();
	if ('remove' in refValue) {
		(refValue.remove as any)();
	}
}

function buildAnimations(ref: Reference<Layout>, animations: Animation[], element: SceneObject) {
	const animationGenerators = [];

	for (const ani of animations) {
		const waitTime = ani.startTime - element.startTime;
		if (ani.type === 'moveTo') {
			const animationOptions = ani.options as MoveToAnimationOptions;
			animationGenerators.push(
				chain(
					waitFor(waitTime),
					moveTo(ref, animationOptions.x, animationOptions.y, ani.endTime - ani.startTime),
				),
			);
		}

		if (ani.type === 'scale') {
			const animationOptions = ani.options as ScaleAnimationOptions;
			animationGenerators.push(
				chain(
					waitFor(waitTime),
					animateScale(ref, animationOptions.targetScale, ani.endTime - ani.startTime),
				),
			);
		}

		if (ani.type === 'changeOpacity') {
			const animationOptions = ani.options as OpacityAnimationOptions;
			animationGenerators.push(
				chain(
					waitFor(waitTime),
					animateOpacity(ref, animationOptions.targetOpacity, ani.endTime - ani.startTime),
				),
			);
		}
	}

	return animationGenerators;
}

function getDurationToShow(object: SceneObject) {
	let durationToShow = object.endTime - object.startTime;

	// Optionally subtract the duration of the appearInAnimation if it exists
	if (object.appearInAnimation) {
		durationToShow -= object.appearInAnimation.duration;
	}

	// Optionally subtract the duration of the disappearAnimation if it exists
	if (object.disappearAnimation) {
		durationToShow -= object.disappearAnimation.duration;
	}

	return durationToShow;
}

function* fadeIn(ref: Reference<Layout>, duration: number) {
	ref().opacity(0);
	yield* ref().opacity(1, duration);
}

function* fadeOut(ref: Reference<Layout>, duration: number) {
	yield* ref().opacity(0, duration);
}

function* scaleIn(ref: Reference<Layout>, duration: number) {
	ref().scale(0);
	yield* ref().scale(1, duration);
}

function* scaleOut(ref: Reference<Layout>, duration: number) {
	yield* ref().scale(0, duration);
}

function* animateOpacity(ref: Reference<Layout>, targetOpacity: number, duration: number) {
	yield* ref().opacity(targetOpacity, duration);
}

function* animateScale(ref: Reference<Layout>, targetScale: number, duration: number) {
	yield* ref().scale(targetScale, duration);
}

function* moveTo(ref: Reference<Layout>, x: number, y: number, duration: number) {
	yield* all(
		ref().position.x(ref().position.x() + x, duration),
		ref().position.y(ref().position.y() + y, duration),
	);
}
