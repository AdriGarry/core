#!/usr/bin/env node
'use strict';

const Core = require(_PATH + 'src/core/Core.js').Core,
	Observers = require(Core._CORE + 'Observers.js');

const log = new (require(Core._API + 'Logger.js'))(__filename),
	Flux = require(Core._API + 'Flux.js'),
	{ Utils } = require(Core._API + 'api.js'),
	RandomBox = require('randombox').RandomBox;

module.exports = {};

Observers.service().max.subscribe({
	next: flux => {
		if (flux.id == 'parse') {
			parseDataFromMax(flux.value);
		} else if (flux.id == 'blinkAllLed') {
			blinkAllLed();
		} else if (flux.id == 'blinkRdmLed') {
			blinkRdmLed();
		} else if (flux.id == 'playOneMelody') {
			playOneMelody();
		} else if (flux.id == 'playRdmMelody') {
			playRdmMelody();
		} else if (flux.id == 'hornRdm') {
			hornRdm();
		} else if (flux.id == 'hornSiren') {
			hornSiren();
		} else if (flux.id == 'turn') {
			turnNose();
		} else Core.error('unmapped flux in Max service', flux, false);
	},
	error: err => {
		Core.error('Flux error', err);
	}
});

const HORNS = [
	'playHornWarning',
	'playHornDoUp',
	'playHorn',
	'playHornOff',
	'playHornFire',
	'playHornWhistle',
	'playHornOvni',
	'playHornBombing',
	'playHornSiren',
	'playHornDown'
];

// let delay = 10;
// HORNS.forEach(item => {
// 	new Flux('interface|arduino|write', item, {delay:delay});
// 	delay = delay + 10;
// });

function blinkAllLed() {
	log.debug('blinkAllLed');
	new Flux('interface|arduino|write', 'blinkAllLed');
}

function blinkRdmLed() {
	log.debug('blinkRdmLed');
	new Flux('interface|arduino|write', 'blinkRdmLed');
}

function playOneMelody() {
	log.debug('playOneMelody');
	new Flux('interface|arduino|write', 'playOneMelody');
}

function playRdmMelody() {
	log.debug('playRdmMelody');
	new Flux('interface|arduino|write', 'playRdmMelody');
}

function turnNose() {
	log.debug('turnNose');
	new Flux('interface|arduino|write', 'turnNose');
}

var hornRandomBox = new RandomBox(HORNS);
function hornRdm() {
	let horn = hornRandomBox.next();
	log.debug('hornRdm', horn);
	new Flux('interface|arduino|write', horn);
}

function hornSiren() {
	log.debug('playHornWarning');
	new Flux('interface|arduino|write', 'playHornWarning');
}

function parseDataFromMax(data) {
	log.info('Max data:', data);
	data = String(data).trim();
	// \n+.
	maxCallbackAction(data);
}

function maxCallbackAction(data) {
	log.debug('maxCallbackAction()', data);
	switch (data) {
		// case 'hi_end':
		// 	maxCallbackTTS([{ lg: 'en', msg: 'Hi Max!' }, { lg: 'en', msg: 'Hey Max!' }]);
		// 	break;
		case 'some random action from Max':
			maxCallbackTTS(Core.ttsMessages.maxCallback.sensor);
			break;
		case 'blinkLed_end':
			if (Core.run('etat') == 'high') new Flux('interface|tts|speak', { lg: 'en', msg: 'blink led' });
			break;
		case 'playOneMelody_end':
		case 'playRdmMelody_end':
			maxCallbackTTS(Core.ttsMessages.maxCallback.melody);
			break;
		case 'turnNose_end':
			if (Core.run('etat') == 'high') new Flux('interface|tts|speak', { lg: 'en', msg: 'turn' });
			break;
		case 'playRdmHorn_end':
		case 'playHornDoUp_end':
		case 'playHorn_end':
		case 'playHornOff_end':
		case 'playHornWhistle_end':
		case 'playHornSiren_end':
		case 'playHornDown_end':
			maxCallbackTTS(Core.ttsMessages.maxCallback.horn);
			break;
		case 'playHornFire_end':
			maxCallbackTTS(Core.ttsMessages.maxCallback.hornFire);
			break;
		case 'playHornOvni_end':
			new Flux('interface|tts|speak', 'OVNI!');
			break;
		case 'playHornWarning_end':
		case 'playHornBombing_end':
			new Flux('interface|tts|speak', 'A couvert !');
			break;
		// escape tous les '...'
		case 'Max initialization...':
		case 'playMelody...':
		case 'Max ready':
			// escaping Max initialization
			break;
		default:
			log.info('unmapped Max data:', data);
			break;
	}
}

//const maxCallbackRandomBox = new RandomBox(); // TODO to implement
function maxCallbackTTS(arg) {
	if (Array.isArray(arg)) {
		new Flux('interface|tts|speak', Utils.randomItem(arg));
	} else if (typeof arg == 'string') {
		new Flux('interface|tts|speak', arg);
	} else {
		log.error('maxCallbackTTS: wrong arg [' + typeof arg + ']', arg);
	}
}

// list of commands:
//blinkAllLed();
// new Flux('interface|arduino|write', 'hi', { delay: 3 });
// new Flux('service|max|blinkAllLed', null, { delay: 6 });
// playRdmHorn
// playHornWarning();
// playHornDoUp(random(1, 8));
// playHorn();
// playHornOff();
// playHornFire(random(1, 5));
// playHornWhistle();
// playHornOvni();
// playHornBombing(random(1, 5));
// playHornSiren(random(3, 7));
// playHornDown();
