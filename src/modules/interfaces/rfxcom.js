#!/usr/bin/env node
'use strict';

const Core = require(_PATH + 'src/core/Core.js').Core,
	log = new (require(Core._API + 'Logger.js'))(__filename),
	{ Utils } = require(Core._API + 'api.js');

const rfxcom = require('rfxcom'),
	rfxtrx = new rfxcom.RfxCom('/dev/ttyUSB0', { debug: Core.conf('log') == 'info' ? false : true });

module.exports = {};

Core.flux.interface.rfxcom.subscribe({
	// TODO Create a parser (receive...)
	next: flux => {
		if (flux.id == 'send' && flux.value.device === 'plugB' && flux.value.value === false) {
			sendStatus(flux.value);
			Core.do('service|internetBox|strategy');
		} else if (flux.id == 'send' && flux.value.device === 'plugB' && flux.value.value === true) {
			sendStatus(flux.value);
			Core.do('service|internetBox|strategyOff');
		} else if (flux.id == 'send') {
			sendStatus(flux.value);
		} else {
			Core.error('unmapped flux in Rfxcom interface', flux, false);
		}
	},
	error: err => {
		Core.error('Flux error', err);
	}
});

const DEVICE = new rfxcom.Lighting2(rfxtrx, rfxcom.lighting2.AC);
const DEVICE_LIST = Core.descriptor.rfxcomDevices;

log.debug('Rfxcom gateway initializing...');
rfxtrx.initialise(function() {
	Core.run('rfxcom', true);
	log.info('Rfxcom gateway ready', '[' + Utils.executionTime(Core.startTime) + 'ms]');

	rfxtrx.on('receive', function(evt) {
		Core.do('interface|led|blink', { leds: ['satellite'], speed: 120, loop: 3 }, { log: 'trace' });
		log.info('Rfxcom_receive:', Buffer.from(evt).toString('hex'));
	});

	rfxtrx.on('disconnect', function(evt) {
		log.warn('Rfxcom disconnected!', Buffer.from(evt).toString('hex'));
	});
});

function sendStatus(args) {
	if (!Core.run('rfxcom')) {
		Core.do('interface|tts|speak', { lg: 'en', msg: 'rfxcom not initialized' });
		log.warn('rfxcom gateway not initialized!', null, false);
		return;
	}
	log.debug('sendStatus', args);
	let deviceName = args.device,
		value = args.value;
	if (!DEVICE_LIST.hasOwnProperty(deviceName)) log.error('Unknown device:', deviceName);
	else {
		if (value) DEVICE.switchOn(DEVICE_LIST[deviceName].id);
		else DEVICE.switchOff(DEVICE_LIST[deviceName].id);
	}
}
