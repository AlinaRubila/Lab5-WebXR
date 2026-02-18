const video = document.getElementById("camera");
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let currentLevel = 1;
let objects = [];
let rainbowIndex = 0;

navigator.mediaDevices.getUserMedia({ video: {facingMode: "environment"} })
.then(stream => {
  video.srcObject = stream;
  document.getElementById("question").innerText =
    "Какой цвет получается при смешении красного и синего?";
  loadLevel1();
})
.catch(err => {
  alert("Нет доступа к камере");
});

function draw() {
  ctx.clearRect(0,0,canvas.width,canvas.height);

  objects.forEach(obj => {
    ctx.fillStyle = obj.color;
    ctx.beginPath();
    ctx.arc(obj.x, obj.y, obj.r, 0, Math.PI*2);
    ctx.fill();
  });

  requestAnimationFrame(draw);
}
draw();

canvas.addEventListener("click", e => {
  let rect = canvas.getBoundingClientRect();
  let mx = e.clientX - rect.left;
  let my = e.clientY - rect.top;

  objects.forEach(obj => {
    let dist = Math.hypot(mx-obj.x, my-obj.y);
    if (dist < obj.r) obj.onClick();
  });
});

function loadLevel1() {
  const w = canvas.width;
  const h = canvas.height;

  objects = [
    makeCircle("purple", w*0.3, h*0.6, true),
    makeCircle("green", w*0.5, h*0.6, false),
    makeCircle("yellow", w*0.7, h*0.6, false)
  ];
}

function makeCircle(color, x, y, correct) {
  return {
    color, x, y, r:40,
    onClick: function() {
      if (correct) nextLevel();
    }
  }
}

function loadLevel2() {
  document.getElementById("levelTitle").innerText = "Уровень 2";
  document.getElementById("question").innerText =
    "Нажимайте цвета радуги по порядку";

  const colors = ["red","orange","yellow","green","blue","indigo","violet"];
  rainbowIndex = 0;

  objects = colors.map((c,i) => ({
    color:c,
    x: canvas.width*0.1 + i*(canvas.width*0.1),
    y: canvas.height*0.6,
    r:30,
    onClick:function(){
      if(colors[rainbowIndex]===c){
        this.r=0;
        rainbowIndex++;
        if(rainbowIndex===colors.length) nextLevel();
      }
    }
  }));
}

function loadLevel3() {
  document.getElementById("levelTitle").innerText = "Уровень 3";
  document.getElementById("question").innerText = "Соберите облако";

  objects = [
    makeCircle("white",200,350,false),
    makeCircle("white",350,300,false),
    makeCircle("white",500,350,false)
  ];
}

function nextLevel(){
  currentLevel++;
  if(currentLevel===2) loadLevel2();
  else if(currentLevel===3) loadLevel3();
  else alert("Квест завершён 🎉");
}
