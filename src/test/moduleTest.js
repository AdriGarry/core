#!/usr/bin/env node
'use strict';

var Odi = require(ODI_PATH + 'src/core/Odi.js').Odi;
var log = new (require(Odi.CORE_PATH + 'Logger.js'))(__filename.match(/(\w*).js/g)[0]);
log.info('Module test sequence...');

const Rx = require('rxjs');

var Flux = require(Odi.CORE_PATH + 'Flux.js');

const testTTSList = [
	{ lg: 'en', msg: 'Test' },
	{ lg: 'en', msg: 'T E S T' },
	{ lg: 'fr', msg: 'Test' },
	{ lg: 'fr', msg: 'T E S T' }
];

module.exports.run = function(callback) {
	Flux.next('module', 'led', 'toggle', { leds: ['eye', 'belly', 'satellite'], value: 1 });
	Flux.next('module', 'led', 'toggle', { leds: ['eye', 'belly', 'satellite'], value: 0 }, 2);
	Flux.next('module', 'led', 'blink', { leds: ['belly'], speed: 900, loop: 100 }, 2);

	Flux.next('module', 'tts', 'speak', testTTSList[Math.floor(Math.random() * testTTSList.length)]);

	Flux.next('module', 'sound', 'mute', { delay: 3, message: 'DELAY 3' }, 5);
	// Flux.next('module', 'sound', 'mute', { delay: 13, message: 'DELAY 13' }, 3);
	// Flux.next('module', 'sound', 'mute', { message: 'no delay at all !' });
	// Flux.next('module', 'sound', 'mute');

	setTimeout(() => {}, 1000);

	setTimeout(() => {
		callback('moduleTest', true);
	}, 30000);
};
