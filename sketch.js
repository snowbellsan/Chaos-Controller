// Chaos Controller - Lorenz Attractor - Immediate Update, Timer, Reset
let x = 0.01, y = 0, z = 0;
let sigma = 10, rho = 28, beta = 8 / 3;
let dt = 0.01;
let points = [];
let zoom = 1.0;
let stepsPerFrame = 3;
let sliders = [];
let timerSelect, resetButton;
let startTime = 0;
let running = true;
let timeLimit = 60000;
let hueOffset = 0;

function setup() {
  let canvasWidth = windowWidth > 768 ? windowWidth * 0.66 : windowWidth;
  let canvasHeight = windowWidth > 768 ? windowHeight : windowHeight * 0.5;
  let canvas = createCanvas(canvasWidth, canvasHeight, WEBGL);
  canvas.parent("canvas-container");
  colorMode(HSB, 360, 255, 255);
  frameRate(60);
  noFill();
  strokeWeight(1.5);

  // 🎛 スライダー作成（物理パラメータはリセット、速度はリセットなし）
  sliders.push(createControl("σ (Sigma)", 5, 20, sigma, 0.1, val => sigma = val, true));
  sliders.push(createControl("ρ (Rho)", 5, 40, rho, 0.1, val => rho = val, true));
  sliders.push(createControl("β (Beta)", 1, 5, beta, 0.01, val => beta = val, true));
  sliders.push(createControl("Speed", 1, 10, stepsPerFrame, 1, val => stepsPerFrame = val, false));

  createTimerControl();

  resetButton = createButton("Reset Drawing");
  resetButton.parent("controls");
  resetButton.class("reset-button action-button mt-3");
  resetButton.mousePressed(resetSimulation);

  startTime = millis();
}

function createControl(label, min, max, value, step, onChange, shouldReset = true) {
  let container = createDiv().parent("controls");
  container.class("flex flex-col");

  let labelEl = createP(`${label}: ${value.toFixed(step < 0.1 ? 2 : 1)}`)
    .parent(container)
    .class("text-gray-300 text-sm");

  let slider = createSlider(min, max, value, step)
    .parent(container)
    .class("w-full accent-pink-400")
    .style('cursor', 'pointer');

  slider.input(() => {
    let val = slider.value();
    onChange(val); // 直接反映
    labelEl.html(`${label}: ${val.toFixed(step < 0.1 ? 2 : 1)}`);
    if (shouldReset) resetSimulation(); // 物理パラメータのみリセット
  });

  return slider;
}

function createTimerControl() {
  let container = createDiv().parent("controls");
  container.class("mt-3");
  createP("Timer Duration").parent(container).class("text-gray-300 text-sm mb-1");

  timerSelect = createSelect();
  timerSelect.parent(container);
  timerSelect.class("timer-select w-full");

  const options = [
    { label: "Unlimited", value: 0 },
    { label: "30 sec", value: 30000 },
    { label: "1 min", value: 60000 },
    { label: "2 min", value: 120000 },
    { label: "5 min", value: 300000 },
    { label: "10 min", value: 600000 },
  ];

  options.forEach(opt => timerSelect.option(opt.label, opt.value));
  timerSelect.selected(60000);
  timerSelect.changed(() => {
    timeLimit = int(timerSelect.value());
    resetSimulation();
  });
}

function resetSimulation() {
  x = 0.01; y = 0; z = 0;
  points = [];
  hueOffset = 0;
  startTime = millis();
  running = true;
  updateTimerDisplay("Drawing in progress...");
}

function draw() {
  background(0);
  orbitControl(1, 1, 0.1);

  if (running) {
    let elapsed = millis() - startTime;
    if (timeLimit > 0 && elapsed > timeLimit) {
      running = false;
      updateTimerDisplay(`Drawing completed! (${floor(timeLimit / 1000)}s)`);
    }

    for (let i = 0; i < stepsPerFrame; i++) {
      let dx = sigma * (y - x) * dt;
      let dy = (x * (rho - z) - y) * dt;
      let dz = (x * y - beta * z) * dt;
      x += dx; y += dy; z += dz;

      points.push(createVector(x, y, z));
      hueOffset += 0.5;

      if (abs(x) > 500 || abs(y) > 500 || abs(z) > 500) {
        resetSimulation();
        updateTimerDisplay("Values diverged. Auto-reset.");
        return;
      }
    }

    if (points.length > 6000) points.splice(0, 100);
  }

  push();
  rotateX(-PI / 6);
  scale(8 * zoom);
  translate(0, 0, -30);

  beginShape();
  for (let i = 0; i < points.length; i++) {
    let v = points[i];
    let h = (hueOffset + i * 0.5) % 360;
    stroke(h, 255, 255);
    vertex(v.x, v.y, v.z);
  }
  endShape();
  pop();

  if (points.length > 0) {
    let latest = points[points.length - 1];
    push();
    rotateX(-PI / 6);
    scale(8 * zoom);
    translate(0, 0, -30);
    translate(latest.x, latest.y, latest.z);
    noFill();
    stroke(0, 255, 255);
    strokeWeight(3);
    sphere(1.0);
    pop();
  }
}

function updateTimerDisplay(text) {
  const el = document.getElementById('timer-display');
  if (el) el.innerText = text;
}

function mouseWheel(event) {
  zoom -= event.delta * 0.001;
  zoom = constrain(zoom, 0.5, 3.0);
  return false;
}

function windowResized() {
  let w = windowWidth * (windowWidth > 768 ? 0.66 : 1);
  resizeCanvas(w, windowHeight);
}
