#!/usr/bin/env node
'use strict';

const { Core, Flux, Logger, Observers, Scheduler } = require('./../../api');

const log = new Logger(__filename);

module.exports = {};

const FLUX_PARSE_OPTIONS = [{ id: 'set', fn: setMoodLevel, condition: { isAwake: true } }];

Observers.attachFluxParseOptions('service', 'mood', FLUX_PARSE_OPTIONS);

const MOOD_LEVELS = {
  0: { volume: 0 }, // muted
  1: { volume: 30 }, // system tts: clock, and others human triggered functions (timer...)
  2: { volume: 50 },
  3: { volume: 60 }, // max + interaction
  4: { volume: 80 }, // screen/diapo
  5: { volume: 90 } // party mode + pirate
};

const DEFAULT_MOOD_LEVEL = Core.run('mood'),
  HOURS_BACK_TO_DEFAULT_LEVEL = 6;

setImmediate(() => {
  setMoodLevel(DEFAULT_MOOD_LEVEL);
});

function setMoodLevel(newMoodLevelId) {
  log.info('Setting mood level to', newMoodLevelId);
  Core.run('mood', newMoodLevelId);
  new Flux('interface|sound|volume', MOOD_LEVELS[newMoodLevelId].volume);
  if (newMoodLevelId > DEFAULT_MOOD_LEVEL) schedulingBackToDefaultMoodLevel();
  additionalMoodSetup(newMoodLevelId);
}

function schedulingBackToDefaultMoodLevel() {
  log.info('Scheduling back to default mood level (' + DEFAULT_MOOD_LEVEL + ') in ' + HOURS_BACK_TO_DEFAULT_LEVEL + ' hours');
  Scheduler.delay(HOURS_BACK_TO_DEFAULT_LEVEL * 60 * 60).then(backToDefaultMoodLevel);
}

function backToDefaultMoodLevel() {
  log.info('Back to default mood level:', DEFAULT_MOOD_LEVEL);
  setMoodLevel(DEFAULT_MOOD_LEVEL);
}

function additionalMoodSetup(moodLevelId) {
  if (moodLevelId >= 3) {
    // Max + interaction
    new Flux('interface|arduino|connect');
    new Flux('interface|tts|speak', { lg: 'en', voice: 'google', msg: 'Mood level ' + moodLevelId });
    scheduleFluxWhileMoodLevel(3, 20, { id: 'service|interaction|random' });
  } else if (Core.run('max')) {
    new Flux('interface|arduino|disconnect');
  }

  if (moodLevelId >= 4) {
    // HDMI (video loop)
    new Flux('interface|video|loop');
    scheduleFluxWhileMoodLevel(4, 23, { id: 'service|interaction|random' });
  } else if (Core.run('screen')) {
    new Flux('interface|hdmi|off');
  }

  if (moodLevelId === 5) {
    // Party
    new Flux('service|party|start');
    scheduleFluxWhileMoodLevel(5, 10, { id: 'service|party|pirate' });
  }
}

function scheduleFluxWhileMoodLevel(moodLevelLimit, minutesInterval, flux) {
  log.info(`Scheduling flux '${flux.id}', at mood level limit ${moodLevelLimit}, each ${minutesInterval} minutes`);
  new Flux(flux.id, flux.data);
  let interval = setInterval(() => {
    if (Core.run('mood') >= moodLevelLimit) new Flux(flux.id, flux.data);
    else clearInterval(interval);
  }, minutesInterval * 60 * 1000);
}
