// ==== THREE.JS SETUP ====
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(75, 1920 / 1080, 0.1, 5000);
camera.position.set(0, 50, 200);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(1920, 1080);
document.body.appendChild(renderer.domElement);

const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(0, 100, 100);
scene.add(light);

// ==== PLAYER ====
const playerGeom = new THREE.BoxGeometry(20, 20, 20);
const playerMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
const player = new THREE.Mesh(playerGeom, playerMat);
player.position.set(0, 50, 0);
scene.add(player);

let keys = {};
document.addEventListener("keydown", e => keys[e.key] = true);
document.addEventListener("keyup", e => keys[e.key] = false);

// ==== GAME STATE ====
let obstacles = [];
let bombs = [];
let explosions = [];
let frame = 0;
let speed = 4;
let score = 0;
let gameOver = false;

const scoreDisplay = document.getElementById("scoreDisplay");
const restartBtn = document.getElementById("restartBtn");
restartBtn.addEventListener("click", () => location.reload());

// ==== SPAWN FUNCTIONS ====
function spawnObstacle() {
  const gapWidth = 200;
  const gapX = (Math.random() - 0.5) * 1000;

  const leftGeom = new THREE.BoxGeometry(500, 20, 20);
  const leftMat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
  const left = new THREE.Mesh(leftGeom, leftMat);
  left.position.set(gapX - gapWidth / 2 - 250, 50, camera.position.z + 1000);
  scene.add(left);
  obstacles.push(left);

  const rightGeom = new THREE.BoxGeometry(500, 20, 20);
  const rightMat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
  const right = new THREE.Mesh(rightGeom, rightMat);
  right.position.set(gapX + gapWidth / 2 + 250, 50, camera.position.z + 1000);
  scene.add(right);
  obstacles.push(right);
}

function spawnBomb() {
  const bombGeom = new THREE.SphereGeometry(15, 16, 16);
  const bombMat = new THREE.MeshStandardMaterial({ color: 0xffa500 });
  const bomb = new THREE.Mesh(bombGeom, bombMat);
  bomb.position.set((Math.random() - 0.5) * 1000, 50, camera.position.z + 1200);
  bomb.userData = { warning: 30 };
  scene.add(bomb);
  bombs.push(bomb);
}

function createExplosion(x, y, z) {
  for (let i = 0; i < 20; i++) {
    explosions.push({
      geom: new THREE.SphereGeometry(Math.random() * 5 + 2, 8, 8),
      mat: new THREE.MeshStandardMaterial({ color: 0xff6600 }),
      x: x, y: y, z: z,
      velX: (Math.random() - 0.5) * 8,
      velY: (Math.random() - 0.5) * 8,
      velZ: (Math.random() - 0.5) * 8,
      alpha: 1
    });
  }
}

// ==== UPDATE LOGIC ====
function update() {
  frame++;
  score++;
  scoreDisplay.textContent = "Score: " + score;

  // Player movement
  if (keys["ArrowLeft"]) player.position.x -= 10;
  if (keys["ArrowRight"]) player.position.x += 10;
  player.position.x = Math.max(Math.min(player.position.x, 960), -960);

  speed += 0.002;

  // Spawn obstacles & bombs
  if (frame % 60 === 0) spawnObstacle();
  if (frame % 180 === 0) spawnBomb();

  // Move obstacles
  for (let obs of obstacles) {
    obs.position.z -= speed;
    if (player.position.distanceTo(obs.position) < 25) gameOver = true;
  }
  obstacles = obstacles.filter(o => o.position.z > camera.position.z - 200);

  // Move bombs
  for (let bomb of bombs) {
    if (bomb.userData.warning > 0) bomb.userData.warning--;
    else bomb.position.z -= speed;

    if (bomb.userData.warning <= 0 && player.position.distanceTo(bomb.position) < 25) {
      createExplosion(player.position.x, player.position.y, player.position.z);
      gameOver = true;
    }

    bomb.material.color.set(bomb.userData.warning > 0 ?
      (Math.floor(frame / 5) % 2 === 0 ? 0xffff00 : 0xff0000) : 0xffa500);
  }
  bombs = bombs.filter(b => b.position.z > camera.position.z - 200);

  // Update explosions
  for (let e of explosions) {
    if (!e.mesh) {
      e.mesh = new THREE.Mesh(e.geom, e.mat);
      e.mesh.position.set(e.x, e.y, e.z);
      scene.add(e.mesh);
    }
    e.mesh.position.x += e.velX;
    e.mesh.position.y += e.velY;
    e.mesh.position.z += e.velZ;
    e.alpha -= 0.02;
    e.mesh.material.transparent = true;
    e.mesh.material.opacity = e.alpha;
  }
  explosions = explosions.filter(e => e.alpha > 0);
}

// ==== RENDER LOOP ====
function animate() {
  if (!gameOver) {
    update();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  } else {
    restartBtn.style.display = "block";
  }
}

animate();
