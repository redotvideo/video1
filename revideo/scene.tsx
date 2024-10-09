/** @jsxImportSource @revideo/2d/lib */
import {Gradient, Img, Layout, Line, Rect, Spline, Txt, View2D, makeScene2D} from '@revideo/2d';
import {all, Reference, createRef, useScene, chain, Vector2, waitFor} from '@revideo/core';

interface AppearAnimation {
	type: "fade" | "scale";
	duration: number;
}

interface sceneObject {
	type: "text" | "rect";
	startTime: number; // at which second the object appears
	endTime: number; // at which second the object disappears, has to be higher than startTime
	position: {x: number, y: number}; // 0,0 is center of video. If you have a 1920x1080 video, the top right corner is {x: 960, y: -540}.
	color: string; // hex code, or also just "white", "blue", etc.
	appearInAnimation?: AppearAnimation; // the animation that makes the object appear, e.g. a fade-in
	disappearAnimation?: AppearAnimation; // the animation that makes the object disappear, e.g. a fade-out
	animations?: Animation[] // general animations, like scaling up or moving objects to specific coordinates
}

interface textObject extends sceneObject {
	fontSize: number; // from 10 to 200
	fontFamily: "Roboto" | "Luckiest Guy";
	textContent: string; // the actual text
}

interface sceneDefinition {
	objects: sceneObject[];
}

interface Animation {
	type: "moveTo" | "changeOpacity" | "scale";
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
	const sceneDescription = useScene().variables.get("sceneDefinition", {objects: []})() as sceneDefinition;

	view.fill("white");

    const generators: any[] = [];

	console.log(sceneDescription);

    // Loop through each object in the sceneDescription
    for (const el of sceneDescription.objects) {
        // Instead of executing showElement directly, push a generator function into the array
        generators.push(showElement(view, el as textObject));
    }

    // Use yield* all() with the spread operator to execute all generator functions concurrently
    yield* all(...generators);
});

const objectTypes = {
	text: Txt,
	rect: Rect
}

const appearAnimation = {
    fade: fadeIn,
    scale: scaleIn,
};

const disappearAnimation = {
    fade: fadeOut,
    scale: scaleOut,
};


function* showElement(view: View2D, object: textObject) {
	console.log("object.starttime", object.textContent, object.startTime);
    yield* waitFor(object.startTime);

	console.log("AHHH")

	const durationToShow = getDurationToShow(object);
	const Component = objectTypes[object.type];
    if (!Component) {
        console.error(`Unsupported object type: ${object.type}`);
        return;
    }

	const ref = createRef() as Reference<Txt> | Reference<Rect>;

	const x = object.position.x;
	const y = object.position.y;

	yield view.add(
		<Component
			text={object.textContent}
			x={x}
			y={y}
			fontSize={object.fontSize}
			fontFamily={object.fontFamily}
			ref={ref}
		/>
	);

	let animationGenerators: any = [];

	if(object.animations){
		animationGenerators = buildAnimations(ref as any, object.animations, object)
	}


	if(object.appearInAnimation){
		yield* appearAnimation[object.appearInAnimation.type](ref as any, object.appearInAnimation.duration);
	}

	console.log("animationgenerators", animationGenerators);
	console.log("durationtoshow", object.textContent, durationToShow);

	yield* all(...([waitFor(durationToShow)]), ...animationGenerators);

	if(object.disappearAnimation){
		yield* disappearAnimation[object.disappearAnimation.type](ref as any, object.disappearAnimation.duration);
	}

	ref().remove();
}

function buildAnimations(ref: Reference<Layout>, animations: Animation[], element: sceneObject){
	const animationGenerators: any = [];

	for(const ani of animations){
		const waitTime = ani.startTime - element.startTime;
		if(ani.type === "moveTo"){
			const animationOptions = ani.options as MoveToAnimationOptions;
			animationGenerators.push(
				chain(
					waitFor(waitTime),
					moveTo(ref, animationOptions.x, animationOptions.y, ani.endTime-ani.startTime)
				)
			)
		}

		if(ani.type === "scale"){
			const animationOptions = ani.options as ScaleAnimationOptions;
			animationGenerators.push(
				chain(
					waitFor(waitTime),
					animateScale(ref, animationOptions.targetScale, ani.endTime-ani.startTime)
				)
			)
		}

		if(ani.type === "changeOpacity"){
			const animationOptions = ani.options as OpacityAnimationOptions;
			animationGenerators.push(
				chain(
					waitFor(waitTime),
					animateOpacity(ref, animationOptions.targetOpacity, ani.endTime-ani.startTime)
				)
			)
		}
	}

	return animationGenerators;
}

function getDurationToShow(object: sceneObject){
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

function* fadeIn(ref: Reference<Layout>, duration: number){
	ref().opacity(0);
	yield* ref().opacity(1, duration);
}

function* fadeOut(ref: Reference<Layout>, duration: number){
	yield* ref().opacity(0, duration);
}

function* scaleIn(ref: Reference<Layout>, duration: number){
	ref().scale(0);
	yield* ref().scale(1, duration);
}

function* scaleOut(ref: Reference<Layout>, duration: number){
	yield* ref().scale(0, duration);
}

function* animateOpacity(ref: Reference<Layout>, targetOpacity: number, duration: number){
	yield* ref().opacity(targetOpacity, duration);
}

function* animateScale(ref: Reference<Layout>, targetScale: number, duration: number){
	yield* ref().scale(targetScale, duration);
}

function* moveTo(ref: Reference<Layout>, x: number, y: number, duration: number){
	yield* all(ref().position.x(ref().position.x()+x, duration), ref().position.y(ref().position.y()+y, duration));
}
