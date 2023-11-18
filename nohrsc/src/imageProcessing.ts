import { createCanvas, loadImage } from 'canvas';
import { create } from 'domain';

function twoCharHex(n: number) {
    let hex = n.toString(16)
    if (hex.length == 1) {
        return '0' + hex;
    }
    else if (hex.length == 2) {
        return hex;
    }
    else {
        throw new Error(`invalid input ${n} -> ${hex}`)
    }
}

function rewriteUrl(url: string) {
    if (url.startsWith("http://www.nohrsc.noaa.gov")) {
        // hardcoded "HSTS policy" as of March 2021
        return "https" + url.substring(4);
    }
    return url
}


export function toColorCode(rgba: Uint8ClampedArray) {
    return `#${twoCharHex(rgba[0])}${twoCharHex(rgba[1])}${twoCharHex(rgba[2])}`
}

export function getImageDataFromUrl(url: string): Promise<ImageData> {
    return loadImage(rewriteUrl(url)).then(img => {
        let canvas = createCanvas(img.width, img.height);
        let ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        console.log('url', url);
        return ctx.getImageData(0, 0, img.width, img.height);
    });
}

function bitmapToImageData(bitmap: ImageBitmap): ImageData {
    let canvas = createCanvas(bitmap.width, bitmap.height);
    let ctx = canvas.getContext('2d');
    if (ctx === null) {
        throw new Error('Could not get 2d context for canvas');
    }
    ctx.drawImage(bitmap, 0, 0);
    let imgData = ctx.getImageData(0, 0, bitmap.width, bitmap.height);
    return imgData
}

export function imageDataToPointFeatures(imgData: ImageData, [w, s, e, n]: number[]): any[] {
    let lngSpan = e - w;
    let latSpan = n - s;
    // let hist = new window.Map();

    let features = [];
    for (let x = 0; x < imgData.width; ++x) {
        for (let y = 0; y < imgData.height; ++y) {
            const redIndex = y * (imgData.width * 4) + x * 4;
            const alpha = imgData!.data[redIndex + 3];
            if (alpha > 0) {
                let color = toColorCode(imgData!.data.slice(redIndex, redIndex + 4))
                features.push({
                    type: 'Feature',
                    geometry: {
                        type: 'Point',
                        coordinates: [
                            w + lngSpan * x / imgData.width,
                            n - latSpan * y / imgData.height,
                        ],
                    },
                    properties: {
                        color,
                    }
                });
            }
        }
    }
    return features;
}

export function bitmapToPointFeatures(bitmap: ImageBitmap, bbox: number[]) {
    let imgData = bitmapToImageData(bitmap);
    return imageDataToPointFeatures(imgData, bbox);
}