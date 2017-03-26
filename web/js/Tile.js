/** DefaultTile object **/
app.factory('DefaultTile', function($rootScope, $mdSidenav, $mdDialog, $mdToast, $mdBottomSheet, UIService){
	// var self = this;
	// var tile;
	// Tile constructor function
	function Tile(tile){
		// var Tile = this; // TODO à implémenter sur tout ce fichier... !!
		//console.log(tile.id, tile.label, tile.color, tile.rowspan, tile.colspan, tile.viewMode, tile.value, tile.actionList);
		// tile = this;
		// Basic attributes
		this.id = tile.id || '';
		this.label = tile.label || '';
		this.expanded = tile.expanded || false;

		// Info attributes
		/*this.value = tile.value || '-';*/

		// Action attributes
		this.actionList = tile.actionList;
		// Set Tile.value to first Tile.actionList item
		if(this.actionList.length>0 && !this.actionList[0].hasOwnProperty('label')){
			this.actionList[0].label = this.label;
		}
		/*if(this.disableOnSleep){
			this.test = 'testABCD';
		}*/
		this.click = click;
	}

	/** Function on click on Tile **/
	function click(){
		if(this.actionList.length>1){
			openBottomSheet(this.actionList);
		}else if(this.actionList.length==1){
			action(this.actionList[0]);
		}else{
			console.log('No action affected.');
			$mdToast.show($mdToast.simple().textContent('No action affected.').position('top right').hideDelay(2500).toastClass('error'));
		}
	}

	/** Function to send action **/
	function action(button){
		if(button.url.indexOf('http://') > -1){
			//$window.open(button.url);
			UIService.getRequest(button.url, function(data){
				//console.log('data', data);
				$mdDialog.show({
					controller: DialogController,
					templateUrl: 'templates/dialog.html',
					locals: {
						modal: modal
					},
					parent: angular.element(document.body),
					clickOutsideToClose:true,
					fullscreen: false // Only for -xs, -sm breakpoints
				});
			});
		}else if(button.label && button.url){
			UIService.sendCommand(button, function(data){
				//$scope.showToast(button.label);
			});
			// TODO test pour showErrorToast
		}
	}

	/** Function to open bottom sheet **/
	function openBottomSheet(bottomSheetList){
		$rootScope.bottomSheetButtonList = bottomSheetList;
		console.log('titi0');
		//$scope.alert = '';
		$mdBottomSheet.show({
			templateUrl: 'templates/bottom-sheet.html',
			// controller: 'UIController',
			controller: 'BottomSheetController',
			clickOutsideToClose: true
		}).then(function(button){
			console.log('titi1');
			action(button);
			console.log('titi2');
		});
	}

	// Tile object own properties
	/*Tile.prototype = {
		onHold: function(element){
			console.log('onHold()', element);
		}
	}*/
	// Return constructor
	return(Tile);
});

app.controller('BottomSheetController', function($scope, $mdBottomSheet){
// function BottomSheetController($scope, $mdBottomSheet){
	/*$scope.modal = modal;
	//console.log('$scope.modal.data', $scope.modal.data);
	if(typeof $scope.modal.data == 'string'){
		$scope.modal.data = $scope.modal.data.split('\n');
	}
	$scope.isNumber = angular.isNumber;
	$scope.close = function(){
		$mdDialog.cancel();
	};*/
	/** Function on click on bottom sheet **/
	$scope.bottomSheetAction = function(button){
		//$scope.action(button);
		$mdBottomSheet.hide(button);
	}
// }
});