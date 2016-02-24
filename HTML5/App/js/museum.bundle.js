(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var context = require('./models/context');
var debug = require('./utils/debug');
var Messenger = require('./utils/Messenger');
var screenManager = require('./managers/screenManager');

var App = function() {
	var pub = {};

	var init = function() {
		debug.enabled = true;

		context.gameContainer = document.body;

		// Setup context
		context.messenger = Messenger();
		context.width = context.gameContainer.scrollWidth;
		context.height = context.gameContainer.scrollHeight;

		// Setup THREE renderer
		context.mainCamera = new THREE.PerspectiveCamera(45, context.width / context.height, 1, 10000);
		context.mainCamera.position.set(-5, -5, 5);
		context.mainCamera.up.set(0, 0, 1);
		context.scene = new THREE.Scene();

		context.threeRenderer = new THREE.WebGLRenderer({ antialias: true });
		context.threeRenderer.setClearColor(0xfff4e5);
		context.threeRenderer.setPixelRatio(window.devicePixelRatio);
		context.threeRenderer.setSize(context.width, context.height);
		context.threeRenderer.sortObjects = false;
		context.gameContainer.appendChild(context.threeRenderer.domElement);

		// Placeholder three stuff
		var directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
		directionalLight.position.set(-1, 1, -1);
		context.scene.add(directionalLight);

		var ambientLight = new THREE.AmbientLight(0xffffff, 0.25);
		context.scene.add(ambientLight);

		// var sphereGeometry = new THREE.SphereGeometry(50, 32, 16);
		// var sphereMaterial = new THREE.MeshLambertMaterial({ color: 0x8888ff }); 
		// var sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
		// sphere.position.set(50, 50, 0);
		// context.scene.add(sphere);

		// context.mainCamera.lookAt(sphere.position);

		var loader = new THREE.ColladaLoader();
		loader.load("./models/crudecabinet.dae", function(model) {
			context.scene.add(model.scene);
			context.mainCamera.lookAt(model.scene.position);
		});

		// Setup PIXI renderer
		context.pixiRenderer = PIXI.autoDetectRenderer(context.width, context.height, { transparent: true });
		context.stage = new PIXI.Container();
		context.gameContainer.appendChild(context.pixiRenderer.view);

		// Add HTML page listeners
		window.addEventListener('resize', resize, false);

		render();

		screenManager.switchScreen('PlayScreen');
	};

	var render = function() {
		context.threeRenderer.render(context.scene, context.mainCamera);
		context.pixiRenderer.render(context.stage);
		window.requestAnimationFrame(render);
	};

	var resize = function() {
		context.width = context.gameContainer.scrollWidth;
		context.height = context.gameContainer.scrollHeight;

		// THREE
		context.mainCamera.aspect = context.width / context.height;
		context.mainCamera.updateProjectionMatrix();
		context.threeRenderer.setSize(context.width, context.height);

		// PIXI
		context.pixiRenderer.resize(context.width, context.height);

		context.messenger.sendMessage('resize');
	};

	init();
	return pub;
};

window.onload = function() {
	window.gamesMuseum = App();
};

},{"./managers/screenManager":2,"./models/context":3,"./utils/Messenger":5,"./utils/debug":6}],2:[function(require,module,exports){
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
},{"../models/context":3,"../screens/PlayScreen":4}],3:[function(require,module,exports){
module.exports = {
	gameContainer: null,
	renderer: null,
	stage: null,
	width: null,
	height: null,
	messenger: null
};
},{}],4:[function(require,module,exports){
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
},{"../managers/screenManager":2,"../models/context":3,"../utils/debug":6}],5:[function(require,module,exports){
var debug = require('./debug');

module.exports = function() {
	var pub = {};

	var listeners = {};

	var init = function() {

	};

	pub.addListener = function(channel, callback) {
		if (!listeners[channel]) {
			listeners[channel] = [];
		}

		for (var i = 0, iLen = listeners[channel].length; i < iLen; i++) {
			if (listeners[channel][i] === callback) {
				debug.log("Warning: unable to add new messenger listener, callback already registered");
				return;
			}
		}

		listeners[channel].push(callback);
	};

	pub.removeListener = function(channel, callback) {
		if (!listeners[channel]) {
			debug.log("Warning: unable to remove messenger listener, channel not in use");
			return;
		}

		for (var i = 0, iLen = listeners[channel].length; i < iLen; i++) {
			if (listeners[channel][i] === callback) {
				listeners[channel].splice(i, 1);
				return;
			}
		}

		debug.log("Warning: unable to remove messenger listener, callback not registered");
	};

	pub.sendMessage = function(channel, message) {
		if (!listeners[channel]) {
			return;
		}

		for (var i = 0, iLen = listeners[channel].length; i < iLen; i++) {
			listeners[channel][i](message);
		}
	};

	init();
	return pub;
};
},{"./debug":6}],6:[function(require,module,exports){
var Debug = function() {
	var pub = {};

	pub.enabled = false;

	var init = function() {

	};

	pub.log = function(message) {
		if (!pub.enabled) return;

		if (console && console.log) {
			console.log(message);
		}
	};

	init();
	return pub;
};

var debug = Debug();
module.exports = debug;
},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3Vzci9sb2NhbC9saWIvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIkFwcC9zcmMvYXBwLmpzIiwiQXBwL3NyYy9tYW5hZ2Vycy9zY3JlZW5NYW5hZ2VyLmpzIiwiQXBwL3NyYy9tb2RlbHMvY29udGV4dC5qcyIsIkFwcC9zcmMvc2NyZWVucy9QbGF5U2NyZWVuLmpzIiwiQXBwL3NyYy91dGlscy9NZXNzZW5nZXIuanMiLCJBcHAvc3JjL3V0aWxzL2RlYnVnLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3REQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhciBjb250ZXh0ID0gcmVxdWlyZSgnLi9tb2RlbHMvY29udGV4dCcpO1xudmFyIGRlYnVnID0gcmVxdWlyZSgnLi91dGlscy9kZWJ1ZycpO1xudmFyIE1lc3NlbmdlciA9IHJlcXVpcmUoJy4vdXRpbHMvTWVzc2VuZ2VyJyk7XG52YXIgc2NyZWVuTWFuYWdlciA9IHJlcXVpcmUoJy4vbWFuYWdlcnMvc2NyZWVuTWFuYWdlcicpO1xuXG52YXIgQXBwID0gZnVuY3Rpb24oKSB7XG5cdHZhciBwdWIgPSB7fTtcblxuXHR2YXIgaW5pdCA9IGZ1bmN0aW9uKCkge1xuXHRcdGRlYnVnLmVuYWJsZWQgPSB0cnVlO1xuXG5cdFx0Y29udGV4dC5nYW1lQ29udGFpbmVyID0gZG9jdW1lbnQuYm9keTtcblxuXHRcdC8vIFNldHVwIGNvbnRleHRcblx0XHRjb250ZXh0Lm1lc3NlbmdlciA9IE1lc3NlbmdlcigpO1xuXHRcdGNvbnRleHQud2lkdGggPSBjb250ZXh0LmdhbWVDb250YWluZXIuc2Nyb2xsV2lkdGg7XG5cdFx0Y29udGV4dC5oZWlnaHQgPSBjb250ZXh0LmdhbWVDb250YWluZXIuc2Nyb2xsSGVpZ2h0O1xuXG5cdFx0Ly8gU2V0dXAgVEhSRUUgcmVuZGVyZXJcblx0XHRjb250ZXh0Lm1haW5DYW1lcmEgPSBuZXcgVEhSRUUuUGVyc3BlY3RpdmVDYW1lcmEoNDUsIGNvbnRleHQud2lkdGggLyBjb250ZXh0LmhlaWdodCwgMSwgMTAwMDApO1xuXHRcdGNvbnRleHQubWFpbkNhbWVyYS5wb3NpdGlvbi5zZXQoLTUsIC01LCA1KTtcblx0XHRjb250ZXh0Lm1haW5DYW1lcmEudXAuc2V0KDAsIDAsIDEpO1xuXHRcdGNvbnRleHQuc2NlbmUgPSBuZXcgVEhSRUUuU2NlbmUoKTtcblxuXHRcdGNvbnRleHQudGhyZWVSZW5kZXJlciA9IG5ldyBUSFJFRS5XZWJHTFJlbmRlcmVyKHsgYW50aWFsaWFzOiB0cnVlIH0pO1xuXHRcdGNvbnRleHQudGhyZWVSZW5kZXJlci5zZXRDbGVhckNvbG9yKDB4ZmZmNGU1KTtcblx0XHRjb250ZXh0LnRocmVlUmVuZGVyZXIuc2V0UGl4ZWxSYXRpbyh3aW5kb3cuZGV2aWNlUGl4ZWxSYXRpbyk7XG5cdFx0Y29udGV4dC50aHJlZVJlbmRlcmVyLnNldFNpemUoY29udGV4dC53aWR0aCwgY29udGV4dC5oZWlnaHQpO1xuXHRcdGNvbnRleHQudGhyZWVSZW5kZXJlci5zb3J0T2JqZWN0cyA9IGZhbHNlO1xuXHRcdGNvbnRleHQuZ2FtZUNvbnRhaW5lci5hcHBlbmRDaGlsZChjb250ZXh0LnRocmVlUmVuZGVyZXIuZG9tRWxlbWVudCk7XG5cblx0XHQvLyBQbGFjZWhvbGRlciB0aHJlZSBzdHVmZlxuXHRcdHZhciBkaXJlY3Rpb25hbExpZ2h0ID0gbmV3IFRIUkVFLkRpcmVjdGlvbmFsTGlnaHQoMHhmZmZmZmYsIDEuNSk7XG5cdFx0ZGlyZWN0aW9uYWxMaWdodC5wb3NpdGlvbi5zZXQoLTEsIDEsIC0xKTtcblx0XHRjb250ZXh0LnNjZW5lLmFkZChkaXJlY3Rpb25hbExpZ2h0KTtcblxuXHRcdHZhciBhbWJpZW50TGlnaHQgPSBuZXcgVEhSRUUuQW1iaWVudExpZ2h0KDB4ZmZmZmZmLCAwLjI1KTtcblx0XHRjb250ZXh0LnNjZW5lLmFkZChhbWJpZW50TGlnaHQpO1xuXG5cdFx0Ly8gdmFyIHNwaGVyZUdlb21ldHJ5ID0gbmV3IFRIUkVFLlNwaGVyZUdlb21ldHJ5KDUwLCAzMiwgMTYpO1xuXHRcdC8vIHZhciBzcGhlcmVNYXRlcmlhbCA9IG5ldyBUSFJFRS5NZXNoTGFtYmVydE1hdGVyaWFsKHsgY29sb3I6IDB4ODg4OGZmIH0pOyBcblx0XHQvLyB2YXIgc3BoZXJlID0gbmV3IFRIUkVFLk1lc2goc3BoZXJlR2VvbWV0cnksIHNwaGVyZU1hdGVyaWFsKTtcblx0XHQvLyBzcGhlcmUucG9zaXRpb24uc2V0KDUwLCA1MCwgMCk7XG5cdFx0Ly8gY29udGV4dC5zY2VuZS5hZGQoc3BoZXJlKTtcblxuXHRcdC8vIGNvbnRleHQubWFpbkNhbWVyYS5sb29rQXQoc3BoZXJlLnBvc2l0aW9uKTtcblxuXHRcdHZhciBsb2FkZXIgPSBuZXcgVEhSRUUuQ29sbGFkYUxvYWRlcigpO1xuXHRcdGxvYWRlci5sb2FkKFwiLi9tb2RlbHMvY3J1ZGVjYWJpbmV0LmRhZVwiLCBmdW5jdGlvbihtb2RlbCkge1xuXHRcdFx0Y29udGV4dC5zY2VuZS5hZGQobW9kZWwuc2NlbmUpO1xuXHRcdFx0Y29udGV4dC5tYWluQ2FtZXJhLmxvb2tBdChtb2RlbC5zY2VuZS5wb3NpdGlvbik7XG5cdFx0fSk7XG5cblx0XHQvLyBTZXR1cCBQSVhJIHJlbmRlcmVyXG5cdFx0Y29udGV4dC5waXhpUmVuZGVyZXIgPSBQSVhJLmF1dG9EZXRlY3RSZW5kZXJlcihjb250ZXh0LndpZHRoLCBjb250ZXh0LmhlaWdodCwgeyB0cmFuc3BhcmVudDogdHJ1ZSB9KTtcblx0XHRjb250ZXh0LnN0YWdlID0gbmV3IFBJWEkuQ29udGFpbmVyKCk7XG5cdFx0Y29udGV4dC5nYW1lQ29udGFpbmVyLmFwcGVuZENoaWxkKGNvbnRleHQucGl4aVJlbmRlcmVyLnZpZXcpO1xuXG5cdFx0Ly8gQWRkIEhUTUwgcGFnZSBsaXN0ZW5lcnNcblx0XHR3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncmVzaXplJywgcmVzaXplLCBmYWxzZSk7XG5cblx0XHRyZW5kZXIoKTtcblxuXHRcdHNjcmVlbk1hbmFnZXIuc3dpdGNoU2NyZWVuKCdQbGF5U2NyZWVuJyk7XG5cdH07XG5cblx0dmFyIHJlbmRlciA9IGZ1bmN0aW9uKCkge1xuXHRcdGNvbnRleHQudGhyZWVSZW5kZXJlci5yZW5kZXIoY29udGV4dC5zY2VuZSwgY29udGV4dC5tYWluQ2FtZXJhKTtcblx0XHRjb250ZXh0LnBpeGlSZW5kZXJlci5yZW5kZXIoY29udGV4dC5zdGFnZSk7XG5cdFx0d2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZShyZW5kZXIpO1xuXHR9O1xuXG5cdHZhciByZXNpemUgPSBmdW5jdGlvbigpIHtcblx0XHRjb250ZXh0LndpZHRoID0gY29udGV4dC5nYW1lQ29udGFpbmVyLnNjcm9sbFdpZHRoO1xuXHRcdGNvbnRleHQuaGVpZ2h0ID0gY29udGV4dC5nYW1lQ29udGFpbmVyLnNjcm9sbEhlaWdodDtcblxuXHRcdC8vIFRIUkVFXG5cdFx0Y29udGV4dC5tYWluQ2FtZXJhLmFzcGVjdCA9IGNvbnRleHQud2lkdGggLyBjb250ZXh0LmhlaWdodDtcblx0XHRjb250ZXh0Lm1haW5DYW1lcmEudXBkYXRlUHJvamVjdGlvbk1hdHJpeCgpO1xuXHRcdGNvbnRleHQudGhyZWVSZW5kZXJlci5zZXRTaXplKGNvbnRleHQud2lkdGgsIGNvbnRleHQuaGVpZ2h0KTtcblxuXHRcdC8vIFBJWElcblx0XHRjb250ZXh0LnBpeGlSZW5kZXJlci5yZXNpemUoY29udGV4dC53aWR0aCwgY29udGV4dC5oZWlnaHQpO1xuXG5cdFx0Y29udGV4dC5tZXNzZW5nZXIuc2VuZE1lc3NhZ2UoJ3Jlc2l6ZScpO1xuXHR9O1xuXG5cdGluaXQoKTtcblx0cmV0dXJuIHB1Yjtcbn07XG5cbndpbmRvdy5vbmxvYWQgPSBmdW5jdGlvbigpIHtcblx0d2luZG93LmdhbWVzTXVzZXVtID0gQXBwKCk7XG59O1xuIiwidmFyIGNvbnRleHQgPSByZXF1aXJlKCcuLi9tb2RlbHMvY29udGV4dCcpO1xudmFyIHNjcmVlbnMgPSB7XG5cdCdQbGF5U2NyZWVuJzogcmVxdWlyZSgnLi4vc2NyZWVucy9QbGF5U2NyZWVuJylcbn07XG5cbnZhciBTY3JlZW5NYW5hZ2VyID0gZnVuY3Rpb24oKSB7XG5cdHZhciBwdWIgPSB7fTtcblxuXHR2YXIgY3VycmVudFNjcmVlbiA9IG51bGw7XG5cblx0dmFyIGluaXQgPSBmdW5jdGlvbigpIHtcblxuXHR9O1xuXG5cdHB1Yi5zd2l0Y2hTY3JlZW4gPSBmdW5jdGlvbihzY3JlZW5OYW1lKSB7XG5cdFx0dmFyIHN3aXRjaFRvTmV3U2NyZWVuID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRpZiAoY3VycmVudFNjcmVlbiAmJiBjdXJyZW50U2NyZWVuLmRlc3Ryb3kpIHtcblx0XHRcdFx0Y3VycmVudFNjcmVlbi5kZXN0cm95KCk7XG5cdFx0XHRcdGNvbnRleHQuc3RhZ2UucmVtb3ZlQ2hpbGQoY3VycmVudFNjcmVlbik7XG5cdFx0XHR9XG5cblx0XHRcdGN1cnJlbnRTY3JlZW4gPSBzY3JlZW5zW3NjcmVlbk5hbWVdKCk7XG5cdFx0XHRjb250ZXh0LnN0YWdlLmFkZENoaWxkKGN1cnJlbnRTY3JlZW4pO1xuXHRcdH07XG5cblx0XHRpZiAoY3VycmVudFNjcmVlbiAmJiBjdXJyZW50U2NyZWVuLm91dHJvKSB7XG5cdFx0XHRjdXJyZW50U2NyZWVuLm91dHJvKHN3aXRjaFRvTmV3U2NyZWVuKTtcblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHRzd2l0Y2hUb05ld1NjcmVlbigpO1xuXHRcdH1cdFx0XG5cdH07XG5cblx0aW5pdCgpO1xuXHRyZXR1cm4gcHViO1xufTtcblxudmFyIHNjcmVlbk1hbmFnZXIgPSBTY3JlZW5NYW5hZ2VyKCk7XG5tb2R1bGUuZXhwb3J0cyA9IHNjcmVlbk1hbmFnZXI7IiwibW9kdWxlLmV4cG9ydHMgPSB7XG5cdGdhbWVDb250YWluZXI6IG51bGwsXG5cdHJlbmRlcmVyOiBudWxsLFxuXHRzdGFnZTogbnVsbCxcblx0d2lkdGg6IG51bGwsXG5cdGhlaWdodDogbnVsbCxcblx0bWVzc2VuZ2VyOiBudWxsXG59OyIsInZhciBkZWJ1ZyA9IHJlcXVpcmUoJy4uL3V0aWxzL2RlYnVnJyk7XG52YXIgY29udGV4dCA9IHJlcXVpcmUoJy4uL21vZGVscy9jb250ZXh0Jyk7XG52YXIgc2NyZWVuTWFuYWdlciA9IHJlcXVpcmUoJy4uL21hbmFnZXJzL3NjcmVlbk1hbmFnZXInKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigpIHtcblx0dmFyIHB1YiA9IG5ldyBQSVhJLkNvbnRhaW5lcigpO1xuXG5cdHZhciBwbGFjZWhvbGRlclN0eWxlID0ge1xuXHRcdGZvbnQgOiAnYm9sZCBpdGFsaWMgMzJweCBBcmlhbCcsXG5cdFx0ZmlsbCA6ICcjRjdFRENBJyxcblx0XHRzdHJva2UgOiAnIzRhMTg1MCcsXG5cdFx0c3Ryb2tlVGhpY2tuZXNzIDogNSxcblx0XHRkcm9wU2hhZG93IDogdHJ1ZSxcblx0XHRkcm9wU2hhZG93Q29sb3IgOiAnIzAwMDAwMCcsXG5cdFx0ZHJvcFNoYWRvd0FuZ2xlIDogTWF0aC5QSSAvIDYsXG5cdFx0ZHJvcFNoYWRvd0Rpc3RhbmNlIDogNixcblx0XHR3b3JkV3JhcCA6IHRydWUsXG5cdFx0d29yZFdyYXBXaWR0aCA6IDQ0MFxuXHR9O1xuXG5cdHZhciBwbGFjZWhvbGRlclRleHQgPSBudWxsO1xuXG5cdHZhciBpbml0ID0gZnVuY3Rpb24oKSB7XG5cdFx0cGxhY2Vob2xkZXJUZXh0ID0gbmV3IFBJWEkuVGV4dChcIkdhbWVzIE11c2V1bVwiLCBwbGFjZWhvbGRlclN0eWxlKTtcblx0XHRwbGFjZWhvbGRlclRleHQuYW5jaG9yID0gbmV3IFBJWEkuUG9pbnQoMC41LCAwLjUpO1xuXHRcdHB1Yi5hZGRDaGlsZChwbGFjZWhvbGRlclRleHQpO1xuXG5cdFx0Y29udGV4dC5tZXNzZW5nZXIuYWRkTGlzdGVuZXIoJ3Jlc2l6ZScsIHJlc2l6ZSk7XG5cblx0XHRyZXNpemUoKTtcblx0fTtcblxuXHRwdWIub3V0cm8gPSBmdW5jdGlvbihvbkNvbXBsZXRlKSB7XG5cblx0fTtcblxuXHRwdWIuZGVzdHJveSA9IGZ1bmN0aW9uKCkge1xuXHRcdGNvbnRleHQubWVzc2VuZ2VyLnJlbW92ZUxpc3RlbmVyKCdyZXNpemUnLCByZXNpemUpO1xuXG5cdFx0cHViLnJlbW92ZUNoaWxkKHBsYWNlaG9sZGVyVGV4dCk7XG5cdFx0cGxhY2Vob2xkZXJUZXh0ID0gbnVsbDtcblx0fTtcblxuXHR2YXIgcmVzaXplID0gZnVuY3Rpb24oKSB7XG5cdFx0aWYgKHBsYWNlaG9sZGVyVGV4dCkge1xuXHRcdFx0cGxhY2Vob2xkZXJUZXh0LnggPSBjb250ZXh0LndpZHRoIC8gMjtcblx0XHRcdHBsYWNlaG9sZGVyVGV4dC55ID0gMzA7XG5cdFx0fVxuXHR9O1xuXG5cdGluaXQoKTtcblx0cmV0dXJuIHB1Yjtcbn07IiwidmFyIGRlYnVnID0gcmVxdWlyZSgnLi9kZWJ1ZycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCkge1xuXHR2YXIgcHViID0ge307XG5cblx0dmFyIGxpc3RlbmVycyA9IHt9O1xuXG5cdHZhciBpbml0ID0gZnVuY3Rpb24oKSB7XG5cblx0fTtcblxuXHRwdWIuYWRkTGlzdGVuZXIgPSBmdW5jdGlvbihjaGFubmVsLCBjYWxsYmFjaykge1xuXHRcdGlmICghbGlzdGVuZXJzW2NoYW5uZWxdKSB7XG5cdFx0XHRsaXN0ZW5lcnNbY2hhbm5lbF0gPSBbXTtcblx0XHR9XG5cblx0XHRmb3IgKHZhciBpID0gMCwgaUxlbiA9IGxpc3RlbmVyc1tjaGFubmVsXS5sZW5ndGg7IGkgPCBpTGVuOyBpKyspIHtcblx0XHRcdGlmIChsaXN0ZW5lcnNbY2hhbm5lbF1baV0gPT09IGNhbGxiYWNrKSB7XG5cdFx0XHRcdGRlYnVnLmxvZyhcIldhcm5pbmc6IHVuYWJsZSB0byBhZGQgbmV3IG1lc3NlbmdlciBsaXN0ZW5lciwgY2FsbGJhY2sgYWxyZWFkeSByZWdpc3RlcmVkXCIpO1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0bGlzdGVuZXJzW2NoYW5uZWxdLnB1c2goY2FsbGJhY2spO1xuXHR9O1xuXG5cdHB1Yi5yZW1vdmVMaXN0ZW5lciA9IGZ1bmN0aW9uKGNoYW5uZWwsIGNhbGxiYWNrKSB7XG5cdFx0aWYgKCFsaXN0ZW5lcnNbY2hhbm5lbF0pIHtcblx0XHRcdGRlYnVnLmxvZyhcIldhcm5pbmc6IHVuYWJsZSB0byByZW1vdmUgbWVzc2VuZ2VyIGxpc3RlbmVyLCBjaGFubmVsIG5vdCBpbiB1c2VcIik7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0Zm9yICh2YXIgaSA9IDAsIGlMZW4gPSBsaXN0ZW5lcnNbY2hhbm5lbF0ubGVuZ3RoOyBpIDwgaUxlbjsgaSsrKSB7XG5cdFx0XHRpZiAobGlzdGVuZXJzW2NoYW5uZWxdW2ldID09PSBjYWxsYmFjaykge1xuXHRcdFx0XHRsaXN0ZW5lcnNbY2hhbm5lbF0uc3BsaWNlKGksIDEpO1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0ZGVidWcubG9nKFwiV2FybmluZzogdW5hYmxlIHRvIHJlbW92ZSBtZXNzZW5nZXIgbGlzdGVuZXIsIGNhbGxiYWNrIG5vdCByZWdpc3RlcmVkXCIpO1xuXHR9O1xuXG5cdHB1Yi5zZW5kTWVzc2FnZSA9IGZ1bmN0aW9uKGNoYW5uZWwsIG1lc3NhZ2UpIHtcblx0XHRpZiAoIWxpc3RlbmVyc1tjaGFubmVsXSkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGZvciAodmFyIGkgPSAwLCBpTGVuID0gbGlzdGVuZXJzW2NoYW5uZWxdLmxlbmd0aDsgaSA8IGlMZW47IGkrKykge1xuXHRcdFx0bGlzdGVuZXJzW2NoYW5uZWxdW2ldKG1lc3NhZ2UpO1xuXHRcdH1cblx0fTtcblxuXHRpbml0KCk7XG5cdHJldHVybiBwdWI7XG59OyIsInZhciBEZWJ1ZyA9IGZ1bmN0aW9uKCkge1xuXHR2YXIgcHViID0ge307XG5cblx0cHViLmVuYWJsZWQgPSBmYWxzZTtcblxuXHR2YXIgaW5pdCA9IGZ1bmN0aW9uKCkge1xuXG5cdH07XG5cblx0cHViLmxvZyA9IGZ1bmN0aW9uKG1lc3NhZ2UpIHtcblx0XHRpZiAoIXB1Yi5lbmFibGVkKSByZXR1cm47XG5cblx0XHRpZiAoY29uc29sZSAmJiBjb25zb2xlLmxvZykge1xuXHRcdFx0Y29uc29sZS5sb2cobWVzc2FnZSk7XG5cdFx0fVxuXHR9O1xuXG5cdGluaXQoKTtcblx0cmV0dXJuIHB1Yjtcbn07XG5cbnZhciBkZWJ1ZyA9IERlYnVnKCk7XG5tb2R1bGUuZXhwb3J0cyA9IGRlYnVnOyJdfQ==
