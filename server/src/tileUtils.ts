/// lifted from tilebelt
import SphericalMercator from "@mapbox/sphericalmercator";
import { RasterData } from "./rawRequest.mjs";
import Jimp from "jimp";
import { raw } from "body-parser";

const TILE_SIZE = 256;
const MAX_ZOOM = 17;
const sm = new SphericalMercator({ size: TILE_SIZE, antimeridian: true });

const d2r = Math.PI / 180,
  r2d = 180 / Math.PI;

function tile2lon(x: number, z: number) {
  return (x / Math.pow(2, z)) * 360 - 180;
}

function tile2lat(y: number, z: number) {
  var n = Math.PI - (2 * Math.PI * y) / Math.pow(2, z);
  return r2d * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
}

type XYZ = {
  x: number;
  y: number;
  z: number;
};

const upperLeftCenterLat = 58.2291666666643;
const upperLeftCenterLng = -130.512499999995;
const dataPixelSizeDeg = 0.008333333333333;
/**
 * find the fractional `x` `y` at MAX_ZOOM corresponding to each row and column
 * of unmasked data
 *
 * these are centers
 */
const precomputeXAndY = () => {
  const COLS = 8192;
  const ROWS = 4096;
  const xByCol = Array(COLS);
  const yByRow = Array(ROWS);
  for (let col = 0, row = 0; col < COLS || row < ROWS; ++col, ++row) {
    const lat = upperLeftCenterLat - dataPixelSizeDeg * row;
    const lng = upperLeftCenterLng + dataPixelSizeDeg * col;
    const [x, y] = sm.px([lng, lat], MAX_ZOOM);

    if (col < COLS) {
      xByCol[col] = x;
    }
    if (row < ROWS) {
      yByRow[row] = y;
    }
  }

  return [xByCol, yByRow];
};

const [xByCol, yByRow] = precomputeXAndY();

class RawTile {
  private buffer: Int16Array;
  readonly size: number;
  constructor(size: number) {
    this.buffer = new Int16Array(size * size);
    this.size = size;
  }

  set(col: number, row: number, value: number) {
    this.buffer[row * this.size + col] = value;
  }

  get(col: number, row: number) {
    return this.buffer[row * this.size + col];
  }
}

export const renderRawTile = (data: RasterData, requestedTile: XYZ) => {
  if (requestedTile.z > MAX_ZOOM) {
    throw new Error("z too high fixme");
  }

  // we're goin to convert from this tile's x and y to our reference pixels at
  // MAX_ZOOM, and use that coordinate space for interpolation
  const scale = Math.pow(2, MAX_ZOOM - requestedTile.z);

  // calculate x and y at max zoom
  // (this is the upper left corner)
  const minX = requestedTile.x * scale * TILE_SIZE;
  const minY = requestedTile.y * scale * TILE_SIZE;

  // lower right corner
  // const maxX = (requestedTile.x + 1) * scale;
  // const maxY = (requestedTile.y + 1) * scale;

  //   const maxCol = xByCol.findIndex((x) => x > maxX) - 1;
  //   const maxRow = yByRow.findIndex((y) => y > maxY) - 1;

  // the center of our pixels
  const firstX = minX + 0.5 * scale;
  const firstY = minY + 0.5 * scale;

  // compute x neighbors
  const nearestColByPixelIndex = Array(TILE_SIZE);
  let col = xByCol.findIndex((x) => x > firstX) - 1;
  for (let i = 0; i < TILE_SIZE; ++i) {
    const centerX = firstX + scale * i;
    while (
      !(xByCol[col] <= centerX && xByCol[col + 1] > centerX) &&
      col < xByCol.length - 1
    ) {
      ++col;
    }
    nearestColByPixelIndex[i] =
      centerX - xByCol[col] > xByCol[col + 1] - centerX ? col + 1 : col;
  }

  const nearestRowByPixelIndex = Array(TILE_SIZE);
  let row: number = yByRow.findIndex((x) => x > firstY) - 1;
  for (let i = 0; i < TILE_SIZE; ++i) {
    const centerY = firstY + scale * i;
    while (
      !(yByRow[row] <= centerY && yByRow[row + 1] > centerY) &&
      row < yByRow.length - 1
    ) {
      ++row;
    }
    nearestRowByPixelIndex[i] =
      centerY - yByRow[row] > yByRow[row + 1] - centerY ? row + 1 : row;
  }

  // TODO bilinear

  const output = new RawTile(TILE_SIZE);
  for (let j = 0; j < TILE_SIZE; j++) {
    const row = nearestRowByPixelIndex[j];
    for (let i = 0; i < TILE_SIZE; i++) {
      const col = nearestColByPixelIndex[i];
      output.set(i, j, data.get(col, row));
    }
  }

  return output;
};

// next we need a color ramp -> pallette -> png renderer

const mmToColor = new Map([
  [1, Jimp.rgbaToInt(220, 220, 220, 255)],
  [25.4 * 2, Jimp.rgbaToInt(227, 254, 254, 255)],
  [25.4 * 4, Jimp.rgbaToInt(177, 252, 254, 255)],
  [25.4 * 8, Jimp.rgbaToInt(103, 73, 26, 255)],
]);

/** given snow depth value, return RGBA color */
export const colorForSnowDepth = (value: number) => {
  // encoded value is millimeters of estimated snow depth
  // the nohrsc maps use grey up to 2in, then light blues up to 8in
  let lastKey: number = undefined;
  for (const key of mmToColor.keys()) {
    if (value < key) {
      break;
    }
    lastKey = key;
  }
  return mmToColor.get(lastKey) ?? 0x0;
};

export const renderPNG = (
  rawTile: RawTile,
  colorForValue: (value: number) => number
) =>
  new Promise<Buffer>((resolve, reject) => {
    new Jimp(TILE_SIZE, TILE_SIZE, 0x0, async (err, image) => {
      if (err) return reject(err);

      for (let row = 0; row < rawTile.size; ++row) {
        for (let col = 0; col < rawTile.size; ++col) {
          image.setPixelColor(colorForValue(rawTile.get(col, row)), col, row);
        }
      }

      resolve(image.getBufferAsync(Jimp.MIME_PNG));
    });
  });
