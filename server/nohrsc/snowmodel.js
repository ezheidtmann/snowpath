const xmljs = require('xml-js');
const assert = require('assert');

export class NOHRSCSnowModel {
    constructor(xmlText) {
        this.xmlText = xmlText
        this.xmlParsed = xmljs.xml2js(xmlText, { compact: false });
        this.sanityCheck()
    }

    sanityCheck() {
        // check that it's kml
        // check that it has a top-level Document with `name` element that contains "NOHRSC"
        // check that there are folders with `name` elements
        // check that there is a Snow Depth folder
        // check that it has GroundOverlay elements
        // check that they have names like `tile R001C001`
    }

    getGroundOverlaysAsMBGLSources(folder) {
        let sources = [];
        for (let child of folder.elements) {
            if (child.name == 'GroundOverlay') {
                let latlonbox = this._getChildByTagName(child, 'LatLonBox');
                let coordinates = this._coordinatesFromLatLonBox(latlonbox);
                let icon = this._getChildByTagName(child, 'Icon')
                let href = this._getChildByTagName(icon, 'href');
                let imageUrl = href.elements[0].text;
                sources.push({
                    'type': 'image',
                    'url': imageUrl,
                    'coordinates': coordinates,
                });
            }
        }
        return sources;
    }

    getFolderByName(name) {
        let kml = this.xmlParsed.elements[0];
        let document = kml.elements[0];
        for (let element of document.elements) {
            if (element.name == 'Folder') {
                let folder = element;
                let folderName = this._getNameChildText(folder);
                if (folderName == name) {
                    return folder;
                }
            }
        }
    }

    _getNameChildText(el) {
        return this._getChildByTagName(el, 'name').elements[0].text;
    }

    _getChildByTagName(el, tagName) {
        for (let child of el.elements) {
            if (child.type == 'element' && child.name == tagName) {
                return child;
            }
        }
    }

    _coordinatesFromLatLonBox(latlonbox) {
        let north = this._getChildByTagName(latlonbox, 'north').elements[0].text;
        let south = this._getChildByTagName(latlonbox, 'south').elements[0].text;
        let east = this._getChildByTagName(latlonbox, 'east').elements[0].text;
        let west = this._getChildByTagName(latlonbox, 'west').elements[0].text;
        // The "coordinates" array contains [longitude, latitude] pairs for the image corners listed in clockwise order: top left, top right, bottom right, bottom left.

        let extent = [
            [north, west],
            [north, east],
            [south, east],
            [south, west],
        ];
        return extent;
    }
}