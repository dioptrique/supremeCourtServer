var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var app = express();

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());

require('./routes')(app);

app.get('/*', (req, res) => res.status(404).send({
  error: 'Route not found',
}));
app.post('/*', (req, res) => res.status(404).send({
  error: 'Route not found',
}));

module.exports = app;
