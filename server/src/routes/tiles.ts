import express from "express";
import vtpbf from "vt-pbf";
// import { PointsTiler } from "nohrsc";
import path from "path";
import fs from "fs";
import { colorForSnowDepth, renderPNG, renderRawTile } from "../tileUtils.js";
import { maybeFetchRawRasterData } from "../cache.js";

let router = express.Router();

// load xml from fixture?

function fixturePath(fixtureName) {
  return path.join(__dirname, "..", "..", "fixtures", fixtureName);
}

function fixtureContents(fixtureName) {
  return fs.readFileSync(fixturePath(fixtureName)).toString();
}
// let pointsTiler = new PointsTiler(fixtureContents("nohrsc_nsm_20200305.kml"));

// router.use("/:z/:x/:y/points.mvt", (req, res) => {
//   pointsTiler
//     .getTile(+req.params.z, +req.params.x, +req.params.y)
//     .then(function (tile) {
//       let buf = vtpbf.fromGeojsonVt({ nohrsc_points: tile });
//       res.set("Content-Type", "application/vnd.mapbox-vector-tile");
//       res.send(Buffer.from(buf));
//     });
// });

router.use("/snow_depth/:year/:month/:day/:z/:x/:y.png", async (req, res) => {
  const dataMap = await maybeFetchRawRasterData({
    products: ["snow_depth"],
    path: {
      year: +req.params.year,
      month: +req.params.month,
      day: +req.params.day,
    },
  });

  try {
    const rawTile = renderRawTile(dataMap.get("snow_depth"), {
      x: +req.params.x,
      y: +req.params.y,
      z: +req.params.z,
    });
    const pngBuffer = await renderPNG(rawTile, colorForSnowDepth);

    res.setHeader("content-type", "image/png");
    return res.send(pngBuffer);
  } catch (e) {
    console.log("failed to render  tile", e);
    return res.status(500).send("failed to render  tile");
  }
});

export default router;
