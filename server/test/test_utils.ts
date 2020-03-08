const fs = require('fs');
import { NOHRSCSnowModel } from '../nohrsc/snowmodel';

export function makeModelFromXMLFile(path: string): NOHRSCSnowModel {
    return new NOHRSCSnowModel(fs.readFileSync(path).toString());
} 