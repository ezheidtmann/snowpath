declare type GroundOverlaySpec = {
    north: number;
    south: number;
    east: number;
    west: number;
    imageUrl: string;
};
export declare class GroundOverlayMatcher {
    private overlays;
    constructor(overlays: Element[]);
    getOverlaysIntersectingBbox([west, south, east, north]: number[]): GroundOverlaySpec[];
}
export declare class NOHRSCSnowModel {
    private xmlDoc;
    constructor(xml: string | XMLDocument);
    sanityCheck(): void;
    getGroundOverlayMatcher(folder: Element): GroundOverlayMatcher;
    getGroundOverlaysAsMBGLSources(folder: Element): any[];
    getFolderByName(name: string): any;
    _coordinatesFromLatLonBox(latlonbox: Element): number[][];
}
export {};
