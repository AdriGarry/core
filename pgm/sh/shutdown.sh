#!/bin/sh

if [ $1 = "reboot" ]
then
	#sudo omxplayer -o local /home/pi/odi/mp3/sounds/system/beback.mp3
	sudo reboot
else
	#sudo omxplayer -o local /home/pi/odi/mp3/sounds/system/powerOff.mp3
	sudo halt
fi

