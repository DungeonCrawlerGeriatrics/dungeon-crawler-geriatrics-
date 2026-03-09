# Dungeon Crawler Geriatrics — Design Expansion Notes

---

## Core Tone Shift: Closer to Dungeon Crawler Carl

The world isn't just a dungeon — it's Earth being **digested**. The System didn't build the dungeon from scratch, it **recycled** the planet. Familiar things were compressed, converted, repurposed. The horror isn't that it's alien. It's that it's *almost* recognizable.

---

## 1. The World Has Lore Now

### The Collapse
- Earth collapsed "inward" — the System folded the surface into layers
- Players don't know this yet. They figure it out as they descend.
- Higher levels = recent collapse = still recognizable. Lower levels = older recycled material = stranger, more alien.
- Level 1 might have a Subway sandwich shop as a safe zone. Level 4 might have something that used to be a mall food court, now serving things that aren't food.

### Recycled Earth Aesthetic
Everything in the dungeon was *something else* first:
- Stone walls that still have drywall texture on one side
- A corridor that's clearly a converted interstate highway median — lane markings still faintly visible
- Safe zones in fast food restaurants (see below)
- Monsters that used to be pets, HOA presidents, customer service bots
- Treasure chests that are clearly Amazon lockers that have been... adapted
- A door that's definitely a Costco fire exit, but now it opens onto a 40-foot drop

### The System Voice
Notifications should occasionally feel like they were written by a bored contractor who's done this ten thousand times:
- `[SYSTEM: You have entered a Safe Zone. Enjoy your complimentary not-dying.]`
- `[SYSTEM: Level collapse in 47 minutes. This is a courtesy reminder. The System is not responsible for limb loss.]`
- `[SYSTEM: You have discovered a Crafting Station. The System notes that you probably won't use this correctly.]`

---

## 2. Fast Food Safe Zones

Safe zones are converted fast food restaurants. The System kept the bones, repurposed the function. Key rules:
- **No monsters can enter.** The fryer still works. Nobody knows why.
- **The menu still exists** but the items have mutated. "McDouble" is now something. It restores HP but the description is unsettling.
- **NPCs hang out here.** Survivors, merchants, other crawlers, a dungeon bureaucrat who handles complaints.
- **Branded but wrong.** The logo is slightly off. The colors are slightly wrong. The mascot is still there but it's been looking at you for a while.

### Example Safe Zones by Depth
| Depth | Location | Vibe |
|-------|----------|------|
| 1 | McDonald's | Everything works. Menu is 90% normal. The Happy Meal toy is a tiny weapon. |
| 2 | Taco Bell | Structurally unsound. The menu is in a language that's almost English. HP restore works great, side effects unclear. |
| 3 | Arby's | Nobody talks about the Arby's. |
| 4 | Something that used to be a Subway | The bread is still there. The bread remembers. |
| 5 | [REDACTED] | The System has removed the name of this location from accessible records. |

### Mechanical Safe Zone Rules
- Entering a safe zone: full HP/MP restore (costs in-world currency or just time)
- Can buy items from a menu (absurd items, real mechanical effects)
- NPCs in safe zones give quests, info, and opinions nobody asked for
- Cannot be attacked here — but can still make terrible decisions

---

## 3. Timed Level Collapses — Urgency System

Every floor has a **collapse timer**. When it hits zero, the floor folds and anyone still on it either dies or gets dragged to the next level with serious penalties.

### How It Works
- Timer is set when the party enters a level (Firebase: `rooms/{code}/collapseTimer`)
- Displayed as a countdown in the UI — pulsing red when under 10 minutes
- DM references it in narration: *"The walls groan. Somewhere below you, something large is shifting."*
- [SYSTEM: COLLAPSE WARNING — 10 minutes remaining. The System suggests moving.]
- Timer is aggressive — designed to make the party skip things, argue about priorities, leave loot behind

### Timer by Depth (suggested defaults)
| Depth | Time | Feel |
|-------|------|------|
| 1 | 45 min | Tutorial pressure — enough time to explore, not enough to dawdle |
| 2 | 35 min | Starting to feel it |
| 3 | 25 min | Someone is always suggesting they just quickly check one more room |
| 4 | 15 min | Pure chaos. Half the party wants to run. |
| 5 | No timer | Final floor. Nowhere to collapse to. |

### Collapse Events
When timer hits zero:
- Floor "folding" narration from DM — should be viscerally weird
- Players on floor take damage (10-20 HP), get "Disoriented" status
- Get forcibly moved to next depth
- Any items left in rooms are gone
- Any NPCs left behind are... gone in a different way

---

## 4. Expanded Class List — Including Wildcards

Current classes: Warrior, Rogue, Mage, Paladin, Bard, Ranger, Summoner, Berserker

### New Standard Classes
- **Scholar** — INT-focused, knows dungeon lore, can identify things, useless in a fight but always right about it
- **Merchant** — CHA-focused, negotiates with everything including monsters, somehow makes money in a dungeon
- **Cleric** — WIS-focused, healer, but their god is a middle management deity who communicates via passive-aggressive notifications
- **Monk** — CON-focused, no weapons, just vibes and extremely controlled anger

### Wildcard Classes (the surprises)
These are earned through *unusual* behavioral patterns. DM assigns them when behavior clearly doesn't fit any standard class.

| Class | Trigger Behavior | Description |
|-------|-----------------|-------------|
| **The Pet** | Being inexplicably charming, following stronger players, attacking things that threaten the group unprompted | You are now a dungeon creature in spirit. The System has reclassified you. You have a Bond skill. You are someone's familiar whether they like it or not. Inspired by Donut from DCC. |
| **The Furniture** | Refusing to engage, hiding behind others, letting the couch do the work | The System has decided you are a fixed object. Surprisingly durable. Surprisingly useful. The couch came with you and it has stats now. |
| **The Manager** | Telling other players what to do without doing anything yourself, filing complaints | You manage. You delegate. Your Passive Aggressive Aura is a real buff. You do almost no damage but enemies sometimes just... comply. |
| **The Cryptid** | Doing inexplicable things that somehow work, never explaining yourself | The System cannot categorize you. This has made it nervous. Your class description is [REDACTED]. Your skills have names that are just coordinates. |
| **The Coward** | Consistently hiding, fleeing, or negotiating instead of fighting | Extreme DEX, zero STR. Speed bonus. The System is not judging you. The System is a little impressed, actually. |
| **The Goblin** | Stealing from teammates, hoarding items, making deals with enemies | You are a goblin. This is not an insult. Goblins are survivors. You get a discount from goblin NPCs and a reputation that precedes you. |

### The Pet Class — Special Rules (like Donut)
- Assigned when a player consistently acts more like a creature than a person
- Gets a **Bond** with one specific player — that player gets buffs when near them
- Can **Evolve** — starts as basically a dog, can become something much stranger
- Their stats rebalance when assigned: STR and INT drop, DEX and CHA spike
- Special skill: **Dungeon Instinct** — can sense danger the party can't
- The System's notifications about them are weirdly affectionate and also slightly horrified

---

## 5. World Flavor Details

### Things That Exist in This Dungeon
- A Yelp review board for safe zones (updated in real time by survivors, stars only go down)
- A dungeon bureaucrat NPC — extremely polite, extremely useless, technically has power
- Monster "sponsored content" — some monsters are running brand deals with the System
- An elevator that goes between floors but requires a punch card. The punch card costs more than it saves.
- A lost pet. It's fine. It's thriving actually. It's doing better than everyone.
- A vending machine that only dispenses items you specifically didn't want
- A crawler who's been in the dungeon since the first collapse and has opinions about newcomers

### Monster Design Philosophy
Monsters in DCG are recycled too:
- The HOA President — territorial, attacks anyone who violates unwritten rules, has a clipboard
- The Customer Service Bot — cannot be reasoned with, cannot be harmed by logic, immune to frustration
- The Middle Manager — no direct attacks, just makes everything slightly worse
- Feral Roombas — low HP, high annoyance, travels in packs
- Something that was definitely a golden retriever and is now approximately the size of a car
- The Yelp Reviewer — follows the party, posts about their decisions, somehow this matters

---

## 6. Implementation Priority

### Now (system prompt updates)
1. Add recycled-earth lore to DM context
2. Add safe zone rules and fast food zone descriptions  
3. Add wildcard classes including The Pet
4. Update opening narration to reference familiar-but-wrong details
5. Add collapse timer language to DM prompt

### Soon (code changes)
1. Collapse timer UI — countdown display in right panel
2. Firebase `collapseTimer` field + DM can set it
3. Safe zone detection — when DM says `[SYSTEM: SAFE ZONE — LocationName]`, unlock rest/shop UI
4. Pet class special Bond mechanic in stat cards

### Later (stretch)
1. Safe zone "shop" interface — buy from mutated fast food menu
2. Yelp review system for locations (flavor only, no mechanics)
3. Crawler NPCs with persistent memory across the session
