var context = require('../models/context');
var screens = {
	'PlayScreen': require('../screens/PlayScreen')
};

var ScreenManager = function() {
	var pub = {};

	var currentScreen = null;

	var init = function() {

	};

	pub.switchScreen = function(screenName) {
		var switchToNewScreen = function() {
			if (currentScreen && currentScreen.destroy) {
				currentScreen.destroy();
				context.stage.removeChild(currentScreen);
			}

			currentScreen = screens[screenName]();
			context.stage.addChild(currentScreen);
		};

		if (currentScreen && currentScreen.outro) {
			currentScreen.outro(switchToNewScreen);
		}
		else {
			switchToNewScreen();
		}		
	};

	init();
	return pub;
};

var screenManager = ScreenManager();
module.exports = screenManager;