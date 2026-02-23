import * as THREE from 'three';
import { ARButton } from 'three/addons/webxr/ARButton.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

let scene, camera, renderer, controller;
let reticle;
let hitTestSource = null;
let hitTestSourceRequested = false;

let gameAnchor = null;
let objects = [];
let activePuzzle = null;
let puzzleTriggerObject = null;

let draggable = null;
let rainbowSlots = [];
let rainbowStep = 0;
let level3Objects = [];

let rainbowParticles = [];

const loaderGLTF = new GLTFLoader();

const rainbowColors = [
  0xff0000,0xff7f00,0xffff00,
  0x00ff00,0x00bbff,0x0000ff,0x9400d3
];

const correctSound = new Audio("sounds/correct.mp3");
const wrongSound = new Audio("sounds/wrong.mp3");

let puzzles = [
  { id:1, color:0xff0000, x:-0.3 },
  { id:2, color:0x00ff00, x:0 },
  { id:3, color:0x0000ff, x:0.3 }
];

init();
animate();

function init() {

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(70, window.innerWidth/window.innerHeight, 0.01, 20);

  renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  document.body.appendChild(renderer.domElement);

  document.body.appendChild(
    ARButton.createButton(renderer, { requiredFeatures:['hit-test'] })
  );

  const light = new THREE.HemisphereLight(0xffffff,0xbbbbff,1);
  scene.add(light);

  controller = renderer.xr.getController(0);
  controller.addEventListener("select", onSelect);
  controller.addEventListener("selectstart", onSelectStart);
  controller.addEventListener("selectend", onSelectEnd);
  scene.add(controller);

  const geo = new THREE.RingGeometry(0.08,0.1,32);
  geo.rotateX(-Math.PI/2);
  reticle = new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color:0x00ff00}));
  reticle.matrixAutoUpdate=false;
  reticle.visible=false;
  scene.add(reticle);
}

function animate(){
  renderer.setAnimationLoop(render);
}

function render(timestamp, frame){

  if(frame){

    const session = renderer.xr.getSession();
    const refSpace = renderer.xr.getReferenceSpace();

    if(!hitTestSourceRequested){
      session.requestReferenceSpace('viewer').then(space=>{
        session.requestHitTestSource({space}).then(source=>{
          hitTestSource = source;
        });
      });

      session.addEventListener("end",()=>{
        hitTestSourceRequested=false;
        hitTestSource=null;
      });

      hitTestSourceRequested=true;
    }

    if(hitTestSource){
      const hits = frame.getHitTestResults(hitTestSource);
      if(hits.length){
        const pose = hits[0].getPose(refSpace);
        reticle.visible=true;
        reticle.matrix.fromArray(pose.transform.matrix);
      } else {
        reticle.visible=false;
      }
    }
  }

  updateParticles();
  renderer.render(scene,camera);
}

function onSelect(){

  if(!gameAnchor && reticle.visible){
    gameAnchor = new THREE.Group();
    gameAnchor.position.setFromMatrixPosition(reticle.matrix);
    scene.add(gameAnchor);
    loadWorld();
    return;
  }

  if(!gameAnchor) return;

  const raycaster = new THREE.Raycaster();
  const tempMatrix = new THREE.Matrix4();
  tempMatrix.identity().extractRotation(controller.matrixWorld);

  raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
  raycaster.ray.direction.set(0,0,-1).applyMatrix4(tempMatrix);

  const intersects = raycaster.intersectObjects(objects,true);

  if(intersects.length){
    const obj = intersects[0].object;

    if(obj.userData.isPuzzleTrigger && !activePuzzle){
      activePuzzle = obj.userData.puzzleId;
      puzzleTriggerObject = obj;
      clearLevel();

      if(activePuzzle===1) loadLevel1();
      if(activePuzzle===2) loadLevel2();
      if(activePuzzle===3) loadLevel3();
      return;
    }

    if(obj.userData.correct){
      correctSound.play();
      completePuzzle();
    }

    if(obj.userData.parentModel){
      handleLevel3Click(obj.userData.parentModel);
    }

    if(obj.userData.draggable){
      draggable=obj;
    }
  }
}

function onSelectStart(){}
function onSelectEnd(){
  if(draggable){
    checkRainbow();
    draggable=null;
  }
}

function loadWorld(){

  puzzles.forEach(p=>{
    const cube=new THREE.Mesh(
      new THREE.BoxGeometry(0.15,0.15,0.15),
      new THREE.MeshStandardMaterial({color:p.color})
    );
    cube.position.set(p.x,0.15,-0.5);
    cube.userData.isPuzzleTrigger=true;
    cube.userData.puzzleId=p.id;
    gameAnchor.add(cube);
    objects.push(cube);
  });
}

function loadLevel1(){
  document.getElementById("question").innerText="Красный + Синий = ?";
  const answers=[
    {color:0x800080,correct:true},
    {color:0x00ff00,correct:false},
    {color:0xffff00,correct:false}
  ];
  answers.forEach((a,i)=>{
    const cube=new THREE.Mesh(
      new THREE.BoxGeometry(0.12,0.12,0.12),
      new THREE.MeshStandardMaterial({color:a.color})
    );
    cube.position.set((i-1)*0.2,0.15,-0.5);
    cube.userData.correct=a.correct;
    gameAnchor.add(cube);
    objects.push(cube);
  });
}

function loadLevel2(){
  document.getElementById("question").innerText="Соберите радугу";
  rainbowSlots=[];
  rainbowColors.forEach((c,i)=>{
    const slotX=-0.5+i*0.17;
    rainbowSlots.push({x:slotX,color:c,filled:null});
    const sphere=new THREE.Mesh(
      new THREE.SphereGeometry(0.05),
      new THREE.MeshStandardMaterial({color:c})
    );
    sphere.position.set((Math.random()-0.5)*0.6,0.2,-0.4);
    sphere.userData.draggable=true;
    sphere.userData.colorValue=c;
    gameAnchor.add(sphere);
    objects.push(sphere);
  });
}

function checkRainbow(){
  let correct=true;
  rainbowSlots.forEach((slot,i)=>{
    if(!objects.find(o=>o.userData.colorValue===slot.color)){
      correct=false;
    }
  });
  if(correct) completePuzzle();
}

function loadLevel3(){
  document.getElementById("question").innerText="Раскрасьте модели по порядку радуги";
  rainbowStep=0;
  const paths=[
    "assets/strawberry.glb",
    "assets/orange.glb",
    "assets/lemon.glb",
    "assets/cactus.glb",
    "assets/bottle.glb",
    "assets/chair.glb",
    "assets/eggplant.glb"
  ];

  paths.forEach((path,index)=>{
    loaderGLTF.load(path,gltf=>{
      const model=gltf.scene;
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
      model.rotation.z = (Math.random() - 0.5) * 0.4;
      model.userData.colorValue=rainbowColors[index];
      model.userData.colored=false;
      model.traverse(child=>{
        if(child.isMesh){
          child.material=new THREE.MeshStandardMaterial({color:0xffffff});
          child.userData.parentModel=model;
          objects.push(child);
        }
      });
      gameAnchor.add(model);
      objects.push(model)
      level3Objects.push(model);
    });
  });
}

function handleLevel3Click(model){
  if(model.userData.colored) return;
  const expected=rainbowColors[rainbowStep];
  if(model.userData.colorValue!==expected){
    wrongSound.play();
    return;
  }
  model.traverse(c=>{
    if(c.isMesh){
      c.material.color.setHex(expected);
    }
  });
  model.userData.colored=true;
  rainbowStep++;
  correctSound.play();
  if(rainbowStep===level3Objects.length){
    setTimeout(()=>completePuzzle(),800);
  }
}

function completePuzzle(){
  correctSound.play();
  createRainbowExplosion(new THREE.Vector3(0,0.2,-0.5));
  setTimeout(()=>{
    puzzles = puzzles.filter(p => p.id !== activePuzzle);
    puzzleTriggerObject = null;
    activePuzzle=null;
    clearLevel();
    loadWorld();
  },1000);
}

function clearLevel(){
  objects.forEach(o=>gameAnchor.remove(o));
  objects=[];
  level3Objects=[];
  rainbowParticles.forEach(p => scene.remove(p));
  rainbowParticles = [];
}

function createRainbowExplosion(position){
  const geo=new THREE.BufferGeometry();
  const count=200;
  const pos=[];
  const vel=[];
  const col=[];
  for(let i=0;i<count;i++){
    pos.push(position.x,position.y,position.z);
    const angle=Math.random()*Math.PI*2;
    const speed=0.02+Math.random()*0.05;
    vel.push(Math.cos(angle)*speed,Math.random()*0.05,Math.sin(angle)*speed);
    const c=new THREE.Color(rainbowColors[Math.floor(Math.random()*7)]);
    col.push(c.r,c.g,c.b);
  }
  geo.setAttribute("position",new THREE.Float32BufferAttribute(pos,3));
  geo.setAttribute("color",new THREE.Float32BufferAttribute(col,3));
  const mat=new THREE.PointsMaterial({size:0.03,vertexColors:true,transparent:true});
  const points=new THREE.Points(geo,mat);
  points.userData.vel=vel;
  points.userData.life=1;
  scene.add(points);
  rainbowParticles.push(points);
}

function updateParticles(){
  rainbowParticles.forEach((p,i)=>{
    const pos=p.geometry.attributes.position.array;
    const vel=p.userData.vel;
    for(let j=0;j<pos.length;j+=3){
      pos[j]+=vel[j];
      pos[j+1]+=vel[j+1];
      pos[j+2]+=vel[j+2];
    }
    p.geometry.attributes.position.needsUpdate=true;
    p.userData.life-=0.01;
    p.material.opacity=p.userData.life;
    if(p.userData.life<=0){
      scene.remove(p);
      rainbowParticles.splice(i,1);
    }
  });
}