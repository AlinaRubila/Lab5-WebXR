import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const video = document.getElementById("camera");
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
const light = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
scene.add(light);
const renderer = new THREE.WebGLRenderer({ alpha:true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.domElement.style.position = "fixed";
renderer.domElement.style.top = "0";
renderer.domElement.style.left = "0";
document.body.appendChild(renderer.domElement);

let rainbowSlots = [];

const rainbowColors = [
    0xff0000,0xff7f00,0xffff00,
    0x00ff00,0x00bbff,0x0000ff,0x9400d3
  ];
let rainbowStep = 0;
let level3Objects = [];
const loaderGLTF = new GLTFLoader();
 const modelPaths = [
    "assets/strawberry.glb",
    "assets/orange.glb",
    "assets/lemon.glb",
    "assets/cactus.glb",
    "assets/bottle.glb",
    "assets/chair.glb",
    "assets/eggplant.glb"
  ];
const correctSound = new Audio("sounds/correct.mp3");
const wrongSound = new Audio("sounds/wrong.mp3")

const raycaster = new THREE.Raycaster();
let draggable = null;

let objects = [];
let activePuzzle = null;
let puzzleTriggerObject = null; 
let puzzles = [
    { id: 1, color: 0xff0000, x: -4 },
    { id: 2, color: 0x00ff00, x: 0 },
    { id: 3, color: 0x0000ff, x: 4 }
  ];
let floatingObjects = [];

function loadWorld() {
  clearScene();
  if (puzzles.length == 0){
    document.getElementById("levelTitle").innerText = "AR-Квест";
    document.getElementById("question").innerText = "Квест завершён!";
    createRainbowExplosion(new THREE.Vector3(0, 0, 0));
    return;
  }
  document.getElementById("levelTitle").innerText = "AR-Квест";
  document.getElementById("question").innerText = "Найдите и нажмите на объект";
  puzzles.forEach(p => {
    const geo = new THREE.BoxGeometry(1.5,1.5,1.5);
    const mat = new THREE.MeshStandardMaterial({ color: p.color });
    const cube = new THREE.Mesh(geo, mat);
    cube.position.set(p.x, 0, 0);
    cube.userData.isPuzzleTrigger = true;
    cube.userData.puzzleId = p.id;
    scene.add(cube);
    objects.push(cube);
    floatingObjects.push(cube);
  });
}
let particles = [];
let rainbowParticles = [];

function createParticles(position, color = 0xffffff) {
  const count = 80;
  const geometry = new THREE.BufferGeometry();
  const positions = [];
  const velocities = [];
  for (let i = 0; i < count; i++) {
    positions.push(position.x, position.y, position.z);
    velocities.push(
      (Math.random() - 0.5) * 0.2,
      (Math.random() - 0.5) * 0.2,
      (Math.random() - 0.5) * 0.2
    );
  }
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    size: 0.4,
    color: color,
    transparent: true,
    opacity: 1,
    depthWrite: false,
    depthTest: false
  });
  const points = new THREE.Points(geometry, material);
  points.userData.velocities = velocities;
  points.userData.life = 1;
  scene.add(points);
  particles.push(points);
  console.log("Particles created", particles.length);
}
function createRainbowExplosion(position) {
  const count = 300;
  const geometry = new THREE.BufferGeometry();
  const positions = [];
  const velocities = [];
  const colors = [];

  for (let i = 0; i < count; i++) {
    positions.push(position.x, position.y, position.z);
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.05 + Math.random() * 0.15;
    velocities.push(
      Math.cos(angle) * speed,
      Math.sin(angle) * speed,
      (Math.random() - 0.5) * 0.1
    );
    const rainbow = rainbowColors[Math.floor(Math.random() * rainbowColors.length)];
    const color = new THREE.Color(rainbow);
    colors.push(color.r, color.g, color.b);
  }

  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  const material = new THREE.PointsMaterial({
    size: 0.8,
    vertexColors: true,
    transparent: true,
    opacity: 1,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending 
  });

  const points = new THREE.Points(geometry, material);
  points.userData.velocities = velocities;
  points.userData.life = 1;

  scene.add(points);
  rainbowParticles.push(points);
  console.log("RAINBOW EXPLOSION!");
}
function animate() {
  requestAnimationFrame(animate);
  const time = Date.now() * 0.001;
  floatingObjects.forEach((obj, i) => {
    obj.position.y = Math.sin(time + i) * 0.3;
    obj.rotation.y += 0.01;
  });
  level3Objects.forEach(obj => {
  obj.rotation.y += 0.005;});
  particles.forEach((p, index) => {
  const positions = p.geometry.attributes.position.array;
  const velocities = p.userData.velocities;
  for (let i = 0; i < positions.length; i += 3) {
    positions[i]     += velocities[i];
    positions[i + 1] += velocities[i + 1];
    positions[i + 2] += velocities[i + 2];
  }
  p.geometry.attributes.position.needsUpdate = true;
  p.userData.life -= 0.01;
  p.material.opacity = p.userData.life;
  if (p.userData.life <= 0) {
    scene.remove(p);
    particles.splice(index, 1);
  }
});
rainbowParticles.forEach((p, index) => {
  const positions = p.geometry.attributes.position.array;
  const velocities = p.userData.velocities;
  for (let i = 0; i < positions.length; i += 3) {
    positions[i]     += velocities[i];
    positions[i + 1] += velocities[i + 1];
    positions[i + 2] += velocities[i + 2];
    velocities[i + 1] -= 0.003;
  }
  p.geometry.attributes.position.needsUpdate = true;
  p.userData.life -= 0.005;
  p.material.opacity = p.userData.life;
  if (p.userData.life <= 0) {
    scene.remove(p);
    rainbowParticles.splice(index, 1);
  }
});
  renderer.render(scene, camera);
}
animate();

renderer.domElement.addEventListener("pointerdown", event => {

  event.preventDefault();

  const rect = renderer.domElement.getBoundingClientRect();

  const mouseX = (event.clientX - rect.left) / rect.width;
  const mouseY = (event.clientY - rect.top) / rect.height;

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
    if (obj.userData.isPuzzleTrigger && !activePuzzle) {
      puzzleTriggerObject = obj;
      activePuzzle = obj.userData.puzzleId;
      clearScene();
      if (activePuzzle === 1) loadLevel1();
      else if (activePuzzle === 2) loadLevel2();
      else if (activePuzzle === 3) loadLevel3();
      return;
    }
    if (obj.userData.parentModel) {
      const model = obj.userData.parentModel;
      if (!model.userData.level3) return;
      if (model.userData.colored) {
        return;
      }
      const expectedColor = rainbowColors[rainbowStep];
      if (expectedColor != model.userData.colorValue){
        wrongSound.play();
        return;
      }
      model.traverse(child => {
        if (child.isMesh) {
          child.material = child.material.clone();
          child.material.color.setHex(expectedColor);
        }
      });
      model.userData.colored = true;
      rainbowStep++;
      correctSound.play();
      if (rainbowStep === level3Objects.length) {
        setTimeout(() => {
          completePuzzle();
        }, 800);
      }
      return;
    }

    if (obj.userData.draggable) {
      draggable = obj;
      renderer.domElement.setPointerCapture(event.pointerId);
    }
    else if (obj.userData.correct) {
      correctSound.play();
      completePuzzle();
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
  if (dist < 0.3 && !slot.filledBy) {
      draggable.position.x = slot.x;
      draggable.position.y = slot.y;
      slot.filledBy = draggable;
    }
  else if (dist >= 0.3 && slot.filledBy == draggable) {slot.filledBy = null;}
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
  rainbowParticles.forEach(p => scene.remove(p));
  rainbowParticles = [];

  particles.forEach(p => scene.remove(p));
  particles = [];
}

function loadLevel1() {
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
    setTimeout(()=>completePuzzle(),1000);
  } else {
    wrongSound.play();
  }
}
function loadLevel3() {
  document.getElementById("levelTitle").innerText = "Уровень 3";
  document.getElementById("question").innerText = "Нажмите на 3D-модели и раскрасьте их по порядку цветов радуги";
  rainbowStep = 0;
  level3Objects = [];
  modelPaths.forEach((path, index) => {

    loaderGLTF.load(path, gltf => {

      const model = gltf.scene;
      const box = new THREE.Box3().setFromObject(model);
      const size = new THREE.Vector3();
      box.getSize(size);
      const maxDim = Math.max(size.x, size.y, size.z);
      const desiredSize = 1.5;
      const scale = desiredSize / maxDim;
      model.scale.set(scale, scale, scale);
      const rangeX = 6;
      const rangeY = 3;
      model.position.set((Math.random() - 0.5) * rangeX,(Math.random() - 0.5) * rangeY, 0);
      model.rotation.y = Math.random() * Math.PI * 2;
      model.rotation.x = (Math.random() - 0.5) * 0.4;
      model.rotation.z = (Math.random() - 0.5) * 0.4;
      model.userData.level3 = true;
      model.userData.colored = false;
      model.userData.orderIndex = index;
      model.userData.colorValue = rainbowColors[index]

      model.traverse(child => {
        if (child.isMesh) {
          child.material = new THREE.MeshStandardMaterial({color: 0xffffff});
          child.userData.parentModel = model;
          objects.push(child);
        }
      });
      scene.add(model);
      objects.push(model);
      level3Objects.push(model);
    });
  });
}

function completePuzzle() {
  correctSound.play();
  const pos = puzzleTriggerObject.position.clone();
  const color = puzzleTriggerObject.material.color.getHex();
  createParticles(pos, color);
  setTimeout(() => {
    scene.remove(puzzleTriggerObject);
    objects = objects.filter(o => o !== puzzleTriggerObject);
    puzzles = puzzles.filter(p => p.id !== activePuzzle);
    puzzleTriggerObject = null;
    activePuzzle = null;
    loadWorld();
  }, 800);
}

loadWorld();
