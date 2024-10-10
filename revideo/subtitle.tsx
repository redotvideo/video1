/** @jsxImportSource @revideo/2d/lib */
import {Layout, Rect, Txt} from '@revideo/2d';
import {all, createRef, createSignal, Reference, waitFor, makeRef} from '@revideo/core';
import {WordInfo} from './types';

export interface CaptionSettings {
	fontSize: number;
	textColor: string;
	fontWeight: number;
	fontFamily: string;
	numSimultaneousWords: number;
	textAlign: 'center' | 'left';
	textBoxWidthInPercent: number;
	borderColor?: string;
	borderWidth?: number;
	currentWordColor?: string;
	currentWordBackgroundColor?: string;
	currentWordFadeIn?: boolean;
	shadowColor?: string;
	shadowBlur?: number;
	fullTextFadeIn?: boolean;
	fullTextBackground?: boolean;
	currentLineColor?: string;
	currentLineEnlargeScale?: number;
	fullTextGetLarger?: boolean;
	capitalized?: boolean;
	shadowOffsetY?: number;
	shadowOffsetX?: number;
}

export const textSettingsFunky: CaptionSettings = {
	fontSize: 70,
	numSimultaneousWords: 4, // how many words are shown at most simultaneously
	textColor: 'white',
	fontWeight: 800,
	fontFamily: 'Montserrat',
	currentWordFadeIn: false, // if true, words appear one by one
	textAlign: 'center',
	textBoxWidthInPercent: 70,
	currentWordBackgroundColor: '#ff8000',
	capitalized: true,
};

export const textSettingsCool: CaptionSettings = {
	fontSize: 70,
	numSimultaneousWords: 5, // how many words are shown at most simultaneously
	textColor: 'white',
	fontWeight: 800,
	fontFamily: 'Montserrat',
	currentWordFadeIn: false, // if true, words appear one by one
	textAlign: 'center',
	textBoxWidthInPercent: 60,
	shadowColor: 'black',
	shadowBlur: 30,
	currentLineColor: 'red',
	capitalized: true,
};

export const textSettingsSerious: CaptionSettings = {
	fontSize: 60,
	numSimultaneousWords: 7, // how many words are shown at most simultaneously
	textColor: 'white',
	fontWeight: 600,
	fontFamily: 'Figtree',
	textAlign: 'center',
	textBoxWidthInPercent: 70,
	shadowBlur: 8,
	shadowColor: 'black',
	borderWidth: 20,
	shadowOffsetX: 2,
	shadowOffsetY: 2,
	borderColor: 'black',
};

export function* displayWords(
	container: Reference<Layout>,
	words: WordInfo[],
	settings: CaptionSettings,
) {
	let waitBefore = words[0].start;
	const frontWordRefs: Txt[] = [];
	const backWordRefs: Txt[] = [];

	for (let i = 0; i < words.length; i += settings.numSimultaneousWords) {
		const currentBatch = words.slice(i, i + settings.numSimultaneousWords);
		const nextClipStart =
			i < words.length - 1 ? words[i + settings.numSimultaneousWords]?.start || null : null;
		const isLastClip = i + settings.numSimultaneousWords >= words.length;
		const waitAfter = isLastClip ? 1 : 0;
		const textRef = createRef<Txt>();
		const textRef2 = createRef<Txt>();
		yield* waitFor(waitBefore);

		yield container().add(
			<>
				<Txt
					width={`${settings.textBoxWidthInPercent}%`}
					textAlign={settings.textAlign}
					ref={textRef}
					textWrap={true}
					zIndex={2}
					lineWidth={10}
					stroke={'black'}
				/>{' '}
				<Txt
					width={`${settings.textBoxWidthInPercent}%`}
					textAlign={settings.textAlign}
					ref={textRef2}
					textWrap={true}
					zIndex={2}
				/>
			</>,
		);

		const wordRefs = [];
		for (let j = 0; j < currentBatch.length; j++) {
			const word = currentBatch[j];
			const optionalSpace = j === currentBatch.length - 1 ? '' : ' ';
			const commonTxtProps = {
				fontSize: settings.fontSize,
				fontWeight: settings.fontWeight,
				fontFamily: settings.fontFamily,
				textAlign: settings.textAlign,
				fill: settings.textColor,
				zIndex: 2,
				shadowBlur: settings.shadowBlur,
				shadowColor: settings.shadowColor,
				text: settings.capitalized
					? (word.word + optionalSpace).toUpperCase()
					: word.word + optionalSpace,
				shadowOffsetX: settings.shadowOffsetX,
				shadowOffsetY: settings.shadowOffsetY,
			};
			textRef().add(
				<Txt
					ref={makeRef(backWordRefs, j)}
					{...commonTxtProps}
					stroke={settings.borderColor}
					lineWidth={settings.borderWidth}
				/>,
			);
			textRef2().add(<Txt ref={makeRef(frontWordRefs, j)} {...commonTxtProps} />);
		}

		yield* all(
			fadeInText(currentBatch, frontWordRefs, backWordRefs, settings),
			applyCurrentWordBackground(
				container,
				currentBatch,
				frontWordRefs,
				backWordRefs,
				settings,
				settings.currentWordColor,
				settings.currentWordBackgroundColor,
			),
			//enlargeCurrentWord(container, currentBatch, wordRefs, settings.currentWordColor, settings.currentWordBackgroundColor, settings),
			enlargeCurrentLine(container, currentBatch, frontWordRefs, backWordRefs, settings),
			letWordsAppear(container, currentBatch, frontWordRefs, backWordRefs, settings),
			makeTextLarger(container, currentBatch, frontWordRefs, backWordRefs, settings),
			waitFor(currentBatch[currentBatch.length - 1].end - currentBatch[0].start + waitAfter),
		);
		textRef().remove();
		textRef2().remove();

		waitBefore =
			nextClipStart !== null ? nextClipStart - currentBatch[currentBatch.length - 1].end : 0;
	}
}

function* letWordsAppear(
	container: Reference<Layout>,
	currentBatch: WordInfo[],
	frontWordRefs: Txt[],
	backWordRefs: Txt[],
	settings: CaptionSettings,
) {
	if (settings.currentWordFadeIn) {
		let nextWordStart = 0;

		for (let i = 0; i < currentBatch.length; i++) {
			frontWordRefs[i].opacity(0);
			backWordRefs[i].opacity(0);
		}

		for (let i = 0; i < currentBatch.length; i++) {
			yield* waitFor(nextWordStart);
			const word = currentBatch[i];
			nextWordStart = currentBatch[i + 1]?.start - word.end || 0;
			const fadeInDuration = Math.min(0.15, word.end - word.start);
			yield* frontWordRefs[i].opacity(1, fadeInDuration);
			yield* backWordRefs[i].opacity(1, fadeInDuration);
			yield* waitFor(word.end - word.start - fadeInDuration);
		}
	}
}

function* fadeInText(
	currentBatch: any,
	frontWordRefs: Txt[],
	backWordRefs: Txt[],
	settings: CaptionSettings,
) {
	if (!settings.fullTextFadeIn) {
		return;
	}

	const opacitySignal = createSignal(0);
	for (let i = 0; i < currentBatch.length; i++) {
		frontWordRefs[i].opacity(opacitySignal);
		backWordRefs[i].opacity(opacitySignal);
	}

	yield* opacitySignal(1, Math.min(0.15, (currentBatch[0].end - currentBatch[0].start) * 0.5));
}

function* makeTextLarger(
	container: Reference<Layout>,
	currentBatch: any,
	frontWordRefs: Txt[],
	backWordRefs: Txt[],
	settings: CaptionSettings,
) {
	if (!settings.fullTextGetLarger) {
		return;
	}

	const scaleSignal = createSignal(0.7);
	for (let i = 0; i < currentBatch.length; i++) {
		//frontWordRefs[i].scale(scaleSignal);
		//backWordRefs[i].scale(scaleSignal);
		container().scale(scaleSignal);
	}

	yield* scaleSignal(1, Math.min(0.25, (currentBatch[0].end - currentBatch[0].start) * 0.5));
}

function* applyCurrentWordBackground(
	container: Reference<Layout>,
	currentBatch: WordInfo[],
	frontWordRefs: Txt[],
	backWordRefs: Txt[],
	settings: CaptionSettings,
	wordColor?: string,
	backgroundColor?: string,
) {
	if (!settings.currentWordBackgroundColor && !settings.currentWordColor) {
		return;
	}

	let nextWordStart = 0;

	for (let i = 0; i < currentBatch.length; i++) {
		yield* waitFor(nextWordStart);
		const word = currentBatch[i];
		const originalColor = frontWordRefs[i].fill();
		nextWordStart = currentBatch[i + 1]?.start - word.end || 0;
		frontWordRefs[i].text(frontWordRefs[i].text());
		backWordRefs[i].text(backWordRefs[i].text());
		frontWordRefs[i].fill(wordColor);
		backWordRefs[i].fill(wordColor);

		const backgroundRef = createRef<Rect>();
		if (backgroundColor) {
			container().add(
				<Rect
					fill={backgroundColor}
					zIndex={1}
					size={[frontWordRefs[i].size.x() + settings.fontSize * 0.25, frontWordRefs[i].size.y()]}
					position={frontWordRefs[i].position}
					radius={10}
					padding={10}
					ref={backgroundRef}
				/>,
			);
		}

		yield* waitFor(word.end - word.start);
		frontWordRefs[i].text(frontWordRefs[i].text());
		frontWordRefs[i].fill(originalColor);

		backWordRefs[i].text(backWordRefs[i].text());
		backWordRefs[i].fill(originalColor);

		if (backgroundColor) {
			backgroundRef().remove();
		}
	}
}

/*function* enlargeCurrentWord(container: Reference<Layout>, currentBatch: Word[], wordRefs: Reference<Txt>[], wordColor: string, backgroundColor: string, settings: captionSettings){
	  if(!settings.currentLineEnlargeScale && !settings.currentLineColor){
		  return;
	  }
  
	  let nextWordStart = 0;
	
	  for(let i = 0; i < currentBatch.length; i++){
		yield* waitFor(nextWordStart);
		const word = currentBatch[i];
		const originalPadding = frontWordRefs[i].padding();
		nextWordStart = currentBatch[i+1]?.start - word.end || 0;
		frontWordRefs[i].scale(settings.currentWordEnlargeScale);
		frontWordRefs[i].padding(settings.fontSize/7*settings.currentWordEnlargeScale);
		yield* waitFor(word.end-word.start);
		frontWordRefs[i].scale(1);
		frontWordRefs[i].padding(originalPadding)
	  }
	}
  */

function* enlargeCurrentLine(
	container: Reference<Layout>,
	currentBatch: WordInfo[],
	frontWordRefs: Txt[],
	backWordRefs: Txt[],
	settings: CaptionSettings,
) {
	if (!settings.currentLineEnlargeScale && !settings.currentLineColor) {
		return;
	}

	// Create a map to hold the y values and their corresponding indices
	const lineMap = new Map<number, number[]>();

	for (let i = 0; i < currentBatch.length; i++) {
		const y = backWordRefs[i].y();
		if (!lineMap.has(y)) {
			lineMap.set(y, []);
		}
		lineMap.get(y)!.push(i);
	}

	// Now you have a map of y values to an array of indices
	// For each index, you can find the other indices on the same line
	let indexToLineIndices: Record<number, number[]> = {};

	for (let i = 0; i < currentBatch.length; i++) {
		const y = backWordRefs[i].y();
		indexToLineIndices[i] = lineMap.get(y)!;
	}

	let nextWordStart = 0;

	for (let i = 0; i < currentBatch.length; i++) {
		yield* waitFor(nextWordStart);
		nextWordStart = currentBatch[i + 1]?.start - currentBatch[i].end || 0;

		const oldYs = backWordRefs.map((ref) => ref.y());

		for (let j of indexToLineIndices[i]) {
			frontWordRefs[j].scale(settings.currentLineEnlargeScale);
			frontWordRefs[j].text(frontWordRefs[j].text());
			frontWordRefs[j].fill(settings.currentLineColor);

			backWordRefs[j].scale(settings.currentLineEnlargeScale);
			backWordRefs[j].text(backWordRefs[j].text());
			backWordRefs[j].fill(settings.currentLineColor);
		}

		let newYs = frontWordRefs.map((ref) => ref.y());

		// Check if indexToLineIndices have changed
		let indicesHaveChanged = !newYs.every((y, index) => y === oldYs[index]);

		let alternativeScale = 1;
		let counter = 0;
		while (indicesHaveChanged) {
			counter += 1;
			for (let j of indexToLineIndices[i]) {
				frontWordRefs[j].scale(alternativeScale);
				frontWordRefs[j].padding((alternativeScale - 1) * settings.fontSize * 1.4);
				frontWordRefs[j].text(frontWordRefs[j].text());
				frontWordRefs[j].fill(settings.currentLineColor);

				backWordRefs[j].scale(alternativeScale);
				backWordRefs[j].padding((alternativeScale - 1) * settings.fontSize * 1.4);
				backWordRefs[j].text(backWordRefs[j].text());
				backWordRefs[j].fill(settings.currentLineColor);
			}
			alternativeScale = 1 + (alternativeScale - 1) * 0.7;

			newYs = backWordRefs.map((ref) => ref.y());
			indicesHaveChanged = !newYs.every((y, index) => y === oldYs[index]);
			console.log('indicesHaveChanged', indicesHaveChanged);
			if (counter === 3) {
				alternativeScale = 1;
			}
		}

		// If indices have not changed, reset scale and padding
		yield* waitFor(currentBatch[i].end - currentBatch[i].start);

		if (indexToLineIndices[i + 1] !== indexToLineIndices[i]) {
			for (let j of indexToLineIndices[i]) {
				frontWordRefs[j].scale(1);
				frontWordRefs[j].padding(0);
				frontWordRefs[j].text(frontWordRefs[j].text());
				frontWordRefs[j].fill(settings.textColor);

				backWordRefs[j].scale(1);
				backWordRefs[j].padding(0);
				backWordRefs[j].text(backWordRefs[j].text());
				backWordRefs[j].fill(settings.textColor);
			}
		}
	}
}
