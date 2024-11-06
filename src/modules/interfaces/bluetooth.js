#!/usr/bin/env node
'use strict';

const noble = require('noble');

const { Core, Flux, Logger, Observers } = require('../../api');

const log = new Logger(__filename);

module.exports = {};

// const FLUX_PARSE_OPTIONS = [
//   { id: 'on', fn: setOn },
//   { id: 'off', fn: setOff }
// ];

// Observers.attachFluxParseOptions('interface', 'bluetooth', FLUX_PARSE_OPTIONS);

setTimeout(() => {
  log.INFO('Starting bluetooth stuff...');
  noble.startScanning();
}, 10000);

// function setOn() {
//   log.info('Activate bluetooth...');

//   bluetooth.on().then(state => {
//     console.log('Bluetooth state changed to on');
//   });
//   //Core.run('bluetooth', true);
// }

// function setOff() {
//   log.info('Disable bluetooth...');

//   bluetooth.off().then(state => {
//     console.log('Bluetooth state changed to off');
//   });
//   //Core.run('bluetooth', false);
// }
