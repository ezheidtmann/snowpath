const xmljs = require('xml-js');
const assert = require('assert');
const Node = require('xmldom/lib/dom').Node;
const DOMParser = require('xmldom').DOMParser

function* iterateNodeList(nl: any) {
    for (let i = 0; i < nl.length; ++i) {
        yield nl[i]
    }
}

export class NOHRSCSnowModel {
    private xmlText: string
    private xmlDoc: XMLDocument
    private xmlParsed: any

    constructor(xmlText: string) {
        this.xmlText = xmlText
        this.xmlDoc = new DOMParser().parseFromString(xmlText);
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

    getGroundOverlaysAsMBGLSources(folder: Element) {
        debugger;
        let sources = [];
        for (let child of iterateNodeList(folder.childNodes)) {
            if (child.nodeType != Node.ELEMENT_NODE) continue;
            child = child as Element;
            if (child.nodeName == 'GroundOverlay') {
                let latlonbox = child.getElementsByTagName('LatLonBox')[0];
                let coordinates = this._coordinatesFromLatLonBox(latlonbox);
                let imageUrl = child.getElementsByTagName('Icon')[0].getElementsByTagName('href')[0].textContent;
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
        return sources;
    }

    getFolderByName(name: string) {
        for (let folder of iterateNodeList(this.xmlDoc.getElementsByTagName('Folder'))) {
            let nameEl = folder.getElementsByTagName('name');
            let folderName = nameEl[0].textContent;
            if (folderName == name) {
                return folder;
            }
        }
    }

    _getFirstChildTextContent(el: Element, tagName: string): string {
        return el.getElementsByTagName(tagName)[0].textContent;
    }

    _coordinatesFromLatLonBox(latlonbox: Element) {
        let north = this._getFirstChildTextContent(latlonbox, 'north');
        let south = this._getFirstChildTextContent(latlonbox, 'south');
        let east = this._getFirstChildTextContent(latlonbox, 'east');
        let west = this._getFirstChildTextContent(latlonbox, 'west');
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