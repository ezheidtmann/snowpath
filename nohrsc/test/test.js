let assert = require('assert');
let path = require('path');
import fetchMock from 'fetch-mock';
import fs from 'fs';
import { makeModelFromXMLFile, getImageDataFromFixtureByUrl } from './test_utils';
import PointsTiler from '../src/pointsTiler';

function fixturePath(fixtureName) {
    return path.join(__dirname, '..', 'fixtures', fixtureName);
}

function fixtureContents(fixtureName) {
    return fs.readFileSync(fixturePath(fixtureName)).toString();
}

describe('nohrsc parsing', function () {
    describe('model', function () {
        let model = makeModelFromXMLFile(fixturePath('nohrsc_nsm_20200305.kml'));
        it('shoud get a folder', function () {
            let folder = model.getFolderByName('Snow Depth');
            assert.notStrictEqual(folder, undefined)
        })
        it('should get sources', function () {
            let folder = model.getFolderByName('Snow Depth');
            let sources = model.getGroundOverlaysAsMBGLSources(folder);
            assert.equal(sources.length, 80);
        })
    })
    describe('overlay intersection', function () {
        // example actual overlay from the fixture:
        // north: 53.96666666666647
        // south: 49.69999999999997
        // east: -70.78333333333316
        // west: -75.04999999999966
        let model = makeModelFromXMLFile(fixturePath('nohrsc_nsm_20200305.kml'));
        let matcher = model.getGroundOverlayMatcher(model.getFolderByName('Snow Depth'))

        it('should get intersecting overlay', function () {
            // coincident coordinates
            let overlays = matcher.getOverlaysIntersectingBbox([
                -75.04999999999966,
                49.69999999999997,
                -70.78333333333316,
                53.96666666666647
            ])
            assert.ok(overlays.length > 0);

            let overlays = matcher.getOverlaysIntersectingBbox([
                -71,
                50,
                -70,
                54
            ])
            // smaller box also ok
            assert.ok(overlays.length > 0);

            let overlays = matcher.getOverlaysIntersectingBbox([
                -126.38671875,
                74.54332982677906,
                -126.2109375,
                74.59010800882325
            ])
            // latitude out of range
            assert.ok(overlays.length == 0);


        })
    });
    describe('tiler', function () {
        it('should get a tile', function () {
            // let folder = model.getFolderByName('Snow Depth');
            let tiler = new PointsTiler(fixtureContents('nohrsc_nsm_20200305.kml'), getImageDataFromFixtureByUrl);
            // let tiler = new PointsTiler(fixtureContents('nohrsc_nsm_20200305.kml'));
            // make geojson: 264.408ms
            // make tileIndex: 671.781ms
            // getTile: 132.835ms
            return tiler.getTile(11, 305, 672).then(function (tile) {
                assert.ok(!!tile);
                assert.ok(tile.features.length > 0);
            })

            // next steps:
            // make an endpoint that serves these tiles, using vtpbf
            // evaluate how well it performs after initial generation
            // pick a min zoom level for this method (9?)
            // fine-tune: adjust by pixel width, compare against published visualization.
            // (maybe try arcgis?)
            //
            // finally, start on warping for raster presentation
            // 
            // mapbox works at z=4 and greater, good at z=8, excellent at z>=10
            // server crashes at z=6 after panning, too much memory

            // compare pixels from images to pixels from the original flat binary files, as documented in the PDF.
            // warp images .. how?
            // https://gdal.org/programs/gdalwarp.html
        })
        it('should get a tile crossing a source tile boundary', function () {
            let tiler = new PointsTiler(fixtureContents('nohrsc_nsm_20200305.kml'));
            tiler.getTile(9, 81, 172).then(function (tile) {

                assert.ok(!!tile);
                assert.ok(tile.features.length > 0);
                console.log('simple', tile.features.length) // 4401
            })
            return tiler.getTile(9, 82, 172).then(function (tile) {

                assert.ok(!!tile);
                assert.ok(tile.features.length > 0);
                console.log('cross', tile.features.length) // 4168
            })

            // why discrepancy in feature count? (probably because some points dont' have snow!)
            // are these counts accurate? probably need to show it on the map to know for sure.
        })
    })
})