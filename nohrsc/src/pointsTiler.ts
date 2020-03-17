import { NOHRSCSnowModel, GroundOverlayMatcher } from './snowmodel';
import SphericalMercator from '@mapbox/sphericalmercator';
import { getImageDataFromUrl as getRealImageDataFromUrl, imageDataToPointFeatures } from './imageProcessing';
// import fetch from 'cross-fetch';
// import { VectorTile } from '@mapbox/vector-tile';
// import vtpbf from 'vt-pbf';
import geojsonVt from 'geojson-vt';
import fs from 'fs';
import path from 'path';
import { writeImageDataToFixturesByUrl } from '../test/test_utils'

type TileIndex = {
    getTile: (z: number, x: number, y: number) => GJVTTile,
};

type GJVTTile = {
    features: any[],
}

// TODO: adopt sphericalmercator bbox naming order!!



export default class PointsTiler {
    private model: NOHRSCSnowModel
    private overlayMatcher: GroundOverlayMatcher
    private merc: SphericalMercator;
    private tileIndexByUrl: { [key: string]: Promise<TileIndex> | TileIndex } = {};
    private getImageDataFromUrl: (url: string) => Promise<ImageData>;

    constructor(kml: string | XMLDocument, getImageDataFromUrl?: (url: string) => Promise<ImageData>) {
        this.model = new NOHRSCSnowModel(kml)
        this.overlayMatcher = this.model.getGroundOverlayMatcher(this.model.getFolderByName('Snow Depth'));
        this.merc = new SphericalMercator({ size: 256 });
        this.getImageDataFromUrl = getImageDataFromUrl || getRealImageDataFromUrl
    }

    private loadImageAsFC(url: string, [w, s, e, n]: number[]): Promise<GeoJSON.FeatureCollection> {
        // TODO preprocess url
        return this.getImageDataFromUrl(url).then(imgData => {
            // writeImageDataToFixturesByUrl(url, imgData);
            // console.log('got imgData', imgData);
            let features = imageDataToPointFeatures(imgData, [w, s, e, n]);
            return {
                type: 'FeatureCollection',
                features
            } as GeoJSON.FeatureCollection
        })
    }

    private getImageAsTileIndex(url: string, bbox: number[]): Promise<TileIndex> {
        if (!this.tileIndexByUrl[url]) {
            this.tileIndexByUrl[url] = this.loadImageAsFC(url, bbox).then(fc => {
                this.tileIndexByUrl[url] = geojsonVt(fc)
                return this.tileIndexByUrl[url]
            });
        }
        return Promise.resolve(this.tileIndexByUrl[url])
    }

    // get geojson-vt tile 
    getTile(z: number, x: number, y: number): Promise<GJVTTile> {
        let [w, s, e, n] = this.merc.bbox(x, y, z);
        let overlays = this.overlayMatcher.getOverlaysIntersectingBbox([w, s, e, n]);
        let fcPromises: Promise<TileIndex>[] = [];
        for (let overlay of overlays) {
            fcPromises.push(this.getImageAsTileIndex(overlay.imageUrl, [overlay.west, overlay.south, overlay.east, overlay.north]));
        }
        return Promise.all(fcPromises).then((tileIndices) => {
            // now all overlays are in this.tileIndexByUrl
            // assemble tile from all applicable tilecaches
            let tile = undefined;
            for (let tileIndex of tileIndices) {
                if (!tile) {
                    tile = tileIndex.getTile(z, x, y)
                }
                else {
                    let features = tileIndex.getTile(z, x, y).features
                    tile.features = tile.features.concat(features);
                }
            }

            return tile
        })
    }
}