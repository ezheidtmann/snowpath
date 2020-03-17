declare type GJVTTile = {
    features: any[];
};
export default class PointsTiler {
    private model;
    private overlayMatcher;
    private merc;
    private tileIndexByUrl;
    constructor(kml: string | XMLDocument);
    private getImageAsTileIndex;
    getTile(z: number, x: number, y: number): Promise<GJVTTile>;
}
export {};
