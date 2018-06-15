import * as THREE from 'three';
const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer();
const width = window.innerWidth;
const height = window.innerHeight;
const camera = new THREE.PerspectiveCamera( 75, width / height, .1, 1000);
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

renderer.setSize(window.innerWidth, window.innerHeight);
// document.body.appendChild(renderer.domElement);
document.getElementById('three').appendChild(renderer.domElement);
let geometry = new THREE.BoxGeometry(2, 2, 2);
let material = new THREE.MeshBasicMaterial({color: 0x00ff00});
let cube = new THREE.Mesh(geometry, material);
scene.add(cube);
camera.position.z = 5;

function onMouseMove(event) {
  mouse.x = ( event.clientX / width ) * 2 - 1;
  mouse.y = ( event.clientY / height ) * 2 + 1;
  console.log(mouse.x, mouse.y);
}
window.addEventListener('mousemove', onMouseMove, false);
export function animate() {
  // requestAnimationFrame(animate);
  raycaster.setFromCamera(mouse, camera);
  let intersects = raycaster.intersectObjects(scene.children);
  for (let i = 0; i < intersects.length; i++) {
    intersects[i].object.material.color.set(0xff0000);
  }
  cube.rotation.x += 0.01;
  cube.rotation.y += 0.01;
  renderer.render(scene, camera);
}
// animate();
