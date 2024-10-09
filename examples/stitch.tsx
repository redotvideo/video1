/** @jsxImportSource @revideo/2d/lib */

import {makeScene2D, Video} from '@revideo/2d';
import {useScene, createRef, waitFor} from '@revideo/core';

/**
 * The Revideo scene
 */
export const stitch = makeScene2D('stitch', function* (view) {

  // the list of videos we want to concatenate
  const videos = [
                    {
                      src: "/beach-3.mp4",
                      start: 1,
                      duration: 6
                    },
                    {
                      src: "/beach-2.mp4",
                      start: 2,
                      duration: 10
                    }
                  ]


  for(const vid of videos){
    const videoRef = createRef<Video>();
    yield view.add(<Video src={vid.src} time={vid.start} play={true} opacity={0} ref={videoRef} />)
    
    if(view.width() / view.height() > videoRef().width() / videoRef().height()){
      videoRef().width("100%");
    } else {
      videoRef().height("100%");
    }

    // this is a fade-out / fade-in transition - the fade-out and in take 0.3 seconds each; just set the opacity of the video tag to 1 and only use yield* waitFor(vid.duration);
    yield* videoRef().opacity(1,0.3);
    yield* waitFor(vid.duration-0.6);
    yield* videoRef().opacity(0,0.3);
    videoRef().pause();
    videoRef().remove();
  }
});