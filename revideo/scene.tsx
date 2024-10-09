/** @jsxImportSource @revideo/2d/lib */
import {Audio, Img, Layout, Rect, Txt, Video, View2D, makeScene2D} from '@revideo/2d';
import {all, Reference, createRef, useScene, chain, waitFor} from '@revideo/core';
import {
	Animation,
	MoveToAnimationOptions,
	OpacityAnimationOptions,
	ScaleAnimationOptions,
	SceneDefinition,
	SceneObject,
	SubtitleObject,
} from './types';
import {displayWords, textSettings} from './subtitle';

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
	audio: Audio,
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

	if (object.type === 'subtitle') {
		// TODO: do
		const layoutRef = createRef<Layout>();
		view.add(<Layout size="100%" ref={layoutRef} />);
		yield* displayWords(layoutRef, object.words, textSettings);
		return;
	}

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
			fill: object.color,
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

	if (object.type === 'audio') {
		props = {
			...props,
			src: object.src,
			time: object.audioStartTime || 0,
			play: true,
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

function getDurationToShow(object: Exclude<SceneObject, SubtitleObject>) {
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
