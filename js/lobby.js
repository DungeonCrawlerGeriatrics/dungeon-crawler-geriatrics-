// ============================================================
//  LOBBY LOGIC
// ============================================================
import { db, ref, set, get, push, onValue, serverTimestamp }
  from "./firebase-config.js";

// ── Ambient particle canvas ──────────────────────────────────
(function initParticles() {
  const canvas = document.getElementById("particle-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  let W, H, particles = [];

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener("resize", resize);

  for (let i = 0; i < 55; i++) {
    particles.push({
      x: Math.random() * 1920,
      y: Math.random() * 1080,
      r: Math.random() * 1.5 + 0.3,
      dx: (Math.random() - 0.5) * 0.25,
      dy: -Math.random() * 0.5 - 0.1,
      a: Math.random(),
    });
  }

  function frame() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => {
      p.x += p.dx; p.y += p.dy;
      p.a += 0.005;
      if (p.y < -4) { p.y = H + 4; p.x = Math.random() * W; }
      const alpha = (Math.sin(p.a) * 0.5 + 0.5) * 0.6;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(201,168,76,${alpha})`;
      ctx.fill();
    });
    requestAnimationFrame(frame);
  }
  frame();
})();

// ── Helpers ──────────────────────────────────────────────────
function genCode(len = 5) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < len; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function showError(msg) {
  const el = document.getElementById("error-toast");
  el.textContent = msg;
  setTimeout(() => { if (el.textContent === msg) el.textContent = ""; }, 4000);
}

function saveSelf(data) {
  sessionStorage.setItem("dungeon_player", JSON.stringify(data));
}

// ── Create Room ──────────────────────────────────────────────
window.createRoom = async function () {
  const name       = document.getElementById("host-name").value.trim();
  const campaignRaw = document.getElementById("campaign-name").value.trim();
  const campaign   = campaignRaw || "The Dungeon of Eternal Shadows";

  if (!name) { showError("⚠ Enter your name before forging a campaign."); return; }

  const btn = document.getElementById("btn-create");
  btn.disabled = true;
  btn.textContent = "Forging...";

  const roomCode = genCode();
  const playerId = genCode(8);

  const roomData = {
    code:      roomCode,
    campaign,
    status:    "lobby",        // lobby → heroselect → playing → ended
    createdAt: Date.now(),
    hostId:    playerId,
    depth:     1,
    location:  "The Gates of Shadow",
    turnIndex: 0,
    turnCount: 0,
    roundCount: 1,
    inventory: {
      healingPotion: 4,
      torch: 6,
      mapFragment: 1,
      goldCoins: 20,
    },
    players: {
      [playerId]: {
        id:       playerId,
        name,
        isHost:   true,
        joinedAt: Date.now(),
        heroClass: null,
        online:   true,
      }
    },
    log: {}
  };

  try {
    await set(ref(db, `rooms/${roomCode}`), roomData);
    saveSelf({ id: playerId, name, roomCode, isHost: true });
    window.location.href = `heroselect.html?room=${roomCode}`;
  } catch (err) {
    console.error(err);
    showError("⚠ Could not create room. Check Firebase config.");
    btn.disabled = false;
    btn.textContent = "🏰 Create Campaign";
  }
};

// ── Join Room ─────────────────────────────────────────────────
window.joinRoom = async function () {
  const name     = document.getElementById("join-name").value.trim();
  const code     = document.getElementById("room-code").value.trim().toUpperCase();

  if (!name) { showError("⚠ Enter your name before joining."); return; }
  if (code.length < 4) { showError("⚠ Enter the room code your host shared."); return; }

  const btn = document.getElementById("btn-join");
  btn.disabled = true;
  btn.textContent = "Entering...";

  try {
    const snap = await get(ref(db, `rooms/${code}`));
    if (!snap.exists()) {
      showError("⚠ Room not found. Check the code and try again.");
      btn.disabled = false;
      btn.textContent = "🚪 Enter the Dungeon";
      return;
    }

    const room = snap.val();
    if (room.status === "playing" || room.status === "ended") {
      showError("⚠ This campaign is already underway.");
      btn.disabled = false;
      btn.textContent = "🚪 Enter the Dungeon";
      return;
    }

    const playerCount = Object.keys(room.players || {}).length;
    if (playerCount >= 4) {
      showError("⚠ This party is already full (4/4 heroes).");
      btn.disabled = false;
      btn.textContent = "🚪 Enter the Dungeon";
      return;
    }

    const playerId = genCode(8);
    const playerData = {
      id: playerId,
      name,
      isHost: false,
      joinedAt: Date.now(),
      heroClass: null,
      online: true,
    };

    await set(ref(db, `rooms/${code}/players/${playerId}`), playerData);
    saveSelf({ id: playerId, name, roomCode: code, isHost: false });
    window.location.href = `heroselect.html?room=${code}`;

  } catch (err) {
    console.error(err);
    showError("⚠ Could not join room. Check Firebase config.");
    btn.disabled = false;
    btn.textContent = "🚪 Enter the Dungeon";
  }
};

// ── Online count (placeholder) ────────────────────────────────
document.getElementById("online-count").textContent = "Ready to adventure";
