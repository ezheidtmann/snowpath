var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
import { createCanvas, loadImage } from 'canvas';
function twoCharHex(n) {
    var hex = n.toString(16);
    if (hex.length == 1) {
        return '0' + hex;
    }
    else if (hex.length == 2) {
        return hex;
    }
    else {
        throw new Error("invalid input " + n + " -> " + hex);
    }
}
export function toColorCode(rgba) {
    return "#" + twoCharHex(rgba[0]) + twoCharHex(rgba[1]) + twoCharHex(rgba[2]);
}
export function getImageDataFromUrl(url) {
    return loadImage(url).then(function (img) {
        var canvas = createCanvas(img.width, img.height);
        var ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        return ctx.getImageData(0, 0, img.width, img.height);
    });
}
function bitmapToImageData(bitmap) {
    var canvas = createCanvas(bitmap.width, bitmap.height);
    var ctx = canvas.getContext('2d');
    if (ctx === null) {
        throw new Error('Could not get 2d context for canvas');
    }
    ctx.drawImage(bitmap, 0, 0);
    var imgData = ctx.getImageData(0, 0, bitmap.width, bitmap.height);
    return imgData;
}
export function imageDataToPointFeatures(imgData, _a) {
    var _b = __read(_a, 4), w = _b[0], s = _b[1], e = _b[2], n = _b[3];
    var lngSpan = e - w;
    var latSpan = n - s;
    // let hist = new window.Map();
    var features = [];
    for (var x = 0; x < imgData.width; ++x) {
        for (var y = 0; y < imgData.height; ++y) {
            var redIndex = y * (imgData.width * 4) + x * 4;
            var alpha = imgData.data[redIndex + 3];
            if (alpha > 0) {
                var color = toColorCode(imgData.data.slice(redIndex, redIndex + 4));
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
                        color: color,
                    }
                });
            }
        }
    }
    return features;
}
export function bitmapToPointFeatures(bitmap, bbox) {
    var imgData = bitmapToImageData(bitmap);
    return imageDataToPointFeatures(imgData, bbox);
}
