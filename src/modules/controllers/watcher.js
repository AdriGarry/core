#!/usr/bin/env node

'use strict';

const fs = require('fs');

const Core = require('./../../core/Core').Core,
	Observers = require('./../../core/Observers');

const log = new (require('./../../api/Logger'))(__filename),
	Flux = require('./../../api/Flux'),
	Utils = require('./../../api/Utils');

module.exports = {};

Observers.controller().watcher.subscribe({
	next: flux => {
		if (flux.id == 'start') {
			startWatch();
		} else if (flux.id == 'stop') {
			stopWatch();
		} else if (flux.id == 'toggle') {
			toggleWatch();
		} else Core.error('unmapped flux in Watcher controller', flux, false);
	},
	error: err => {
		Core.error('Flux error', err);
	}
});

setImmediate(() => {
	if (Core.conf('watcher')) {
		new Flux('controller|watcher|start');
	}
});

const SEC_TO_RESTART = 3,
	PATHS_TO_WATCH = [
		_PATH,
		Core._SRC,
		Core._CORE,
		Core._MODULES + 'controllers/',
		Core._MODULES + 'interfaces/',
		Core._MODULES + 'services/',
		Core._SRC + 'test/',
		Core._DATA,
		Core._CONF
	];
var watchers = [];

function toggleWatch() {
	if (Core.conf('watcher')) stopWatch();
	else startWatch();
}

function startWatch() {
	log.info('starting watchers on', PATHS_TO_WATCH);
	PATHS_TO_WATCH.forEach(path => {
		watchers.push(addWatcher(path, relaunch));
	});
	Core.conf('watcher', true);
}

function stopWatch() {
	log.info('watchers stop', PATHS_TO_WATCH);
	watchers.forEach(watcher => {
		removeWatcher(watcher);
	});
	Core.conf('watcher', false);
}

var timer;

function addWatcher(path, action) {
	let watcher = fs.watch(path, { recursive: true }, (eventType, filename) => {
		if (eventType) {
			if (!timer) {
				timer = new Date();
			}
			let logInfo = path.match(/\/(\w*)\/$/g);
			log.info(eventType, logInfo[0] || logInfo, filename, '[' + Utils.executionTime(timer) + 'ms]');
			waitForUpdateEnd(action);
		}
	});
	return watcher;
}

function removeWatcher(watcher) {
	watcher.close();
}

var watchTimeout;
function waitForUpdateEnd(action) {
	log.debug('waiting for update end (' + SEC_TO_RESTART + 's)...');
	clearTimeout(watchTimeout);
	watchTimeout = setTimeout(() => {
		action();
	}, SEC_TO_RESTART * 1000);
}

function relaunch() {
	log.INFO('>> relaunching...');
	new Flux('service|context|restart', Core.conf('mode'));
}
