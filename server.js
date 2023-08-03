'use strict';

const bodyParser = require('body-parser');
const express = require('express');
const logger = require('pino')();
const port = process.env.APP_PORT || '8080';

const app = express();

app.use((req, res, next) => {
  res.set('Timing-Allow-Origin', '*');
  res.set('Access-Control-Allow-Origin', '*');
  next();
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get('/multiple-exporters', (req, res) => {
  res.send('Ohai!');
});

app.listen(port, () => {
  logger.info(`Started on port: ${port}`);
});
