#!/usr/bin/env node
'use strict';

const { spawn } = require('child_process');

const Core = require('./../../core/Core').Core,
	Observers = require('./../../core/Observers');

const log = new (require('./../../api/Logger'))(__filename),
	Flux = require('./../../api/Flux');

module.exports = {};

Observers.interface().hdmi.subscribe({
	next: flux => {
		if (flux.id == 'on') {
			screenOn();
		} else if (flux.id == 'off') {
			screenOff();
		} else Core.error('unmapped flux in Hdmi interface', flux, false);
	},
	error: err => {
		Core.error('Flux error', err);
	}
});

setImmediate(() => {
	if (!Core.isAwake() || !Core.run('hdmi')) {
		screenOff();
	}
});

/** Function to turn screen on (for 30 minutes) */
function screenOn() {
	spawn('/opt/vc/bin/tvservice', ['-p']);
	log.info('Hdmi on');
	Core.run('hdmi', true);
	setTimeout(function() {
		screenOff();
	}, 30 * 60 * 1000);
}

/** Function to turn screen off */
function screenOff() {
	spawn('/opt/vc/bin/tvservice', ['-o']);
	new Flux('service|video|stopLoop');
	Core.run('hdmi', false);
	log.info('Hdmi off');
}
