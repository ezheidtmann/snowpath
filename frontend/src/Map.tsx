import React from 'react';
import ReactDOM from 'react-dom';
import mapboxgl from 'mapbox-gl';
import { bitmapColumnToPointFeatures, bitmapColumnToImageUrl, columnCoordinates } from './nohrscUtils';
import { bitmapToPointFeatures } from './nohrscUtils';

mapboxgl.accessToken = 'pk.eyJ1IjoiZXpoIiwiYSI6IlpQQ01TR2cifQ.LuIx3e1Ez52srjbRHymXNg';

let noaaPrefixRe = /^https?:\/\/www.nohrsc.noaa.gov\/\/?/
function rewriteNOAAUrl(url: string) {
    return url.replace(noaaPrefixRe, '/nohrsc/');
}


type MapProps = {
    style: any,
    initialLng: number,
    initialLat: number,
    initialZoom: number,
}

type MapState = {
    sources: null | Array<mapboxgl.ImageSourceRaw>,
    mapLoaded: boolean,
}

export default class Map extends React.Component<MapProps, MapState> {
    private mapContainer = React.createRef<HTMLDivElement>()
    private map?: mapboxgl.Map;
    private sourceIdCounter: number = 0;

    constructor(props: MapProps) {
        super(props);
        this.state = {
            sources: null,
            mapLoaded: false,
        };
    }

    componentDidMount() {
        this.map = new mapboxgl.Map({
            container: this.mapContainer.current!,
            style: 'mapbox://styles/mapbox/streets-v11',
            center: [this.props.initialLng, this.props.initialLat],
            zoom: this.props.initialZoom,
            hash: true,
        });
        // this.map.showTileBoundaries = true;

        this.map.on('load', ev => {
            this.setState({ mapLoaded: true });
            let map = this.map!

            map.addSource('snow_depth', {
                type: "raster",
                tiles: ["http://localhost:8000/tiles/snow_depth/2023/11/22/{z}/{x}/{y}.png"],
                tileSize: 256,
            })

            map.addLayer({
                id: 'snow_depth',
                 source: "snow_depth",
                 type: "raster",
                 paint: {
                    "raster-opacity": 0.5,
                 }
            })
        })
    }

    addSourcesIfReady() {
        const { mapLoaded, sources } = this.state;
        debugger;
        if (mapLoaded && sources !== null) {

        }
    }

    render() {
        let { style } = this.props;
        return (
            <div style={style} ref={this.mapContainer} />
        );
    }
}