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

type TwoDCoord = [number, number];

// TODO: adopt sphericalmercator bbox naming order!!

function describeTile(tile: GJVTTile) {
    const featureCount = tile.features.length;
    console.log(`${featureCount} points`)
    let collisions = new Map<TwoDCoord, number>();
    const factor = 8; // 512px display -> 
    for (let feature of tile.features) {
        let pt = feature.geometry[0]
        const index: TwoDCoord = [Math.round(pt[0] / factor), Math.round(pt[1] / factor)]
        // console.log(collisions.get(index))
        const currentVal = collisions.get(index) ?? 0
        collisions.set(index, 1 + currentVal)
    }
    for (let [key, count] of collisions.entries()) {
        if (count > 1) {

            console.log(key, count)
        }
    }
}

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
            console.time('make geojson');
            let features = imageDataToPointFeatures(imgData, [w, s, e, n]);
            console.timeEnd('make geojson');
            return {
                type: 'FeatureCollection',
                features
            } as GeoJSON.FeatureCollection
        })
    }

    private getImageAsTileIndex(url: string, bbox: number[]): Promise<TileIndex> {
        if (!this.tileIndexByUrl[url]) {
            this.tileIndexByUrl[url] = this.loadImageAsFC(url, bbox).then(fc => {
                console.time('make tileIndex');
                this.tileIndexByUrl[url] = geojsonVt(fc)
                console.timeEnd('make tileIndex');
                return this.tileIndexByUrl[url]
            });
        }
        return Promise.resolve(this.tileIndexByUrl[url])
    }

    // get geojson-vt tile 
    async getTile(z: number, x: number, y: number): Promise<GJVTTile> {
        let [w, s, e, n] = this.merc.bbox(x, y, z);
        let overlays = this.overlayMatcher.getOverlaysIntersectingBbox([w, s, e, n]);
        console.log(`${overlays.length} overlays`)
        const fcPromises: Promise<TileIndex>[] = overlays.map(overlay => this.getImageAsTileIndex(overlay.imageUrl, [overlay.west, overlay.south, overlay.east, overlay.north]))

        const tileIndices = await Promise.all(fcPromises);

        // now all overlays are in this.tileIndexByUrl
        // assemble tile from all applicable tilecaches
        console.time('assemble tile');
        const features = tileIndices.flatMap(tileIndex => {
            console.time('tileIndex.getTile');
            const tile = tileIndex.getTile(z, x, y);
            console.log(`${tile?.features.length} features`);
            console.timeEnd('tileIndex.getTile');
            return tile?.features ?? [];
        })
        console.timeEnd('assemble tile');
        return { features };
    }
}