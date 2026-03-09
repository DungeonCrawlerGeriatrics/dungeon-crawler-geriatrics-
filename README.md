# ⚔️ Dungeon of Eternal Shadows
### A Real-Time Multiplayer AI Dungeon Master Game

Four players. One AI Dungeon Master. Zero mercy.

---

## 🚀 Setup Guide (15 minutes total)

### Step 1 — Firebase (free, ~5 min)

1. Go to **https://console.firebase.google.com**
2. Click **"Add project"** → name it `dungeon-eternal-shadows` → Continue
3. Disable Google Analytics (optional) → **Create project**
4. In the left sidebar → **Build → Realtime Database**
5. Click **"Create Database"** → choose any location → **"Start in test mode"** → Enable
6. In the left sidebar → **Project Settings** (gear icon) → **"Your apps"**
7. Click the **Web icon `</>`** → Register app (name: `dungeon-web`) → **Continue**
8. Copy the `firebaseConfig` object — you'll need it in Step 2

### Step 2 — Configure Firebase in the code

Open **`js/firebase-config.js`** and replace the placeholder values:

```js
const firebaseConfig = {
  apiKey:            "AIzaSy...",          // ← your values here
  authDomain:        "dungeon-abc123.firebaseapp.com",
  databaseURL:       "https://dungeon-abc123-default-rtdb.firebaseio.com",
  projectId:         "dungeon-abc123",
  storageBucket:     "dungeon-abc123.appspot.com",
  messagingSenderId: "123456789",
  appId:             "1:123456789:web:abc..."
};
```

### Step 3 — GitHub Pages (~5 min)

1. Create a new **public** GitHub repository (e.g. `dungeon-shadows`)
2. Upload all files maintaining the folder structure:
   ```
   index.html
   heroselect.html
   game.html
   css/
     global.css
     lobby.css
     heroselect.css
     game.css
   js/
     firebase-config.js
     lobby.js
     heroselect.js
     game.js
   README.md
   ```
3. Go to your repo → **Settings → Pages**
4. Under **Source**, select **"Deploy from a branch"** → `main` → `/ (root)` → **Save**
5. Wait ~2 minutes → your site is live at: `https://YOUR-USERNAME.github.io/dungeon-shadows/`

### Step 4 — Play! 🎲

1. **Host** opens the URL → enters their name → clicks **"Create Campaign"**
2. Host shares the **5-letter room code** with friends
3. Each player opens the same URL → enters their name + room code → **"Enter the Dungeon"**
4. Everyone picks a hero on the Hero Select screen
5. Host clicks **"Begin the Adventure"** when all 4 heroes are chosen
6. The AI Dungeon Master narrates your fate — take turns and survive!

---

## 📁 File Structure

```
dungeon-shadows/
├── index.html          ← Lobby (create/join room)
├── heroselect.html     ← Hero class selection
├── game.html           ← Main game screen
├── css/
│   ├── global.css      ← Shared styles, buttons, bars
│   ├── lobby.css       ← Lobby page styles
│   ├── heroselect.css  ← Hero select styles
│   └── game.css        ← Game screen styles
├── js/
│   ├── firebase-config.js  ← ⚠️ Fill in YOUR Firebase values
│   ├── lobby.js            ← Room creation & joining
│   ├── heroselect.js       ← Hero selection logic
│   └── game.js             ← Full game logic + AI DM
└── README.md
```

---

## 🎮 How to Play

| Who | Does What |
|-----|-----------|
| **Host** | Creates room, starts game, acts first |
| **Players** | Join with room code, pick a hero |
| **Everyone** | Takes turns — type any action in the text box |
| **AI DM** | Narrates results, tracks HP/MP, creates encounters |

### Heroes
| Class | Role | HP | MP |
|-------|------|----|----|
| ⚔️ Ironclad Warrior | Tank / Melee DPS | 120 | 30 |
| 🔮 Arcane Mage | AoE Caster | 65 | 120 |
| 🗡️ Shadow Rogue | Burst DPS / Stealth | 85 | 50 |
| 🛡️ Holy Paladin | Support / Healer | 100 | 80 |

### Tips
- The AI DM tracks HP damage from its own narration automatically
- Use **Quick Action** buttons for common moves
- The host's browser calls the Claude API for DM responses — all players see results in real-time via Firebase
- The dungeon has **5 levels** — the final boss is **The Shadow Lich**

---

## 🔒 Firebase Security (optional, for production)

Replace test mode rules in Firebase Console → Realtime Database → Rules:

```json
{
  "rules": {
    "rooms": {
      "$roomCode": {
        ".read": true,
        ".write": true
      }
    }
  }
}
```

For a real deployment, add authentication. Test mode is fine for private games.

---

## 🛠 Troubleshooting

**"Firebase config error"** → Double-check all values in `firebase-config.js`

**"Room not found"** → Make sure the host created the room first, room codes are case-sensitive

**"DM not responding"** → The host's browser calls Claude API. Host must keep their tab open.

**Players can't join** → Firebase Realtime Database must be in "test mode" (allows open reads/writes)

---

*Built with ❤️ using Claude AI + Firebase Realtime Database*
