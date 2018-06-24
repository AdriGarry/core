#!/usr/bin/env node

// Middleware sub-module (server)

var Odi = require(ODI_PATH + 'src/core/Odi.js').Odi;
const log = new (require(Odi._CORE + 'Logger.js'))(__filename.match(/(\w*).js/g)[0]);
const Flux = require(Odi._CORE + 'Flux.js');
const Utils = require(ODI_PATH + 'src/core/Utils.js');
const fs = require('fs');

const FILE_REQUEST_HISTORY = ODI_PATH + 'log/requestHistory.log';
const noSoundUrl = ['/dashboard', '/log'];
const BAD_REQUEST_TIMEOUT = 5000;
const BAD_REQUEST_CP_LIMIT = 5;
var badRequestCount = 0;
var canTTSBadRequest = true;

module.exports = {
	security: function() {
		// badRequestCount = 0;
		return securityMiddleware;
	}
};

var securityMiddleware = function(req, res, next) {
	// let requestToLog;
	Flux.next('interface|led|blink', { leds: ['satellite'], speed: 80, loop: 3 }, { hidden: true });
	if (!Utils.searchStringInArray(req.url, noSoundUrl)) Flux.next('interface|sound|UI', null, { hidden: true });

	let ip = req.connection.remoteAddress;
	if (!ip) {
		log.error('Incoming socket /!\\ /!\\');
		log.info(req); // TODO revoir cette sécurité...
		rejectUnauthorizedRequest(res);
		// } else if (req.url == '/favicon.ico') {
		// 	log.info('favicon request', req.url, ipToLog);
		// 	rejectUnauthorizedRequest(res);
	}
	let isLocalIp = ip.indexOf('192.168') > -1;
	let ipToLog = isLocalIp ? '' : 'from [' + req.connection.remoteAddress + ']';
	if (req.headers['user-interface'] !== 'UIv5') {
		// Not allowed requests
		if (canTTSBadRequest && Odi.isAwake()) {
			canTTSBadRequest = false;
			Flux.next('interface|tts|speak', { voice: 'espeak', lg: 'en', msg: 'Bad request' }, { delay: 0.5, hidden: true });
			setTimeout(() => {
				canTTSBadRequest = true;
			}, BAD_REQUEST_TIMEOUT);
		}
		Odi.error('Bad request', '401 ' + decodeUrl(req.url) + ' ' + ipToLog, false);
		rejectUnauthorizedRequest(res);
	}

	if (!isLocalIp) {
		logNotLocalRequest(req);
	}
	log.info(req.headers['user-interface'] + ' ' + decodeUrl(req.url), ipToLog);
	res.statusCode = 200;
	next();
};

function decodeUrl(url) {
	// return url.replace('%20', ' '); // TODO faire un vrai décodage de l'url !
	return decodeURI(url);
}

function logNotLocalRequest(req) {
	let requestToLog = Utils.logTime('D/M h:m:s ') + req.url + ' [' + req.connection.remoteAddress + ']\r\n';
	fs.appendFile(FILE_REQUEST_HISTORY, requestToLog, function(err) {
		if (err) return Odi.error(err);
	});
}

function rejectUnauthorizedRequest(res) {
	res.status(401); // Unauthorized
	res.end();
	badRequestCount++;
	if (badRequestCount >= BAD_REQUEST_CP_LIMIT) {
		closingServerTemporary(5000);
	}
}

function closingServerTemporary(breakDuration) {
	Flux.next('controller|server|closeUIServer', breakDuration);
	setTimeout(function() {
		log.INFO('restarting UI server...');
		badRequestCount = 0;
		Flux.next('controller|server|startUIServer');
	}, breakDuration);
}
