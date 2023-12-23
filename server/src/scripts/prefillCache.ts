import "dotenv/config";

import { _maybeFetchRawRasterData, maybeFetchRawRasterData } from "cache.js";
import { RawTarPathOpts } from "../nohrsc/rawRequest.js";
import pLimit from "p-limit";

const prefill = async () => {
  const now = new Date();
  const paths: RawTarPathOpts[] = [];
  for (var d = new Date(2014, 0, 1); d <= now; d.setDate(d.getDate() + 1)) {
    paths.push({
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      day: d.getDate(),
    });
  }
  const parallelism = 4;
  const limit = pLimit(parallelism);

  console.log(`starting ${paths.length} requests, ${parallelism} at a time`);
  await Promise.all(
    paths.map(async (path: RawTarPathOpts) =>
      limit(async () => {
        try {
          console.log("starting", path);
          await _maybeFetchRawRasterData({
            products: ["snow_depth", "snow_water_equivalent"],
            path,
          });
          console.log("finished", path);
        } catch (e) {
          console.log("failed", path, e);
        }
      })
    )
  );
};

prefill();
