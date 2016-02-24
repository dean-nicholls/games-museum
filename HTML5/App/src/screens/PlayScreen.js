var debug = require('../utils/debug');
var context = require('../models/context');
var screenManager = require('../managers/screenManager');

module.exports = function() {
	var pub = new PIXI.Container();

	var placeholderStyle = {
		font : 'bold italic 32px Arial',
		fill : '#F7EDCA',
		stroke : '#4a1850',
		strokeThickness : 5,
		dropShadow : true,
		dropShadowColor : '#000000',
		dropShadowAngle : Math.PI / 6,
		dropShadowDistance : 6,
		wordWrap : true,
		wordWrapWidth : 440
	};

	var placeholderText = null;

	var init = function() {
		placeholderText = new PIXI.Text("Games Museum", placeholderStyle);
		placeholderText.anchor = new PIXI.Point(0.5, 0.5);
		pub.addChild(placeholderText);

		context.messenger.addListener('resize', resize);

		resize();
	};

	pub.outro = function(onComplete) {

	};

	pub.destroy = function() {
		context.messenger.removeListener('resize', resize);

		pub.removeChild(placeholderText);
		placeholderText = null;
	};

	var resize = function() {
		if (placeholderText) {
			placeholderText.x = context.width / 2;
			placeholderText.y = 30;
		}
	};

	init();
	return pub;
};