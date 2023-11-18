import React from 'react';
import ReactDOM from 'react-dom';
import mapboxgl from 'mapbox-gl';
import { NOHRSCSnowModel } from 'nohrsc';
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
        fetch('/fixtures/nohrsc_nsm_20200305.kml')
            .then(res => res.text())
            .then(text => {
                // let doc = new DOMParser().parseFromString(text, 'text/xml');
                let model = new NOHRSCSnowModel(text);
                let sources = model.getGroundOverlaysAsMBGLSources(model.getFolderByName('Snow Depth'))
                this.setState({ sources });
                // console.log(sources);
            })

        this.map = new mapboxgl.Map({
            container: this.mapContainer.current!,
            style: 'mapbox://styles/mapbox/streets-v11',
            center: [this.props.initialLng, this.props.initialLat],
            zoom: this.props.initialZoom,
            hash: true,
        });
        this.map.showTileBoundaries = true;

        this.map.on('load', ev => {
            this.setState({ mapLoaded: true });
            let map = this.map!

            map.addSource('points', {
                'type': 'vector',
                'tiles': ['http://localhost:3000/tiles/{z}/{x}/{y}/points.mvt'],
                'maxzoom': 14,
                'minzoom': 6,
            })

            map.addLayer({
                'id': 'points',
                'source': 'points',
                'source-layer': 'nohrsc_points',
                'type': 'circle',
                'paint': {
                    'circle-color': ['get', 'color'],
                    'circle-radius': 5,
                    'circle-opacity': 0.85,
                }
            })

            return;

            for (let source of this.state.sources!) {
                if (source.coordinates === undefined) {
                    console.error('invalid source missing coordinates:', source);
                    continue;
                }
                let coordinates = source.coordinates;
                let sourceId = 'source_' + this.sourceIdCounter++;

                let url = rewriteNOAAUrl(source.url!);
                if (this.sourceIdCounter < 3) {
                    fetch(url)
                        .then(res => res.blob())
                        .then(blob => createImageBitmap(blob))
                        .then(bitmap => {

                            // let column = 1;
                            // let features = bitmapColumnToPointFeatures(bitmap, column, coordinates);

                            // @ts-ignore doesn't like coordinates
                            map.addSource(`bbox_${sourceId}`, {
                                type: 'geojson',
                                data: {
                                    type: 'Feature',
                                    properties: {},
                                    geometry: {
                                        type: "LineString",
                                        coordinates: coordinates,
                                    }
                                }
                            });

                            // map.addLayer({
                            //     id: `bbox_${sourceId}`,
                            //     type: 'line',
                            //     source: `bbox_${sourceId}`,
                            //     paint: {
                            //         "line-color": '#000000',
                            //         "line-width": 3,
                            //     }
                            // })

                            // let features = bitmapColumnToPointFeatures(bitmap, column, coordinates);
                            // @ts-ignore doesn't like type of `features`
                            // map.addSource(`points_${sourceId}`, {
                            //     type: "geojson",
                            //     data: {
                            //         type: "FeatureCollection",
                            //         features,
                            //     }
                            // });
                            // console.log(features);

                            // map.addLayer({
                            //     id: `layer_${sourceId}`,
                            //     type: "circle",
                            //     source: `points_${sourceId}`,
                            //     paint: {
                            //         'circle-color': ['get', 'color'],
                            //         'circle-radius': 5,
                            //         'circle-opacity': 0.85,
                            //     }
                            // })

                            // let columnImageUrl = bitmapColumnToImageUrl(bitmap, column);
                            // let newCoordinates = columnCoordinates(column, bitmap.width, coordinates);

                            // map.addSource(`image_${sourceId}`, {
                            //     type: "image",
                            //     url: columnImageUrl,
                            //     coordinates: newCoordinates,
                            // });

                            // map.addLayer({
                            //     id: `layer_image_${sourceId}`,
                            //     type: "raster",
                            //     source: `image_${sourceId}`,
                            //     paint: {
                            //         'raster-resampling': 'nearest',
                            //         'raster-opacity': 0.5,
                            //     }
                            // })
                        })

                }
                // 30 arc-second, 6935 columns by 3351 rows
                // Southernmost Latitude: 24.0996° N
                // Northernmost Latitude: 53.9667° N
                // Westernmost Longitude: 130.5171° W
                // Easternmost Longitude: 62.2504° W


                // console.log('added source', sourceId, lngSpan, latSpan, lngSpan / 512, latSpan / 512);

            }
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