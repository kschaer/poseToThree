import * as THREE from 'three';
const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer({antialias: true});
const width = window.innerWidth;
const height = window.innerHeight;
const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

renderer.setSize(window.innerWidth, window.innerHeight);
// document.body.appendChild(renderer.domElement);
document.getElementById('three').appendChild(renderer.domElement);
let geo = new THREE.BoxGeometry(1, 2, 3);
// let material = new THREE.MeshBasicMaterial({color: 0xccff00});
// let material2 = new THREE.MeshBasicMaterial({color: 0x22ffcc});
let material = new THREE.MeshLambertMaterial({color: 0xccff00});
let material2 = new THREE.MeshPhongMaterial({color: 0x22ffcc});
let cube = new THREE.Mesh(geo, material);
scene.add(cube);
camera.position.z = 5;

function onMouseMove(event) {
  mouse.x = (event.clientX / width) * 2 - 1;
  mouse.y = (event.clientY / height) * 2 + 1;
  // console.log(mouse.x, mouse.y);
}
window.addEventListener('mousemove', onMouseMove, false);

let position = new THREE.Vector3(0, 0, 0);
let sphereGeometry = new THREE.SphereGeometry(1, 26, 26);
let sphere = new THREE.Mesh(sphereGeometry, material2);
// sphere.position.set(position);
scene.add(sphere);
let lightPos = new THREE.Vector3(0, 0, 0);
let light = new THREE.PointLight(0xfffff, 1, 100);
light.position.set(0, 0, 0);
scene.add(light);

export function noseSphere(posX, posY, wristX, wristY) {
  position.set((posX / width) * 2 - 1, (posY / width) * 2 - 1, 5);
  position.unproject(camera);
  let dir = position.sub(camera.position).normalize();
  let distance = -camera.position.z / dir.z;
  let pos = camera.position.clone().add(dir.multiplyScalar(distance));

  lightPos.set((wristX / width) * 2 - 1, (wristY / width) * 2 - 1, 5);
  lightPos.unproject(camera);
  let lightDir = lightPos.sub(camera.position).normalize();
  let distanceLight = -camera.position.z / lightDir.z;
  // multiply the light position vector to make interaction more dramatic
  let interactionMultiplier = 3;
  let posLight = camera.position
    .clone()
    .add(lightDir.multiplyScalar(distanceLight * interactionMultiplier));

  // // console.log('making a sphere at', posX, posY);
  // position.x = (posX / width) * 2 - 1;
  // position.y = (posY / height) * 2 - 1;
  // position.z = 0;
  light.position.set(posLight.x, -posLight.y, 5);
  return sphere.position.set(pos.x, -pos.y, pos.z);
  // console.log('sphere at:', pos);
}
export function animate() {
  // requestAnimationFrame(animate);
  raycaster.setFromCamera(mouse, camera);
  let intersects = raycaster.intersectObjects(scene.children);
  for (let i = 0; i < intersects.length; i++) {
    intersects[i].object.material.color.set(0xff0000);
  }
  // sphere.rotation.x += 2;
  //  console.log('cube', cube.position, 'sphere', sphere.position);
  console.log('light', light.position);
  cube.rotation.x += 0.01;
  cube.rotation.y += 0.01;
  renderer.render(scene, camera);
}
// take dom position and convert into scene position
// let i,
//   line,
//   vertex1,
//   vertex2,
//   material2,
//   p,
//   parameters = [
//     [0.25, 0xff7700, 1, 2],
//     [0.5, 0xff9900, 1, 1],
//     [0.75, 0xffaa00, 0.75, 1],
//     [1, 0xffaa00, 0.5, 1],
//     [1.25, 0x000833, 0.8, 1],
//     [3.0, 0xaaaaaa, 0.75, 2],
//     [3.5, 0xffffff, 0.5, 1],
//     [4.5, 0xffffff, 0.25, 1],
//     [5.5, 0xffffff, 0.125, 1],
//   ];

// function createGeometry() {
//   let myGeometry = new THREE.BufferGeometry();
//   let vertices = [];
//   let vertex = new THREE.Vector3();
//   for (let i = 0; i < 1500; i++) {
//     vertex.x = Math.random() * 2 - 1;
//     vertex.y = Math.random() * 2 - 1;
//     vertex.z = Math.random() * 2 - 1;
//     vertex.normalize();
//     vertex.multiplyScalar(450);
//     vertices.push(vertex.x, vertex.y, vertex.z);
//     vertex.multiplyScalar(Math.random() * 0.09 + 1);
//     vertices.push(vertex.x, vertex.y, vertex.z);
//   }
//   myGeometry.addAttribute(
//     'position',
//     new THREE.Float32BufferAttribute(vertices, 3)
//   );
//   return myGeometry;
// }
// // create the geometry
// let geometry = createGeometry();

// for (let i = 0; i < parameters.length; ++i) {
//   p = parameters[i];
//   material = new THREE.LineBasicMaterial({
//     color: p[1],
//     opacity: p[2],
//     linewidth: p[3],
//   });
//   line = new THREE.LineSegments(geometry, material2);
//   line.scale.x = line.scale.y = line.scale.z = p[0];
//   line.userData.originalScale = p[0];
//   line.updateMatrix();
//   scene.add(line);
// }

// animate();
