import { movingObject } from "./moving-object";
import { stitch } from "./stitch";
import { makeProject } from "@revideo/core";

/**
 * The final revideo project
 */
export default makeProject({
    scenes: [movingObject],
    settings: {
      // Example settings:
      shared: {
        size: {x: 1920, y: 1080},
      },
    },
  });