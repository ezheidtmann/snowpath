import { ProductName, RawTarPathOpts } from "./nohrsc/rawRequest.js";
import {
  FetchRawRasterDataOpts,
  RasterData,
  fetchRawRasterData,
  parseProductMetadata,
} from "./rawRequest.mjs";
import { promisify } from "util";
import fs from "fs";
import { gunzip, gzip } from "zlib";

const readFilePromise = promisify(fs.readFile);
const writeFilePromise = promisify(fs.writeFile);
const gunzipPromise = promisify(gunzip);
const gzipPromise = promisify(gzip);

const CACHE_DIR = process.env.SNOWPATH_CACHE ?? "/tmp/snowpath";

console.info(`snowpath: using cache at ${CACHE_DIR}`);

const memoryCache = new Map<string, RasterData>();

const cacheKey = ({
  product,
  masked,
  year,
  month,
  day,
}: RawTarPathOpts & { product: ProductName }) =>
  `${product}:${masked ? "m" : "u"}:${year}:${month}:${day}`;

/** avoid dispatching more than one request for the same asset */
const avoidHerd = <ArgsT extends any[], RetT extends Promise<any>>(
  f: (...args: ArgsT) => RetT,
  cacheKey: (...args: ArgsT) => string
): typeof f => {
  const _progress = new Map<string, RetT>();
  return (...args: ArgsT) => {
    const key = cacheKey(...args);
    if (_progress.has(key)) {
      return _progress.get(key);
    } else {
      const promise = f(...args);
      _progress.set(key, promise);
      promise.then(() => {
        _progress.delete(key);
      });
      return promise;
    }
  };
};

export const _maybeFetchRawRasterData = async <P extends ProductName>({
  path,
  products,
}: FetchRawRasterDataOpts<P>) => {
  const result = new Map<P, RasterData>();
  const missingProducts = new Set<P>();
  for (const product of products) {
    const key = cacheKey({ ...path, product });
    if (memoryCache.has(key)) {
      result.set(product, memoryCache.get(key));
    } else {
      missingProducts.add(product);
    }
  }

  const loaded = await loadFromFileCacheOrFetch({
    path,
    products: Array.from(missingProducts),
  });

  for (const product of missingProducts) {
    result.set(product, loaded.get(product));
  }

  return result;
};

export const maybeFetchRawRasterData = avoidHerd(
  _maybeFetchRawRasterData,
  ({ path, products }) => {
    return products.map((product) => cacheKey({ ...path, product })).join("!");
  }
);

const loadFromFileCacheOrFetch = async <P extends ProductName>({
  path,
  products,
}: FetchRawRasterDataOpts<P>) => {
  const dataByIndex = await Promise.all(
    products.map(async (product) => {
      try {
        return await loadFromFileCache(cacheKey({ ...path, product }));
      } catch (e) {
        return false;
      }
    })
  );

  let missingProducts = new Set<P>();
  const dataByProduct = new Map<P, RasterData>();
  for (const [index, data] of dataByIndex.entries()) {
    if (!data) {
      missingProducts.add(products[index]);
    } else {
      dataByProduct.set(products[index], data);
    }
  }

  if (missingProducts.size) {
    const fetched = await fetchRawRasterData({
      path,
      products: Array.from(missingProducts),
    });
    for (const [product, { txt, dat }] of fetched.entries()) {
      const rawMeta = parseProductMetadata(txt);
      const meta = {
        rows: +rawMeta["Number of rows"],
        cols: +rawMeta["Number of columns"],
        ...path,
      };
      const key = cacheKey({ ...path, product });
      const data = new RasterData({ buffer: dat, ...meta });
      saveToFileCache(key, data, meta);
      dataByProduct.set(product, data);
    }
  }

  return dataByProduct;
};

const loadFromFileCache = async (key: string) => {
  const meta = JSON.parse(
    (await readFilePromise(`${CACHE_DIR}/${key}.json`)).toString("utf-8")
  );
  const gzBuffer = await readFilePromise(`${CACHE_DIR}/${key}.dat.gz`);
  const buffer = await gunzipPromise(gzBuffer);
  return new RasterData({
    buffer,
    rows: meta.rows,
    cols: meta.cols,
  });
};

const saveToFileCache = async (key: string, data: RasterData, meta: object) => {
  return Promise.all([
    writeFilePromise(
      `${CACHE_DIR}/${key}.dat.gz`,
      await gzipPromise(data.buffer)
    ),
    writeFilePromise(
      `${CACHE_DIR}/${key}.json`,
      JSON.stringify(meta, null, "  ")
    ),
  ]);
};
