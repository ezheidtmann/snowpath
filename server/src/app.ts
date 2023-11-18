var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

import indexRouter from './routes/index';
import noaaProxyRouter from './routes/noaa_proxy';
import tilesRouter from './routes/tiles';

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/nohrsc', noaaProxyRouter);
app.use('/tiles', tilesRouter);
app.use('/fixtures', express.static(path.join(__dirname, '..', 'fixtures')))

module.exports = app;
