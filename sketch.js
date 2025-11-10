// Chaos Controller - Lorenz Attractor - Fixed Sliders (Mobile + Desktop)
let x = 0.01, y = 0, z = 0;
let sigma = 10, rho = 28, beta = 8 / 3;
let dt = 0.01;
let points = [];
let zoom = 1.0;
let stepsPerFrame = 3;
let timerSelect, resetButton;
let startTime = 0;
let running = true;
let timeLimit = 60000;
let hueOffset = 0;

// Store references to sliders for custom drag handling
let sliders = [];

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

  // Create controls and store slider references
  sliders.push(createControl("σ (Sigma)", 5, 20, sigma, 0.1, v => sigma = v, true));
  sliders.push(createControl("ρ (Rho)", 5, 40, rho, 0.1, v => rho = v, true));
  sliders.push(createControl("β (Beta)", 1, 5, beta, 0.01, v => beta = v, true));
  sliders.push(createControl("Speed", 1, 10, stepsPerFrame, 1, v => stepsPerFrame = v, false));

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

// Modified to return slider for drag handling
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

  // Store reference
  slider.labelEl = labelEl;
  slider.onChange = onChange;
  slider.shouldReset = shouldReset;

  slider.input(() => {
    let val = slider.value();
    onChange(val);
    labelEl.html(`${label}: ${val.toFixed(step < 0.1 ? 2 : 1)}`);
    if (shouldReset) resetSimulation();
  });

  return slider;
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

// ========== スライダー ドラッグ修正（ここが肝！）==========

let activeSlider = null;

function mousePressed() {
  return checkSliderInteraction(mouseX, mouseY);
}

function touchStarted() {
  let tx = touches[0].x, ty = touches[0].y;
  return checkSliderInteraction(tx, ty);
}

function mouseDragged() {
  if (activeSlider) {
    updateSliderFromMouse(mouseX);
    return false;
  }
}

function touchMoved() {
  if (activeSlider && touches.length > 0) {
    updateSliderFromMouse(touches[0].x);
    return false;
  }
}

function mouseReleased() {
  activeSlider = null;
}

function touchEnded() {
  activeSlider = null;
}

function checkSliderInteraction(x, y) {
  for (let slider of sliders) {
    let elt = slider.elt;
    let rect = elt.getBoundingClientRect();
    if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
      activeSlider = slider;
      updateSliderFromMouse(x);
      return true;
    }
  }
  return false;
}

function updateSliderFromMouse(x) {
  if (!activeSlider) return;
  let elt = activeSlider.elt;
  let rect = elt.getBoundingClientRect();
  let percent = (x - rect.left) / rect.width;
  percent = constrain(percent, 0, 1);
  let val = lerp(activeSlider.min, activeSlider.max, percent);
  val = round(val / activeSlider.step) * activeSlider.step;
  activeSlider.value(val);
  activeSlider.input(); // 手動で input イベント発火
}

// =================================================

function windowResized() {
  let w = windowWidth * (windowWidth > 768 ? 0.66 : 1);
  resizeCanvas(w, windowHeight);
}