import fetch from "node-fetch";

export const NOAA_BASE_URL = "https://noaadata.apps.nsidc.org/NOAA/G02158/";

export type RawTarPathOpts = {
  /** defaults to "https://noaadata.apps.nsidc.org/NOAA/G02158/" */
  baseUrl?: string;
  masked?: boolean;
  year: number;
  /** Jan is 1; Dec is 12 */
  month: number;
  /** day of month */
  day: number;
};

const monthFolders0Index = [
  "01_Jan",
  "02_Feb",
  "03_Mar",
  "04_Apr",
  "05_May",
  "06_Jun",
  "07_Jul",
  "08_Aug",
  "09_Sep",
  "10_Oct",
  "11_Nov",
  "12_Dec",
];

export const rawTarUrl = ({
  baseUrl = NOAA_BASE_URL,
  masked = false,
  year,
  month,
  day,
}: RawTarPathOpts) => {
  const formattedDate = `${year}${month.toString().padStart(2, "0")}${day
    .toString()
    .padStart(2, "0")}`;
  const filename = `SNODAS_${masked ? "" : "unmasked_"}${formattedDate}.tar`;
  return `${baseUrl}${masked ? "masked" : "unmasked"}/${year}/${
    monthFolders0Index[month - 1]
  }/${filename}`;
};

// we don't support `1025` precipitation because it's a driving variable and has
// a different format
export type ProductName =
  | "snow_water_equivalent"
  | "snow_depth"
  | "snow_pack_average_temperature"
  | "blowing_snow_sublimation"
  | "snow_melt"
  | "snow_pack_sublimation";

const productCodes: Record<ProductName, string> = {
  snow_water_equivalent: "1034",
  snow_depth: "1036",
  snow_pack_average_temperature: "1038",
  blowing_snow_sublimation: "1039",
  snow_melt: "1044",
  snow_pack_sublimation: "1050",
};

export const tarMemberPrefix = (
  product: ProductName,
  masked: boolean = false
) => `${masked ? "us" : "zz"}_ssmv1${productCodes[product]}`;
