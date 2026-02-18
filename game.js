import * as THREE from 'three';

const video = document.getElementById("camera");

navigator.mediaDevices.getUserMedia({
  video: { facingMode: "environment" }
})
.then(stream => video.srcObject = stream)
.catch(() => alert("Нет доступа к камере"));

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  70,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

const renderer = new THREE.WebGLRenderer({ alpha:true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.domElement.style.position = "fixed";
renderer.domElement.style.top = "0";
renderer.domElement.style.left = "0";
document.body.appendChild(renderer.domElement);

camera.position.z = 5;

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let draggable = null;

let currentLevel = 1;
let objects = [];

const correctSound = new Audio("sounds/correct.mp3");
const wrongSound = new Audio("sounds/wrong.mp3")

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();

window.addEventListener("pointerdown", event => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(objects);

  if (intersects.length > 0) {
    const obj = intersects[0].object;

    if (obj.userData.draggable) {
      draggable = obj;
    } else if (obj.userData.correct) {
      correctSound.play();
      nextLevel();
    }
    else if (!obj.userData.correct){
      wrongSound.play();
    }
  }
});

window.addEventListener("pointermove", event => {
  if (!draggable) return;

  const rect = renderer.domElement.getBoundingClientRect();

  const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  const vector = new THREE.Vector3(x, y, 0.5);
  vector.unproject(camera);

  const dir = vector.sub(camera.position).normalize();
  const distance = -camera.position.z / dir.z;

  const pos = camera.position.clone().add(dir.multiplyScalar(distance));

  draggable.position.x = pos.x;
  draggable.position.y = pos.y;
});

window.addEventListener("pointerup", () => {
  draggable = null;
});

function clearScene() {
  objects.forEach(obj => scene.remove(obj));
  objects = [];
}

function loadLevel1() {
  clearScene();
  document.getElementById("question").innerText =
    "Какой цвет получается при смешении красного и синего?";

  const colors = [
    {color:0x800080, correct:true},
    {color:0x00ff00, correct:false},
    {color:0xffff00, correct:false}
  ];

  colors.forEach((c,i) => {
    const geo = new THREE.BoxGeometry();
    const mat = new THREE.MeshBasicMaterial({ color:c.color });
    const cube = new THREE.Mesh(geo, mat);

    cube.position.x = (i-1)*2;
    cube.userData.correct = c.correct;

    scene.add(cube);
    objects.push(cube);
  });
}

function loadLevel2() {
  clearScene();
  document.getElementById("levelTitle").innerText="Уровень 2";
  document.getElementById("question").innerText=
    "Перетащите цвета в правильном порядке";

  const colors = [
    0xff0000,0xff7f00,0xffff00,
    0x00ff00,0x00bbff,0x0000ff,0x9400d3
  ];

  colors.forEach((c,i)=>{
    const geo = new THREE.SphereGeometry(0.4);
    const mat = new THREE.MeshBasicMaterial({color:c});
    const sphere = new THREE.Mesh(geo,mat);

    sphere.position.set((Math.random()*6-3),2-Math.random()*2,0);
    sphere.userData.draggable=true;

    scene.add(sphere);
    objects.push(sphere);
  });

  setTimeout(()=>nextLevel(),15000);
}

function loadLevel3() {
  clearScene();
  document.getElementById("levelTitle").innerText="Уровень 3";
  document.getElementById("question").innerText=
    "Соберите облако";

  const loader = new THREE.TextureLoader();
  const textures = [
    "assets/cloud1.png",
    "assets/cloud2.png",
    "assets/cloud3.png"
  ];

  textures.forEach((path,i)=>{
    loader.load(path, texture=>{
      const geo = new THREE.PlaneGeometry(2,1.5);
      const mat = new THREE.MeshBasicMaterial({
        map:texture,
        transparent:true
      });
      const plane = new THREE.Mesh(geo,mat);

      plane.position.set((i-1)*2,Math.random()*2-1,0);
      plane.userData.draggable=true;

      scene.add(plane);
      objects.push(plane);
    });
  });

  setTimeout(()=>{
    correctSound.play();
    alert("Облако собрано");
  },15000);
}

function nextLevel(){
  currentLevel++;
  if(currentLevel===2) loadLevel2();
  else if(currentLevel===3) loadLevel3();
  else alert("Квест завершён");
}

loadLevel1();
