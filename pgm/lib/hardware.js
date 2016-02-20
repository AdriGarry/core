#!/usr/bin/env node
// Module Materiel


// CPU TEMP
// CPU TEMP CHECK

var log = 'Odi/ ';
var fs = require('fs');
var request = require('request');
var spawn = require('child_process').spawn;
var exec = require('child_process').exec;
var leds = require('./leds.js');
var timer = require('./timer.js');
var fip = require('./fip.js');
var jukebox = require('./jukebox.js');
var exclamation = require('./exclamation.js');
var tts = require('./tts.js');
var EventEmitter = require('events').EventEmitter;
var event = new EventEmitter();
var clock = require('./clock.js');
var service = require('./service.js');
var remote = require('./remote.js');
var self = this;

var mute = function(){
	var deploy = spawn('sh', ['/home/pi/odi/pgm/sh/mute.sh']);
	console.log('>> MUTE ALL  :|');
	leds.clearLeds();
	eye.write(0);
	belly.write(0);
};
exports.mute = mute;

var muteTimer;
var autoMute = function(message){
	clearTimeout(muteTimer);
	muteTimer = setTimeout(function(){
		//console.log('_EventEmited: ' + (message || '.'));
		var deploy = spawn('sh', ['/home/pi/odi/pgm/sh/mute.sh', 'auto']);
		setTimeout(function(){
			deploy = spawn('sh', ['/home/pi/odi/pgm/sh/mute.sh']);
			console.log(message + ' > AUTO MUTE   :|');
			leds.clearLeds();
			eye.write(0);
			belly.write(0);
		}, 1600);
	}, 60*60*1000);
};
exports.autoMute = autoMute;

var randomAction = function(){
	self.testConnexion(function(connexion){
		var rdm = Math.floor(Math.random()*13); // 1->12
		console.log('> randomAction [rdm = ' + rdm + ']');
		if(rdm <= 4 && connexion == true){
			tts.speak('','');
		}else if(rdm == 5 && connexion == true){
			service.time();
		}else if(rdm == 6 && connexion == true){
			service.date();
		}else if(rdm == 7 && connexion == true){
			service.weather();
		}else if(rdm == 8 && connexion == true){
			service.cpuTemp();
		}else{
			exclamation.exclamation2Rappels();
		}
	});
};
exports.randomAction = randomAction;

var testConnexion = function(callback){
	require('dns').resolve('www.google.com', function(err) {
		if(err){
			//console.error('Odi is not connected to internet (utils.testConnexion)   /!\\');
			callback(false);
		}else{
			//console.log('Odi is online   :');
			callback(true);
		}
	});
};
exports.testConnexion = testConnexion;

var sleepNode = function(sec, delay){
	/*if(delay){
		delay = 0;
	}*/
	//if(isNaN (parseFloat(delay)){
	//if(typeof delay == "number"){
	if(delay > 0){
		console.log('\nOdi is going to fall asleep in ' + delay + 'sec ...');
	} else {
		delay = 0;
	}
	console.log('\nsleepNode: Odi falling asleep for ' + sec + 'sec !');
	setTimeout(function(){
		var wakeUp = new Date().getTime() + (sec * 1000);
		while (new Date().getTime() <= wakeUp) {
			; // <-- to sleep Node
		}
		console.log('\nsleepNode:       -->  Odi going on !!\n');
	}, delay*1000+1);	
};
exports.sleepNode = sleepNode;

var getMsgLastGitCommit = function(callback){
	function getMsg(error, stdout, stderr){
		if(error) stdout = 'Error Git Last Commit Message  /!\\';
		console.log('LastGitCommitMsg : "' + stdout.trim() + '"');
		callback(stdout);
	}
	exec('git log -1 --pretty=%B',{cwd: '/home/pi/odi/'}, getMsg);
};
exports.getMsgLastGitCommit = getMsgLastGitCommit;

var reboot = function(){
	tts.speak('fr','A tout de suite !');
	remote.check();
	deploy = spawn('sh', ['/home/pi/odi/pgm/sh/mute.sh']);
	deploy = spawn('sh', ['/home/pi/odi/pgm/sh/sounds.sh', 'reboot']);
	console.log('_/!\\__REBOOTING RASPBERRY PI !!');
	// deploy = spawn('omxplayer', ['/home/pi/odi/mp3/sounds/system/beback.mp3', '-o local']);
	setTimeout(function(){
		deploy = spawn('sh', ['/home/pi/odi/pgm/sh/shutdown.sh', 'reboot']);
	}, 2000);
};
exports.reboot = reboot;

var shutdown = function(){
	tts.speak('fr','Arret du systeme !');
	remote.check();
	deploy = spawn('sh', ['/home/pi/odi/pgm/sh/mute.sh']);
	deploy = spawn('omxplayer', ['-o local', '/home/pi/odi/mp3/sounds/system/sessionOff.mp3']);
	deploy = spawn('sh', ['/home/pi/odi/pgm/sh/sounds.sh', 'shutdown']);
	console.log('_/!\\__SHUTING DOWN RASPBERRY PI !!');
	setTimeout(function(){
		deploy = spawn('sh', ['/home/pi/odi/pgm/sh/reInit_log.sh']);
		deploy = spawn('sh', ['/home/pi/odi/pgm/sh/shutdown.sh']);
	}, 2000);
};
exports.shutdown = shutdown;

var restartOdi = function(){
	console.log('Restarting Odi !!');
	setTimeout(function(){
		process.exit();
	}, 1000);
};
exports.restartOdi = restartOdi;
