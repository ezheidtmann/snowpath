var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
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
var Node = require('xmldom/lib/dom').Node;
var DOMParser = require('xmldom').DOMParser;
function iterateNodeList(nl) {
    var i;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                i = 0;
                _a.label = 1;
            case 1:
                if (!(i < nl.length)) return [3 /*break*/, 4];
                return [4 /*yield*/, nl[i]];
            case 2:
                _a.sent();
                _a.label = 3;
            case 3:
                ++i;
                return [3 /*break*/, 1];
            case 4: return [2 /*return*/];
        }
    });
}
function getFirstChildTextContentAsNumber(el, tagName) {
    return parseFloat(el.getElementsByTagName(tagName)[0].textContent || '');
}
var GroundOverlayMatcher = /** @class */ (function () {
    function GroundOverlayMatcher(overlays) {
        var e_1, _a;
        try {
            for (var overlays_1 = __values(overlays), overlays_1_1 = overlays_1.next(); !overlays_1_1.done; overlays_1_1 = overlays_1.next()) {
                var overlay = overlays_1_1.value;
                var latlonbox = overlay.getElementsByTagName('LatLonBox')[0];
                var north = getFirstChildTextContentAsNumber(latlonbox, 'north');
                var south = getFirstChildTextContentAsNumber(latlonbox, 'south');
                var east = getFirstChildTextContentAsNumber(latlonbox, 'east');
                var west = getFirstChildTextContentAsNumber(latlonbox, 'west');
                var imageUrl = overlay.getElementsByTagName('Icon')[0].getElementsByTagName('href')[0].textContent;
                this.overlays.push({ north: north, south: south, east: east, west: west, imageUrl: imageUrl });
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (overlays_1_1 && !overlays_1_1.done && (_a = overlays_1.return)) _a.call(overlays_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
    }
    GroundOverlayMatcher.prototype.getOverlaysIntersectingBbox = function (_a) {
        var e_2, _b;
        var _c = __read(_a, 4), west = _c[0], south = _c[1], east = _c[2], north = _c[3];
        var matchingOverlays;
        try {
            for (var _d = __values(this.overlays), _e = _d.next(); !_e.done; _e = _d.next()) {
                var overlay = _e.value;
                if (north < overlay.south // desired box is below
                    || south > overlay.north // above
                    || west > overlay.east // to the right
                    || east < overlay.west) { // to the left
                    // doesn't intersect
                    continue;
                }
                matchingOverlays.push(overlay);
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (_e && !_e.done && (_b = _d.return)) _b.call(_d);
            }
            finally { if (e_2) throw e_2.error; }
        }
        return matchingOverlays;
    };
    return GroundOverlayMatcher;
}());
export { GroundOverlayMatcher };
var NOHRSCSnowModel = /** @class */ (function () {
    function NOHRSCSnowModel(xml) {
        if (typeof xml == "string") {
            this.xmlDoc = new DOMParser().parseFromString(xml, 'text/xml');
        }
        else {
            this.xmlDoc = xml;
        }
        this.sanityCheck();
    }
    NOHRSCSnowModel.prototype.sanityCheck = function () {
        // check that it's kml
        // check that it has a top-level Document with `name` element that contains "NOHRSC"
        // check that there are folders with `name` elements
        // check that there is a Snow Depth folder
        // check that it has GroundOverlay elements
        // check that they have names like `tile R001C001`
    };
    NOHRSCSnowModel.prototype.getGroundOverlayMatcher = function (folder) {
        var e_3, _a;
        var elements;
        try {
            for (var _b = __values(iterateNodeList(folder.childNodes)), _c = _b.next(); !_c.done; _c = _b.next()) {
                var child = _c.value;
                if (child.nodeType != Node.ELEMENT_NODE)
                    continue;
                child = child;
                if (child.nodeName == 'GroundOverlay') {
                    elements.push(child);
                    // let latlonbox = child.getElementsByTagName('LatLonBox')[0];
                    // let coordinates = this._coordinatesFromLatLonBox(latlonbox);
                    // let imageUrl = child.getElementsByTagName('Icon')[0].getElementsByTagName('href')[0].textContent;
                    // // let icon = child.getElementsByTagName('Icon')[0];
                    // // let href = icon.getElementsByTagName('href')[0];
                    // // let imageUrl = href.textContent;
                    // sources.push({
                    //     'type': 'image' as const,
                    //     'url': imageUrl,
                    //     'coordinates': coordinates,
                    // });
                }
            }
        }
        catch (e_3_1) { e_3 = { error: e_3_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_3) throw e_3.error; }
        }
        return new GroundOverlayMatcher(elements);
    };
    NOHRSCSnowModel.prototype.getGroundOverlaysAsMBGLSources = function (folder) {
        var e_4, _a;
        var sources = [];
        try {
            for (var _b = __values(iterateNodeList(folder.childNodes)), _c = _b.next(); !_c.done; _c = _b.next()) {
                var child = _c.value;
                if (child.nodeType != Node.ELEMENT_NODE)
                    continue;
                child = child;
                if (child.nodeName == 'GroundOverlay') {
                    var latlonbox = child.getElementsByTagName('LatLonBox')[0];
                    var coordinates = this._coordinatesFromLatLonBox(latlonbox);
                    var imageUrl = child.getElementsByTagName('Icon')[0].getElementsByTagName('href')[0].textContent;
                    // let icon = child.getElementsByTagName('Icon')[0];
                    // let href = icon.getElementsByTagName('href')[0];
                    // let imageUrl = href.textContent;
                    sources.push({
                        'type': 'image',
                        'url': imageUrl,
                        'coordinates': coordinates,
                    });
                }
            }
        }
        catch (e_4_1) { e_4 = { error: e_4_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_4) throw e_4.error; }
        }
        return sources;
    };
    NOHRSCSnowModel.prototype.getFolderByName = function (name) {
        var e_5, _a;
        try {
            for (var _b = __values(iterateNodeList(this.xmlDoc.getElementsByTagName('Folder'))), _c = _b.next(); !_c.done; _c = _b.next()) {
                var folder = _c.value;
                var nameEl = folder.getElementsByTagName('name');
                var folderName = nameEl[0].textContent;
                if (folderName == name) {
                    return folder;
                }
            }
        }
        catch (e_5_1) { e_5 = { error: e_5_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_5) throw e_5.error; }
        }
    };
    NOHRSCSnowModel.prototype._coordinatesFromLatLonBox = function (latlonbox) {
        var north = getFirstChildTextContentAsNumber(latlonbox, 'north');
        var south = getFirstChildTextContentAsNumber(latlonbox, 'south');
        var east = getFirstChildTextContentAsNumber(latlonbox, 'east');
        var west = getFirstChildTextContentAsNumber(latlonbox, 'west');
        // From mapboxl gl docs:
        // The "coordinates" array contains [longitude, latitude] pairs for 
        // the wimage corners listed in clockwise order: top left, top right, 
        // bottom right, bottom left.
        var extent = [
            [west, north],
            [east, north],
            [east, south],
            [west, south],
        ];
        return extent;
    };
    return NOHRSCSnowModel;
}());
export { NOHRSCSnowModel };
