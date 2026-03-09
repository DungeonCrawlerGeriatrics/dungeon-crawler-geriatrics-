// ============================================================
//  GAME LOGIC — Real-time multiplayer with AI Dungeon Master
// ============================================================
import { db, ref, set, get, push, onValue, update, serverTimestamp }
  from "./firebase-config.js";

// ── Boot ─────────────────────────────────────────────────────
const params   = new URLSearchParams(window.location.search);
const roomCode = params.get("room");
const me       = JSON.parse(sessionStorage.getItem("dungeon_player") || "null");

if (!roomCode || !me) { window.location.href = "index.html"; }

// ── State ────────────────────────────────────────────────────
let roomData   = null;
let players    = [];   // ordered array
let myPlayer   = null;
let myHeroIdx  = -1;
let turnIndex  = 0;
let turnCount  = 0;
let roundCount = 1;
let aiHistory  = [];   // full conversation sent to Claude
let depth      = 1;
let isDMThinking = false;

// Class colours for quick lookup
const CLASS_COLOR = { warrior:"#e74c3c", mage:"#a569bd", rogue:"#27ae60", paladin:"#f0b429" };

// ── Firebase listener ─────────────────────────────────────────
onValue(ref(db, `rooms/${roomCode}`), snap => {
  if (!snap.exists()) { window.location.href = "index.html"; return; }
  roomData = snap.val();

  // Build ordered player list (stable sort by joinedAt)
  players = Object.values(roomData.players || {})
    .sort((a, b) => (a.joinedAt || 0) - (b.joinedAt || 0));

  myPlayer  = players.find(p => p.id === me.id) || null;
  myHeroIdx = players.findIndex(p => p.id === me.id);

  turnIndex  = roomData.turnIndex  || 0;
  turnCount  = roomData.turnCount  || 0;
  roundCount = roomData.roundCount || 1;
  depth      = roomData.depth      || 1;

  // Header
  document.getElementById("gh-campaign").textContent = roomData.campaign || "Dungeon";
  document.getElementById("gh-room-code").textContent = roomCode;
  document.getElementById("gh-location-name").textContent = roomData.location || "The Gates of Shadow";
  document.getElementById("gh-depth").textContent = `LEVEL ${depth}`;
  document.getElementById("sess-room").textContent  = roomCode;
  document.getElementById("sess-turn").textContent  = turnCount + 1;
  document.getElementById("sess-round").textContent = roundCount;

  renderParty();
  renderTurnBar();
  renderTurnOrder();
  renderDepth();
  renderOnlinePips();

  // Sync log from Firebase
  syncLog(roomData.log || {});

  // Host: run first DM message if log is empty
  if (me.isHost && Object.keys(roomData.log || {}).length === 0 && !isDMThinking) {
    runOpeningNarration();
  }
});

// ── Mark online ───────────────────────────────────────────────
update(ref(db, `rooms/${roomCode}/players/${me.id}`), { online: true });
window.addEventListener("beforeunload", () => {
  navigator.sendBeacon && navigator.sendBeacon("", "");
  update(ref(db, `rooms/${roomCode}/players/${me.id}`), { online: false });
});

// ── Party Panel ───────────────────────────────────────────────
function renderParty() {
  const panel = document.getElementById("party-panel");
  panel.innerHTML = players.map((p, i) => {
    const isMine   = p.id === me.id;
    const isActive = i === turnIndex;
    const pct      = v => Math.max(0, Math.min(100, ((v || 0) / (p.maxHp || 100)) * 100));
    const hpPct    = pct(p.hp || p.maxHp);
    const mpPct    = ((p.mp || 0) / (p.maxMp || 100)) * 100;
    const hpClass  = hpPct > 60 ? "hp-high" : hpPct > 30 ? "hp-mid" : "hp-low";
    const fallen   = (p.hp || 1) <= 0;

    return `
      <div class="hero-mini ${p.heroClass || "warrior"} ${isActive ? "active-turn" : ""} ${fallen ? "fallen" : ""} ${isMine ? "my-hero" : ""}">
        ${isActive ? `<div class="active-turn-badge">⚔ Acting</div>` : ""}
        <div class="hero-mini-top">
          <div class="hero-mini-avatar">${p.heroEmoji || "⚔️"}</div>
          <div>
            <div class="hero-mini-name">${p.name}${isMine ? " <span style='color:var(--gold-dim);font-size:.55rem'>(YOU)</span>" : ""}</div>
            <div class="hero-mini-class">${p.heroName || "Hero"}</div>
          </div>
        </div>
        <div class="hero-mini-bars">
          <div class="bar-label-row"><span>HP</span><span>${p.hp ?? p.maxHp}/${p.maxHp}</span></div>
          <div class="bar-track"><div class="bar-fill ${hpClass}" style="width:${hpPct}%"></div></div>
          <div class="bar-label-row" style="margin-top:.3rem"><span>MP</span><span>${p.mp ?? p.maxMp}/${p.maxMp}</span></div>
          <div class="bar-track"><div class="bar-fill mp" style="width:${mpPct}%"></div></div>
        </div>
        <div class="hero-mini-statuses">
          ${(p.statuses || []).map(s => `<div class="status-badge status-${s}">${s}</div>`).join("")}
          ${fallen ? `<div class="status-badge status-dead">FALLEN</div>` : ""}
        </div>
      </div>
    `;
  }).join("");
}

// ── Turn Bar ──────────────────────────────────────────────────
function renderTurnBar() {
  const actingPlayer = players[turnIndex];
  const isMyTurn = actingPlayer?.id === me.id;

  // Turn chips
  const chipsEl = document.getElementById("turn-heroes");
  chipsEl.innerHTML = players.map((p, i) => `
    <div class="turn-chip ${p.heroClass || "warrior"} ${i === turnIndex ? "active" : ""}">
      ${p.heroEmoji || "⚔️"} ${p.name.split(" ")[0]}
    </div>
  `).join("");

  // Show/hide input panels
  const myTurnEl  = document.getElementById("my-turn-panel");
  const waitEl    = document.getElementById("waiting-panel");
  const waitIcon  = document.getElementById("waiting-hero-icon");
  const waitText  = document.getElementById("waiting-hero-text");

  if (isMyTurn && !isDMThinking) {
    myTurnEl.style.display  = "block";
    waitEl.style.display    = "none";
    document.getElementById("action-input").placeholder =
      `What does ${myPlayer?.name || "your hero"} do?`;
  } else {
    myTurnEl.style.display  = "none";
    waitEl.style.display    = "flex";
    waitIcon.textContent    = actingPlayer?.heroEmoji || "⚔️";
    waitText.textContent    = isDMThinking
      ? "The Dungeon Master is weaving fate..."
      : `Waiting for ${actingPlayer?.name || "another hero"} to act...`;
  }
}

// ── Turn Order (right panel) ──────────────────────────────────
function renderTurnOrder() {
  const el = document.getElementById("turn-order");
  el.innerHTML = players.map((p, i) => `
    <div class="to-item ${i === turnIndex ? "current" : ""}">
      <span class="to-num">${i + 1}</span>
      <span>${p.heroEmoji || "⚔️"}</span>
      <span>${p.name}</span>
      ${i === turnIndex ? `<span style="margin-left:auto;font-size:.6rem;color:var(--gold)">◀ NOW</span>` : ""}
    </div>
  `).join("");
}

// ── Depth Track ───────────────────────────────────────────────
function renderDepth() {
  document.querySelectorAll(".depth-pip").forEach((pip, i) => {
    pip.classList.toggle("active", i + 1 === depth || (i === 4 && depth >= 5));
  });
}

// ── Online Pips (header) ──────────────────────────────────────
function renderOnlinePips() {
  const el = document.getElementById("gh-pips");
  el.innerHTML = Array.from({ length: 4 }, (_, i) => {
    const p = players[i];
    const online = p?.online;
    return `<div class="gh-pip ${online ? "online" : ""}" title="${p ? p.name : "Empty slot"}"></div>`;
  }).join("");
}

// ── Log Sync ──────────────────────────────────────────────────
let renderedKeys = new Set();

function syncLog(logObj) {
  const sorted = Object.entries(logObj)
    .sort(([, a], [, b]) => (a.ts || 0) - (b.ts || 0));

  sorted.forEach(([key, entry]) => {
    if (renderedKeys.has(key)) return;
    renderedKeys.add(key);

    // Remove welcome placeholder
    const welcome = document.querySelector(".log-welcome");
    if (welcome) welcome.remove();

    appendLogEntry(entry);
  });
}

function appendLogEntry(entry) {
  const log = document.getElementById("dungeon-log");
  const div = document.createElement("div");

  if (entry.type === "dm") {
    div.className = "log-entry log-dm";
    div.innerHTML = `
      <div class="log-speaker">🎲 DUNGEON MASTER 🎲</div>
      <div class="log-body">${formatDMText(entry.text)}</div>
    `;
  } else if (entry.type === "player") {
    const p = players.find(p => p.id === entry.playerId);
    const cls = p?.heroClass || "warrior";
    div.className = `log-entry log-player ${cls}`;
    div.innerHTML = `
      <div class="log-speaker">${entry.emoji || "⚔️"} ${entry.playerName?.toUpperCase() || "HERO"}</div>
      <div class="log-body">"${entry.text}"</div>
    `;
  } else {
    div.className = "log-entry log-system";
    div.innerHTML = `<div class="log-body">— ${entry.text} —</div>`;
  }

  log.appendChild(div);
  log.scrollTop = log.scrollHeight;
}

function formatDMText(text) {
  // Highlight [mechanic] brackets
  return text
    .replace(/\[([^\]]+)\]/g, `<span class="mechanic">[$1]</span>`)
    .replace(/\n/g, "<br>");
}

// ── Write to Firebase log ─────────────────────────────────────
async function writeLog(entry) {
  const key = Date.now() + "_" + Math.random().toString(36).slice(2, 6);
  await set(ref(db, `rooms/${roomCode}/log/${key}`), { ...entry, ts: Date.now() });
}

// ── Advance turn ──────────────────────────────────────────────
async function advanceTurn() {
  let next = (turnIndex + 1) % players.length;
  // Skip fallen heroes
  let safety = 0;
  while ((players[next]?.hp ?? 1) <= 0 && safety < players.length) {
    next = (next + 1) % players.length;
    safety++;
  }

  const newTurnCount  = turnCount + 1;
  const newRoundCount = Math.floor(newTurnCount / players.length) + 1;

  await update(ref(db, `rooms/${roomCode}`), {
    turnIndex:  next,
    turnCount:  newTurnCount,
    roundCount: newRoundCount,
  });

  // Log round change
  if (newTurnCount > 0 && newTurnCount % players.length === 0) {
    await writeLog({ type: "system", text: `Round ${newRoundCount} begins` });
  }
}

// ── Opening Narration (host runs once) ────────────────────────
async function runOpeningNarration() {
  isDMThinking = true;
  setDMTyping(true);
  renderTurnBar();

  const systemPrompt = buildSystemPrompt();
  const opening = `The party of four brave heroes stands at the entrance of the Dungeon of Eternal Shadows:
${players.map(p => `- ${p.name} the ${p.heroName} (HP:${p.maxHp}, MP:${p.maxMp})`).join("\n")}

Begin the adventure! Describe the dungeon entrance dramatically and atmospherically. Give the heroes their first glimpse of darkness and dread. End with a clear first choice or challenge for the party.`;

  const dmText = await callClaude(systemPrompt, opening);

  aiHistory.push({ role: "user",      content: opening });
  aiHistory.push({ role: "assistant", content: dmText  });

  // Save history to Firebase so any player can continue
  await update(ref(db, `rooms/${roomCode}`), {
    aiHistory: JSON.stringify(aiHistory)
  });

  await writeLog({ type: "dm", text: dmText });

  isDMThinking = false;
  setDMTyping(false);
}

// ── Player Action ─────────────────────────────────────────────
window.sendAction = async function () {
  const input = document.getElementById("action-input");
  const text  = input.value.trim();
  if (!text || isDMThinking) return;

  // Validate it's my turn
  if (players[turnIndex]?.id !== me.id) {
    showToast("It's not your turn!", true);
    return;
  }

  input.value = "";
  isDMThinking = true;
  setDMTyping(true);
  renderTurnBar();

  // Log player action
  await writeLog({
    type:       "player",
    playerId:   me.id,
    playerName: myPlayer?.name || me.name,
    emoji:      myPlayer?.heroEmoji || "⚔️",
    text,
  });

  // Load latest AI history from Firebase
  const snap = await get(ref(db, `rooms/${roomCode}/aiHistory`));
  if (snap.exists()) {
    try { aiHistory = JSON.parse(snap.val()); } catch (e) {}
  }

  const systemPrompt = buildSystemPrompt();
  const userMsg = buildPlayerMessage(text);

  const dmText = await callClaude(systemPrompt, userMsg);

  aiHistory.push({ role: "user",      content: userMsg });
  aiHistory.push({ role: "assistant", content: dmText  });

  // Persist updated history
  await update(ref(db, `rooms/${roomCode}`), {
    aiHistory: JSON.stringify(aiHistory)
  });

  // Parse mechanics from DM text (HP changes, depth)
  await parseMechanics(dmText);

  await writeLog({ type: "dm", text: dmText });
  await advanceTurn();

  isDMThinking = false;
  setDMTyping(false);
};

window.quickAction = function (text) {
  document.getElementById("action-input").value = text;
  window.sendAction();
};

window.handleKey = function (e) {
  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); window.sendAction(); }
};

// ── Build prompts ─────────────────────────────────────────────
function buildSystemPrompt() {
  const partyDesc = players.map(p =>
    `- ${p.name} (${p.heroName}, HP:${p.hp ?? p.maxHp}/${p.maxHp}, MP:${p.mp ?? p.maxMp}/${p.maxMp}, Abilities: ${(p.abilities || []).join(" | ")})`
  ).join("\n");

  return `You are an expert, dramatic, and creative Dungeon Master for a dark fantasy real-time multiplayer RPG.

PARTY (${players.length} heroes):
${partyDesc}

DUNGEON: "Dungeon of Eternal Shadows" — 5 levels deep. Final boss: The Shadow Lich.
Current depth: Level ${depth}. Location: ${roomData?.location || "The Gates of Shadow"}.

RULES:
- Narrate vividly in second/third person. Rich dark fantasy prose.
- React to ALL player actions with meaningful consequences (good and bad).
- Create encounters: combat, traps, puzzles, mysteries, NPCs.
- Track damage with [brackets]: e.g. [${players[0]?.name || "Hero"} takes 12 damage! HP: XX/XX]
- Healing: [${players[0]?.name || "Hero"} heals 8 HP! HP: XX/XX]
- Keep responses 150-300 words. End with a clear situation or choice.
- Escalate tension and danger as depth increases.
- Be fair but deadly — this is a real dungeon.
- Occasionally use humour for memorable moments.`;
}

function buildPlayerMessage(actionText) {
  const actor = players[turnIndex];
  const partyStatus = players.map(p =>
    `${p.name}: HP ${p.hp ?? p.maxHp}/${p.maxHp}${(p.hp ?? 1) <= 0 ? " [FALLEN]" : ""}`
  ).join(", ");

  return `[Turn ${turnCount + 1} | Round ${roundCount} | Depth ${depth}]
${actor?.name} (${actor?.heroName}) takes action: "${actionText}"

Party status: ${partyStatus}

Narrate the result dramatically. Use [brackets] for all mechanics.`;
}

// ── Parse mechanics ───────────────────────────────────────────
async function parseMechanics(text) {
  const updates = {};

  // Damage
  const dmgRe = /\[(\w[\w\s]*?) takes (\d+) damage/gi;
  let m;
  while ((m = dmgRe.exec(text)) !== null) {
    const nameFrag = m[1].toLowerCase();
    const dmg = parseInt(m[2]);
    const p = players.find(p => p.name.toLowerCase().includes(nameFrag) || nameFrag.includes(p.name.toLowerCase().split(" ")[0].toLowerCase()));
    if (p) {
      const newHp = Math.max(0, (p.hp ?? p.maxHp) - dmg);
      updates[`players/${p.id}/hp`] = newHp;
      p.hp = newHp; // local optimistic update
    }
  }

  // Healing
  const healRe = /\[(\w[\w\s]*?) (?:heals?|recovers?) (\d+) HP/gi;
  while ((m = healRe.exec(text)) !== null) {
    const nameFrag = m[1].toLowerCase();
    const heal = parseInt(m[2]);
    const p = players.find(p => p.name.toLowerCase().includes(nameFrag) || nameFrag.includes(p.name.toLowerCase().split(" ")[0].toLowerCase()));
    if (p) {
      const newHp = Math.min(p.maxHp, (p.hp ?? p.maxHp) + heal);
      updates[`players/${p.id}/hp`] = newHp;
      p.hp = newHp;
    }
  }

  // Depth change
  const depthMatch = text.match(/(?:descend|reach|enter).{0,30}level (\d)/i);
  if (depthMatch) {
    const newDepth = Math.min(5, parseInt(depthMatch[1]));
    if (newDepth > depth) updates["depth"] = newDepth;
  }

  if (Object.keys(updates).length > 0) {
    await update(ref(db, `rooms/${roomCode}`), updates);
  }
}

// ── Claude API ────────────────────────────────────────────────
async function callClaude(systemPrompt, userMessage) {
  const messages = [
    ...aiHistory,
    { role: "user", content: userMessage }
  ];

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model:      "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system:     systemPrompt,
        messages,
      }),
    });

    const data = await res.json();
    return data.content?.[0]?.text || "The dungeon master is momentarily lost in thought...";
  } catch (err) {
    console.error("Claude API error:", err);
    return "⚠ The crystal ball has gone dark. The dungeon master could not respond. Please try again.";
  }
}

// ── DM typing indicator ───────────────────────────────────────
function setDMTyping(on) {
  document.getElementById("dm-typing").classList.toggle("visible", on);
}

// ── DM Overlay ────────────────────────────────────────────────
window.closeDMOverlay = function () {
  document.getElementById("dm-overlay").classList.remove("open");
};

// ── Leave game ────────────────────────────────────────────────
window.leaveGame = function () {
  if (confirm("Abandon your quest and return to the lobby?")) {
    update(ref(db, `rooms/${roomCode}/players/${me.id}`), { online: false });
    sessionStorage.removeItem("dungeon_player");
    window.location.href = "index.html";
  }
};

// ── Toast ─────────────────────────────────────────────────────
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
