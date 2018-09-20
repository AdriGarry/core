#!/usr/bin/env node

'use strict';

const startTime = new Date();
console.log('\u2022');

const argv = process.argv;
const name = process.argv[2];
const forcedParams = {
	debug: argv.indexOf('debug') > 0 ? true : false,
	sleep: argv.indexOf('sleep') > 0 ? true : false,
	test: argv.indexOf('test') > 0 ? true : false
};

global._PATH = __dirname.match(/\/.*\//g)[0];

const descriptor = require(_PATH + '_' + name + '/descriptor.json');
var Core = require(_PATH + 'src/core/Core.js').init(
	__filename.match(/\/.*\//g)[0],
	descriptor,
	forcedParams,
	startTime
);

const log = new (require(Core._CORE + 'Logger.js'))(__filename, Core.conf('mode'));
log.debug('argv', argv);

const Utils = require(Core._CORE + 'Utils.js');
// const Flux = require(Core._CORE + 'Flux.js').loadModules(descriptor.modules);

log.info('--> ' + Core.name + ' ready in ' + Utils.executionTime(startTime) + 'ms');

if (!Core.isAwake()) {
	Core.do('interface|video|screenOff');
} else if (Core.conf('mode') == 'test') {
	////////  TEST section  ////////
	Core.do('interface|tts|speak', {
		lg: 'en',
		msg: 'test sequence'
	});
	setTimeout(function() {
		var testSequence = require(Core._SRC + 'test/tests.js').launch(function(testStatus) {
			let testTTS = Utils.rdm()
				? 'Je suis Ok !'
				: {
						lg: 'en',
						msg: 'all tests succeeded!'
				  };
			Core.do('interface|tts|speak', testTTS);
			setTimeout(function() {
				// if (testStatus) Core.do('interface|runtime|updateRestart', { mode: 'ready' });
				if (testStatus)
					Core.do('interface|runtime|updateRestart', {
						mode: 'ready'
					});
			}, 3000);
		});
	}, 1000);
} else {
	Core.do('service|time|isAlarm'); // Alarm / Cocorico...
	if (!Core.run('alarm')) {
		Core.do('service|voicemail|check');
	}
}
Core.do('interface|runtime|refresh');

if (Core.conf('watcher')) {
	Core.do('controller|watcher|startWatch');
}

if (Core.isAwake() && Core.conf('watcher')) {
	// TODO put this in a callable function from UI!
	for (var i = 0, tts; (tts = Core.ttsMessages.random[i]); i++) {
		//Core.do('interface|tts|speak', tts, { delay: 2 });
	}
}

// Core.do('interface|tts|speak', { lg: 'en', msg: 'Core dot do' });
// Core.do('tts|speak', { lg: 'en', msg: 'Core dot do' });
// Core.do('service|sms|sendError', 'toto');
