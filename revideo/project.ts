import {makeProject} from '@revideo/core';

import './global.css';

import example from './scene';
import { stitch } from '../examples/stitch';
import { movingObject } from '../examples/moving-object';
import { ad } from '../examples/marketing';
import subtitles from '../examples/subtitles';


export default makeProject({
	scenes: [subtitles],
});
