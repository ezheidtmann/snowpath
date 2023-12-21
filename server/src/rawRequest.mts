import fetch from "node-fetch";
import tar from "tar-stream";
import {
  rawTarUrl,
  RawTarPathOpts,
  ProductName,
  tarMemberPrefix,
} from "nohrsc";
import gunzip from "gunzip-maybe";

const streamToBuffer = async (stream: NodeJS.ReadableStream): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    const bufs: Buffer[] = [];
    stream.on("data", (chunk) => {
      if (chunk instanceof Buffer) {
        bufs.push(chunk);
      } else {
        reject(new Error("Got unknown when expected Buffer"));
      }
    });
    stream.on("end", () => resolve(Buffer.concat(bufs)));
  });

const streamToString = (stream: NodeJS.ReadableStream) =>
  streamToBuffer(stream).then((buf) => buf.toString("utf-8"));

export type FetchRawRasterDataOpts<P extends ProductName> = {
  path: RawTarPathOpts;
  products: P[];
};

type ProductRawData = { txt: string; dat: Buffer };

export const fetchRawRasterData = async <P extends ProductName>({
  path,
  products,
}: FetchRawRasterDataOpts<P>) => {
  const response = await fetch(rawTarUrl(path));

  const dataByProduct = new Map<P, Partial<ProductRawData> | undefined>();
  const checkDataForSanity = () => {
    for (const product of products) {
      const data = dataByProduct.get(product);
      if (!data?.dat || !data?.txt) {
        throw new Error(`Missing files for product ${product}`);
      }
      const meta = parseProductMetadata(data.txt);
      if (!path.masked && !checkMatches(unmaskedExpectedMetadata, meta)) {
        throw new Error(`Metadata doesn't match expectation`);
      }
      if (path.masked) {
        throw new Error("Masked data not yet supported");
      }
    }
    return true;
  };

  const extract = tar.extract();
  response.body.pipe(extract);
  for await (const entry of extract) {
    for (const product of products) {
      const prefix = tarMemberPrefix(product);
      if (entry.header.name.startsWith(prefix)) {
        if (entry.header.name.endsWith(".txt.gz")) {
          const productData = dataByProduct.get(product) ?? {};
          productData.txt = await streamToString(entry.pipe(gunzip()));
          dataByProduct.set(product, productData);
        } else if (entry.header.name.endsWith(".dat.gz")) {
          const productData = dataByProduct.get(product) ?? {};
          productData.dat = await streamToBuffer(entry.pipe(gunzip()));
          dataByProduct.set(product, productData);
        }
      }
    }
    entry.resume();
  }

  checkDataForSanity();

  return dataByProduct as Map<P, ProductRawData>;
};

export const parseProductMetadata = (txt: string) => {
  const lineRegex = /(?<label>[^:]+):(?<value>.*)/;
  const parsed: Record<string, string> = {};
  for (const line of txt.split("\n")) {
    const m = line.match(lineRegex);
    if (m) {
      const { label, value } = m.groups;
      parsed[label] = value.trim();
    }
  }
  return parsed;
};

const checkMatches = (
  expected: Record<string, string>,
  actual: Record<string, string>
) => {
  const numericMatch = (expected: string, actual: string) => {
    // In practice the greatest diff we have seen is `-130.516666666662` when we
    // expect `-130.516666666661`, which is a difference of just under 1e-12.
    // But 1e-11 is also a tiny distance.
    return Math.abs(parseFloat(expected) - parseFloat(actual)) < 1e-11;
  };
  for (const [k, v] of Object.entries(expected)) {
    if (actual[k] !== v && !numericMatch(v, actual[k])) {
      console.log(`${k}: expected '${v}' actual '${actual[k]}'`);
      return false;
    }
  }
  return true;
};

const unmaskedExpectedMetadata = parseProductMetadata(`
Format version: NOHRSC GIS/RS raster file v1.1
Number of columns: 8192
Number of rows: 4096
Benchmark column: 0
Benchmark row: 0
Benchmark x-axis coordinate: -130.512499999995
Benchmark y-axis coordinate: 58.2291666666643
X-axis resolution: 0.00833333333333300
Y-axis resolution: 0.00833333333333300
X-axis offset: 0.00416666666666650
Y-axis offset: 0.00416666666666650
Minimum x-axis coordinate: -130.516666666661
Maximum x-axis coordinate: -62.2499999999975
Minimum y-axis coordinate: 24.0999999999990
Maximum y-axis coordinate: 58.2333333333310
`);

// type RasterData = {
//   data: DataView;
//   product: ProductName;
//   path: RawTarPathOpts;
// };

type RasterDataOpts = {
  buffer: Buffer | ArrayBuffer;
  rows: number;
  cols: number;
};

export class RasterData {
  /** raw buffer from NOHRSC (big-endian) */
  readonly buffer: Buffer;
  private dataView: DataView;
  private int16array: Int16Array;
  private rows: number;
  private cols: number;

  /**
   * Make a decoder/encoder from big-endian buffer
   */
  constructor({ buffer, rows, cols }: RasterDataOpts) {
    const dataView = new DataView("buffer" in buffer ? buffer.buffer : buffer);
    if (dataView.byteLength !== rows * cols * 2) {
      throw new Error(
        `Invalid buffer size ${dataView.byteLength} for ${cols}x${rows} buffer`
      );
    }
    const int16array = new Int16Array(rows * cols);
    for (let col = 0; col < cols; ++col) {
      for (let row = 0; row < rows; ++row) {
        // https://nsidc.org/sites/default/files/g02158-v001-userguide_2_1.pdf
        //
        // The first value at (1,1) is the top-left corner of the array (NW corner
        // in this context). The file is structured so that values are read across
        // the rows. For example, the second value to be read would be the second
        // column of the first row (2,1).
        const index = row * cols * 2 + col * 2;
        int16array[index] = dataView.getInt16(index, false);
      }
    }

    this.dataView = dataView;
    this.int16array = int16array;
    this.buffer = "buffer" in buffer ? buffer : Buffer.from(buffer);
    this.rows = rows;
    this.cols = cols;
  }

  get(col: number, row: number) {
    if (col < 0 || row < 0 || col >= this.cols || row >= this.rows) {
      throw new Error(
        `Cannot .get(${col}, ${row}) from ${this.cols}x${this.rows} buffer`
      );
    }
    return this.int16array[row * this.cols + col];
  }

  set(col: number, row: number, value: number) {
    if (col < 0 || row < 0 || col >= this.cols || row >= this.rows) {
      throw new Error(
        `Cannot .set(${col}, ${row}) from ${this.cols}x${this.rows} buffer`
      );
    }

    this.dataView.setInt16(row * this.cols * 2 + col * 2, value, false);
    this.int16array[row * this.cols + col] = value;
  }
}
