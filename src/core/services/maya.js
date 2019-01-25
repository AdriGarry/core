#!/usr/bin/env node

'use strict';

const Core = require(_PATH + 'src/core/Core.js').Core,
	log = new (require(Core._CORE + 'Logger.js'))(__filename),
	Utils = require(Core._CORE + 'Utils.js');

Core.flux.service.maya.subscribe({
	next: flux => {
		if (flux.id == 'comptine') {
			comptine(flux.value);
			// } else if (flux.id == '') {
		} else Core.error('unmapped flux in Maya service', flux, false);
	},
	error: err => {
		Core.error('Flux error', err);
	}
});

const COMPTINE = 'maya/songs/comptines.mp3';
function comptine() {
	let songPath = Utils.getAbsolutePath(COMPTINE, Core._MP3);
	if (!songPath) {
		Core.error("Can't play comptine");
		return;
	}
	Core.do('interface|sound|mute', null, { log: 'trace' });
	Core.run('music', 'comptines');
	Core.do('interface|sound|playRandom', { mp3: songPath }, { delay: 0.5 });
}
