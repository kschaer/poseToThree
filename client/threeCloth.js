import * as THREE from 'three';
// import {simulate, clothFunction, Cloth} from './cloth.js';
const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setSize(window.innerWidth, window.innerHeight);
const width = window.innerWidth;
const height = window.innerHeight;
// const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
const camera = new THREE.PerspectiveCamera(
  30,
  window.innerWidth / window.innerHeight,
  1,
  10000
);
// camera.position.z = 5;
camera.position.set(1000, 50, 1500);
camera.up = new THREE.Vector3(0, 1, 0);
camera.lookAt(125, 125, 0);

document.getElementById('three').appendChild(renderer.domElement);

// basic ambient and directional lights for testing
scene.add(new THREE.AmbientLight(0x000000));
let light = new THREE.DirectionalLight(0xdfebff);
light.position.set(100, 5, 150);
scene.add(light);

// sphere for debug
let axesHelper = new THREE.AxesHelper(500);
let sphereGeometry = new THREE.SphereGeometry(100);
let sphere = new THREE.Mesh(
  sphereGeometry,
  new THREE.MeshBasicMaterial(0x0ffcc)
);
// sphere.position.set(position);
let planeGeometry = new THREE.PlaneGeometry(500, 500);
let material = new THREE.MeshBasicMaterial({
  color: 0xffff00,
  side: THREE.DoubleSide,
});
let debugPlane = new THREE.Mesh(planeGeometry, material);
scene.add(debugPlane);
scene.add(sphere);
scene.add(axesHelper);

// mouse listener and raycaster to get mouse position into scene
const raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();
// let spherePosition = new THREE.Vector3();
let mousePos;
function onMouseMove(event) {
  mouse.x = (event.clientX / width) * 2 - 1;
  mouse.y = (event.clientY / height) * 2 + 1;
  // spherePosition.set()

  let vector = new THREE.Vector3(mouse.x, mouse.y, 0.5);
  vector.unproject(camera);
  let mouseDir = vector.sub(camera.position).normalize();
  let mouseDist = -camera.position.z / mouseDir.z;
  mousePos = camera.position.clone().add(mouseDir.multiplyScalar(mouseDist));
  sphere.position.set(-mousePos.x, mousePos.y, 0);

  // clothMesh.position.copy(pos);
  // console.log(mouse.x, mouse.y);
  console.log('FIRINGMOUSEEVENT', sphere.position);
}
window.addEventListener('mousemove', onMouseMove, false);

/* --------------------------------------------START CLOTH HELPERS----- */
let DAMPING = 0.03;
let DRAG = 1 - DAMPING;
let MASS = 0.1;
let restDistance = 25;

let xSegs = 10;
let ySegs = 10;

let clothFunction = plane(restDistance * xSegs, restDistance * ySegs);

let cloth = new Cloth(xSegs, ySegs);

let GRAVITY = 981 * 1.4;
let gravity = new THREE.Vector3(0, -GRAVITY, 0).multiplyScalar(MASS);

let TIMESTEP = 18 / 1000;
let TIMESTEP_SQ = TIMESTEP * TIMESTEP;
// **************  INITIAL PINS- */
let pins = [0, cloth.w];

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
  /*
  if (sphere.visible) {
    for (
      particles = cloth.particles, i = 0, il = particles.length;
      i < il;
      i++
    ) {
      particle = particles[i];
      let pos = particle.position;
      diff.subVectors(pos, ballPosition);
      if (diff.length() < ballSize) {
        // collided
        diff.normalize().multiplyScalar(ballSize);
        pos.copy(ballPosition).add(diff);
      }
    }
  }*/

  // Floor Constraints

  // for (particles = cloth.particles, i = 0, il = particles.length; i < il; i++) {
  //   particle = particles[i];
  //   pos = particle.position;
  //   if (pos.y < -250) {
  //     pos.y = -250;
  //   }
  // }

  // Pin Constraints

  for (i = 0, il = pins.length; i < il; i++) {
    let xy = pins[i];
    let p = particles[xy];

    // console.log('what is xy?', p);
    p.position.copy(p.original);
    p.previous.copy(p.original);
  }
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
let clothTexture = loader.load('./circuit_pattern.png');
clothTexture.anisotropy = 16;
let clothMaterial = new THREE.MeshLambertMaterial({
  // map: clothTexture,
  side: THREE.DoubleSide,
  // alphaTest: 0.5,
  color: 0x00ffcc,
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
  let windStrength = Math.sin(time / 10000) * 20;
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
  console.log(cloth.particles[0].position);
  // now send to renderer
  renderer.render(scene, camera);
}