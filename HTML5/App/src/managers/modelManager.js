var manifest = require('../models/modelManifest');

var ModelManager = function() {
	var pub = {};
	
	pub.models = {};
	
	pub.load = function(onProgress, onComplete) {
		var loader = new THREE.ColladaLoader();
		var loaded = 0;
		
		manifest.forEach(function(entry) {
			loader.load(entry.src, function(model) {
				pub.models[entry.id] = model;
				
				loaded += 1;
				var percentage = 1 / (manifest.length / loaded);
				onProgress(percentage);
				
				if (loader === manifest.length) {
					onComplete();
				}
			});
		});
	};
	
	return pub;
};

module.exports = ModelManager();