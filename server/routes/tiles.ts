import express from 'express';
import vtpbf from 'vt-pbf';
import { PointsTiler } from 'nohrsc';
import path from 'path';
import fs from 'fs';

let router = express.Router();

// load xml from fixture?


function fixturePath(fixtureName) {
    return path.join(__dirname, '..', 'fixtures', fixtureName);
}

function fixtureContents(fixtureName) {
    return fs.readFileSync(fixturePath(fixtureName)).toString();
}
let tiler = new PointsTiler(fixtureContents('nohrsc_nsm_20200305.kml'))

router.use('/:z/:x/:y/points.mvt', (req, res) => {
    const [z, x, y] = [req.params.z, req.params.x, req.params.y].map(parseInt);
    tiler.getTile(z, x, y).then(function (tile) {
        let buf = vtpbf.fromGeojsonVt({ 'nohrsc_points': tile });
        res.set('Content-Type', 'application/vnd.mapbox-vector-tile');
        res.send(buf);
    })
})