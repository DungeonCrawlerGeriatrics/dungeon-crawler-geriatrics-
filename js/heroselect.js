// ============================================================
//  HERO SELECT LOGIC
// ============================================================
import { db, ref, set, get, onValue, update }
  from "./firebase-config.js";

// ── Class definitions ────────────────────────────────────────
const CLASSES = [
  {
    id: "warrior",
    name: "Ironclad Warrior",
    emoji: "⚔️",
    desc: "Frontline tank who absorbs punishment and protects allies.",
    hp: 120, maxHp: 120,
    mp: 30,  maxMp: 30,
    stats: ["STR 18", "CON 16", "DEX 10"],
    abilities: ["⚔ Power Strike — heavy blow, +2d8 dmg", "🛡 Shield Wall — +4 AC until next turn", "📣 Battle Cry — boost party attack"],
    role: "Tank / Melee DPS",
  },
  {
    id: "mage",
    name: "Arcane Mage",
    emoji: "🔮",
    desc: "Glass-cannon spellcaster with devastating area attacks.",
    hp: 65,  maxHp: 65,
    mp: 120, maxMp: 120,
    stats: ["INT 20", "WIS 14", "CON 8"],
    abilities: ["🔥 Fireball — AoE 8d6 fire dmg", "❄ Ice Lance — single target + slow", "🛡 Arcane Shield — magic barrier"],
    role: "AoE Caster",
  },
  {
    id: "rogue",
    name: "Shadow Rogue",
    emoji: "🗡️",
    desc: "Agile assassin who strikes from the shadows for massive damage.",
    hp: 85,  maxHp: 85,
    mp: 50,  maxMp: 50,
    stats: ["DEX 20", "CHA 14", "STR 12"],
    abilities: ["🗡 Backstab — 6d6 sneak attack dmg", "👻 Vanish — become invisible 1 round", "☠ Poison Blade — DoT 2d4/turn"],
    role: "Burst DPS / Stealth",
  },
  {
    id: "paladin",
    name: "Holy Paladin",
    emoji: "🛡️",
    desc: "Divine champion who heals allies and smites evil with holy power.",
    hp: 100, maxHp: 100,
    mp: 80,  maxMp: 80,
    stats: ["STR 15", "CHA 18", "WIS 16"],
    abilities: ["⚡ Holy Smite — 4d8 radiant + stun", "✨ Lay on Hands — heal 3d8 HP", "🔆 Divine Shield — immune 1 round"],
    role: "Support / Healer",
  },
];

// ── State ────────────────────────────────────────────────────
const params   = new URLSearchParams(window.location.search);
const roomCode = params.get("room");
const me       = JSON.parse(sessionStorage.getItem("dungeon_player") || "null");

if (!roomCode || !me) {
  window.location.href = "index.html";
}

let roomData   = null;
let myClass    = null;

// ── Init UI ──────────────────────────────────────────────────
document.getElementById("display-room-code").textContent = roomCode;

window.copyRoomCode = function () {
  navigator.clipboard?.writeText(roomCode).catch(() => {});
  showToast("Room code copied!", false);
};

buildHeroGrid();

// ── Firebase listener ─────────────────────────────────────────
onValue(ref(db, `rooms/${roomCode}`), snap => {
  if (!snap.exists()) { window.location.href = "index.html"; return; }
  roomData = snap.val();

  document.getElementById("campaign-title").textContent = roomData.campaign || roomCode;

  renderPlayerPips();
  renderRoster();
  updateHeroGrid();
  checkReady();

  // Follow host to game
  if (roomData.status === "playing" && !me.isHost) {
    window.location.href = `game.html?room=${roomCode}`;
  }
});

// ── Build grid ───────────────────────────────────────────────
function buildHeroGrid() {
  const grid = document.getElementById("hero-grid");
  grid.innerHTML = CLASSES.map(cls => `
    <div class="hero-card ${cls.id}-card" id="hcard-${cls.id}" onclick="pickHero('${cls.id}')">
      <div class="card-class-badge">${cls.role}</div>
      <div class="hero-avatar-lg">${cls.emoji}</div>
      <div class="hero-card-name">${cls.name}</div>
      <div class="hero-card-desc">${cls.desc}</div>

      <div class="hero-stats">
        ${cls.stats.map(s => `<div class="hero-stat-pill">${s}</div>`).join("")}
      </div>

      <div class="bar-label-sm"><span>HP</span><span>${cls.hp}</span></div>
      <div class="bar-track" style="margin-bottom:0.4rem">
        <div class="bar-fill hp-high" style="width:${(cls.hp/120)*100}%"></div>
      </div>
      <div class="bar-label-sm"><span>MP</span><span>${cls.mp}</span></div>
      <div class="bar-track" style="margin-bottom:0.75rem">
        <div class="bar-fill mp" style="width:${(cls.mp/120)*100}%"></div>
      </div>

      <div class="hero-abilities">
        ${cls.abilities.map(a => `<div class="hero-ability">${a}</div>`).join("")}
      </div>

      <div class="hero-card-footer" id="hcard-footer-${cls.id}">Click to choose</div>
    </div>
  `).join("");
}

// ── Pick a hero ───────────────────────────────────────────────
window.pickHero = async function (classId) {
  if (!roomData) return;

  // Already taken?
  const taken = Object.values(roomData.players || {}).find(p => p.heroClass === classId && p.id !== me.id);
  if (taken) { showToast(`${taken.name} already chose this hero!`, true); return; }

  // Deselect current
  if (myClass) {
    document.getElementById(`hcard-${myClass}`)?.classList.remove("selected", "my-pick");
    document.getElementById(`hcard-footer-${myClass}`).textContent = "Click to choose";
  }

  myClass = classId;
  const cls = CLASSES.find(c => c.id === classId);

  // Update Firebase
  await update(ref(db, `rooms/${roomCode}/players/${me.id}`), {
    heroClass:   classId,
    heroEmoji:   cls.emoji,
    heroName:    cls.name,
    hp:          cls.hp,
    maxHp:       cls.maxHp,
    mp:          cls.mp,
    maxMp:       cls.maxMp,
    stats:       cls.stats,
    abilities:   cls.abilities,
    statuses:    [],
  });

  showToast(`${cls.emoji} ${cls.name} chosen!`, false);
};

// ── Update grid styling based on room state ──────────────────
function updateHeroGrid() {
  if (!roomData) return;
  const players = Object.values(roomData.players || {});
  const takenMap = {};
  players.forEach(p => { if (p.heroClass) takenMap[p.heroClass] = p.name; });

  CLASSES.forEach(cls => {
    const card   = document.getElementById(`hcard-${cls.id}`);
    const footer = document.getElementById(`hcard-footer-${cls.id}`);
    if (!card) return;

    const isMine  = takenMap[cls.id] && players.find(p => p.id === me.id && p.heroClass === cls.id);
    const isTaken = !!takenMap[cls.id] && !isMine;

    card.classList.toggle("selected", !!isMine);
    card.classList.toggle("my-pick",  !!isMine);
    card.classList.toggle("taken",    isTaken);

    if (isMine)       footer.textContent = "✓ Your hero";
    else if (isTaken) footer.textContent = `Taken by ${takenMap[cls.id]}`;
    else              footer.textContent = "Click to choose";
  });
}

// ── Player pips ───────────────────────────────────────────────
function renderPlayerPips() {
  if (!roomData) return;
  const players = Object.values(roomData.players || {});
  const pips = document.getElementById("player-pips");
  pips.innerHTML = Array.from({ length: 4 }, (_, i) => {
    const p = players[i];
    const cls = p ? "player-pip filled" + (p.id === me.id ? " me" : "") : "player-pip";
    const label = p ? p.name.slice(0, 2).toUpperCase() : "?";
    return `<div class="${cls}" title="${p ? p.name : "Waiting..."}">${label}</div>`;
  }).join("");
}

// ── Roster ────────────────────────────────────────────────────
function renderRoster() {
  if (!roomData) return;
  const players = Object.values(roomData.players || {});
  const list = document.getElementById("roster-list");
  list.innerHTML = Array.from({ length: 4 }, (_, i) => {
    const p = players[i];
    const cls = CLASSES.find(c => c.id === p?.heroClass);
    const filled = !!p;
    return `
      <div class="roster-slot ${filled ? "filled" : ""}">
        <div class="roster-slot-avatar">${cls ? cls.emoji : "👤"}</div>
        <div class="roster-slot-name">${p ? p.name : "Waiting..."}</div>
        <div class="roster-slot-class">${cls ? cls.name : "No hero chosen"}</div>
      </div>
    `;
  }).join("");
}

// ── Ready check ───────────────────────────────────────────────
function checkReady() {
  if (!roomData) return;
  const players = Object.values(roomData.players || {});
  const allReady = players.length === 4 && players.every(p => !!p.heroClass);
  const waitEl = document.getElementById("waiting-msg");
  const beginEl = document.getElementById("btn-begin");

  if (allReady && me.isHost) {
    waitEl.style.display = "none";
    beginEl.style.display = "inline-flex";
  } else if (allReady) {
    waitEl.querySelector("span").textContent = "Waiting for the host to begin...";
  } else {
    const chosen = players.filter(p => !!p.heroClass).length;
    waitEl.querySelector("span").textContent =
      `${chosen}/4 heroes chosen — waiting for everyone to pick...`;
  }
}

// ── Begin adventure (host only) ───────────────────────────────
window.beginAdventure = async function () {
  await update(ref(db, `rooms/${roomCode}`), { status: "playing" });
  window.location.href = `game.html?room=${roomCode}`;
};

// ── Toast helper ─────────────────────────────────────────────
function showToast(msg, isError) {
  let toast = document.getElementById("__toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "__toast";
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.className = "toast" + (isError ? " error" : "");
  requestAnimationFrame(() => toast.classList.add("show"));
  setTimeout(() => toast.classList.remove("show"), 2500);
}
