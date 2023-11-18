
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

export function toColorCode(rgba: Uint8ClampedArray) {
    return `#${twoCharHex(rgba[0])}${twoCharHex(rgba[1])}${twoCharHex(rgba[2])}`
}

function bitmapToImageData(bitmap: ImageBitmap): ImageData {
    let canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    let ctx = canvas.getContext('2d');
    if (ctx === null) {
        throw new Error('Could not get 2d context for canvas');
    }
    ctx.drawImage(bitmap, 0, 0);
    let imgData = ctx.getImageData(0, 0, bitmap.width, bitmap.height);
    return imgData
}

function imageDataToPointFeatures(imgData: ImageData, coordinates: number[][]): any[] {
    let lngSpan = coordinates[1][0] - coordinates[0][0];
    let latSpan = coordinates[0][1] - coordinates[3][1];
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
                            coordinates[0][0] + lngSpan * x / imgData.width,
                            coordinates[0][1] - latSpan * y / imgData.height,
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

export function bitmapToPointFeatures(bitmap: ImageBitmap, coordinates: number[][]) {
    let imgData = bitmapToImageData(bitmap);
    return imageDataToPointFeatures(imgData, coordinates)
}


// idea: decompose each image into rows, and render each row at the appropriate longitude.
// void ctx.drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
// alternatives require warping at, say, 4x resolution

function getColumnImageData(bitmap: ImageBitmap, column: number): ImageData {
    let canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = bitmap.height;
    let ctx = canvas.getContext('2d');
    if (ctx === null) {
        throw new Error('Could not get 2d context for canvas');
    }
    ctx.drawImage(bitmap, column, 0, 1, bitmap.height, 0, 0, 1, bitmap.height);
    let imgData = ctx.getImageData(0, 0, 1, bitmap.height);
    return imgData;
}

export function bitmapColumnToPointFeatures(bitmap: ImageBitmap, column: number, coordinates: number[][]) {
    let imgData = getColumnImageData(bitmap, column);

    return imageDataToPointFeatures(imgData, columnCoordinates(column, bitmap.width, coordinates));
}

export function columnCoordinates(column: number, width: number, coordinates: number[][]): number[][] {
    let [[west, north], [east], [_, south]] = coordinates;
    let lngSpan = east - west;
    let newWest = west + column * lngSpan / width;
    let pixelWidth = lngSpan / width;
    let newCoordinates = [
        [newWest, north],
        [newWest + pixelWidth, north],
        [newWest + pixelWidth, south],
        [newWest, south],
    ]
    return newCoordinates;
}

export function bitmapColumnToImageUrl(bitmap: ImageBitmap, column: number): string {
    let canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = bitmap.height;
    let ctx = canvas.getContext('2d');
    if (ctx === null) {
        throw new Error('Could not get 2d context for canvas');
    }
    ctx.drawImage(bitmap, column, 0, 1, bitmap.height, 0, 0, 1, bitmap.height);
    return canvas.toDataURL();
}
