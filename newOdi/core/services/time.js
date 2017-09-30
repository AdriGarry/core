#!/usr/bin/env node
'use strict'

var Odi = require(ODI_PATH + 'core/Odi.js').Odi;
var log = new (require(Odi.CORE_PATH + 'logger.js'))(__filename);

var brain = require (Odi.CORE_PATH + 'brain.js');

brain.service.time.subscribe({
	next: flux => {
		if(!brain.inspect(flux, 'Time')) return;
		log.info('Time service', flux);
	},
	error: err => { Odi.error(flux) }
});
