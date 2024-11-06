#!/bin/sh

echo
echo "setup script..."

echo "OS release informations:"
cat /etc/os-release


# Create odi user
# Operation to be handled performed, or test if odi user already exists
# sudo adduser odi
# sudo adduser odi sudo
# sudo adduser odi audio
# sudo adduser odi gpio
#su odi

#sudo mkdir /home/odi/framebot
# TODO: add git clone last tag
# Il restera toujours les répertoires /security /media absents !

#sudo mkdir /home/odi/framebot/tmp
cd /home/odi/framebot/tmp

# Run the following command to fix the $HOME directory permissions for the current $USER:
# sudo chown -R $USER:$USER $HOME/

# Uninstall npm & nodejs
sudo apt-get remove -y nodejs
# sudo apt-get remove -y npm

# Install npm & nodejs
curl -sL https://deb.nodesource.com/setup_lts.x | sudo bash -
sudo apt-get install -y nodejs
sudo apt-get install -y npm

# Install sound tools & player
sudo apt-get install -y alsa-base alsa-utils alsa-tools pulseaudio mpg321 lame ffmpeg

# Set audio output to headphones
amixer cset numid=3 1

# Reset volume
amixer sset 'Master' 100%

# Install espeak
sudo apt-get install -y espeak

# Install voices for mbrola
# wget http://tcts.fpms.ac.be/synthesis/mbrola/dba/fr1/fr1-990204.zip
# sudo unzip fr1-990204.zip -d /opt/mbrola
# sudo mkdir -p /usr/share/mbrola/voices/
# sudo cp -r /opt/mbrola/fr1/* /usr/share/mbrola/voices/

# wget http://tcts.fpms.ac.be/synthesis/mbrola/bin/raspberri_pi/mbrola.tgz
# tar xvzf mbrola.tgz 
# sudo chmod 755 mbrola
# sudo mv ./mbrola /usr/local/bin/

wget http://steinerdatenbank.de/software/mbrola3.0.1h_armhf.deb
sudo dpkg -i mbrola3.0.1h_armhf.deb
sudo apt-get install -y mbrola mbrola-fr1 mbrola-fr4

# Install pico2wave
sudo apt-get install -y libttspico-utils

# Install fbi (framebuffer imageviewer: diapo)
sudo apt-get -y install fbi

# Install Certbot
sudo apt install -y certbot

# Install fail2ban & auto start
sudo apt-get -y install fail2ban
sudo echo "ignoreip = 127.0.0.1/8 192.168.0.0/16" > /etc/fail2ban/jail.local
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Install sound tools & player
sudo apt-get -y install nmap

# Install bluetooth libs
sudo apt-get -y install bluetooth bluez libbluetooth-dev libudev-dev

# Test
espeak -s 125 -v mb/mb-fr1 'Installation terminée.'

echo "node version:" $(node -v)
echo "npm version:" $(npm -v)

exit 0

#################
## After npm i ##
#################

# TODO put these lines in /etc/rc.local file (before 'exit 0')
sudo adduser odi audio
sudo adduser odi gpio

# gpio access
sudo chmod -R 777 /sys/class/gpio

# rfxcom gateway access
sudo chmod -R 777 /dev/ttyUSB0