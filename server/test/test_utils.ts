const fs = require('fs');
import { NOHRSCSnowModel } from '../nohrsc/snowmodel.js';

export function makeModelFromXMLFile(path: string): NOHRSCSnowModel {
    return new NOHRSCSnowModel(fs.readFileSync(path));
} 