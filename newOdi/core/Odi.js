#!/usr/bin/env node
"use strict";

var log = new (require(ODI_PATH + "core/Logger.js"))(__filename);

var fs = require("fs");

var Odi = {
	conf: require(ODI_PATH + "conf.json"),
	modes: [], // forcedMode, clockMode, alarms...
	setup: {}, // functions ...
	stats: {}, // lastUpdate, totalLines, diskSpace...
	// watch:watch,
	error: error,
	ODI_PATH: "",
	CORE_PATH: ODI_PATH + "core/",
	CONFIG_FILE: ODI_PATH + "conf.json",
	DATA_PATH: ODI_PATH + "data/",
	LOG_PATH: ODI_PATH + "log/",
	WEB_PATH: ODI_PATH + "web/",
	TMP_PATH: ODI_PATH + "tmp/"
};
// console.log('Odi.LOG_PATH', Odi.LOG_PATH);
// console.log('Odi.WEB_PATH', Odi.WEB_PATH);
module.exports = {
	init: init,
	Odi: Odi
};

function init(path) {  // Deprecated ?
	Odi.PATH = path;
	log.info("Odi initializing...");
	// log.info('Odi context initializing', Odi.conf.debug, Odi.conf.debug ? 'debug mode' : '');
	// log.debug('something to log ?');
	return Odi;
}

var Flux = require(Odi.CORE_PATH + 'Flux.js');

setTimeout(() => {
	// Flux.service.time.next({ id: 'toto', value: 'value' });
	Flux.next('module', 'tts', 'speak', 'say something...', 1.5, 3);
	// new Flux('module', 'sound', 'mute', 'now!');
}, 1000);

function error() {
	log.error(arguments);
	log.error(console.trace());
	// TODO ring & blink
}

function watch(arg) {
	log.debug("watch()", arg);
}

// console.log(log);
// log.info('TEMOIN Odi [info].js');
log.debug("TEMOIN Odi [debug].js");
