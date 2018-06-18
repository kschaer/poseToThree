import * as THREE from 'three';
import * as POST from 'postprocessing';
// import {simulate, clothFunction, Cloth} from './cloth.js';
const scene = new THREE.Scene();
// antialias and allow alpha so our scene can transparently render above video
const renderer = new THREE.WebGLRenderer({antialias: true, alpha: true});
renderer.setClearColor(0x000000, 0);
renderer.setSize(window.innerWidth, window.innerHeight);
const width = window.innerWidth;
const height = window.innerHeight;
// POST

// IMAGES FOR TEXTURES -----------
const fabricImg = require('../public/knit.jpg');
// const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
const camera = new THREE.PerspectiveCamera(
  30,
  window.innerWidth / window.innerHeight,
  1,
  10000
);
// camera.position.z = 5;
camera.position.set(0, 0, 1500);
// camera.up = new THREE.Vector3(0, 1, 0);
camera.lookAt(0, 0, 0);
const composer = new POST.EffectComposer(renderer);
composer.addPass(new POST.RenderPass(scene, camera));
const bloom = new POST.BloomPass();
const clock = new THREE.Clock();
bloom.renderToScreen = true;
composer.addPass(bloom);

document.getElementById('three').appendChild(renderer.domElement);

// basic ambient and directional lights for testing
scene.add(new THREE.AmbientLight(0x000000));
let light = new THREE.DirectionalLight(0xdfebff);
light.position.set(100, 5, 150);
scene.add(light);

// postprocessing

// -------------------------------------sphere for debug
// let axesHelper = new THREE.AxesHelper(500);
let sphereGeometry = new THREE.SphereGeometry(10);
let sphere = new THREE.Mesh(
  sphereGeometry,
  new THREE.MeshBasicMaterial({color: 0x00ff00})
);

// scene.add(sphere);
// scene.add(axesHelper);

// mouse listener and raycaster to get mouse position into scene
const raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();
let spherePosition = new THREE.Vector3();

// -----------------------------HELPER TO TRANSLATE DOM TO WORLD
export const domToWorld = function(x, y) {
  let newPosition = new THREE.Vector3();
  let normalizedX = (x / width) * 2 - 1;
  let normalizedY = ((y - height) / height) * 2 + 1;
  newPosition.set(normalizedX, -normalizedY, 0);
  newPosition.unproject(camera);
  let dir = newPosition.sub(camera.position).normalize();
  let distance = -camera.position.z / dir.z;
  let pos = camera.position.clone().add(dir.multiplyScalar(distance));
  return pos;
};
// ----MOUSE------------------------------------------------
function onMouseMove(event) {
  let pos = domToWorld(event.clientX, event.clientY);
  spherePosition.set(pos.x, pos.y, 0);
  sphere.position.set(pos.x, pos.y, 0);

  // console.log('FIRINGMOUSEEVENT', sphere.position);
}
window.addEventListener('mousemove', onMouseMove, false);

// ------------------ RIGHT WRIST
let rightWrist = new THREE.Vector3();
export const rightWristController = function(x, y) {
  let pos = domToWorld(x, y);
  rightWrist.set(pos.x, pos.y, 0);
};

// ------------------ LEFT WRIST
let leftWrist = new THREE.Vector3();
export const leftWristController = function(x, y) {
  let pos = domToWorld(x, y);
  leftWrist.set(pos.x, pos.y, 0);
};

/* --------------------------------------------START CLOTH HELPERS----- */
let DAMPING = 0.03;
let DRAG = 1 - DAMPING;
let MASS = 0.05;
let restDistance = 15;

let xSegs = 15;
let ySegs = 15;

let clothFunction = plane(restDistance * xSegs, restDistance * ySegs);

let cloth = new Cloth(xSegs, ySegs);

let GRAVITY = 981 * 1.4;
let gravity = new THREE.Vector3(0, -GRAVITY, 0).multiplyScalar(MASS);

let TIMESTEP = 18 / 1000;
let TIMESTEP_SQ = TIMESTEP * TIMESTEP;
// **************  INITIAL PINS- */
let pins = [0, cloth.w];
// let pins = [0];
let wind = true;
// let windStrength = 2;
let windForce = new THREE.Vector3(0, 0, 0);

let ballPosition = new THREE.Vector3(0, -45, 0);
let ballSize = 60; // 40

let tmpForce = new THREE.Vector3();

let lastTime;

function plane(width, height) {
  return function(u, v, optionalTarget) {
    let result = optionalTarget || new THREE.Vector3();

    let x = (u - 0.5) * width;
    let y = (v + 0.5) * height;
    let z = 0;

    return result.set(x, y, z);
  };
}

function Particle(x, y, z, mass) {
  this.position = clothFunction(x, y); // position
  this.previous = clothFunction(x, y); // previous
  this.original = clothFunction(x, y);
  this.a = new THREE.Vector3(0, 0, 0); // acceleration
  this.mass = mass;
  this.invMass = 1 / mass;
  this.tmp = new THREE.Vector3();
  this.tmp2 = new THREE.Vector3();
}

// Force -> Acceleration

Particle.prototype.addForce = function(force) {
  this.a.add(this.tmp2.copy(force).multiplyScalar(this.invMass));
};

// Performs Verlet integration

Particle.prototype.integrate = function(timesq) {
  let newPos = this.tmp.subVectors(this.position, this.previous);
  newPos.multiplyScalar(DRAG).add(this.position);
  newPos.add(this.a.multiplyScalar(timesq));

  this.tmp = this.previous;
  this.previous = this.position;
  this.position = newPos;

  this.a.set(0, 0, 0);
};

let diff = new THREE.Vector3();

function satisfyConstraints(p1, p2, distance) {
  diff.subVectors(p2.position, p1.position);
  let currentDist = diff.length();
  if (currentDist === 0) return; // prevents division by 0
  let correction = diff.multiplyScalar(1 - distance / currentDist);
  let correctionHalf = correction.multiplyScalar(0.5);
  p1.position.add(correctionHalf);
  p2.position.sub(correctionHalf);
}

function Cloth(w, h) {
  w = w || 10;
  h = h || 10;
  this.w = w;
  this.h = h;

  let particles = [];
  let constraints = [];

  let u, v;

  // Create particles
  for (v = 0; v <= h; v++) {
    for (u = 0; u <= w; u++) {
      particles.push(new Particle(u / w, v / h, 0, MASS));
    }
  }

  // Structural

  for (v = 0; v < h; v++) {
    for (u = 0; u < w; u++) {
      constraints.push([
        particles[index(u, v)],
        particles[index(u, v + 1)],
        restDistance,
      ]);

      constraints.push([
        particles[index(u, v)],
        particles[index(u + 1, v)],
        restDistance,
      ]);
    }
  }

  for (u = w, v = 0; v < h; v++) {
    constraints.push([
      particles[index(u, v)],
      particles[index(u, v + 1)],
      restDistance,
    ]);
  }

  for (v = h, u = 0; u < w; u++) {
    constraints.push([
      particles[index(u, v)],
      particles[index(u + 1, v)],
      restDistance,
    ]);
  }
  this.particles = particles;
  this.constraints = constraints;

  function index(u, v) {
    return u + v * (w + 1);
  }

  this.index = index;
}

function simulate(time) {
  if (!lastTime) {
    lastTime = time;
    return;
  }

  let i, il, particles, particle, pt, constraints, constraint;

  // Aerodynamics forces

  if (wind) {
    let face,
      faces = clothGeometry.faces,
      normal;

    particles = cloth.particles;

    for (i = 0, il = faces.length; i < il; i++) {
      face = faces[i];
      normal = face.normal;

      tmpForce
        .copy(normal)
        .normalize()
        .multiplyScalar(normal.dot(windForce));
      particles[face.a].addForce(tmpForce);
      particles[face.b].addForce(tmpForce);
      particles[face.c].addForce(tmpForce);
    }
  }

  for (particles = cloth.particles, i = 0, il = particles.length; i < il; i++) {
    particle = particles[i];
    particle.addForce(gravity);

    particle.integrate(TIMESTEP_SQ);
  }

  // Start Constraints

  constraints = cloth.constraints;
  il = constraints.length;

  for (i = 0; i < il; i++) {
    constraint = constraints[i];
    satisfyConstraints(constraint[0], constraint[1], constraint[2]);
  }

  // Ball Constraints

  ballPosition.z = -Math.sin(Date.now() / 600) * 90; // + 40;
  ballPosition.x = Math.cos(Date.now() / 400) * 70;

  // for (i = 0, il = pins.length - 1; i < il; i++) {
  //   let xy = pins[i];
  //   let p = particles[xy];

  //   // console.log('what is xy?', p);
  //   p.position.copy(p.original);
  //   p.previous.copy(p.original);
  // }
  let movingPin = particles[pins[pins.length - 1]];
  // movingPin.position.copy(spherePosition);
  movingPin.position.set(rightWrist.x, rightWrist.y, 0);
  // let target = new THREE.Vector3(rightWrist.x, rightWrist.y, 0);
  // let target2 = new THREE.Vector3(leftWrist.x, leftWrist.y, 0);
  // movingPin.position.lerp(target, 0.2);
  let movingLeftPin = particles[pins[0]];
  movingLeftPin.position.set(leftWrist.x, leftWrist.y, 0);
  // movingLeftPin.position.lerp(target2, 0.2);

  // console.log('MOVING PIN', movingPin.position);
  // mouse constraint?
}

/* ---------------------------------------------END CLOTH HELPERS---- */

// let material = new THREE.MeshPhongMaterial({color: 0x22ffcc});

// expect hands as an object:
/*
hands = {
  left: {x: float, y: float},
  right: {x: float, y: float}
};
*/
export function clothController(hands) {}
// set up the cloth
let loader = new THREE.TextureLoader();
let clothTexture = loader.load(fabricImg);
clothTexture.anisotropy = 16;
let clothMaterial = new THREE.MeshLambertMaterial({
  map: clothTexture,
  side: THREE.DoubleSide,
  alphaTest: 0.5,
  // color: 0x00ffcc,
});

// let clothMaterial = new THREE.MeshBasicMaterial(0x00ffcc);
let clothGeometry = new THREE.ParametricGeometry(
  clothFunction,
  cloth.w,
  cloth.h
);
// set up the cloth mesh
let clothMesh = new THREE.Mesh(clothGeometry, clothMaterial);
clothMesh.position.set(0, 0, 0);
scene.add(clothMesh);
clothMesh.customDepthMaterial = new THREE.MeshDepthMaterial({
  depthPacking: THREE.RGBADepthPacking,
  map: clothTexture,
  alphaTest: 0.5,
});

// set up wind
// let windForce = new THREE.Vector3(0, 0, 0);

export function animateCloth() {
  // raycaster to get mouse into scene
  raycaster.setFromCamera(mouse, camera);
  // console.log(raycaster);
  // simulate wind
  let time = Date.now();
  let windStrength = Math.sin(time / 10000) * 40;
  windForce.set(
    Math.sin(time / 2000),
    Math.cos(time / 3000),
    Math.sin(time / 1000)
  );
  // console.log('animating cloth?');
  windForce.normalize();
  windForce.multiplyScalar(windStrength);
  simulate(time);

  render();
}
// send to the scene
function render() {
  let p = cloth.particles;
  for (let i = 0; i < p.length; i++) {
    // update the cloth geometry to the new particle locations
    clothGeometry.vertices[i].copy(p[i].position);
  }
  // console.log(cloth.particles[119].position, cloth.particles.length);
  clothGeometry.verticesNeedUpdate = true;
  clothGeometry.computeFaceNormals();
  clothGeometry.computeVertexNormals();
  // camera.lookAt(cloth.particles[0].position);
  // now send to renderer
  // renderer.render(scene, camera);
  composer.render(clock.getDelta());
}
