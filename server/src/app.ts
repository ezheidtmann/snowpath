import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
import logger from "morgan";
import indexRouter from "./routes/index.js";
import noaaProxyRouter from "./routes/noaa_proxy.js";
import tilesRouter from "./routes/tiles.js";
import cors from "cors";

const __dirname = new URL(".", import.meta.url).pathname;

var app = express();

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/nohrsc", noaaProxyRouter);
app.use("/tiles", tilesRouter);
app.use("/fixtures", express.static(path.join(__dirname, "..", "fixtures")));

export default app;
