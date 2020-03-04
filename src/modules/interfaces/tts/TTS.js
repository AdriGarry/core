#!/usr/bin/env node
'use strict';

const Logger = require('./../../../api/Logger');

const log = new Logger(__filename);

const FALLBACK_LANGUAGE = 'fr',
	FALLBACK_VOICE = 'espeak';

module.exports = class TTS {
	constructor(message, language, voice) {
		this.msg = message;
		if (language) {
			this.lg = language;
		} else {
			log.debug('No valid language, fallback on Fr');
			this.lg = FALLBACK_LANGUAGE;
		}
		if (voice) {
			this.voice = voice;
		} else {
			log.debug('No valid voice, fallback on espeak');
			this.voice = FALLBACK_VOICE;
		}
	}

	getMsg() {
		return this.msg;
	}

	getLg() {
		return this.lg;
	}

	getVoice() {
		return this.voice;
	}

	setMsgReplaced() {
		this.msg = this.msg.replace('%20', '');
		return this.msg;
	}

	toString() {
		return 'play TTS [' + this.voice + ', ' + this.lg + '] "' + this.msg + '"';
	}
};
