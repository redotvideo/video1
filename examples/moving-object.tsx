/** @jsxImportSource @revideo/2d/lib */

import {Rect, Txt, Audio, makeScene2D} from '@revideo/2d';
import {all, waitFor, createRef} from '@revideo/core';

export const movingObject = makeScene2D("moving-object", function* (view) {
  view.fill("#FFFFFF") // add white background

  const rectRef = createRef<Rect>();
  const audioRef = createRef<Audio>();

  // add text on top of rect
  yield view.add(
    <>
      <Rect fill={'blue'} size={[100, 100]} ref={rectRef}>
        <Txt fontSize={30} fontFamily={'Sans-Serif'} fill={'white'}>
          Hi!
        </Txt>
      </Rect>
      <Audio src={"background_music.mp4"} play={true} ref={audioRef} />
    </>
  );

  yield* waitFor(audioRef().getDuration()/10) // wait for one tenth of the song to play

  yield* waitFor(0.5); // do nothing for 0.5s
  yield* all(rectRef().position.x(200, 1), rectRef().position.y(50, 1)); // move the rectangle to [200, 50] in 1s
  yield* all(rectRef().position.x(0, 2), rectRef().position.y(0, 2)); // move the rectangle to [0,0] (center) in 2s

  yield* rectRef().scale(2, 1); // scale the rectangle by 2 in 1s
  yield* rectRef().radius(100, 1); // increase the radius to 100 in 1s, thereby turning the rectangle into a radius
  yield* waitFor(1); // do nothing for 1s
});
