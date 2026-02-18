import * as THREE from 'three';

const video = document.getElementById("camera");
let rainbowSlots = [];
const rainbowColors = [
    0xff0000,0xff7f00,0xffff00,
    0x00ff00,0x00bbff,0x0000ff,0x9400d3
  ];
navigator.mediaDevices.getUserMedia({
  video: { facingMode: "environment" }
})
.then(stream => video.srcObject = stream)
.catch(() => alert("Нет доступа к камере"));

const scene = new THREE.Scene();
const aspect = window.innerWidth / window.innerHeight;
const frustumSize = 10;

const camera = new THREE.OrthographicCamera(
  frustumSize * aspect / -2,
  frustumSize * aspect / 2,
  frustumSize / 2,
  frustumSize / -2,
  0.1,
  1000
);
camera.position.z = 10;
const renderer = new THREE.WebGLRenderer({ alpha:true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.domElement.style.position = "fixed";
renderer.domElement.style.top = "0";
renderer.domElement.style.left = "0";
document.body.appendChild(renderer.domElement);


const raycaster = new THREE.Raycaster();
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

renderer.domElement.addEventListener("pointerdown", event => {

  event.preventDefault();

  const rect = renderer.domElement.getBoundingClientRect();

  const mouseX = (event.clientX - rect.left) / rect.width;
  const mouseY = (event.clientY - rect.top) / rect.height;

  const worldX = camera.left + mouseX * (camera.right - camera.left);
  const worldY = camera.top - mouseY * (camera.top - camera.bottom);

  raycaster.setFromCamera(
    new THREE.Vector2(
      mouseX * 2 - 1,
      -(mouseY * 2 - 1)
    ),
    camera
  );

  const intersects = raycaster.intersectObjects(objects);

  if (intersects.length > 0) {
    const obj = intersects[0].object;

    if (obj.userData.draggable) {
      draggable = obj;
      renderer.domElement.setPointerCapture(event.pointerId);
    }
    else if (obj.userData.correct) {
      correctSound.play();
      nextLevel();
    }
    else {
      wrongSound.play();
    }
  }
});

renderer.domElement.addEventListener("pointermove", event => {
  if (!draggable) return;

  const rect = renderer.domElement.getBoundingClientRect();

  const mouseX = (event.clientX - rect.left) / rect.width;
  const mouseY = (event.clientY - rect.top) / rect.height;

  const worldX = camera.left + mouseX * (camera.right - camera.left);
  const worldY = camera.top - mouseY * (camera.top - camera.bottom);

  draggable.position.x = worldX;
  draggable.position.y = worldY;
});

renderer.domElement.addEventListener("pointerup", event => {
  if (!draggable) return;
  rainbowSlots.forEach(slot => {
  const dist = Math.abs(draggable.position.x - slot.x);
  if (dist < 0.5 && !slot.filledBy) {
      draggable.position.x = slot.x;
      draggable.position.y = slot.y;
      slot.filledBy = draggable;
    }
  else if (dist >= 0.5 && slot.filledBy == draggable) {slot.filledBy = null;}
  });
  checkRainbow();

  draggable = null;
  renderer.domElement.releasePointerCapture(event.pointerId);
});

renderer.domElement.addEventListener("pointercancel", () => {
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
  document.getElementById("question").innerText= "Составьте правильный порядок радуги";

  rainbowSlots = [];
  for (let i = 0; i < 7; i++) {
    const slotX = -3 + i;
    rainbowSlots.push({
      x: slotX,
      y: -2,
      filledBy: null
    });
  const slotGeo = new THREE.CircleGeometry(0.45, 32);
  const slotMat = new THREE.MeshBasicMaterial({color: 0xffffff, wireframe: true});
  const slotMesh = new THREE.Mesh(slotGeo, slotMat);
  slotMesh.position.set(slotX, -2, 0);
  scene.add(slotMesh);
  objects.push(slotMesh);
  }
  rainbowColors.forEach((color,i)=>{
    const geo = new THREE.SphereGeometry(0.4);
    const mat = new THREE.MeshBasicMaterial({color});
    const sphere = new THREE.Mesh(geo,mat);
    sphere.position.set((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 2 + 1, 0);
    sphere.userData.draggable = true;
    sphere.userData.colorValue = color;
    scene.add(sphere);
    objects.push(sphere);
  });
}

function checkRainbow(){
  const filledSlots = rainbowSlots.filter(s => s.filledBy !== null);
  if (filledSlots.length != 7) return;
  let correct = true;
  for (let i = 0; i < 7; i++) {
    if (!rainbowSlots[i].filledBy || rainbowSlots[i].filledBy.userData.colorValue !== rainbowColors[i]) {
      correct = false;
      break;
    }
  }
  if (correct) {
    correctSound.play();
    setTimeout(()=>nextLevel(),1000);
  } else {
    wrongSound.play();
  }
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

      plane.position.set((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 4, 0);
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
