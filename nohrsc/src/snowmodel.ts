const Node = require('xmldom/lib/dom').Node;

const DOMParser = require('xmldom').DOMParser

function* iterateNodeList(nl: any) {
    for (let i = 0; i < nl.length; ++i) {
        yield nl[i]
    }
}

function getFirstChildTextContentAsNumber(el: Element, tagName: string): number {
    return parseFloat(el.getElementsByTagName(tagName)[0].textContent || '');
}

type GroundOverlaySpec = {
    north: number
    south: number
    east: number
    west: number
    imageUrl: string
}

export class GroundOverlayMatcher {
    private overlays: GroundOverlaySpec[] = []

    constructor(overlays: Element[]) {
        for (let overlay of overlays) {
            let latlonbox = overlay.getElementsByTagName('LatLonBox')[0];
            let north = getFirstChildTextContentAsNumber(latlonbox, 'north');
            let south = getFirstChildTextContentAsNumber(latlonbox, 'south');
            let east = getFirstChildTextContentAsNumber(latlonbox, 'east');
            let west = getFirstChildTextContentAsNumber(latlonbox, 'west');

            let imageUrl = overlay.getElementsByTagName('Icon')[0].getElementsByTagName('href')[0].textContent;

            this.overlays.push({ north, south, east, west, imageUrl })
        }
    }

    getOverlaysIntersectingBbox([west, south, east, north]: number[]): GroundOverlaySpec[] {
        let matchingOverlays: GroundOverlaySpec[] = [];
        for (let overlay of this.overlays) {
            if (north < overlay.south // desired box is below
                || south > overlay.north // above
                || west > overlay.east // to the right
                || east < overlay.west) { // to the left
                // doesn't intersect
                continue
            }
            matchingOverlays.push(overlay);
        }
        return matchingOverlays;
    }
}

export class NOHRSCSnowModel {
    private xmlDoc: XMLDocument

    constructor(xml: string | XMLDocument) {
        if (typeof xml == "string") {
            this.xmlDoc = new DOMParser().parseFromString(xml, 'text/xml');
        }
        else {
            this.xmlDoc = xml;
        }

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

    getGroundOverlayMatcher(folder: Element): GroundOverlayMatcher {
        let elements: Element[] = [];
        for (let child of iterateNodeList(folder.childNodes)) {
            if (child.nodeType != Node.ELEMENT_NODE) continue;
            child = child as Element;
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
        return new GroundOverlayMatcher(elements);
    }

    getGroundOverlaysAsMBGLSources(folder: Element) {
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
                    'type': 'image' as const,
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


    _coordinatesFromLatLonBox(latlonbox: Element) {
        let north = getFirstChildTextContentAsNumber(latlonbox, 'north');
        let south = getFirstChildTextContentAsNumber(latlonbox, 'south');
        let east = getFirstChildTextContentAsNumber(latlonbox, 'east');
        let west = getFirstChildTextContentAsNumber(latlonbox, 'west');

        // From mapboxl gl docs:
        // The "coordinates" array contains [longitude, latitude] pairs for 
        // the wimage corners listed in clockwise order: top left, top right, 
        // bottom right, bottom left.

        let extent = [
            [west, north],
            [east, north],
            [east, south],
            [west, south],
        ];
        return extent;
    }
}