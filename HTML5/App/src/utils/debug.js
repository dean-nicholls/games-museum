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