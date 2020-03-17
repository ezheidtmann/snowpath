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
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
import { NOHRSCSnowModel } from './snowmodel';
import SphericalMercator from '@mapbox/sphericalmercator';
import { getImageDataFromUrl, imageDataToPointFeatures } from './imageProcessing';
// import fetch from 'cross-fetch';
// import { VectorTile } from '@mapbox/vector-tile';
// import vtpbf from 'vt-pbf';
import geojsonVt from 'geojson-vt';
// TODO: adopt sphericalmercator bbox naming order!!
function loadImageAsFC(url, _a) {
    var _b = __read(_a, 4), w = _b[0], s = _b[1], e = _b[2], n = _b[3];
    // TODO preprocess url
    return getImageDataFromUrl(url).then(function (imgData) {
        var features = imageDataToPointFeatures(imgData, [w, s, e, n]);
        return {
            type: 'FeatureCollection',
            features: features
        };
    });
}
var PointsTiler = /** @class */ (function () {
    function PointsTiler(kml) {
        this.model = new NOHRSCSnowModel(kml);
        this.overlayMatcher = this.model.getGroundOverlayMatcher(this.model.getFolderByName('Snow Depth'));
        this.merc = new SphericalMercator({ size: 256 });
    }
    PointsTiler.prototype.getImageAsTileIndex = function (url, bbox) {
        var _this = this;
        if (this.tileIndexByUrl[url]) {
            return Promise.resolve(this.tileIndexByUrl[url]);
        }
        else {
            this.tileIndexByUrl[url] = loadImageAsFC(url, bbox).then(function (fc) {
                _this.tileIndexByUrl[url] = geojsonVt(fc);
                return _this.tileIndexByUrl[url];
            });
        }
    };
    // get geojson-vt tile 
    PointsTiler.prototype.getTile = function (z, x, y) {
        var e_1, _a;
        var _b = __read(this.merc.bbox(x, y, z), 4), w = _b[0], s = _b[1], e = _b[2], n = _b[3];
        var overlays = this.overlayMatcher.getOverlaysIntersectingBbox([w, s, e, n]);
        var fcPromises;
        try {
            for (var overlays_1 = __values(overlays), overlays_1_1 = overlays_1.next(); !overlays_1_1.done; overlays_1_1 = overlays_1.next()) {
                var overlay = overlays_1_1.value;
                fcPromises.push(this.getImageAsTileIndex(overlay.imageUrl, [overlay.west, overlay.south, overlay.east, overlay.north]));
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (overlays_1_1 && !overlays_1_1.done && (_a = overlays_1.return)) _a.call(overlays_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return Promise.all(fcPromises).then(function (tileIndices) {
            var e_2, _a;
            // now all overlays are in this.tileIndexByUrl
            // assemble tile from all applicable tilecaches
            var tile = undefined;
            try {
                for (var tileIndices_1 = __values(tileIndices), tileIndices_1_1 = tileIndices_1.next(); !tileIndices_1_1.done; tileIndices_1_1 = tileIndices_1.next()) {
                    var tileIndex = tileIndices_1_1.value;
                    if (!tile) {
                        tile = tileIndex.getTile(z, x, y);
                    }
                    else {
                        var features = tileIndex.getTile(z, x, y).features;
                        tile.features = tile.features.concat(features);
                    }
                }
            }
            catch (e_2_1) { e_2 = { error: e_2_1 }; }
            finally {
                try {
                    if (tileIndices_1_1 && !tileIndices_1_1.done && (_a = tileIndices_1.return)) _a.call(tileIndices_1);
                }
                finally { if (e_2) throw e_2.error; }
            }
            return tile;
        });
    };
    return PointsTiler;
}());
export default PointsTiler;
