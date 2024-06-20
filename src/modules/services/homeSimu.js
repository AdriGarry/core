#!/usr/bin/env node
'use strict';

const { Core, Flux, Logger, Observers, Scheduler } = require('../../api');

const log = new Logger(__filename);

// module.exports = {
//   cron: {
//     base: [{ cron: '0 0 22 * * *', flux: { id: 'service|mood|set', data: 1 } }]
//   }
// };

const FLUX_PARSE_OPTIONS = [{ id: 'start', fn: startHomeSimu }];

Observers.attachFluxParseOptions('service', 'homeSimu', FLUX_PARSE_OPTIONS);

function startHomeSimu() {
  log.info('Start homeSimu...');

  // One song each 10 min
  new CronJob('0 */10 * * * *', function () {
    Flux.do('service|music|song');
  }).start();
}
