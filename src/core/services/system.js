#!/usr/bin/env node
'use strict';

const { spawn } = require('child_process');

const Core = require(_PATH + 'src/core/Core.js').Core,
	log = new (require(Core._CORE + 'Logger.js'))(__filename),
	Utils = require(_PATH + 'src/core/Utils.js');

Core.flux.service.system.subscribe({
	next: flux => {
		if (flux.id == 'restart') {
			/* || flux.id == 'restartCore'*/
			restartCore(flux.value);
		} else if (flux.id == 'goToSleep') {
			goToSleep();
		} else if (flux.id == 'reboot') {
			reboot();
		} else if (flux.id == 'shutdown') {
			shutdown();
		} else if (flux.id == 'light') {
			light(flux.value);
		} else Core.error('unmapped flux in System service', flux, false);
	},
	error: err => {
		Core.error('Flux error', err);
	}
});

/** Function to restart/sleep Core */
function restartCore(mode) {
	log.info('restarting Core...', mode || '');
	if (Core.run('timer')) {
		let timerRemaining = 'Minuterie ' + Core.run('timer') + 'secondes';
		Core.do('interface|tts|speak', timerRemaining);
		log.INFO(timerRemaining);
	}
	// log.
	Core.do('service|context|updateRestart', { mode: mode || 'ready' });
}

/** Function to random TTS good night, and sleep */
function goToSleep() {
	if (Core.isAwake()) {
		let sleepTTS = Utils.randomItem(Core.ttsMessages.goToSleep);
		Core.do('interface|tts|speak', sleepTTS);
		log.info('AutoLifeCycle go to sleep !');
		setTimeout(function() {
			Core.do('service|system|restart', 'sleep');
		}, sleepTTS.msg.length * 150);
	}
}

/** Function to reboot RPI */
function reboot() {
	if (Core.isAwake()) {
		Core.do('interface|sound|mute');
		Core.do('interface|tts|speak', { msg: 'Je redaimarre' });
		Core.do('interface|arduino|write', 'playHornOff', { delay: 2 });
	}
	console.log('\n\n_/!\\__REBOOTING RASPBERRY PI !!\n');
	setTimeout(function() {
		spawn('reboot');
	}, 2000);
}

/** Function to shutdown RPI */
function shutdown() {
	if (Core.isAwake()) {
		Core.do('interface|sound|mute');
		Core.do('interface|tts|speak', { msg: 'Arret system' });
		Core.do('interface|arduino|write', 'playHornOff', { delay: 2 });
	}
	setTimeout(function() {
		console.log("\n\n /!\\  SHUTING DOWN RASPBERRY PI - DON'T FORGET TO SWITCH OFF POWER SUPPLY !!\n");
		spawn('halt');
	}, 2000);
}

const LIGTH_LEDS = ['eye', 'belly'];
/** Function to use belly led as light */
function light(duration) {
	log.info('light [duration=' + duration + 's]');
	if (isNaN(duration)) Core.error('light error: duration arg is not a number!', duration, false);
	let loop = (duration - 2) / 2;
	Core.do('interface|led|toggle', { leds: LIGTH_LEDS, value: 1 });
	Core.do('interface|led|toggle', { leds: LIGTH_LEDS, value: 1 }, { log: 'trace', delay: 2, loop: loop });

	Core.do('interface|led|blink', { leds: LIGTH_LEDS, speed: 200, loop: 8 }, { delay: duration - 2 });

	Core.do('interface|led|toggle', { leds: LIGTH_LEDS, value: 0 }, { delay: duration });
}
