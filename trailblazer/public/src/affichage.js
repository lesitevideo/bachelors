/*global THREE*/
/*global Stats*/
window.addEventListener('load', loadassets, false);

var sceneWidth;
var sceneHeight;
var camera;
var scene;
var renderer;
var dom;
var sun;
var ground;

var sceneBackground;

var orbitControl;
var rollingGroundSphere;
var heroSphere;
var heroSphere2;
var rollingSpeed = 0.008;
var heroRollingSpeed;
var worldRadius = 26;
var heroRadius = 0.2;
var sphericalHelper;
var pathAngleValues;
var heroBaseY = 1.8;
var bounceValue = 0.1;
var bounceValue2 = 0.1;
var gravity = 0.005;

var leftLane = -1;
var rightLane = 1;
var middleLane = 0;
var currentLane;

var leftLane2 = -1;
var rightLane2 = 1;
var middleLane2 = 0;
var currentLane2;

var clock;
var jumping;
var jumping2;
var treeReleaseInterval = 0.5;
var lastTreeReleaseTime = 0;
var rocksInPath;
var rocksPool;
var particleGeometry;
var particleCount = 20;
var explosionPower = 1.06;
var particles;
//var stats;
var scoreText;
var score;
var scoreText2;
var score2;
var health1 = 100;
var health2 = 100;
var hasCollided;
var hasCollided2;



var socket = io.connect();

socket.on('connect', function () {
	socket.emit('affichage', 'ok');
});

socket.on('startGame', function () {
	console.log("start game !");
	addHero();
	addHero2();
	ambiance.play();
	document.getElementById('waitingPlayers').style.display = 'none';
	document.getElementById('gameOver').style.display='none';
	health1 = health2 = 100;
	scoreText.innerHTML = health1.toString();
	scoreText2.innerHTML = health2.toString();
});

socket.on('playerdisconnect', function () {
	console.log("one player disconnected");
	removeHeroes();
	document.getElementById('waitingPlayers').style.display = 'flex';
	health1 = health2 = 100;
	scoreText.innerHTML = health1.toString();
	scoreText2.innerHTML = health2.toString();
});


socket.on("left", function (index) {
	//console.log( index + " pressed left" );
	if (index < 1) {
		console.log("P1 pressed left");
		emulKeypress(37);
	} else {
		console.log("P2 pressed left");
		emulKeypress(49);
	}
});

socket.on("right", function (index) {
	//console.log( index + " pressed left" );
	if (index < 1) {
		console.log("P1 pressed right");
		emulKeypress(39);
	} else {
		console.log("P2 pressed right");
		emulKeypress(51);
	}
});

socket.on("up", function (index) {
	//console.log( index + " pressed left" );
	if (index < 1) {
		console.log("P1 pressed up");
		emulKeypress(38);
	} else {
		console.log("P2 pressed up");
		emulKeypress(53);
	}
});


var listener = new THREE.AudioListener();

var audioLoader = new THREE.AudioLoader();

var ambiance = new THREE.Audio(listener);


var jumpSound = new THREE.Audio(listener);
var jumpSound2 = new THREE.Audio(listener);

var hitSound = new THREE.Audio(listener);
var hitSound2 = new THREE.Audio(listener);

function emulKeypress(keyCode) {
	var e = new Event("keydown");
	e.keyCode = keyCode;
	e.which = e.keyCode;
	e.altKey = false;
	e.ctrlKey = true;
	e.shiftKey = false;
	e.metaKey = false;
	e.bubbles = true;
	document.dispatchEvent(e);
}


function loadassets() {
	audioLoader.load('assets/jump.mp3', function (buffer) {
		jumpSound.setBuffer(buffer);
		jumpSound.setLoop(false);
		jumpSound.setVolume(0.5);

		jumpSound2.setBuffer(buffer);
		jumpSound2.setLoop(false);
		jumpSound2.setVolume(0.5);

		audioLoader.load('assets/hit.mp3', function (buffer) {
			hitSound.setBuffer(buffer);
			hitSound.setLoop(false);
			hitSound.setVolume(0.5);

			hitSound2.setBuffer(buffer);
			hitSound2.setLoop(false);
			hitSound2.setVolume(0.5);

			audioLoader.load('assets/audio.mp3', function (buffer2) {
				ambiance.setBuffer(buffer2);
				ambiance.setLoop(true);
				ambiance.setVolume(0.5);

				var loader = new THREE.TextureLoader();

				// load a resource
				loader.load(
					// resource URL
					'assets/images/sky.png',

					// onLoad callback
					function (texture) {
						sceneBackground = texture;
						init();
					}
				);

			});

		});
	});

}


function init() {
	createScene();
	update();
}

function createScene() {
	hasCollided = false;
	hasCollided2 = false;
	score = 0;
	score2 = 0;
	rocksInPath = [];
	rocksPool = [];
	clock = new THREE.Clock();
	clock.start();
	heroRollingSpeed = (rollingSpeed * worldRadius / heroRadius) / 5;
	sphericalHelper = new THREE.Spherical();
	pathAngleValues = [1.52, 1.57, 1.62];
	sceneWidth = window.innerWidth;
	sceneHeight = window.innerHeight;

	scene = new THREE.Scene(); //the 3d scene
	scene.background = new THREE.TextureLoader().load("assets/images/sky.png");

	//scene.fog = new THREE.FogExp2( 0xf0fff0, 0.1 );

	camera = new THREE.PerspectiveCamera(60, sceneWidth / sceneHeight, 0.1, 1000); //perspective camera
	renderer = new THREE.WebGLRenderer(); //renderer with transparent backdrop

	renderer.setSize(sceneWidth, sceneHeight);
	dom = document.getElementById('game');
	dom.appendChild(renderer.domElement);

	createrocksPool();
	addWorld();
	//addHero();
	//addHero2();
	addLight();
	addExplosion();

	camera.position.z = 6.5;
	camera.position.y = 3.5;
	orbitControl = new THREE.OrbitControls(camera, renderer.domElement); //helper to rotate around in scene
	orbitControl.addEventListener('change', render);

	orbitControl.noKeys = true;
	orbitControl.noPan = true;
	orbitControl.enableZoom = false;
	orbitControl.minPolarAngle = 1.1;
	orbitControl.maxPolarAngle = 1.1;
	orbitControl.minAzimuthAngle = -0.2;
	orbitControl.maxAzimuthAngle = 0.2;

	window.addEventListener('resize', onWindowResize, false); //resize callback

	document.onkeydown = handleKeyDown;

	scoreText = document.getElementById("scoreplayer1");
	scoreText2 = document.getElementById("scoreplayer2");
}

function addExplosion() {
	particleGeometry = new THREE.Geometry();
	for (var i = 0; i < particleCount; i++) {
		var vertex = new THREE.Vector3();
		particleGeometry.vertices.push(vertex);
	}
	var pMaterial = new THREE.ParticleBasicMaterial({
		color: 0xfffafa,
		size: 0.2
	});
	particles = new THREE.Points(particleGeometry, pMaterial);
	scene.add(particles);
	particles.visible = false;
}

function createrocksPool() {
	var maxRocksInPool = 20;
	var newRock;
	for (var i = 0; i < maxRocksInPool; i++) {
		newRock = createRock();
		rocksPool.push(newRock);
	}
}

function playsound1() {
	if (jumpSound.isPlaying) {
		jumpSound.stop();
	}
	jumpSound.play();
}

function playsound2() {
	if (jumpSound2.isPlaying) {
		jumpSound2.stop();
	}
	jumpSound2.play();
}


function movePlayer1(keyEvent) {
	if (jumping) return;

	var validMove = true;
	if (keyEvent.keyCode === 37) { //left

		if (currentLane == middleLane) {
			currentLane = leftLane;
			playsound1();
		} else if (currentLane == rightLane) {
			currentLane = middleLane;
			playsound1();
		} else {
			validMove = false;
		}
	} else if (keyEvent.keyCode === 39) { //right

		if (currentLane == middleLane) {
			currentLane = rightLane;
			playsound1();
		} else if (currentLane == leftLane) {
			currentLane = middleLane;
			playsound1();
		} else {
			validMove = false;
		}
	} else {
		if (keyEvent.keyCode === 38) { //up, jump
			playsound1();
			bounceValue = 0.1;
			jumping = true;
		}
		validMove = false;
	}

	//heroSphere.position.x=currentLane;

	if (validMove) {

		jumping = true;
		bounceValue = 0.06;
	}
}

function movePlayer2(keyEvent) {
	if (jumping2) return;

	var validMove = true;
	if (keyEvent.keyCode === 49) { //left
		if (currentLane2 == middleLane2) {
			currentLane2 = leftLane2;
			playsound2();
		} else if (currentLane2 == rightLane2) {
			currentLane2 = middleLane2;
			playsound2();
		} else {
			validMove = false;
		}
	} else if (keyEvent.keyCode === 51) { //right
		if (currentLane2 == middleLane2) {
			currentLane2 = rightLane2;
			playsound2();
		} else if (currentLane2 == leftLane2) {
			currentLane2 = middleLane2;
			playsound2();
		} else {
			validMove = false;
		}
	} else {
		if (keyEvent.keyCode === 53) { //up, jump
			playsound2();
			bounceValue2 = 0.1;
			jumping2 = true;
		}
		validMove = false;
	}

	//heroSphere2.position.x=currentLane2;

	if (validMove) {
		jumping2 = true;
		bounceValue2 = 0.06;
	}
}

function handleKeyDown(keyEvent) {
	if (keyEvent.keyCode === 37 || keyEvent.keyCode === 38 || keyEvent.keyCode === 39) {
		movePlayer1(keyEvent);
	} else {
		movePlayer2(keyEvent);
	}
}

function removeHeroes() {
	if (heroSphere && heroSphere2) {
		scene.remove(scene.getObjectByName('player1'));
		scene.remove(scene.getObjectByName('player2'));
		heroSphere = heroSphere2 = false;
	}
}

function addHero() {
	var sphereGeometry = new THREE.SphereGeometry(heroRadius, 8, 8);
	var sphereMaterial = new THREE.MeshToonMaterial({
		map: new THREE.TextureLoader().load("assets/images/balle1.jpg")
	})
	jumping = false;
	heroSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
	heroSphere.name = 'player1';
	scene.add(heroSphere);
	heroSphere.position.y = heroBaseY;
	heroSphere.position.z = 4.8;
	currentLane = middleLane;
	heroSphere.position.x = leftLane;
}

function addHero2() {
	var sphereGeometry = new THREE.SphereGeometry(heroRadius, 8, 8);
	var sphereMaterial = new THREE.MeshToonMaterial({
		map: new THREE.TextureLoader().load("assets/images/balle2.jpg")
	})
	jumping2 = false;
	heroSphere2 = new THREE.Mesh(sphereGeometry, sphereMaterial);
	heroSphere2.name = 'player2';
	scene.add(heroSphere2);
	heroSphere2.position.y = heroBaseY;
	heroSphere2.position.z = 4.8;
	currentLane2 = middleLane2;
	heroSphere2.position.x = rightLane2;
}

function addWorld() {
	var sides = 40;
	var tiers = 40;
	var sphereGeometry = new THREE.SphereGeometry(worldRadius, sides, tiers);
	var sphereMaterial = new THREE.MeshToonMaterial({
		map: new THREE.TextureLoader().load("assets/images/mud.png")
	})
	sphereMaterial.map.wrapS = THREE.RepeatWrapping;
	sphereMaterial.map.wrapT = THREE.RepeatWrapping;
	sphereMaterial.map.repeat.set(10, 10);

	var vertexIndex;
	var vertexVector = new THREE.Vector3();
	var nextVertexVector = new THREE.Vector3();
	var firstVertexVector = new THREE.Vector3();
	var offset = new THREE.Vector3();
	var currentTier = 1;
	var lerpValue = 0.5;
	var heightValue;
	var maxHeight = 0.07;
	for (var j = 1; j < tiers - 2; j++) {
		currentTier = j;
		for (var i = 0; i < sides; i++) {
			vertexIndex = (currentTier * sides) + 1;
			vertexVector = sphereGeometry.vertices[i + vertexIndex].clone();
			if (j % 2 !== 0) {
				if (i == 0) {
					firstVertexVector = vertexVector.clone();
				}
				nextVertexVector = sphereGeometry.vertices[i + vertexIndex + 1].clone();
				if (i == sides - 1) {
					nextVertexVector = firstVertexVector;
				}
				lerpValue = (Math.random() * (0.75 - 0.25)) + 0.25;
				vertexVector.lerp(nextVertexVector, lerpValue);
			}
			heightValue = (Math.random() * maxHeight) - (maxHeight / 2);
			offset = vertexVector.clone().normalize().multiplyScalar(heightValue);
			sphereGeometry.vertices[i + vertexIndex] = (vertexVector.add(offset));
		}
	}
	rollingGroundSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
	rollingGroundSphere.receiveShadow = true;
	rollingGroundSphere.castShadow = false;
	rollingGroundSphere.rotation.z = -Math.PI / 2;
	scene.add(rollingGroundSphere);
	rollingGroundSphere.position.y = -24;
	rollingGroundSphere.position.z = 2;
	addWorldRocks();
}

function addLight() {
	var hemisphereLight = new THREE.HemisphereLight(0xfffafa, 0x000000, .9)
	scene.add(hemisphereLight);
	sun = new THREE.DirectionalLight(0xcdc1c5, 0.2);
	sun.position.set(12, 6, -7);
	scene.add(sun);
}

function addPathTree() {
	var options = [0, 1, 2];
	var lane = Math.floor(Math.random() * 3);
	addRock(true, lane);
	options.splice(lane, 1);
	if (Math.random() > 0.5) {
		lane = Math.floor(Math.random() * 2);
		addRock(true, options[lane]);
	}
}

function addWorldRocks() {
	var numRocks = 36;
	var gap = 6.28 / 36;
	for (var i = 0; i < numRocks; i++) {
		addRock(false, i * gap, true);
		addRock(false, i * gap, false);
	}
}

function addRock(inPath, row, isLeft) {
	var newRock;
	if (inPath) {
		if (rocksPool.length == 0) return;
		newRock = rocksPool.pop();
		newRock.visible = true;
		rocksInPath.push(newRock);
		sphericalHelper.set(worldRadius - 0.3, pathAngleValues[row], -rollingGroundSphere.rotation.x + 4);
	} else {
		newRock = createRock();
		var forestAreaAngle = 0; //[1.52,1.57,1.62];
		if (isLeft) {
			forestAreaAngle = 1.68 + Math.random() * 0.1;
		} else {
			forestAreaAngle = 1.46 - Math.random() * 0.1;
		}
		sphericalHelper.set(worldRadius - 0.3, forestAreaAngle, row);
	}
	newRock.position.setFromSpherical(sphericalHelper);
	var rollingGroundVector = rollingGroundSphere.position.clone().normalize();
	var treeVector = newRock.position.clone().normalize();
	newRock.quaternion.setFromUnitVectors(treeVector, rollingGroundVector);
	newRock.rotation.x += (Math.random() * (2 * Math.PI / 10)) + -Math.PI / 10;

	rollingGroundSphere.add(newRock);
}

function createRock() {

	var scalarMultiplier = (Math.random() * 0.5) + 0.25;
	var geometry = new THREE.DodecahedronGeometry(scalarMultiplier, 0);
	var material = new THREE.MeshToonMaterial({
		map: new THREE.TextureLoader().load("assets/images/crate.jpg")
	});
	material.map.wrapS = THREE.RepeatWrapping;
	material.map.wrapT = THREE.RepeatWrapping;
	material.map.repeat.set(2, 2);

	geometry.translate(0, 0.3, 0);
	
	var tree = new THREE.Mesh(geometry, material);

	var tree = new THREE.Mesh(geometry, material);

	return tree;
}

function update() {

	//animate
	rollingGroundSphere.rotation.x += rollingSpeed;

	var easeT = 2 * clock.getDelta();
	if (heroSphere && heroSphere2) {

		heroSphere.rotation.x -= heroRollingSpeed;
		if (heroSphere.position.y <= heroBaseY) {
			jumping = false;
			bounceValue = (Math.random() * 0.04) + 0.005;

		}
		heroSphere.position.y += bounceValue;
		heroSphere.position.x = THREE.Math.lerp(heroSphere.position.x, currentLane, easeT); //clock.getElapsedTime());

		heroSphere2.rotation.x -= heroRollingSpeed;
		if (heroSphere2.position.y <= heroBaseY) {
			jumping2 = false;
			bounceValue2 = (Math.random() * 0.04) + 0.005;

		}
		heroSphere2.position.y += bounceValue2;
		heroSphere2.position.x = THREE.Math.lerp(heroSphere2.position.x, currentLane2, easeT); //clock.getElapsedTime());

		bounceValue -= gravity;
		bounceValue2 -= gravity;

		if (clock.getElapsedTime() > treeReleaseInterval) {
			clock.start();
			addPathTree();
		}
		if (health1 < 1 || health2 < 1) {
			gameOver();
		}
	}
	doRockLogic();
	doExplosionLogic();
	render();
	requestAnimationFrame(update); //request next update
}

function doRockLogic() {
	var oneRock;
	var treePos = new THREE.Vector3();
	var rocksToRemove = [];
	rocksInPath.forEach(function (element, index) {
		oneRock = rocksInPath[index];
		treePos.setFromMatrixPosition(oneRock.matrixWorld);
		if (treePos.z > 6 && oneRock.visible) { //gone out of our view zone
			rocksToRemove.push(oneRock);
		} else { //check collision
			if (heroSphere.position) {


				if (treePos.distanceTo(heroSphere.position) <= 0.6) {
					//console.log("hit1");
					hasCollided = true;
					explode(heroSphere);

					health1 = health1 - 1;
					scoreText.innerHTML = health1.toString();

				}
			}
			if (heroSphere2.position) {
				if (treePos.distanceTo(heroSphere2.position) <= 0.6) {
					//console.log("hit2");
					hasCollided2 = true;
					explode(heroSphere2);

					health2 = health2 - 1;
					scoreText2.innerHTML = health2.toString();

				}
			}
		}
	});
	var fromWhere;
	rocksToRemove.forEach(function (element, index) {
		oneRock = rocksToRemove[index];
		fromWhere = rocksInPath.indexOf(oneRock);
		rocksInPath.splice(fromWhere, 1);
		rocksPool.push(oneRock);
		oneRock.visible = false;
	});
}

function doExplosionLogic() {
	if (!particles.visible) return;
	for (var i = 0; i < particleCount; i++) {
		particleGeometry.vertices[i].multiplyScalar(explosionPower);
	}
	if (explosionPower > 1.005) {
		explosionPower -= 0.001;
	} else {
		particles.visible = false;
	}
	particleGeometry.verticesNeedUpdate = true;

}

function explode(player) {

	if (hitSound.isPlaying) {
		hitSound.stop();
	}
	hitSound.play();

	particles.position.y = 2;
	particles.position.z = 4.8;

	particles.position.x = player.position.x;

	for (var i = 0; i < particleCount; i++) {
		var vertex = new THREE.Vector3();
		vertex.x = -0.2 + Math.random() * 0.4;
		vertex.y = -0.2 + Math.random() * 0.4;
		vertex.z = -0.2 + Math.random() * 0.4;
		particleGeometry.vertices[i] = vertex;
	}
	explosionPower = 4.07;
	particles.visible = true;

	return false;
}


function render() {
	renderer.render(scene, camera); //draw
}

function gameOver() {
	//cancelAnimationFrame( globalRenderID );
	//window.clearInterval( powerupSpawnIntervalID );
	if (health1 > health2) {
		//alert("Player 1 wins");
	} else if (health2 > health1) {
		//alert("Player 2 wins");
	}
	
	
	var gameoverbox = document.getElementById('gameOver');
	gameoverbox.style.display='flex';
	removeHeroes();
	
}

function onWindowResize() {
	//resize & align
	sceneHeight = window.innerHeight;
	sceneWidth = window.innerWidth;
	renderer.setSize(sceneWidth, sceneHeight);
	camera.aspect = sceneWidth / sceneHeight;
	camera.updateProjectionMatrix();
}
