import { fetchRawRasterData } from "rawRequest.mjs";

fetchRawRasterData({
  path: { masked: false, year: 2023, month: 1, day: 1 },
  products: ["snow_depth"],
});
