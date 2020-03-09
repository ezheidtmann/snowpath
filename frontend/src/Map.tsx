import React from 'react';
import ReactDOM from 'react-dom';
import mapboxgl from 'mapbox-gl';
import { timingSafeEqual } from 'crypto';

mapboxgl.accessToken = 'pk.eyJ1IjoiZXpoIiwiYSI6IlpQQ01TR2cifQ.LuIx3e1Ez52srjbRHymXNg';


type MapProps = {
    style: any,
    initialLng: number,
    initialLat: number,
    initialZoom: number,
}

export default class Map extends React.Component<MapProps> {
    private mapContainer = React.createRef<HTMLDivElement>()
    private map?: mapboxgl.Map;

    constructor(props: MapProps) {
        super(props);
    }

    componentDidMount() {
        fetch('/fixtures/nohrsc_nsm_20200305.kml')
            .then(res => res.text())
            .then(text => {
                let doc = new DOMParser().parseFromString(text, 'text/xml');
                this.setState({ kmlText: text })
            })

        this.map = new mapboxgl.Map({
            container: this.mapContainer.current!,
            style: 'mapbox://styles/mapbox/streets-v11',
            center: [this.props.initialLng, this.props.initialLat],
            zoom: this.props.initialZoom
        });

        this.map.on('load', ev => {

        })
    }

    render() {
        let { style } = this.props;
        return (
            <div style={style} ref={this.mapContainer} />
        );
    }
}