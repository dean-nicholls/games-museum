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
