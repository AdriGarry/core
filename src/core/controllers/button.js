#!/usr/bin/env node
'use strict';

var Odi = require(ODI_PATH + 'src/core/Odi.js').Odi;
var log = new (require(Odi._CORE + 'Logger.js'))(__filename);
var Utils = require(Odi._CORE + 'Utils.js');
var Flux = require(Odi._CORE + 'Flux.js');

var util = require('util');
var Gpio = require('onoff').Gpio;
var belly = new Gpio(17, 'out'); // TODO...
const DEBOUNCE_LIMIT = 0.4;
var Button = {};

Odi.gpio.buttons.forEach(button => {
	Button[button.id] = new Gpio(button.pin, button.direction, button.edge, button.options);
	Button[button.id]['id'] = button.id;
});

function getPushTime(button) {
	let pushedTime = new Date();
	while (button.readSync() == 1) {
		var time = Math.round((new Date() - pushedTime) / 100) / 10;
		if (time % 1 == 0) belly.write(0);
		else belly.write(1);
	}
	//log.info('Button must be pushed for ' + DEBOUNCE_LIMIT + 's at least, try again!');
	belly.write(0);
	let pushTime = Math.round((new Date() - pushedTime) / 100) / 10;
	log.info(button.id + ' button pressed for ' + pushTime + ' sec...');
	return pushTime;
}

Button.ok.watch(function(err, value) {
	var pushTime = getPushTime(Button.ok);
	Flux.next('controller|button|ok', pushTime);
});

Button.cancel.watch(function(err, value) {
	Flux.next('interface|sound|mute');
	var pushTime = getPushTime(Button.cancel);
	Flux.next('controller|button|cancel', pushTime);
});

Button.white.watch(function(err, value) {
	var pushTime = getPushTime(Button.white);
	Flux.next('controller|button|white', pushTime);
});

Button.blue.watch(function(err, value) {
	var pushTime = getPushTime(Button.blue);
	if (pushTime > DEBOUNCE_LIMIT) Flux.next('controller|button|blue', pushTime);
	else {
		// already done in the handler
		log.info('Blue button pushed not enough:', pushTime);
		log.info('___This should not be logged any more !!!');
	}
});

/** Interval for switch state + random actions */
var instance = false,
	intervalEtat;
const INTERVAL_DELAY = (Odi.conf('watcher') ? 60 : 5 * 60) * 1000; //3 * 60 * 1000;
setInterval(function() {
	// A deplacer dans flux.next('interface|runtime|refresh')) ?
	let value = Button.etat.readSync();
	//TODO faire un truc avec ce flux => move to jobsList.json?
	Flux.next('interface|led|toggle', { leds: ['satellite'], value: value }, { hidden: true });

	if (1 === value) {
		if (!instance) {
			// TODO! deplacer ça dans le handler ... !?
			instance = true;
			intervalEtat = setInterval(function() {
				log.info('Etat btn Up => random action');
				Flux.next('service|interaction|random');
			}, INTERVAL_DELAY);
			Flux.next('interface|video|cycle');
		}
	} else {
		instance = false;
		clearInterval(intervalEtat);
	}
}, 2000);

/** Switch watch for radio volume */
Button.etat.watch(function(err, value) {
	value = Button.etat.readSync();
	Odi.run('etat', value ? 'high' : 'low');
	Odi.run('volume', Odi.isAwake() ? (value ? 400 : -400) : 'mute');
	log.info('Etat has changed:', value);
	if (Odi.run('music') == 'fip') {
		Flux.next('interface|sound|mute');
		Flux.next('service|music|fip', null, { delay: 0.1 });
	}
	if (Odi.run('screen')) {
		Flux.next('interface|video|screenOff');
	}
	log.table(Odi.run(), 'RUNTIME...');
});
