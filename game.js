let scene = document.querySelector("a-scene");
let container = document.querySelector("#levelContainer");
let currentLevel = 1;

scene.addEventListener("enter-vr", () => {
  if (scene.is("ar-mode")) {
    console.log("AR started");
    loadLevel1();
  }
});

function clearLevel() {
  container.innerHTML = "";
}

function nextLevel() {
  currentLevel++;
  if (currentLevel === 2) loadLevel2();
  else if (currentLevel === 3) loadLevel3();
  else alert("Квест завершён 🎉");
}

function loadLevel1() {
  clearLevel();
  document.getElementById("question").innerText =
    "Какой цвет получается при смешении красного и синего?";

  const answers = [
    { color: "purple", correct: true, pos: "-0.5 0 -2" },
    { color: "green", correct: false, pos: "0.5 0 -2" },
    { color: "yellow", correct: false, pos: "1.5 0 -2" }
  ];

  answers.forEach(a => {
    let box = document.createElement("a-box");
    box.setAttribute("color", a.color);
    box.setAttribute("position", a.pos);
    box.setAttribute("depth", "0.3");

    box.addEventListener("click", () => {
      if (a.correct) {
        nextLevel();
      } else {
        box.setAttribute("animation",
          "property: rotation; to: 0 360 0; dur: 500");
      }
    });

    container.appendChild(box);
  });
}

function loadLevel2() {
  clearLevel();
  document.getElementById("question").innerText =
    "Нажмите сферы по порядку радуги";

  const colors = ["red","orange","yellow","green","blue","indigo","violet"];
  let index = 0;

  colors.forEach((c, i) => {
    let sphere = document.createElement("a-sphere");
    sphere.setAttribute("color", c);
    sphere.setAttribute("radius", "0.25");
    sphere.setAttribute("position", `${i*0.5-1.5} 0 -2`);

    sphere.addEventListener("click", () => {
      if (colors[index] === c) {
        index++;
        sphere.setAttribute("visible", false);
        if (index === colors.length) nextLevel();
      }
    });

    container.appendChild(sphere);
  });
}

function loadLevel3() {
  clearLevel();
  document.getElementById("question").innerText =
    "Соберите облако";

  for (let i = 0; i < 3; i++) {
    let piece = document.createElement("a-box");
    piece.setAttribute("color", "white");
    piece.setAttribute("position", `${i-1} 0 -2`);
    piece.setAttribute("scale", "0.6 0.4 0.2");

    piece.addEventListener("click", () => {
      piece.object3D.position.x = 0;
    });

    container.appendChild(piece);
  }
}