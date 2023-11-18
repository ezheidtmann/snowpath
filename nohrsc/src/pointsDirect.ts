import SphericalMercator from '@mapbox/sphericalmercator';
import { ImageData } from 'canvas';
import { getImageDataFromUrl as getRealImageDataFromUrl, imageDataToPointFeatures } from './imageProcessing';
import { GroundOverlayMatcher, NOHRSCSnowModel } from "./snowmodel";

// w, s, e, n
type BBoxArray = [number, number, number, number]

class PreparedImage {
    private imgData: ImageData
    private bboxLngLat: BBoxArray

    constructor(imgData: ImageData, bbox: BBoxArray) {
        this.imgData = imgData;

    }

    getTileFeatures(bbox: BBoxArray): any[] {
        const [w, s, e, n] = bbox;
        let lngSpan = e - w;
        let latSpan = n - s;

        // iterate subset of image
        // yield points in 4096 span of lngSpan and latSpan
        // (I think I meant to resample here)
    }
}

type GJVTTile = {
    features: any[],
}

export default class PointsTiler {
    private model: NOHRSCSnowModel
    private overlayMatcher: GroundOverlayMatcher
    private merc: SphericalMercator
    private getImageDataFromUrl: (url: string) => Promise<ImageData>

    private imagesByUrl: Map<string, PreparedImage | Promise<PreparedImage>>

    constructor(kml: string | XMLDocument, getImageDataFromUrl?: (url: string) => Promise<ImageData>) {
        this.model = new NOHRSCSnowModel(kml)
        this.overlayMatcher = this.model.getGroundOverlayMatcher(this.model.getFolderByName('Snow Depth'));
        this.merc = new SphericalMercator({ size: 256 });
        this.getImageDataFromUrl = getImageDataFromUrl || getRealImageDataFromUrl
    }

    private getPreparedImage(url: string, bbox: BBoxArray): Promise<PreparedImage> {
        if (!this.imagesByUrl.has(url)) {
            const promise = this.getImageDataFromUrl(url).then(imgData => {
                console.time('prepare image')
                const img = new PreparedImage(imgData, bbox);
                console.timeEnd('prepare image')
                this.imagesByUrl.set(url, img)
                return img;
            })
            this.imagesByUrl.set(url, promise);
        }
        return Promise.resolve(this.imagesByUrl.get(url));
    }

    async getTile(z: number, x: number, y: number): Promise<GJVTTile> {
        let [w, s, e, n] = this.merc.bbox(x, y, z);
        let overlays = this.overlayMatcher.getOverlaysIntersectingBbox([w, s, e, n]);
        let promises = overlays.map(o => this.getPreparedImage(o.imageUrl, [o.west, o.south, o.east, o.north]))
        const images = await Promise.all(promises);
        return {
            features: images.flatMap(image => {
                console.time('getTileFeatures');
                const result = image.getTileFeatures([w, s, e, n])
                console.timeEnd('getTileFeatures');
            })
        }
    }

}