
import { NOHRSCSnowModel } from '../src/snowmodel';
import path from 'path';
import fs from 'fs';
import { ImageData } from 'canvas';

export function makeModelFromXMLFile(path: string): NOHRSCSnowModel {
    return new NOHRSCSnowModel(fs.readFileSync(path).toString());
}

export function getImageDataFromFixtureByUrl(url: string): Promise<ImageData> {
    let filename = path.basename(url);
    let meta = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'fixtures', `${filename}.meta`)).toString())
    let dataBuffer = fs.readFileSync(path.join(__dirname, '..', 'fixtures', `${filename}.imgData`));
    let dataArray = new Uint8ClampedArray(dataBuffer);
    console.log('loaded url from fixture:', url);
    return Promise.resolve(new ImageData(dataArray, meta.width, meta.height));
}

export function writeImageDataToFixturesByUrl(url: string, imgData: ImageData): void {
    let filename = path.basename(url);
    fs.writeFileSync(path.join(__dirname, '..', 'fixtures', `${filename}.imgData`), imgData.data);
    fs.writeFileSync(path.join(__dirname, '..', 'fixtures', `${filename}.meta`), JSON.stringify({
        width: imgData.width,
        height: imgData.height,
    }));
}