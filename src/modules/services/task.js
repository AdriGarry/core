#!/usr/bin/env node

'use strict';

const { Core, Flux, Logger, Observers, Utils } = require('./../../api');

const log = new Logger(__filename);

const FLUX_PARSE_OPTIONS = [
  { id: 'goToSleep', fn: goToSleep },
  { id: 'idea', fn: idea },
  { id: 'certbot', fn: renewCertbot }
];

Observers.attachFluxParseOptions('service', 'task', FLUX_PARSE_OPTIONS);

const GO_TO_SLEEP_DELAY = 5 * 60;

function idea() {
  log.info('Idea...');
  blinkLivingRoom();
}

function blinkLivingRoom() {
  log.info('blinkLivingRoom...');
  // TODO Récupérer l'état des lampes pour la suite...
  let lightState = false;
  // Flux.do('service|task|switchLivingRoomOff', null, { loop: 5, delay: 0.3 });
  // Flux.do('service|task|switchLivingRoomOn', null, { loop: 5, delay: 0.8 });
  switchLivingRoom(lightState);
  const blinkInterval = setInterval(() => {
    lightState = !lightState;
    switchLivingRoom(lightState);
  }, 500);
  setTimeout(() => {
    clearInterval(blinkInterval);
    switchLivingRoom(false);
  }, 4000);
}

function switchLivingRoom(value) {
  // Flux.do('interface|rfxcom|send', { device: 'plug3', value: value });
  Flux.do('interface|rfxcom|send', { device: 'plug13', value: value });
  Flux.do('interface|rfxcom|send', { device: 'plug12', value: value });
  Flux.do('interface|rfxcom|send', { device: 'plug11', value: value });
}

function goToSleep() {
  log.info(`goToSleep in ${GO_TO_SLEEP_DELAY / 60} min`);

  // light
  Flux.do('service|light|on', GO_TO_SLEEP_DELAY);
  Flux.do('interface|rfxcom|send', { device: 'plug14', value: true });

  Flux.do('service|mood|set', 0);

  // plug off
  Flux.do('interface|rfxcom|send', { device: 'plug1', value: false }, { delay: 3 * 60 });
  Flux.do('interface|rfxcom|send', { device: 'plug3', value: false }, { delay: 3 * 60 });
  Flux.do('interface|rfxcom|send', { device: 'plug11', value: false }, { delay: 3 * 60 });
  Flux.do('interface|rfxcom|send', { device: 'plug12', value: false }, { delay: 3 * 60 });
  Flux.do('interface|rfxcom|send', { device: 'plug13', value: false }, { delay: 3 * 60 });
  Flux.do('interface|rfxcom|send', { device: 'plug14', value: false }, { delay: GO_TO_SLEEP_DELAY });

  // internetBox off
  Flux.do('service|internetBox|off', null, { delay: GO_TO_SLEEP_DELAY });

  if (Core.isAwake()) {
    Flux.do('service|context|sleep', null, { delay: GO_TO_SLEEP_DELAY + 10 });
  }
}

function renewCertbot() {
  log.INFO('renew Certbot certificate');
  // TODO use https://www.npmjs.com/package/greenlock
  Utils.execCmd('/usr/bin/sudo /usr/bin/framebot certbot') // TODO sudo useless ?
    .then(data => {
      log.info('Certbot certificate successfully renewed', data);
    })
    .catch(err => {
      Core.error('Error renewing Certbot certificate', err);
    });
}
