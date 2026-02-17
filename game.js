let currentLevel = 1;
let container = document.querySelector("#levelContainer");

let correctSound = new Audio("sounds/correct.mp3");
let wrongSound = new Audio("sounds/wrong.mp3");

function clearLevel() {
    container.innerHTML = "";
}

function nextLevel() {
    currentLevel++;
    if (currentLevel === 2) loadLevel2();
    else if (currentLevel === 3) loadLevel3();
    else alert("Поздравляем! Квест завершён 🎉");
}

/* ===============================
   УРОВЕНЬ 1 — Викторина
=================================*/
function loadLevel1() {
    clearLevel();
    document.getElementById("question").innerText =
        "Какой цвет получается при смешении красного и синего?";

    const answers = [
        { color: "purple", correct: true, pos: "-1 0.5 -3" },
        { color: "green", correct: false, pos: "0 0.5 -3" },
        { color: "yellow", correct: false, pos: "1 0.5 -3" }
    ];

    answers.forEach(a => {
        let box = document.createElement("a-box");
        box.setAttribute("color", a.color);
        box.setAttribute("position", a.pos);
        box.setAttribute("depth", "0.5");

        box.addEventListener("click", () => {
            if (a.correct) {
                correctSound.play();
                nextLevel();
            } else {
                wrongSound.play();
                box.setAttribute("animation", 
                    "property: rotation; to: 0 360 0; dur: 500");
            }
        });

        container.appendChild(box);
    });
}

/* ===============================
   УРОВЕНЬ 2 — Радуга
=================================*/
function loadLevel2() {
    clearLevel();
    document.getElementById("question").innerText =
        "Расположите цвета радуги в правильном порядке";

    const colors = ["red","orange","yellow","green","blue","indigo","violet"];
    let shuffled = colors.sort(() => Math.random() - 0.5);

    shuffled.forEach((c, i) => {
        let sphere = document.createElement("a-sphere");
        sphere.setAttribute("color", c);
        sphere.setAttribute("radius", "0.3");
        sphere.setAttribute("position", `${i-3} 0.5 -3`);
        sphere.setAttribute("draggable", true);

        sphere.addEventListener("click", () => {
            sphere.object3D.position.x += 0.5;
        });

        container.appendChild(sphere);
    });

    setTimeout(() => {
        correctSound.play();
        nextLevel();
    }, 10000); // имитация проверки
}

/* ===============================
   УРОВЕНЬ 3 — Паззл облако
=================================*/
function loadLevel3() {
    clearLevel();
    document.getElementById("question").innerText =
        "Соберите облако из частей";

    for (let i = 1; i <= 3; i++) {
        let piece = document.createElement("a-plane");
        piece.setAttribute("src", `assets/cloud${i}.png`);
        piece.setAttribute("position", `${i-2} 1 -3`);
        piece.setAttribute("width", "1");
        piece.setAttribute("height", "1");

        piece.addEventListener("click", () => {
            piece.object3D.position.x = 0;
            piece.object3D.position.y = 1;
        });

        container.appendChild(piece);
    }

    setTimeout(() => {
        correctSound.play();
        alert("Облако собрано ☁");
    }, 10000);
}

loadLevel1();
