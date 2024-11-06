/** TTS component */
app.component('tts', {
  bindings: {
    data: '<',
    coreConst: '<'
  },
  templateUrl: 'templates/tiles.html',
  controller: function ($window, DefaultTile, UIService, $timeout) {
    const ctrl = this;
    const tileParams = {
      label: 'Text To Speech',
      actionList: [],
      expanded: false
    };
    ctrl.access = true;
    ctrl.tile = new DefaultTile(tileParams, true);

    ctrl.$onChanges = function (changes) {
      if (changes.coreConst && ctrl.coreConst) ctrl.options = initTextInputOptions(ctrl.coreConst);
    };

    /** Overwrite tile action */
    ctrl.tile.click = function ($event) {
      if (!ctrl.tile.expanded) {
        ctrl.toggleTileHeight();
        focusOnTtsInput();
      }
      return false;
    };

    ctrl.cssClass = function () {
      return (ctrl.tile.expanded ? 'expanded' : '') + ' ' + ctrl.tile.id;
    };

    ctrl.toggleTileHeight = function () {
      ctrl.tile.expanded = !ctrl.tile.expanded;
    };

    function focusOnTtsInput() {
      let autocompleteElement = $window.document.getElementById('textInput');
      let autocompleteInputElement = autocompleteElement.getElementsByTagName('input')[0];
      if (autocompleteInputElement) autocompleteInputElement.focus();
    }

    ctrl.tts = {
      voice: 'espeak',
      lg: 'fr',
      msg: '',
      voicemail: false,
      error: '',
      conf: {
        languageList: [
          { code: 'fr', label: 'French' },
          { code: 'en', label: 'English' },
          { code: 'ru', label: 'Russian' },
          { code: 'es', label: 'Spanish' },
          { code: 'it', label: 'Italian' },
          { code: 'de', label: 'German' }
        ],
        voiceList: [
          { code: 'espeak', label: 'Espeak' },
          { code: 'mbrolaFr1', label: 'MbrolaFr1' },
          { code: 'mbrolaFr4', label: 'MbrolaFr4' },
          { code: 'google', label: 'Google' },
          { code: 'pico', label: 'Pico' }
        ]
      },
      submit() {
        console.log('[deprecated?] submit', ctrl.tts);
        if (ctrl.tts.msg != '') {
          UIService.sendTTS(ctrl.tts, function (callback) {
            if (callback.status == 200) {
              ctrl.tts.msg = '';
              ctrl.tts.error = ''; // Reinit TTS
            }
          });
        } else {
          focusOnTtsInput();
        }
      }
    };

    function initTextInputOptions(coreConst) {
      let options = [];
      angular.forEach(coreConst.playlists, (playlist, playListId) => {
        angular.forEach(playlist, song => {
          options.push({ label: song.slice(0, -4), type: 'song', value: 'playlists/' + playListId + '/' + song, icon: 'fa-solid fa-music' });
        });
      });
      angular.forEach(coreConst.stories, story => {
        options.push({ label: story.slice(8, -4), type: 'story', value: story, icon: 'fa-solid fa-book' });
      });
      return options;
    }

    ctrl.getMatchingOptions = function (input) {
      let matchingOptions = input ? ctrl.options.filter(createStrictFilterFor(input)) : ctrl.options;
      let othersMatchingOptions = input ? ctrl.options.filter(createFilterFor(input)) : [];
      angular.forEach(othersMatchingOptions, option => {
        if (!matchingOptions.includes(option)) {
          matchingOptions.push(option);
        }
      });
      let ttsOption = ctrl.data.value.mode === 'Sleep' ? [] : { label: input, type: 'tts', icon: 'fa-regular fa-comment-dots' };
      let voicemailOption = { label: input, type: 'voicemail', icon: 'fa-regular fa-envelope' };
      let clearInputOption = { label: 'Clear "' + input + '"', type: 'clear', icon: 'fa-solid fa-backspace' };
      let rawTextOption = { label: input, type: 'text', icon: 'fa-solid fa-i-cursor' };
      return matchingOptions.concat(ttsOption, voicemailOption, clearInputOption, rawTextOption);
    };

    ctrl.selectedOptionChange = function (option) {
      if (option) {
        ctrl.tts.msg = ctrl.textInput;
        if (option.type === 'song') {
          ctrl.tile.action({ label: 'Mute', url: '/flux/interface/sound/mute' });
          ctrl.tile.action({
            label: 'Play ' + option.label,
            url: '/flux/interface/sound/play',
            value: { file: option.value }
          });
          resetAutocomplete();
        } else if (option.type === 'story') {
          ctrl.tile.action({ label: 'Mute', url: '/flux/interface/sound/mute' });
          if (option.label.indexOf('Survivaure') > -1) {
            ctrl.tile.action({ label: option.label, url: '/flux/service/music/story', value: 'survivaure' });
          } else if (option.label.indexOf('Naheulbeuk') > -1) {
            ctrl.tile.action({ label: option.label, url: '/flux/service/music/story', value: 'naheulbeuk' });
          }
          resetAutocomplete();
        } else if (option.type === 'tts') {
          ctrl.tts.submit();
          resetAutocomplete();
        } else if (option.type === 'voicemail') {
          ctrl.tts.voicemail = true;
          ctrl.tts.submit();
          ctrl.tts.voicemail = false;
          resetAutocomplete();
        } else if (option.type === 'clear') {
          resetAutocomplete();
        } else {
          navigator.clipboard.writeText(ctrl.tts.msg);
          UIService.showToast("'" + ctrl.textInput + "' copied");
        }
      }
    };

    ctrl.onFocus = function () {
      let textInputOriginalValue = ctrl.textInput;
      ctrl.textInput = angular.copy(ctrl.textInput.slice(0, -1));
      $timeout(() => {
        ctrl.selectedOption = null;
        ctrl.textInput = angular.copy(textInputOriginalValue);
      }, 100);
    };

    function resetAutocomplete() {
      ctrl.textInput = null;
      ctrl.selectedOption = null;
    }

    function createStrictFilterFor(input) {
      return function filterFn(option) {
        return option.label.toLowerCase().indexOf(input.toLowerCase()) === 0;
      };
    }
    function createFilterFor(input) {
      return function filterFn(option) {
        return option.label.toLowerCase().indexOf(input.toLowerCase()) > -1;
      };
    }
  }
});

/** Mode component */
app.component('mode', {
  bindings: {
    data: '<',
    access: '<'
  },
  templateUrl: 'templates/tiles.html',
  controller: function (DefaultTile, $rootScope, UIService) {
    const ctrl = this;
    const tileParams = {
      label: 'Mode',
      actionList: [
        { label: 'Mood', icon: 'fa-regular fa-grin-alt', continu: true },
        { label: 'Sleep', icon: 'fa-regular fa-moon', url: '/flux/service/context/sleep' },
        { label: 'Reset', icon: 'fa-solid fa-retweet', url: '/flux/service/context/reset' },
        { label: 'Restart', icon: 'fa-solid fa-bolt', url: '/flux/service/context/restart' }
      ]
    };
    ctrl.tile = new DefaultTile(tileParams);

    /** Overwrite tile action */
    ctrl.tile.click = function () {
      if (!$rootScope.irda) {
        UIService.showErrorToast('Unauthorized action.');
      } else {
        ctrl.tile.openBottomSheet(this.actionList, specificMoodActions);
      }
    };

    const PLUG_FLUX_URL = '/flux/service/mood/set';
    let specificMoodActions = function (action) {
      if (action.label === 'Mood') {
        let actionList = [
          { label: 'Mood 0', icon: 'fa-regular fa-meh-blank', url: PLUG_FLUX_URL, value: 0 },
          { label: 'Mood 1', icon: 'fa-regular fa-meh', url: PLUG_FLUX_URL, value: 1 },
          { label: 'Mood 2', icon: 'fa-regular fa-smile', url: PLUG_FLUX_URL, value: 2 },
          { label: 'Mood 3', icon: 'fa-regular fa-grin-beam', url: PLUG_FLUX_URL, value: 3 },
          { label: 'Mood 4', icon: 'fa-regular fa-grin-squint', url: PLUG_FLUX_URL, value: 4 },
          { label: 'Mood 5', icon: 'fa-regular fa-grin-squint-tears', url: PLUG_FLUX_URL, value: 5 }
        ];
        ctrl.tile.openBottomSheet(actionList, ctrl.tile.action);
      } else {
        ctrl.tile.action(action);
      }
    };
  }
});

/** Options component */
app.component('options', {
  bindings: {
    data: '<',
    access: '<'
    // odiState: '<'
  },
  templateUrl: 'templates/tiles.html',
  controller: function (DefaultTile) {
    const ctrl = this;
    const tileParams = {
      label: 'Options',
      actionList: [
        { label: 'Renew Certbot', icon: 'fa-solid fa-lock', url: '/flux/service/task/certbot' },
        { label: 'Test', icon: 'fa-solid fa-flask-vial', url: '/flux/service/context/updateRestart', value: { mode: 'test' } },
        { label: 'Demo', icon: 'fa-solid fa-play', url: '/flux/service/interaction/demo' },
        { label: '!Watcher', icon: 'fa-solid fa-eye', url: '/flux/interface/watcher/toggle' },
        { label: 'Log', icon: 'fa-solid fa-code', continu: true },
        { label: 'Core', icon: 'fa-solid fa-circle-nodes', continu: true }
      ]
    };
    ctrl.tile = new DefaultTile(tileParams);

    const logActionList = [
        { label: '!Trace', icon: 'fa-regular fa-dot-circle', url: '/toggleTrace' },
        { label: '!Debug', icon: 'fa-solid fa-circle', url: '/toggleDebug' }
      ],
      coreActionList = [
        { label: 'Const', icon: 'fa-solid fa-hockey-puck', url: 'https://odi.adrigarry.com/const' },
        { label: 'Config', icon: 'fa-brands fa-whmcs', url: 'https://odi.adrigarry.com/config.json' },
        { label: 'Runtime', icon: 'fa-brands fa-buffer', url: 'https://odi.adrigarry.com/runtime' }
      ];

    /** Overwrite tile action */
    ctrl.tile.click = function () {
      ctrl.tile.openBottomSheet(this.actionList, specificActions);
    };

    const specificActions = function (button) {
      if (button.label === 'Log') {
        ctrl.tile.openBottomSheet(logActionList);
      } else if (button.label === 'Core') {
        ctrl.tile.openBottomSheet(coreActionList);
      } else {
        ctrl.tile.action(button);
      }
    };
  }
});

/** Volume component */
app.component('volume', {
  bindings: {
    data: '<',
    access: '<'
  },
  templateUrl: 'templates/tiles.html',
  controller: function ($rootScope, DefaultTile) {
    const ctrl = this;
    const tileParams = {
      label: 'Volume',
      actionList: []
    };
    ctrl.tile = new DefaultTile(tileParams);
    ctrl.odiState = ctrl.odiState;

    ctrl.getVolumeIcon = function () {
      let fontAwesomeIcon = 'fa-volume-';
      switch (ctrl.data.volume.value) {
        case 10:
        case 20:
        case 30:
          fontAwesomeIcon += 'off';
          break;
        case 40:
        case 50:
        case 60:
          fontAwesomeIcon += 'down';
          break;
        case 70:
        case 80:
        case 90:
        case 100:
          fontAwesomeIcon += 'up';
          break;
        default:
          fontAwesomeIcon += 'mute';
          break;
      }
      return fontAwesomeIcon;
    };

    /** Overwrite tile action */
    ctrl.tile.click = function () {
      if (!$rootScope.irda) {
        UIService.showErrorToast('Unauthorized action.');
      } else {
        let slider = {
          label: 'Volume',
          url: '/flux/interface/sound/volume',
          legend: '%',
          min: 0,
          max: 100,
          step: 10,
          value: ctrl.data.volume.value,
          action: null,
          formatTime: false
        };
        ctrl.tile.openSliderBottomSheet(slider);
      }
    };
  }
});

/** Alarms component */
app.component('alarms', {
  bindings: {
    data: '<',
    access: '<',
    odiState: '<'
  },
  templateUrl: 'templates/tiles.html',
  controller: function (DefaultTile, $rootScope, UIService, $mdpTimePicker) {
    const ctrl = this;
    const tileParams = {
      label: 'Alarm & timer',
      actionList: [
        { label: 'weekDay', icon: 'fa-regular fa-frown', url: '/flux/service/alarm/set', continu: true },
        { label: 'weekEnd', icon: 'fa-regular fa-smile', url: '/flux/service/alarm/set', continu: true },
        { label: 'Disable all', icon: 'fa-solid fa-bell-slash', url: '/flux/service/alarm/off' },
        { label: 'Stop timer', icon: 'fa-solid fa-stop', url: '/flux/service/timer/stop' },
        {
          label: 'Manual',
          icon: 'fa-solid fa-hourglass-half',
          url: '/flux/service/timer/increase',
          value: 5,
          continu: true
        },
        { label: 'Timer +1', icon: 'fa-solid fa-plus', url: '/flux/service/timer/increase', value: 1 }
      ]
    };
    ctrl.tile = new DefaultTile(tileParams);
    ctrl.odiState = ctrl.odiState;

    ctrl.$onChanges = function (changes) {
      updateNextAlarm();
    };

    /** Overwrite tile action */
    ctrl.tile.click = function (arg) {
      if (!$rootScope.irda) {
        UIService.showErrorToast('Unauthorized action.');
      } else {
        ctrl.tile.openBottomSheet(this.actionList, dispatcherAlarmTimer);
      }
    };

    let dispatcherAlarmTimer = function (button) {
      if (button.url.includes('alarm')) specificAlarmActions(button);
      else specificTimerActions(button);
    };

    let specificTimerActions = function (button) {
      if (button.label.indexOf('Manual') != -1) {
        let slider = {
          label: 'Manual timer',
          url: '/flux/service/timer/increase',
          legend: 'min',
          min: 2,
          max: 30,
          extensible: true,
          step: 1,
          value: 5,
          action: null,
          formatTime: false
        };
        ctrl.tile.openSliderBottomSheet(slider);
      } else {
        ctrl.tile.action(button);
      }
    };

    let showTimePicker = function (ev) {
      // TODO A déplacer dans Tile.js ?
      $mdpTimePicker(new Date(), {
        targetEvent: ev,
        autoSwitch: true
      }).then(function (selectedDate) {
        ctrl.newAlarm.value = {
          when: ctrl.newAlarm.label,
          h: selectedDate.getHours(),
          m: selectedDate.getMinutes()
        };
        ctrl.newAlarm.toast = ctrl.newAlarm.label + ' alarm set to ' + ctrl.newAlarm.value.h + ':' + ctrl.newAlarm.value.m;
        UIService.sendCommand(ctrl.newAlarm);
      });
    };

    let specificAlarmActions = function (button) {
      if (button.label !== 'Disable all' && button.label !== 'Sleep forever') {
        ctrl.newAlarm = button;
        showTimePicker();
      } else {
        ctrl.tile.action(button);
      }
    };

    const DAYS = { weekDay: [1, 2, 3, 4, 5], weekEnd: [6, 0] };
    let updateNextAlarm = function () {
      let ALARMS = ctrl.data.alarms.value;
      if (ALARMS.weekDay || ALARMS.weekEnd) {
        let now = new Date(),
          nextAlarms = {};
        Object.keys(ALARMS).forEach(key => {
          if (ALARMS[key]) {
            let nextAlarm = new Date(now.getFullYear(), now.getMonth(), now.getDate(), ALARMS[key].h, ALARMS[key].m);
            while (!DAYS[key].includes(nextAlarm.getDay()) || nextAlarm < now) {
              nextAlarm = _incrementDay(nextAlarm, ALARMS[key]);
            }
            nextAlarms[key] = nextAlarm;
          }
        });
        let alarmToReturn = getAlarmToDisplay(nextAlarms);
        ctrl.nextAlarm = { h: alarmToReturn.getHours(), m: alarmToReturn.getMinutes() };
      } else ctrl.nextAlarm = false;
    };

    let getAlarmToDisplay = function (nextAlarms) {
      if (!nextAlarms.weekDay) return nextAlarms.weekEnd;
      if (!nextAlarms.weekEnd) return nextAlarms.weekDay;
      if (nextAlarms.weekDay < nextAlarms.weekEnd) return nextAlarms.weekDay;
      else return nextAlarms.weekEnd;
    };

    let _incrementDay = function (date, time) {
      return new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1, time.h, time.m);
    };
  }
});

/** Message component */
app.component('message', {
  bindings: {
    data: '<',
    access: '<'
  },
  templateUrl: 'templates/tiles.html',
  controller: function (DefaultTile, $rootScope, UIService) {
    const ctrl = this;
    const tileParams = {
      label: 'Message',
      actionList: [
        { label: 'Exclamation', icon: 'fa-solid fa-bullhorn', url: '/flux/service/interaction/exclamation' },
        { label: 'Random', icon: 'fa-regular fa-comment-dots', url: '/flux/interface/tts/random' },
        { label: 'Clear', icon: 'fa-regular fa-trash-alt', url: '/flux/service/message/clear' },
        { label: 'Play', icon: 'fa-solid fa-play', url: '/flux/service/message/play' },
        { label: 'Last', icon: 'fa-solid fa-undo', url: '/flux/service/message/last' }
      ]
    };
    ctrl.tile = new DefaultTile(tileParams);
    ctrl.odiState = ctrl.odiState;

    ctrl.getIconClass = function () {
      if (ctrl.data.audioRecord.value && ctrl.data.voicemail.value) {
        return 'fa-solid fa-comment-dots';
      } else if (ctrl.data.audioRecord.value) {
        return 'fa-solid fa-microphone';
      } else if (ctrl.data.voicemail.value) {
        return 'fa-solid fa-envelope';
      }
      return 'fa-regular fa-comment-dots';
    };

    /** Overwrite tile action */
    ctrl.tile.click = function () {
      ctrl.tile.openCustomBottomSheet(bottomSheetController, bottomSheetTemplate, this.actionList, bottomSheetCatch);
    };

    let bottomSheetCatch = function (audioService) {
      audioService.cancelRecord();
    };

    const bottomSheetTemplate = `
		<md-bottom-sheet class="md-grid" layout="column">
			<md-subheader data-ng-cloak>
				<span data-ng-show="!recording">Message</span>
				<span data-ng-show="recording">Speak now... <i>-{{countDown}}s</i></span>
			</md-subheader>
			<div data-ng-cloak>
				<span data-ng-if="$root.irda">
					<md-button data-ng-repeat="button in bottomSheetButtonList track by $index" data-ng-click="action(button)" class="md-grid-item-content">
						<i class="{{button.icon}} fa-2x"></i>
						<div class="md-grid-text">{{button.label}}</div>
					</md-button>
				</span>
				<md-button class="md-raised md-grid-item-content" data-ng-class="recording?'md-warn':'md-primary'" data-ng-click="toggleRecord()" title="ToggleRecord">
					<br>
					<i class="fa-solid fa-2x {{waitRecording?'fa-circle-notch fa-spin':'fa-microphone'}}"></i>
					<br>{{recording ? 'Send':'Start'}}
				</md-button>
				<br>
			</div>
		</md-bottom-sheet>`;

    let bottomSheetController = function ($rootScope, $scope, $timeout, $interval, $mdBottomSheet, UIService, audioService) {
      let ctrl = $scope;
      ctrl.recording = false;
      ctrl.waitRecording = false;

      ctrl.action = function (cmd) {
        UIService.sendCommand(cmd, () => {
          $mdBottomSheet.hide(cmd);
        });
      };

      ctrl.toggleRecord = function () {
        if (!ctrl.recording) {
          ctrl.waitRecording = true;
          audioService.startRecord(isRecording => {
            $timeout(() => {
              ctrl.waitRecording = false;
              ctrl.recording = isRecording;
              startCountDown();
            }, 1000);
          });
        } else {
          ctrl.waitRecording = true;
          $timeout(() => {
            audioService.stopRecord(isRecording => {
              ctrl.waitRecording = false;
              ctrl.recording = isRecording;
              ctrl.countDown = 0;
            });
          }, 1000);
        }
      };

      function startCountDown() {
        ctrl.countDown = $rootScope.irda ? 30 : 10;
        ctrl.countDownInterval = $interval(() => {
          ctrl.countDown--;
          if (!ctrl.countDown || !ctrl.recording) {
            $interval.cancel(ctrl.countDownInterval);
            if (ctrl.recording) {
              ctrl.toggleRecord();
            }
          }
        }, 1000);
      }
    };
  }
});

/** CPU component */
app.component('hardware', {
  bindings: {
    data: '<',
    access: '<',
    odiState: '<'
  },
  templateUrl: 'templates/tiles.html',
  controller: function (DefaultTile) {
    const ctrl = this;
    const tileParams = {
      label: 'Hardware',
      //disableOnSleep: true,
      actionList: [
        { label: 'CPU', icon: 'fa-solid fa-3x fa-microchip', url: '/flux/interface/hardware/cpuTTS' },
        { label: 'Memory', icon: 'fa-solid fa-3x fa-memory', url: '/flux/interface/hardware/soulTTS' },
        { label: 'Disk Space', icon: 'fa-solid fa-3x fa-chart-pie', url: '/flux/interface/hardware/diskSpaceTTS' },
        { label: 'Netstat', icon: 'fa-solid fa-3x fa-network-wired', url: '/flux/service/network/netstat' }
      ]
    };
    ctrl.tile = new DefaultTile(tileParams);
    ctrl.odiState = ctrl.odiState;

    const MEMORY_REGEX = /(\d+)\/(\d+)/;
    ctrl.getMemoryPerCent = function () {
      let memory = ctrl.data.value.memory.system;
      let regexResult = memory.match(MEMORY_REGEX);
      return ((regexResult[1] / regexResult[2]) * 100).toFixed(0);
    };
  }
});

/** Music component */
app.component('music', {
  bindings: {
    data: '<',
    access: '<',
    odiState: '<'
  },
  templateUrl: 'templates/tiles.html',
  controller: function (DefaultTile) {
    const ctrl = this;
    const tileParams = {
      label: 'Music',
      actionList: [
        { label: 'Playlist childs', icon: 'fa-solid fa-child-reaching', url: '/flux/service/music/playlist', value: 'childs', continu: true },
        { label: 'Low', icon: 'fa-solid fa-kiwi-bird', url: '/flux/service/music/playlist', value: 'low', continu: true },
        { label: 'Jukebox', icon: 'fa-solid fa-compact-disc', url: '/flux/service/music/playlist', continu: true },
        { label: 'FIP', icon: 'fa-solid fa-radio', url: '/flux/service/music/radio', value: 'fip' },
        { label: 'FIP Hip Hop', icon: 'fa-brands fa-napster', url: '/flux/service/music/radio', value: 'fipHipHop' }
      ]
    };
    ctrl.tile = new DefaultTile(tileParams);
    ctrl.odiState = ctrl.odiState;

    /** Overwrite tile action */
    ctrl.tile.click = function () {
      ctrl.tile.openBottomSheet(this.actionList, specificActions);
    };

    function getPlaylistActionList(value) {
      return [
        { label: 'One song', icon: 'fa-solid fa-1', url: '/flux/service/music/song', value: value },
        { label: 'Loop', icon: 'fa-solid fa-sync', url: '/flux/service/music/playlist', value: value }
      ];
    }
    const specificActions = function (button) {
      if (button.continu) {
        ctrl.tile.openBottomSheet(getPlaylistActionList(button.value));
      } else {
        ctrl.tile.action(button);
      }
    };

    ctrl.getIconClass = function () {
      if (ctrl.data.value === 'jukebox') {
        return 'fa-solid fa-compact-disc';
      } else if (ctrl.data.value === 'fip') {
        return 'fa-solid fa-radio';
      } else if (ctrl.data.value === 'fipHipHop') {
        return 'fa-brands fa-napster';
      } else if (ctrl.data.value === 'low') {
        return 'fa-solid fa-kiwi-bird';
      } else if (ctrl.data.value === 'childs') {
        return 'fa-solid fa-child-reaching';
      } else {
        return 'fa-solid fa-music';
      }
    };
  }
});

/** Time component */
app.component('time', {
  bindings: {
    data: '<',
    access: '<',
    odiState: '<'
  },
  templateUrl: 'templates/tiles.html',
  controller: function (DefaultTile) {
    const ctrl = this;
    const tileParams = {
      label: 'Time',
      // actionList:[{url: '/time'}]
      actionList: [
        { label: 'Bot age', icon: 'fa-solid fa-birthday-cake', url: '/flux/service/time/age' },
        { label: 'Today', icon: 'fa-solid fa-calendar-day', url: '/flux/service/time/today' },
        { label: 'Time', icon: 'fa-regular fa-clock', url: '/flux/service/time/now' }
      ]
    };
    ctrl.tile = new DefaultTile(tileParams);
    ctrl.odiState = ctrl.odiState;
  }
});

/** Weather component */
app.component('weather', {
  bindings: {
    data: '<',
    access: '<',
    odiState: '<'
  },
  templateUrl: 'templates/tiles.html',
  controller: function (DefaultTile) {
    const ctrl = this;
    const tileParams = {
      label: 'Weather',
      actionList: [
        { label: 'Refresh report', icon: 'fa-solid fa-sync', url: '/flux/service/weather/refresh' },
        { label: 'Official weather', icon: 'fa-solid fa-cloud-sun', url: '/flux/service/weather/report' },
        { label: 'Alternative weather', icon: 'fa-solid fa-cloud-sun-rain', url: '/flux/service/weather/alternative' }
      ]
    };
    ctrl.tile = new DefaultTile(tileParams);
    ctrl.odiState = ctrl.odiState;
  }
});

/** Childs component */
app.component('childs', {
  bindings: {
    data: '<',
    access: '<',
    odiState: '<'
  },
  templateUrl: 'templates/tiles.html',
  controller: function (DefaultTile) {
    const ctrl = this;
    const tileParams = {
      label: 'Childs',
      actionList: [
        { label: 'Naheulbeuk', icon: 'fa-brands fa-fort-awesome', url: '/flux/service/music/story', value: 'naheulbeuk' },
        { label: 'Survivaure', icon: 'fa-solid fa-space-shuttle', url: '/flux/service/music/story', value: 'survivaure' },
        { label: 'Yayou', icon: 'fa-solid fa-child-reaching', url: '/flux/service/childs/interact', value: 'Yayou' },
        { label: 'Zazou', icon: 'fa-solid fa-baby', url: '/flux/service/childs/interact', value: 'Zazou' },
        { label: 'Bonne nuit', icon: 'fa-solid fa-moon', url: '/flux/service/childs/bonneNuit' },
        { label: 'Roulotte', icon: 'fa-solid fa-campground', url: '/flux/service/powerPlug/timeout', value: { plug: 'plug3', mode: true, timeout: 30 } }
      ]
    };
    ctrl.tile = new DefaultTile(tileParams);
    ctrl.odiState = ctrl.odiState;
  }
});

/** Idea component */
app.component('idea', {
  bindings: {
    data: '<',
    access: '<',
    odiState: '<'
  },
  templateUrl: 'templates/tiles.html',
  controller: function (DefaultTile) {
    const ctrl = this;
    const tileParams = {
      label: 'Idea',
      actionList: [
        { label: 'Total lines', icon: 'fa-regular fa-file-code', url: '/flux/interface/hardware/totalLinesTTS' },
        { label: 'Idea', icon: 'fa-regular fa-lightbulb', url: '/flux/interface/tts/speak', value: { lg: 'en', msg: "I've got an idea !" } },
        { label: 'Civil Horn', icon: 'fa-solid fa-bullhorn', url: '/flux/service/interaction/civilHorn' },
        { label: 'Subway / Street', icon: 'fa-solid fa-subway', url: '/flux/service/interaction/russia' },
        { label: 'Test', icon: 'fa-solid fa-flag-checkered', url: '/test' }
      ]
    };
    ctrl.tile = new DefaultTile(tileParams);
    ctrl.odiState = ctrl.odiState;
  }
});

/** Bad boy component */
app.component('badBoy', {
  bindings: {
    data: '<',
    access: '<',
    odiState: '<'
  },
  templateUrl: 'templates/tiles.html',
  controller: function (DefaultTile, $rootScope, UIService) {
    const ctrl = this;
    const tileParams = {
      label: 'Bad boy',
      actionList: [
        { label: 'Java', icon: 'fa-solid fa-grin-squint-tears', url: '/flux/service/party/java' },
        { label: 'BadBoy Mode', icon: 'fa-solid fa-hand-middle-finger', url: '/flux/service/party/badBoy', continu: true },
        { label: 'BadBoy TTS', icon: 'fa-solid fa-hand-middle-finger', url: '/flux/service/party/badBoy' }
      ]
    };
    ctrl.tile = new DefaultTile(tileParams);
    ctrl.odiState = ctrl.odiState;

    /** Overwrite tile action */
    ctrl.tile.click = function () {
      if (!$rootScope.irda) {
        UIService.showErrorToast('Unauthorized action.');
      } else {
        ctrl.tile.openBottomSheet(this.actionList, specificActions);
      }
    };

    let specificActions = function (button) {
      if (button.label.toUpperCase().indexOf('BADBOY MODE') != -1) {
        let slider = {
          label: 'Bad boy interval',
          url: '/flux/service/party/badBoy',
          legend: 'min',
          min: 10,
          max: 300,
          step: 1,
          value: 60,
          action: null,
          formatTime: true
        };
        ctrl.tile.openSliderBottomSheet(slider);
      } else {
        ctrl.tile.action(button);
      }
    };
  }
});

/** Party component */
app.component('party', {
  bindings: {
    data: '<',
    access: '<',
    odiState: '<'
  },
  templateUrl: 'templates/tiles.html',
  controller: function (DefaultTile) {
    const ctrl = this;
    const tileParams = {
      label: 'Party',
      actionList: [
        { label: 'Cigales', icon: 'fa-solid fa-bug', url: '/flux/interface/sound/play', value: { file: 'system/cigales.mp3' } },
        { label: 'Party mode', icon: 'fa-regular fa-grin-tongue', url: '/flux/service/party/start' },
        { label: 'Pirate', icon: 'fa-solid fa-bottle-droplet', url: '/flux/service/party/pirate' },
        { label: 'Birthday song', icon: 'fa-solid fa-birthday-cake', url: '/flux/service/party/birthdaySong' },
        { label: 'TTS', icon: 'fa-regular fa-comment-dots', url: '/flux/service/party/tts' }
      ]
    };
    ctrl.tile = new DefaultTile(tileParams);
    ctrl.odiState = ctrl.odiState;
  }
});

/** Video component */
app.component('videos', {
  bindings: {
    data: '<',
    access: '<',
    odiState: '<'
  },
  templateUrl: 'templates/tiles.html',
  controller: function (DefaultTile) {
    const ctrl = this;
    const tileParams = {
      label: 'Video',
      actionList: [
        { label: 'Loop', icon: 'fa-solid fa-film', url: '/flux/service/video/loop' },
        { label: 'On', icon: 'fa-solid fa-toggle-on', url: '/flux/interface/hdmi/on' },
        { label: 'Off', icon: 'fa-solid fa-toggle-off', url: '/flux/interface/hdmi/off' }
      ]
    };
    ctrl.tile = new DefaultTile(tileParams);
  }
});

/** Max component */
app.component('max', {
  bindings: {
    data: '<',
    access: '<',
    odiState: '<'
  },
  templateUrl: 'templates/tiles.html',
  controller: function (DefaultTile) {
    const ctrl = this;
    const tileParams = {
      label: 'Max',
      actionList: [
        { label: 'RDM Led', icon: 'fa-regular fa-sun', url: '/flux/service/max/blinkRdmLed' },
        { label: 'All Led', icon: 'fa-solid fa-sun', url: '/flux/service/max/blinkAllLed' },
        { label: 'Melody', icon: 'fa-solid fa-music', url: '/flux/service/max/playOneMelody' },
        { label: 'RDM Melody', icon: 'fa-solid fa-shuffle', url: '/flux/service/max/playRdmMelody' },
        { label: 'Horn', icon: 'fa-solid fa-bullhorn', url: '/flux/service/max/hornRdm' },
        { label: 'Turn', icon: 'fa-solid fa-sync', url: '/flux/service/max/turn' }
      ]
    };
    ctrl.tile = new DefaultTile(tileParams);
  }
});

/** Power plug component */
app.component('powerPlug', {
  bindings: {
    data: '<',
    access: '<',
    odiState: '<'
  },
  templateUrl: 'templates/tiles.html',
  controller: function (DefaultTile, $rootScope) {
    const ctrl = this;
    const tileParams = {
      label: 'Power plug',
      actionList: [
        { label: 'Plug 1', icon: 'fa-solid fa-computer', value: { device: 'plug1', continu: true } },
        { label: 'Plug 2', icon: 'fa-solid fa-plug-circle-bolt', value: { device: 'plug2', continu: true } },
        { label: 'Plug 3', icon: 'fa-solid fa-plug', value: { device: 'plug3', continu: true } },
        { label: 'Plug 11', icon: 'fa-regular fa-sun', value: { device: 'plug11', continu: true } },
        { label: 'Plug 12', icon: 'fa-regular fa-lightbulb', value: { device: 'plug12', continu: true } },
        { label: 'Plug 13', icon: 'fa-solid fa-plug', value: { device: 'plug13', continu: true } },
        { label: 'Plug 14', icon: 'fa-solid fa-user-tie', value: { device: 'plug14', continu: true } }
      ]
    };
    ctrl.tile = new DefaultTile(tileParams);
    ctrl.odiState = ctrl.odiState;
    ctrl.plugs = {};

    ctrl.$onChanges = function () {
      updateAllPlugsStatus();
    };

    function updateAllPlugsStatus() {
      for (let plug in tileParams.actionList) {
        updatePlugStatus(tileParams.actionList[plug].value.device);
      }
    }

    function updatePlugStatus(plugId) {
      let mode = getMode(plugId);
      let cssClass = mode === 'on' ? '' : mode === 'unknow' ? 'opacity20' : 'opacity50';
      let timeout = getPlugTimeoutIfExists(plugId);
      let unknowMode = mode === 'unknow';
      let info = unknowMode || timeout;
      let badgeOpacity = timeout ? 'opacity70' : 'opacity50';
      ctrl.plugs[plugId] = { cssClass: cssClass, info: info, timeout: timeout, badgeOpacity: badgeOpacity, unknowMode: unknowMode };
    }

    function getMode(plugId) {
      return ctrl.data.powerPlug.value[plugId].mode || ctrl.data.powerPlug.value[plugId];
    }

    function getPlugTimeoutIfExists(plugId) {
      if (ctrl.data.config.rfxcomDevices[plugId]) {
        let plugTimeout = ctrl.data.config.rfxcomDevices[plugId].timeout;
        if (plugTimeout) {
          return plugTimeout;
        }
      }
      return false;
    }

    /** Overwrite tile action */
    ctrl.tile.click = function () {
      if (!$rootScope.irda) {
        UIService.showErrorToast('Unauthorized action.');
      } else {
        ctrl.tile.openBottomSheet(this.actionList, specificplugActions);
      }
    };

    let specificplugActions = function (action) {
      let actionList = [
        {
          label: 'ON timeout',
          icon: 'fa-solid fa-clock',
          url: '/flux/service/powerPlug/timeout',
          value: { plug: action.value.device, mode: true },
          continu: true
        },
        {
          label: 'OFF timeout',
          icon: 'fa-regular fa-clock',
          url: '/flux/service/powerPlug/timeout',
          value: { plug: action.value.device, mode: false },
          continu: true
        },
        {
          label: 'ON',
          icon: 'fa-solid fa-toggle-on',
          url: '/flux/service/powerPlug/toggle',
          value: { plug: action.value.device, mode: true }
        },
        {
          label: 'OFF',
          icon: 'fa-solid fa-toggle-off',
          url: '/flux/service/powerPlug/toggle',
          value: { plug: action.value.device, mode: false }
        }
      ];
      ctrl.tile.openBottomSheet(actionList, specificActions);
    };

    let specificActions = function (button) {
      if (button.label.toUpperCase().indexOf('TIMEOUT') > -1) {
        let slider = {
          label: button.label,
          url: button.url,
          legend: 'min',
          min: 1,
          max: 30,
          extensible: true,
          step: 1,
          value: 10,
          action: null,
          data: button.value,
          plug: button.value.plug
        };
        ctrl.tile.openSliderBottomSheet(slider, specificEndAction);
      } else {
        ctrl.tile.action(button);
      }
    };

    let specificEndAction = function (button) {
      button.value = { mode: button.label.toUpperCase().indexOf('ON') > -1 ? 'on' : 'off', timeout: button.value, plug: button.plug };
      ctrl.tile.action(button);
    };
  }
});

/** Arduino component */
app.component('arduino', {
  bindings: {
    data: '<',
    access: '<',
    odiState: '<'
  },
  templateUrl: 'templates/tiles.html',
  controller: function (DefaultTile) {
    const ctrl = this;
    const tileParams = {
      label: 'Arduino',
      actionList: [
        { label: 'On', icon: 'fa-solid fa-toggle-on', url: '/flux/interface/arduino/connect' },
        { label: 'Off', icon: 'fa-solid fa-toggle-off', url: '/flux/interface/arduino/disconnect' }
      ]
    };
    ctrl.tile = new DefaultTile(tileParams);
  }
});

/** Bluetooth component */
app.component('bluetooth', {
  bindings: {
    data: '<',
    access: '<',
    odiState: '<'
  },
  templateUrl: 'templates/tiles.html',
  controller: function (DefaultTile) {
    const ctrl = this;
    const tileParams = {
      label: 'Bluetooth',
      actionList: [
        { label: 'On', icon: 'fa-solid fa-toggle-on', url: '/flux/interface/bluetooth/on' },
        { label: 'Off', icon: 'fa-solid fa-toggle-off', url: '/flux/interface/bluetooth/off' }
      ]
    };
    ctrl.tile = new DefaultTile(tileParams);
  }
});

/** Rfxcom component */
app.component('rfxcom', {
  bindings: {
    data: '<',
    access: '<',
    odiState: '<'
  },
  templateUrl: 'templates/tiles.html',
  controller: function (DefaultTile) {
    const ctrl = this;
    const tileParams = {
      label: 'Rfxcom',
      actionList: [
        { label: 'On', icon: 'fa-solid fa-toggle-on', url: '/flux/interface/rfxcom/toggleLock', value: true },
        { label: 'Off', icon: 'fa-solid fa-toggle-off', url: '/flux/interface/rfxcom/toggleLock', value: false }
      ]
    };
    ctrl.tile = new DefaultTile(tileParams);
    ctrl.odiState = ctrl.odiState;
  }
});

/** Logs component */
app.component('logs', {
  bindings: {
    data: '<',
    access: '<'
  },
  templateUrl: 'templates/tiles.html',
  controller: function (DefaultTile) {
    const ctrl = this;
    const tileParams = {
      label: 'Logs',
      actionList: [
        { label: 'Trash uploads', icon: 'fa-solid fa-microphone', url: '/flux/service/audioRecord/trash' },
        { label: 'Archive logs', icon: 'fa-solid fa-file-archive', url: '/flux/interface/hardware/archiveLogs' },
        { label: 'TTS', icon: 'fa-regular fa-comment-dots', url: 'https://odi.adrigarry.com/ttsUIHistory' },
        { label: 'Voicemail', icon: 'fa-regular fa-envelope', url: 'https://odi.adrigarry.com/voicemailHistory' },
        { label: 'Request', icon: 'fa-solid fa-exchange-alt', url: 'https://odi.adrigarry.com/requestHistory' },
        { label: 'Unknown hosts', icon: 'fa-solid fa-broadcast-tower', url: 'https://odi.adrigarry.com/unknownHostHistory' },
        { label: 'Errors', icon: 'fa-brands fa-sith', url: 'https://odi.adrigarry.com/errorHistory' }
      ]
    };
    ctrl.tile = new DefaultTile(tileParams);
  }
});

/** System component */
app.component('system', {
  bindings: {
    data: '<',
    access: '<'
  },
  templateUrl: 'templates/tiles.html',
  controller: function (DefaultTile) {
    const ctrl = this;
    const tileParams = {
      label: 'System',
      actionList: [
        { label: 'Light', icon: 'fa-regular fa-sun', url: '/flux/service/light/on', value: 120 },
        { label: 'Shutdown', icon: 'fa-solid fa-power-off', url: '/flux/interface/hardware/shutdown' },
        { label: 'Reboot', icon: 'fa-solid fa-sync', url: '/flux/interface/hardware/reboot' }
      ]
    };
    ctrl.tile = new DefaultTile(tileParams);
  }
});

/** Nmap component */
app.component('nmap', {
  bindings: {
    data: '<',
    access: '<'
  },
  templateUrl: 'templates/tiles.html',
  controller: function (DefaultTile) {
    const ctrl = this;
    const tileParams = {
      label: 'Nmap',
      actionList: [
        { label: 'Scan', icon: 'fa-solid fa-broadcast-tower', url: '/flux/interface/nmap/scan' },
        { label: 'Loop', icon: 'fa-solid fa-sync', url: '/flux/interface/nmap/continuous' },
        { label: 'Stop', icon: 'fa-solid fa-stop', url: '/flux/interface/nmap/stop' }
      ]
    };
    ctrl.tile = new DefaultTile(tileParams);
  }
});

/** Presence component */
app.component('presence', {
  bindings: {
    data: '<',
    access: '<'
  },
  templateUrl: 'templates/tiles.html',
  controller: function (DefaultTile) {
    const ctrl = this;
    const tileParams = {
      label: 'Presence & tasks',
      actionList: [
        { label: 'Check presence', icon: 'fa-solid fa-rotate', url: '/flux/service/presence/check' },
        { label: 'Shower music', icon: 'fa-solid fa-shower', url: '/flux/service/powerPlug/timeout', value: { mode: 'on', timeout: 10, plug: 'plug11' } },
        { label: 'HomeOffice', icon: 'fa-solid fa-laptop-code', url: '/flux/service/homeOffice/start' },
        { label: 'goToSleep', icon: 'fa-solid fa-bed', url: '/flux/service/task/goToSleep' }
      ]
    };
    ctrl.tile = new DefaultTile(tileParams);

    ctrl.iconCssClass = function () {
      if (ctrl.data.run.presence === true) {
        return 'fa-person-rays';
      } else if (ctrl.data.run.presence === false) {
        return 'fa-user-large-slash opacity70';
      }
      return 'fa-person-circle-question opacity70';
    };
  }
});

/** About component */
app.component('about', {
  bindings: {
    data: '<'
  },
  templateUrl: 'templates/tiles.html',
  controller: function (DefaultTile) {
    const ctrl = this;
    const tileParams = {
      label: 'About',
      actionList: [{ url: 'https://odi.adrigarry.com/about' }]
    };
    ctrl.access = true;
    ctrl.tile = new DefaultTile(tileParams, true);
  }
});
