// ============================================================
//  FIREBASE CONFIGURATION
//  ⚠️  FILL IN YOUR OWN VALUES FROM THE FIREBASE CONSOLE ⚠️
//  Steps:
//    1. Go to https://console.firebase.google.com
//    2. Create a new project (e.g. "dungeon-eternal-shadows")
//    3. Add a Web App inside the project
//    4. Copy the firebaseConfig values below
//    5. Go to Realtime Database → Create Database → Start in test mode
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, set, get, push, onValue, update, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const firebaseConfig = {
  apiKey:            "AIzaSyCO0663W0Yrtl3R9HlE909tSx3m547c-zs",
  authDomain:        "dungeon-crawler-geriatrics.firebaseapp.com",
  databaseURL:       "https://dungeon-crawler-geriatrics-default-rtdb.firebaseio.com",
  projectId:         "dungeon-crawler-geriatrics",
  storageBucket:     "dungeon-crawler-geriatrics.firebasestorage.app",
  messagingSenderId: "967017118838",
  appId:             "1:967017118838:web:fd4497925ca83bfb34b357"
};

// Initialise Firebase
const app = initializeApp(firebaseConfig);
const db  = getDatabase(app);

// Export everything pages need
export { db, ref, set, get, push, onValue, update, serverTimestamp };
