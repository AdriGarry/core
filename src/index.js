#!/usr/bin/env node

'use strict';

const startTime = new Date();
console.log('\u2022');

const argv = process.argv;
const name = process.argv[2];
const forcedParams = {
	debug: argv.includes('debug') ? true : false,
	sleep: argv.includes('sleep') ? true : false,
	test: argv.includes('test') ? true : false
};

global._PATH = __dirname.match(/\/.*\//g)[0];

const descriptor = require(_PATH + '_' + name + '/descriptor.json');
var Core = require(_PATH + 'src/core/Core.js').initializeContext(
	__filename.match(/\/.*\//g)[0],
	descriptor,
	forcedParams,
	startTime
);

const log = new (require(Core._API + 'Logger.js'))(__filename, Core.conf('mode'));
log.debug('argv:', argv);

const Utils = require(Core._API + 'Utils.js');
log.info(' -->  ' + Core.Name + ' ready [' + Utils.executionTime(Core.startTime) + 'ms]');

////////  TEST section  ////////
if (Core.conf('mode') == 'test') {
	setTimeout(function() {
		Core.do('interface|tts|speak', { lg: 'en', msg: 'test sequence' });
		require(Core._SRC + 'test/tests.js').launch();
	}, 1000);
}
