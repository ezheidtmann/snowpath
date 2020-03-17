export declare function toColorCode(rgba: Uint8ClampedArray): string;
export declare function getImageDataFromUrl(url: string): Promise<ImageData>;
export declare function imageDataToPointFeatures(imgData: ImageData, [w, s, e, n]: number[]): any[];
export declare function bitmapToPointFeatures(bitmap: ImageBitmap, bbox: number[]): any[];
