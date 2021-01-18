#!/usr/bin/env node
'use strict';

const { spawn, exec } = require('child_process');

const Core = require('../../core/Core').Core;

const Logger = require('../../api/Logger'),
	Flux = require('../../api/Flux'),
	Utils = require('../../api/Utils'),
	Observers = require('../../api/Observers');

const log = new Logger(__filename);

module.exports = {
	cron: {
		full: [
			{ cron: '0 30 8 * * *', flux: { id: 'interface|sound|volume', data: 40 } },
			{ cron: '0 45 18 * * *', flux: { id: 'interface|sound|volume', data: 60 } }
		]
	}
};

const FLUX_PARSE_OPTIONS = [
	{ id: 'mute', fn: mute },
	{ id: 'volume', fn: setVolume, condition: { isAwake: true } },
	{ id: 'play', fn: playSound, condition: { isAwake: true } },
	{ id: 'playRandom', fn: playSoundRandomPosition, condition: { isAwake: true } },
	{ id: 'error', fn: playErrorSound, condition: { isAwake: true } },
	{ id: 'UI', fn: playUISound, condition: { isAwake: true } },
	{ id: 'reset', fn: resetSoundOutput, condition: { isAwake: true } }
];

Observers.attachFluxParseOptions('interface', 'sound', FLUX_PARSE_OPTIONS);

setImmediate(() => {
	resetSoundOutput();
});

const VOLUME_LEVELS = Array.from({ length: 11 }, (v, k) => k * 10); // 0 to 100, step: 10
var mplayerInstances = {},
	muteTimer;

function playSound(arg) {
	log.debug('playSound(arg)', arg);
	let soundTitle, sound;
	if (arg.mp3) {
		try {
			soundTitle = arg.mp3.match(/\/.+.mp3/gm)[0].substr(1);
		} catch (err) {
			soundTitle = arg.mp3;
		}
		sound = Utils.getAbsolutePath(arg.mp3, Core._MP3);
		if (!sound) return;
	} else if (arg.url) {
		soundTitle = arg.url;
		sound = arg.url;
	} else {
		Core.error('No source sound arg', arg);
	}
	let durationLog = arg.duration
		? 'duration=' + (Math.floor(arg.duration / 60) + 'm' + Math.round(arg.duration % 60))
		: '';
	let volLog = arg.volume ? 'vol=' + arg.volume : '';
	let positionLog = arg.position ? 'pos=' + Utils.formatDuration(arg.position) : '';
	if (!arg.noLog) log.info('play', soundTitle, volLog, positionLog, durationLog);

	let position = arg.position || 0;
	let volume = arg.volume || Core.run('volume');
	doPlay(sound, volume, position, soundTitle, arg.noLog, arg.noLed);
}

function playSoundRandomPosition(arg) {
	let sound = Utils.getAbsolutePath(arg.mp3, Core._MP3);
	if (!sound) return;
	Utils.getDuration(sound)
		.then(data => {
			arg.position = Utils.random(1, Math.floor((data / 100) * 50)); // Position up to 50% of sound duration
			playSound(arg);
		})
		.catch(err => {
			Core.error('playSoundRandomPosition error', err);
		});
}

function doPlay(sound, volume, position, soundTitle, noLog, noLed) {
	let startPlayTime = new Date();
	let mplayerProcess = spawn('mplayer', ['-volstep', 10, '-volume', volume, '-ss', position || 0, sound]);

	if (!noLed) mplayerProcess.ledFlag = ledFlag();

	mplayerProcess.stderr.on('data', err => {
		log.error('mplayer error for ' + soundTitle || sound, Buffer.from(err).toString());
	});

	mplayerProcess.on('close', err => {
		if (err) Core.error('mplayer.onClose ' + soundTitle + ' error', err);
		if (!noLog) {
			let playTime = Utils.formatDuration(Math.round(Utils.executionTime(startPlayTime) / 100) / 10);
			log.info('play_end ' + soundTitle + ' time=' + playTime);
		}
		clearInterval(mplayerProcess.ledFlag);
		delete mplayerInstances[sound];
	});
	mplayerInstances[sound] = mplayerProcess;
}

/** Function to mute */
function mute(args) {
	clearTimeout(muteTimer);
	if (!args) args = {};
	if (args.hasOwnProperty('delay') && Number(args.delay)) {
		muteTimer = setTimeout(function () {
			new Flux('interface|sound|play', { mp3: 'system/autoMute.mp3' });
			setTimeout(function () {
				muteAll(args.message || null);
			}, 1600);
		}, Number(args.delay) * 1000);
	} else {
		muteAll(args.message || null);
	}
}

/** Function to stop all sounds & leds */
function muteAll(message) {
	if (Core.run('max')) {
		new Flux('interface|arduino|disconnect', null, { log: 'trace' });
		new Flux('interface|arduino|connect', null, { log: 'trace' });
	}
	writeAllMPlayerInstances('q');
	new Flux('service|music|stop', null, { log: 'trace' });
	new Flux('interface|tts|clearTTSQueue', null, { log: 'trace' });
	exec('sudo killall omxplayer.bin');
	exec('sudo killall espeak');
	log.info('>> MUTE  -.-', message ? '"' + message + '"' : '');
	new Flux('interface|led|clearLeds', null, { log: 'trace' });
	new Flux('interface|led|toggle', { leds: ['eye', 'belly'], value: 0 }, { log: 'trace' });
	Core.run('music', false);
}

function setVolume(volume) {
	if (typeof volume === 'object' && volume.hasOwnProperty('value')) volume = volume.value;
	if (!isNaN(volume)) {
		let volumeUpdate = getVolumeInstructions(parseInt(volume));
		if (!volumeUpdate) return;

		let sign = volumeUpdate.increase ? '*' : '/';
		while (volumeUpdate.gap) {
			writeAllMPlayerInstances(sign);
			volumeUpdate.gap--;
		}
		Core.run('volume', volume);
		log.info('Volume level =', volume + '%');
	} else {
		Core.error('volume argument not a numeric value', volume);
	}
}

function writeAllMPlayerInstances(sign) {
	log.trace('mplayerInstances.write:', sign);
	Object.keys(mplayerInstances).forEach(key => {
		mplayerInstances[key].stdin.write(sign);
	});
}
function getVolumeInstructions(newVolume) {
	let actualVolume = parseInt(Core.run('volume'));
	let indexNewVolume = VOLUME_LEVELS.indexOf(newVolume);
	if (actualVolume === newVolume) {
		log.debug('same volume as configured');
		return;
	}
	if (indexNewVolume < 0 || indexNewVolume > 100) {
		Core.error('Invalid volume value', 'volume value=' + newVolume, false);
	}
	let increase = newVolume > actualVolume;
	let indexActualVolume = VOLUME_LEVELS.indexOf(actualVolume);

	let gap = Math.abs(indexNewVolume - indexActualVolume);
	log.debug({ increase: increase, gap: gap });
	return { increase: increase, gap: gap };
}

function ledFlag() {
	// new Flux('interface|led|altLeds', { speed: 100, duration: 1.3 }, { log: 'trace' });
	new Flux('interface|led|blink', { leds: ['eye'], speed: 100, loop: 3 }, { log: 'trace' });
	return setInterval(function () {
		new Flux('interface|led|altLeds', { speed: 100, duration: 1.3 }, { log: 'trace' });
	}, 10 * 1000);
}

function playErrorSound() {
	playSound({ mp3: 'system/ressort.mp3', noLog: true, noLed: true });
}

function playUISound() {
	playSound({ mp3: 'system/UIrequestSound.mp3', noLog: true, noLed: true });
}

/** Function to reset sound output */
function resetSoundOutput() {
	log.info('Reset sound output [amixer set PCM 100%]');
	// Utils.execCmd('amixer set PCM 100%')
	Utils.execCmd("amixer sset 'Master' 100%")
		.then(data => {
			log.debug(data);
		})
		.catch(err => {
			Core.error('Reset sound output error', err);
		});
}
