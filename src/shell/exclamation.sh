#!/bin/sh

exclamationTTS () {
	echo '__exclamationTTS()'
	echo $*
	node /home/pi/odi/core/modules/tts.js $* 
}

exclamation () {
	echo 'exclamation !_!'
	volume=$(cat /sys/class/gpio/gpio13/value)
	sound=$(sudo find /home/pi/core/media/mp3/exclamation -maxdepth 1 -type f | shuf | head -1)
	if [ $volume = 0 ]
	then
		volume=-200 #-400
	else
		volume=400 #400
	fi

	txt=$(basename "$sound")
	# echo $txt | sed 's/.\{4\}$//'
	txt=`echo $txt | sed 's/.\{4\}$//'`
	echo $txt

	sudo omxplayer -o local --vol $volume $sound > /dev/null

	#exclamationTTS $txt
	# sleep 20;
	# exclamationTTS param1 param2 param3 param4
}

##########################   TODO: supprimer le test sur le service omxplayer et ajouter un sleep comme pour jukebox ou video
if [ $1 = "LOOP" ]
then
	SERVICE="omxplayer" # On definit le service a utiliser (omxplayer)
	while true; do # On scanne en boucle le dossier
		if ps ax | grep -v grep | grep $SERVICE > /dev/null
			then
			sleep 180; # Le script plante parfois si la pause n'est pas assez longue
		else
			exclamation
		fi
	done
else
	exclamation
fi
