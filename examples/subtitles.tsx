/** @jsxImportSource @revideo/2d/lib */

import { Txt, Video, Layout, makeScene2D} from '@revideo/2d';
import {all, any, createRef, waitFor, Reference} from '@revideo/core';


export default makeScene2D("subtitles", function* (view) {
    const textBox = createRef<Layout>();
    const vidRef = createRef<Video>();

    const words = [
        {
            text: "At a YC",
            startInSeconds: 0.24
        },
        {
            text: "event",
            startInSeconds: 1.02
        },
        {
            text: "last",
            startInSeconds: 1.3
        },
        {
            text: "week,",
            startInSeconds: 1.56
        },
        {
            text: "Brian",
            startInSeconds: 1.9
        },
        {
            text: "Chesky",
            startInSeconds: 2.16
        },
        {
            text: "gave",
            startInSeconds: 2.5
        },
        {
            text: "a talk",
            startInSeconds: 2.68
        },
        {
            text: "that everyone",
            startInSeconds: 3.16
        },
        {
            text: "who was",
            startInSeconds: 3.74
        },
        {
            text: "there",
            startInSeconds: 4.14
        },
        {
            text: "will",
            startInSeconds: 4.34
        },
        {
            text: "remember.",
            startInSeconds: 4.74
        }
        ]
      
  
    yield view.add(
      <>
        <Video
          src={'/video_belonging_to_subtitles.mp4'}
          size={['100%', '100%']}
          play={true}
          ref={vidRef}
        />
        <Layout
          size={"100%"}
          ref={textBox}
        />
      </>,
    );
  
    yield* any(
      displayWords(textBox, words),
      waitFor(vidRef().getDuration())
    )
  
  });
  
  function* displayWords(textBox: Reference<Layout>, words: any){
    // Wait for the first word's start time
    yield* waitFor(words[0].startInSeconds);
  
    for (let i = 0; i < words.length; i++) {
      const textRef = createRef<Txt>();
      const textRef2 = createRef<Txt>();
  
      const textProps = {
        text: words[i].text.toUpperCase(),
        fontFamily: "Rubik",
        fontWeight: 700,
        fontSize: 100 * 0.8,
        fill: "white",
        fontStyle: "bold",
        y: 570,
        rowGap: 10,
        letterSpacing: 0,
      };
  
      // we layer multiple texts on top of each other, one with a stroke to create an illusion of a bold stroke
      yield textBox().add(
        <>
          <Txt
            {...textProps}
            ref={textRef}
            stroke={"black"}
            lineWidth={20}
            lineJoin={"round"}
          />
          <Txt
            {...textProps}
            ref={textRef2}
            lineJoin={"round"}
          />
        </>
      );
  
  
      yield* all(
        textRef().scale(1/0.8, 0.15), textRef().position.y(textRef().position.y()-30, 0.15), // scale the text up by a factor of 1/0.8 in 0.15 seconds and move it up by 30px from its current position in 0.15s
        textRef2().scale(1/0.8, 0.15), textRef2().position.y(textRef().position.y()-30, 0.15)
      );
  
      // Calculate the duration to display this word
      const wordDuration = (words[i + 1]?.startInSeconds || words[i].startInSeconds + 1) - words[i].startInSeconds;
      yield* waitFor(wordDuration - 0.15);
  
      // Remove the text after waiting
      textRef()?.remove();
      textRef2()?.remove();
  
      // If there's a next word, wait for the gap between words
      if (i < words.length - 1) {
        const gap = words[i + 1].startInSeconds - (words[i].startInSeconds + wordDuration);
        if (gap > 0) {
          yield* waitFor(gap);
        }
      }
    }
  }