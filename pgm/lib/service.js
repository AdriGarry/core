#!/usr/bin/env node
// Module Service

// var spawn = require('child_process').spawn;
var fs = require('fs');
var request = require('request');
//var xmlreader = require('xmlreader');
var leds = require('./leds.js');
var tts = require('./tts.js');
var self = this;

var weatherStatus = fs.readFileSync('/home/pi/odi/pgm/data/weather.status.properties', 'UTF-8').toString().split('\n');
var weather = function(){
	request.get({
		// url:'http://weather.yahooapis.com/forecastrss?w=610264&u=c',
		url:'http://xml.weather.yahoo.com/forecastrss?w=610264&u=c',
		headers: {'Content-Type': 'xml'}
	},
	function (error, response, body){
		if(!error && response.statusCode == 200){
			body = body.split('\n');
			// console.log('body : ' + body);
			var weather = body[28];
			weather = weather.substring(weather.lastIndexOf('code="')+6,weather.lastIndexOf('code="')+8);
			weather = weatherStatus[weather];
			var temp = body[32];
			temp = temp.substring(temp.lastIndexOf(',')+1,temp.lastIndexOf('C'));
			var wind = body[12].toString();
			wind = Math.floor(wind.substring(wind.lastIndexOf('speed="')+7,wind.lastIndexOf('speed="')+10));
			var annonceTemp = 'Meteo Marseille : le temps est ' + weather + ' , il fait ' + temp
				+ ' degres avec ' + (isNaN(wind)?'0':wind) + ' kilometre heure de vent';
			console.log('Service Weather... ' + annonceTemp);
			tts.speak('fr',annonceTemp);
		}else{
			tts.speak('fr', 'Erreur service meteo:1');
			console.error('Weather request > response.statusCode : ' + response.statusCode);
			if(error){console.error('Error getting weather info  /!\\ \n' + error);}
		}
	});
};
exports.weather = weather; 

var delay = 400;
var introTxt = ['Je suis Ody',
	'J\'ai plusieurs fonctions, horloge, reveil, minuterie, calendrier...',
	'Ainsi que jukebox et radio pour se mettre dans le jus',
	'Tu peux aussi me faire dire ce que tu veux !']
var conversation = function(messages){
	console.log('Service Conversation... ' + messages);
	try{
		if(messages.constructor != Array){ //typeof messages == 'undefined' ||       // IS EMPTY ?
			console.error(messages);
			messages = introTxt;
		}
		console.log('messages.constructor : ' + messages.constructor);
		console.log(typeof messages);
		// if(messages.constructor == Array){
			/*messages.forEach(function(messages){
				console.log(messages.length + '  ->  ' + messages);
			});*/
		/*tts.speak('fr', messages[0]);
		setTimeout(function(){
			tts.speak('fr', messages[1]);
			setTimeout(function(){
				tts.speak('fr', messages[2]);
				setTimeout(function(){
						tts.speak('fr', messages[3]);
				}, messages[2].length * delay + 500);
			}, messages[1].length * delay + 500);
		}, messages[0].length * delay + 500);*/

		messages.forEach(function(message){
			setTimeout(function(message){
				tts.speak('fr', message);
			}.bind(this, message), message.length * delay);
		});
	}catch(e){
		tts.speak('fr','erreur conversation:1');
		console.error('conversation_error : ' + e);
	}
};
exports.conversation = conversation;

var time = function(){
	console.log('Service Time...');
	var date = new Date();
	var hour = date.getHours();
	var min = date.getMinutes();
	if(min == 0){
		tts.speak('fr', 'Il est ' + hour + ' heure');
	} else {
		tts.speak('fr', 'Il est ' + hour + ' heures et ' + min + ' minutes'); 
	}
};
exports.time = time;

var days = fs.readFileSync('/home/pi/odi/pgm/data/date.days.properties', 'UTF-8').toString().split('\n');
var months = fs.readFileSync('/home/pi/odi/pgm/data/date.months.properties', 'UTF-8').toString().split('\n');
var date = function(){
	var date = new Date();
	var dayNb = date.getDate();
	if(dayNb == 1) dayNb = 'premier';
	var day = date.getDay();
	var day = days[day];
	var month = date.getMonth();
	var month = months[month];
	var year = date.getFullYear();
	var annonceDate = 'Nous sommes le ' + day + ' ' + dayNb + ' ' + month + ' ' + year;
	console.log('Service Date... ' + annonceDate);
	tts.speak('fr',annonceDate);
};
exports.date = date;

var info = function(){
	console.log('Service Info...');
	self.date();
	setTimeout(function(){
		self.time();
		setTimeout(function(){
			self.weather();
		}, 6*1000);
	}, 5*1000);
};
exports.info = info;

var cpuTemp = function(){
	var temperature = fs.readFileSync("/sys/class/thermal/thermal_zone0/temp");
	temperature = ((temperature/1000).toPrecision(2));
	console.log('Service CPU Temperature...  ' + temperature + ' degres');
	tts.speak('fr', 'Mon processeur est a ' + temperature + ' degres')
};
exports.cpuTemp = cpuTemp;
