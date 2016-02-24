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