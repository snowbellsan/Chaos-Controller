// Chaos Controller - Lorenz Attractor - Fixed Highlight
let x = 0.01, y = 0, z = 0;
let sigma = 10, rho = 28, beta = 8 / 3;
let dt = 0.01;
let points = [];
let zoom = 1.0;
let stepsPerFrame = 3;
let timerSelect, resetButton;
let startTime = 0;
let running = true;
let timeLimit = 60000; // 1 minute default

let hueOffset = 0;

function setup() {
  let canvas = createCanvas(
    windowWidth * (windowWidth > 768 ? 0.66 : 1),
    windowHeight,
    WEBGL
  );
  canvas.parent("canvas-container");
  colorMode(HSB, 360, 255, 255);
  frameRate(60);
  noFill();
  strokeWeight(1.5);

  createControl("σ (Sigma)", 5, 20, sigma, 0.1, v => sigma = v, true);
  createControl("ρ (Rho)", 5, 40, rho, 0.1, v => rho = v, true);
  createControl("β (Beta)", 1, 5, beta, 0.01, v => beta = v, true);
  createControl("Speed", 1, 10, stepsPerFrame, 1, v => stepsPerFrame = v, false);

  createTimerControl();

  resetButton = createButton("Reset Drawing");
  resetButton.parent("controls");
  resetButton.class("reset-button action-button mt-3");
  resetButton.mousePressed(resetSimulation);

  startTime = millis();
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

function createControl(label, min, max, value, step, onChange, shouldReset = true) {
  let container = createDiv().parent("controls");
  container.class("flex flex-col");

  let labelEl = createP(`${label}: ${value.toFixed(step < 0.1 ? 2 : 1)}`)
    .parent(container)
    .class("text-gray-300 text-sm");

  let slider = createSlider(min, max, value, step)
    .parent(container)
    .class("w-full accent-pink-400");

  slider.input(() => {
    let val = slider.value();
    onChange(val);
    labelEl.html(`${label}: ${val.toFixed(step < 0.1 ? 2 : 1)}`);
    if (shouldReset) resetSimulation();
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

  /* ---------- TRAJECTORY ---------- */
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

  /* ---------- CURRENT POINT (fixed) ---------- */
  if (points.length > 0) {
    let latest = points[points.length - 1];

    push();
    // Apply **exactly the same transforms** as the line
    rotateX(-PI / 6);
    scale(8 * zoom);
    translate(0, 0, -30);
    translate(latest.x, latest.y, latest.z);

    noFill();
    stroke(0, 255, 255);   // cyan
    strokeWeight(3);
    sphere(1.0);
    pop();
  }

  updateTimerDisplayInCanvas();
}

function updateTimerDisplay(text) {
  const el = document.getElementById('timer-display');
  if (el) el.innerText = text;
}
function updateTimerDisplayInCanvas() { /* removed duplicate canvas timer */ }

function mouseWheel(event) {
  zoom -= event.delta * 0.001;
  zoom = constrain(zoom, 0.5, 3.0);
  return false;
}

/* optional pinch-zoom for mobile */
function touchMoved() {
  if (touches.length === 2) {
    let d = dist(touches[0].x, touches[0].y, touches[1].x, touches[1].y);
    let pd = dist(touches[0].winX - pmouseX, touches[0].winY - pmouseY,
                  touches[1].winX - pmouseX, touches[1].winY - pmouseY);
    if (pd !== 0) {
      zoom += (d - pd) * 0.001;
      zoom = constrain(zoom, 0.5, 3.0);
    }
  }
  return false;
}

function windowResized() {
  let w = windowWidth * (windowWidth > 768 ? 0.66 : 1);
  resizeCanvas(w, windowHeight);
}