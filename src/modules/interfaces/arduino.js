#!/usr/bin/env node
'use strict';

const SerialPort = require('serialport'),
	Readline = SerialPort.parsers.Readline;

const Core = require('./../../core/Core').Core,
	Observers = require('./../../core/Observers');

const log = new (require('./../../api/Logger'))(__filename),
	Flux = require('./../../api/Flux');

const ARDUINO = { address: '/dev/ttyACM0', baudRate: 115200 };
var arduino;

module.exports = {};

const FLUX_PARSE_OPTIONS = [
	{ id: 'connect', fn: connect },
	{ id: 'write', fn: write },
	{ id: 'disconnect', fn: disconnect }
];

Observers.attachFluxParseOptions('interface', 'arduino', FLUX_PARSE_OPTIONS);

setImmediate(() => {
	if (Core.run('volume') > 50) {
		connect();
	}
});

function connect() {
	if (arduino instanceof SerialPort) {
		log.info('arduino channel already open!');
		return;
	}
	arduino = new SerialPort(ARDUINO.address, { baudRate: ARDUINO.baudRate }, function(err) {
		if (err) {
			Core.error('Error opening arduino port: ', err.message, false);
			// TODO Scheduler to retry connect...?
			if (!Core.run('alarm') && Core.run('etat') == 'high') {
				new Flux('interface|tts|speak', { lg: 'en', msg: 'Max is not available' });
			}
			Core.run('max', false);
		} else {
			log.info('arduino serial channel opened');
			Core.run('max', true);
			// if (Core.isAwake() && !Core.run('alarm') && Core.run('etat') == 'high')
			// 	new Flux('interface|tts|speak', { lg: 'en', msg: 'Max Contact!' });

			var feedback = arduino.pipe(new Readline({ delimiter: '\r\n' }));
			feedback.on('data', function(data) {
				log.debug(data);
				new Flux('interface|led|blink', { leds: ['satellite'], speed: 80, loop: 3 }, { log: 'trace' });
				new Flux('service|max|parse', data.trim(), { log: 'trace' });
			});

			arduino.on('close', function(data) {
				data = String(data);
				if (data.indexOf('bad file descriptor') >= 0) {
					Core.error('Max is disconnected', data, false);
					new Flux('interface|tts|speak', { lg: 'en', msg: "I've just lost my connexion with Max!" });
				}
				Core.run('max', false);
				log.info('arduino serial channel disconnected!');
				// setTimeout(() => {
				// 	log.info('Trying to connect to Max...');
				// 	connect();
				// }, 5000);
			});
		}
	});
}

function disconnect() {
	log.debug('Max serial channel disconnection...');
	if (arduino instanceof SerialPort) arduino.close();
	arduino = null;
}

/** Function to send message to arduino */
function write(msg) {
	log.debug('write()', msg);
	if (!arduino || !Core.run('max')) {
		log.info('Max not available!');
		return;
	}
	arduino.write(msg + '\n', function(err, data) {
		if (err) {
			Core.error('Error while writing to arduino', err);
		}
		log.DEBUG('data:', data);
	});
}
