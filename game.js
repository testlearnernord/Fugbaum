const STORAGE_KEY = "bernd-knauer-rpg-save";
const SHOP = [
  { id: "knueppel", name: "Kanal-Knüppel", kind: "Waffe", cost: 35, attack: 4 },
  { id: "jacke", name: "Lederjacke", kind: "Schutz", cost: 45, defense: 3 },
  { id: "kette", name: "Schwere Kette", kind: "Waffe", cost: 80, attack: 8 },
  { id: "weste", name: "Motorradweste", kind: "Schutz", cost: 100, defense: 7 },
  { id: "Knarre", name: "Knarre", kind: "Waffe", cost: 200, attack: 13}
];
const RANKS = [
  { wins: 0, name: "Mitläufer" },
  { wins: 2, name: "Anerkannter Kumpel" },
  { wins: 4, name: "Rechte Hand" },
  { wins: 5, name: "Gang-Chef" },
];
const ENEMIES = [
  { name: "Timo vom Bolzplatz", health: 35, attack: 8, xp: 25, cash: 16 },
  { name: "Die Bushaltestellen-Crew", health: 46, attack: 10, xp: 32, cash: 22 },
  { name: "Mats mit dem Mofa", health: 55, attack: 12, xp: 40, cash: 28 },
  { name: "Hans der Hausmeister", health: 100, attack: 23, xp: 60, cash: 20}
];
const BOSS = {
  name: "Laboe Blue Brothers – Anführer",
  health: 105,
  attack: 15,
  xp: 100,
  cash: 150,
  boss: true,
};
const DISTRICTS = [
  { id: "ellerbek", name: "Ellerbek", scene: "Zwischen Backstein und Förde beginnt deine Runde.", stops: ["Am Werftzaun", "An der Förde", "Hinterhofrunde"], sayings: ["Erst mal um den Block. Der Rest läuft nicht weg.", "Gegenwind? Dann weißt du wenigstens, wo vorne ist.", "Große Klappe passt auch durch kleine Hinterhöfe."] },
  { id: "wellingdorf", name: "Wellingdorf", scene: "Werftkulisse, Schwentine und ein Treffpunkt am Wasser.", stops: ["Schwentinepause", "Werftblick", "Am Treff"], sayings: ["Die Schwentine macht keinen Stress. Nimm dir ein Beispiel.", "Hier glänzt nicht alles. Muss es auch nicht.", "Kein Plan ist auch ein Plan. Nur meistens ein schlechter."] },
  { id: "gaarden", name: "Gaarden", scene: "Durch die Straßen zum Platz und zurück an den Kiosk.", stops: ["Am Kiosk", "Auf dem Platz", "Straßenecke"], sayings: ["Am Kiosk gibt's Wechselgeld, keinen Lebensrat.", "Erst zuhören, dann den Dicken machen.", "Respekt gibt's nicht im Sonderangebot."] },
  { id: "laboe", name: "Laboe", scene: "Promenade, Hafen und die letzte Etappe deiner Tour.", stops: ["Promenade", "Hafenpause", "Letzte Bank"], sayings: ["Bis Laboe und dann erst mal sitzen.", "Die Förde ist groß genug für mehr als eine Meinung.", "Großer Auftritt? Ich fang mit einem kleinen Spaziergang an."] },
];
const SCENE_IMAGES = [
  { src: "assets/bernd-knauer-archiv-1.png", label: "Bereitgestelltes Bernd-Standbild · Gespräch" },
  { src: "assets/bernd-knauer-archiv-2.png", label: "Bereitgestelltes Bernd-Standbild · Nahaufnahme" },
  { src: "assets/bernd-knauer-archiv-3.png", label: "Bereitgestelltes Bernd-Standbild · Am Tisch" },
  { src: "assets/youth-wars-gruppe.png", label: "Bereitgestelltes Gruppenbild" },
];
const STOPS = [{ x: 3, y: 3 }, { x: 8, y: 7 }, { x: 12, y: 3 }];
const MAPS = [
  ["~~~~~~~~~~~~~~~~", "~~~~~~~~~~~~~~~~", "###.####.###.###", "###..........###", "###.####.###.###", "................", "###.####.###.###", "###..........###", "###.####.###.###", "################"],
  ["################", "###.####.###.###", "###.####.###.###", "###..........###", "###.####.###.###", "................", "###.####.###.###", "###..........###", "~~~~~~~~.~~~~~~~", "~~~~~~~~~~~~~~~~"],
  ["################", "###..........###", "###.####.###.###", "###..........###", "###.####.###.###", "................", "###.####.###.###", "###..........###", "###.####.###.###", "################"],
  ["~~~~~~~~~~~~~~~~", "~~~~~~~~~~~~~~~~", "~~~.~~~~.~~~.~~~", "................", "###.####.###.###", "................", "###.####.###.###", "###..........###", "###.####.###.###", "################"],
];

function newWorld() {
  return { area: 0, x: 2, y: 5, visited: [] };
}

function loadWorld(saved) {
  const world = newWorld();
  if (!saved || !Number.isInteger(saved.area) || !MAPS[saved.area]) return world;
  world.area = saved.area;
  if (Number.isInteger(saved.x) && Number.isInteger(saved.y) && MAPS[world.area][saved.y]?.[saved.x] === ".") {
    world.x = saved.x;
    world.y = saved.y;
  }
  if (Array.isArray(saved.visited)) {
    world.visited = [...new Set(saved.visited.filter((id) => /^[0-3]-[0-2]$/.test(id)))];
  }
  return world;
}

function newGame() {
  return {
    day: 1,
    level: 1,
    xp: 0,
    cash: 50,
    health: 100,
    wins: 0,
    inventory: [],
    equipment: { weapon: null, armor: null },
    battle: null,
    bossDefeated: false,
    world: newWorld(),
    log: ["Bernd und seine Gang machen sich auf, das Viertel zurückzuerobern."],
  };
}

function loadGame() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && typeof saved === "object") {
      return { ...newGame(), ...saved, world: loadWorld(saved.world), battle: null };
    }
  } catch {
    // Ignore invalid or unavailable local save data and start a fresh game.
  }
  return newGame();
}

let game = loadGame();
let guarding = false;
let sayingIndex = 0;

const byId = (id) => document.getElementById(id);
const money = (amount) => `${amount} €`;

function saveGame() {
  try {
    const saved = { ...game, battle: null };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  } catch {
    // The game remains playable if browser storage is unavailable.
  }
}

function addLog(message) {
  game.log.unshift(message);
  game.log = game.log.slice(0, 8);
}

function currentRank() {
  return [...RANKS].reverse().find((rank) => game.wins >= rank.wins);
}

function weaponAttack() {
  return game.equipment.weapon?.attack ?? 0;
}

function armorDefense() {
  return game.equipment.armor?.defense ?? 0;
}

function xpToNextLevel() {
  return game.level * 50;
}

function gainXp(amount) {
  game.xp += amount;
  while (game.xp >= xpToNextLevel()) {
    game.xp -= xpToNextLevel();
    game.level += 1;
    game.health += 20;
    addLog(`Levelaufstieg! Bernd ist jetzt Level ${game.level} und bekommt 20 Gesundheit zurück.`);
  }
}

function render() {
  const rank = currentRank();
  const requiredXp = xpToNextLevel();
  byId("rank").textContent = rank.name;
  byId("wins").textContent = `${game.wins} ${game.wins === 1 ? "Sieg" : "Siege"}`;
  byId("level").textContent = game.level;
  byId("xp-label").textContent = `${game.xp} / ${requiredXp} XP`;
  byId("xp-bar").style.width = `${Math.min(100, (game.xp / requiredXp) * 100)}%`;
  byId("cash").textContent = money(game.cash);
  byId("health").textContent = `${game.health} / ${100 + (game.level - 1) * 20}`;
  byId("health-bar").style.width = `${Math.min(100, (game.health / (100 + (game.level - 1) * 20)) * 100)}%`;
  byId("day").textContent = `Tag ${game.day}`;
  byId("objective").textContent = game.bossDefeated
    ? "Laboe ist fällich gewesen. Das Viertel kennt jetzt deinen Namen."
    : `Nächster Rang: ${RANKS.find((item) => item.wins > game.wins)?.name ?? "Laboe Blue Brothers"} · ${
        Math.max(0, 5 - game.wins)
      } ${Math.max(0, 5 - game.wins) === 1 ? "Sieg" : "Siege"} bis zum Showdown.`;

  const inBattle = Boolean(game.battle);
  byId("battle-panel").hidden = !inBattle;
  byId("work-button").disabled = inBattle || game.bossDefeated;
  byId("fight-button").disabled = inBattle || game.bossDefeated || game.health <= 0;
  byId("rest-button").disabled = inBattle || game.bossDefeated || game.health >= 100 + (game.level - 1) * 20;
  byId("boss-button").disabled = inBattle || game.wins < 5 || game.bossDefeated || game.health <= 0;
  byId("boss-copy").textContent = game.bossDefeated
    ? "Die Blue Brothers sind geschlagen. Dein Name macht jetzt die Runde."
    : game.wins < 5
      ? `Sammle noch ${5 - game.wins} ${game.wins === 4 ? "Sieg" : "Siege"}, dann kannst du ihren Anführer herausfordern.`
      : "Du hast dir Respekt verdient. Zeit, die Blue Brothers herauszufordern.";

  if (inBattle) {
    byId("enemy-name").textContent = game.battle.name;
    byId("enemy-health").textContent = `${Math.max(0, game.battle.health)} / ${game.battle.maxHealth}`;
    byId("enemy-bar").style.width = `${Math.max(0, (game.battle.health / game.battle.maxHealth) * 100)}%`;
  }

  renderGear();
  renderShop();
  renderLog();
  renderWorld();
  renderCollection();
  saveGame();
}

function nearbyPlace() {
  const { x, y, area } = game.world;
  const near = (point) => Math.abs(point.x - x) + Math.abs(point.y - y) <= 1;
  const stop = STOPS.findIndex(near);
  if (stop !== -1) return { kind: "stop", index: stop, label: DISTRICTS[area].stops[stop] };
  const places = [
    { x: 5, y: 5, kind: "work", label: "Nebenjob · +20 €" },
    { x: 10, y: 5, kind: "rest", label: "Bank · Durchatmen" },
    { x: 8, y: 5, kind: "fight", label: "Rivalen herausfordern" },
    { x: 0, y: 5, kind: "travel", destination: (area + 3) % 4, label: `Weiter nach ${DISTRICTS[(area + 3) % 4].name}` },
    { x: 15, y: 5, kind: "travel", destination: (area + 1) % 4, label: `Weiter nach ${DISTRICTS[(area + 1) % 4].name}` },
  ];
  return places.find(near);
}

function renderWorld() {
  const { area, x, y, visited } = game.world;
  const district = DISTRICTS[area];
  byId("district-name").textContent = district.name;
  byId("district-copy").textContent = district.scene;
  byId("world-map").className = `world-map ${district.id}`;
  byId("world-map").setAttribute("aria-label", `${district.name}, Bernd auf Spalte ${x + 1}, Zeile ${y + 1}. Schematische Spielkarte.`);
  const tiles = document.createDocumentFragment();
  MAPS[area].forEach((row, tileY) => [...row].forEach((terrain, tileX) => {
    const tile = document.createElement("span");
    tile.className = `map-tile ${terrain === "#" ? "building" : terrain === "~" ? "water" : "street"}`;
    tile.setAttribute("aria-hidden", "true");
    const stop = STOPS.findIndex((point) => point.x === tileX && point.y === tileY);
    if (stop !== -1) {
      tile.textContent = visited.includes(`${area}-${stop}`) ? "✓" : "★";
      tile.classList.add("map-stop");
    }
    if (tileY === 5) {
      if (tileX === 0 || tileX === 15) tile.textContent = "↔";
      if (tileX === 5) tile.textContent = "€";
      if (tileX === 8) tile.textContent = "⚑";
      if (tileX === 10) tile.textContent = "♥";
    }
    if (tileX === x && tileY === y) {
      const portrait = document.createElement("img");
      portrait.src = "assets/knauer-portrait.svg";
      portrait.alt = "";
      tile.replaceChildren(portrait);
      tile.classList.add("player");
    }
    tiles.append(tile);
  }));
  byId("world-map").replaceChildren(tiles);
  const place = nearbyPlace();
  byId("world-hint").textContent = game.battle ? "Im Kampf pausiert der Spaziergang. Nutze die Kampfaktionen unten." : place ? `In Reichweite: ${place.label}. E oder „Interagieren“ drücken.` : "Folge den Wegen. Die Sterne markieren Bild- und Spruchstationen.";
  byId("interact-button").disabled = Boolean(game.battle) || !place;
  document.querySelectorAll("[data-travel]").forEach((button) => {
    button.disabled = Boolean(game.battle) || Number(button.dataset.travel) === area;
    button.setAttribute("aria-pressed", String(Number(button.dataset.travel) === area));
  });
  document.querySelectorAll("[data-move]").forEach((button) => { button.disabled = Boolean(game.battle); });
}

function renderCollection() {
  byId("collection-count").textContent = `${game.world.visited.length} / 12 Stationen entdeckt`;
  const list = byId("memory-gallery");
  list.replaceChildren();
  DISTRICTS.forEach((district, area) => district.stops.forEach((stop, index) => {
    const image = SCENE_IMAGES[(area + index) % SCENE_IMAGES.length];
    const card = document.createElement("figure");
    card.className = "memory-card";
    const photo = document.createElement("img");
    photo.src = image.src;
    photo.alt = image.label;
    photo.loading = "lazy";
    const caption = document.createElement("figcaption");
    const title = document.createElement("strong");
    title.textContent = `${game.world.visited.includes(`${area}-${index}`) ? "✓ " : ""}${district.name} · ${stop}`;
    const saying = document.createElement("p");
    saying.textContent = district.sayings[index];
    const note = document.createElement("small");
    note.textContent = `${image.label}. Fiktiver Spielspruch; keine Aufnahme dieses Ortes.`;
    caption.append(title, saying, note);
    card.append(photo, caption);
    list.append(card);
  }));
  const sayings = DISTRICTS.flatMap((district) => district.sayings);
  byId("bernd-saying").textContent = sayings[sayingIndex % sayings.length];
}

function moveBernd(dx, dy) {
  if (game.battle) return;
  const { area, x, y } = game.world;
  if (MAPS[area][y + dy]?.[x + dx] !== ".") return;
  game.world.x += dx;
  game.world.y += dy;
  renderWorld();
  saveGame();
}

function travelTo(area) {
  if (game.battle || !DISTRICTS[area] || area === game.world.area) return;
  Object.assign(game.world, { area, x: 2, y: 5 });
  addLog(`Bernd ist jetzt in ${DISTRICTS[area].name}. Die Tour geht weiter.`);
  render();
}

function interact() {
  if (game.battle) return;
  const place = nearbyPlace();
  if (!place) return;
  if (place.kind === "travel") return travelTo(place.destination);
  if (place.kind === "work") return earnMoney();
  if (place.kind === "rest") return rest();
  if (place.kind === "fight") return startBattle();
  const { area, visited } = game.world;
  const id = `${area}-${place.index}`;
  sayingIndex = area * 3 + place.index;
  if (!visited.includes(id)) {
    visited.push(id);
    game.cash += 5;
    gainXp(5);
    addLog(`${DISTRICTS[area].name} · ${place.label} entdeckt: +5 XP und +5 €. Spielspruch: ${DISTRICTS[area].sayings[place.index]}`);
  } else {
    addLog(`Spielszene am Ort ${place.label}: ${DISTRICTS[area].sayings[place.index]}`);
  }
  render();
}

function renderGear() {
  const list = byId("gear-list");
  list.replaceChildren();
  const equipped = [
    { label: "Waffe", item: game.equipment.weapon, stat: `+${weaponAttack()} Angriff` },
    { label: "Schutz", item: game.equipment.armor, stat: `−${armorDefense()} Schaden` },
  ];
  for (const slot of equipped) {
    const item = document.createElement("li");
    item.className = "gear-item";
    const name = document.createElement("span");
    name.textContent = `${slot.label}: ${slot.item?.name ?? "nichts"}`;
    const stat = document.createElement("span");
    stat.className = "gear-stat";
    stat.textContent = slot.stat;
    item.append(name, stat);
    list.append(item);
  }
}

function renderShop() {
  const list = byId("shop-list");
  list.replaceChildren();
  for (const item of SHOP) {
    const owned = game.inventory.includes(item.id);
    const row = document.createElement("div");
    row.className = "shop-item";
    const description = document.createElement("div");
    const name = document.createElement("strong");
    name.textContent = item.name;
    const stats = document.createElement("small");
    stats.textContent = item.attack ? `Waffe · +${item.attack} Angriff` : `Schutz · −${item.defense} Schaden`;
    description.append(name, stats);
    const button = document.createElement("button");
    button.className = "buy-button";
    button.type = "button";
    button.textContent = owned ? "Gekauft" : money(item.cost);
    button.disabled = owned || game.cash < item.cost || Boolean(game.battle) || game.bossDefeated;
    button.setAttribute("aria-label", owned ? `${item.name} bereits gekauft` : `${item.name} für ${money(item.cost)} kaufen`);
    button.addEventListener("click", () => buyItem(item.id));
    row.append(description, button);
    list.append(row);
  }
}

function renderLog() {
  const list = byId("log-list");
  list.replaceChildren();
  for (const entry of game.log) {
    const item = document.createElement("li");
    item.textContent = entry;
    list.append(item);
  }
}

function advanceDay() {
  game.day += 1;
}

function earnMoney() {
  if (game.battle || game.bossDefeated) return;
  advanceDay();
  game.cash += 20;
  addLog("Nebenjob erledigt: 20 € in der Tasche. Ein langer Tag im Viertel.");
  render();
}

function rest() {
  const maxHealth = 100 + (game.level - 1) * 20;
  if (game.battle || game.bossDefeated || game.health >= maxHealth) return;
  const recovered = Math.min(30, maxHealth - game.health);
  game.health += recovered;
  advanceDay();
  addLog(`Die Gang kommt zu Kräften: ${recovered} Gesundheit zurückgewonnen.`);
  render();
}

function startBattle(isBoss = false) {
  if (game.battle || game.bossDefeated || game.health <= 0) return;
  if (isBoss && game.wins < 5) return;
  const enemy = isBoss ? BOSS : ENEMIES[Math.floor(Math.random() * ENEMIES.length)];
  game.battle = { ...enemy, maxHealth: enemy.health };
  guarding = false;
  advanceDay();
  addLog(isBoss ? "Der Showdown beginnt: Die Laboe Blue Brothers stellen sich Bernd entgegen." : `${enemy.name} legt sich mit deiner Gang an.`);
  render();
}

function enemyTurn() {
  if (!game.battle) return;
  const damage = Math.max(1, game.battle.attack - armorDefense() - (guarding ? 8 : 0));
  game.health = Math.max(0, game.health - damage);
  guarding = false;
  if (game.health <= 0) {
    const lostCash = Math.min(game.cash, 10);
    game.cash -= lostCash;
    game.battle = null;
    addLog(`Bernd muss sich zurückziehen und verliert ${money(lostCash)}. Ruh dich aus, bevor du wieder losziehst.`);
    return;
  }
  addLog(`${game.battle.name} trifft Bernd für ${damage} Schaden.`);
}

function attack() {
  if (!game.battle || game.health <= 0) return;
  const damage = 12 + Math.floor(Math.random() * 7) + weaponAttack() + Math.floor((game.level - 1) * 1.5);
  game.battle.health -= damage;
  if (game.battle.health <= 0) {
    winBattle();
    render();
    return;
  }
  addLog(`Bernd landet einen Treffer für ${damage} Schaden.`);
  enemyTurn();
  render();
}

function guard() {
  if (!game.battle || game.health <= 0) return;
  guarding = true;
  addLog("Bernd geht in Deckung und wartet auf den Angriff.");
  enemyTurn();
  render();
}

function escape() {
  if (!game.battle) return;
  const enemyName = game.battle.name;
  game.battle = null;
  guarding = false;
  addLog(`Die Gang zieht sich vor ${enemyName} zurück. Morgen ist auch noch ein Tag.`);
  render();
}

function winBattle() {
  const enemy = game.battle;
  game.battle = null;
  guarding = false;
  game.wins += 1;
  game.cash += enemy.cash;
  gainXp(enemy.xp);
  addLog(`${enemy.name} geschlagen! +${enemy.xp} XP, +${money(enemy.cash)} und ein Sieg für die Gang.`);
  const rank = currentRank();
  if (game.wins === rank.wins) addLog(`Beförderung: Du bist jetzt ${rank.name}.`);
  if (enemy.boss) {
    game.bossDefeated = true;
    addLog("Die Laboe Blue Brothers sind geschlagen. Das Viertel gehört jetzt Bernd Knauer.");
  }
}

function buyItem(id) {
  const item = SHOP.find((entry) => entry.id === id);
  if (!item || game.inventory.includes(id) || game.cash < item.cost || game.battle || game.bossDefeated) return;
  game.cash -= item.cost;
  game.inventory.push(item.id);
  if (item.attack) game.equipment.weapon = item;
  else game.equipment.armor = item;
  addLog(`${item.name} gekauft und angelegt. Deine Gang ist jetzt besser ausgerüstet.`);
  render();
}

byId("work-button").addEventListener("click", earnMoney);
byId("fight-button").addEventListener("click", () => startBattle());
byId("rest-button").addEventListener("click", rest);
byId("boss-button").addEventListener("click", () => startBattle(true));
byId("attack-button").addEventListener("click", attack);
byId("guard-button").addEventListener("click", guard);
byId("escape-button").addEventListener("click", escape);
byId("interact-button").addEventListener("click", interact);
byId("saying-button").addEventListener("click", () => {
  sayingIndex += 1;
  renderCollection();
});
document.querySelectorAll("[data-travel]").forEach((button) => {
  button.addEventListener("click", () => travelTo(Number(button.dataset.travel)));
});
document.querySelectorAll("[data-move]").forEach((button) => {
  button.addEventListener("click", () => moveBernd(...button.dataset.move.split(",").map(Number)));
});
byId("world-map").addEventListener("keydown", (event) => {
  if (event.altKey || event.ctrlKey || event.metaKey) return;
  const moves = { w: [0, -1], a: [-1, 0], s: [0, 1], d: [1, 0], arrowup: [0, -1], arrowleft: [-1, 0], arrowdown: [0, 1], arrowright: [1, 0] };
  const key = event.key.toLowerCase();
  if (moves[key]) {
    event.preventDefault();
    moveBernd(...moves[key]);
  } else if (key === "e" || key === " ") {
    event.preventDefault();
    if (!event.repeat) interact();
  }
});
byId("reset-button").addEventListener("click", () => {
  if (!window.confirm("Wirklich ein neues Spiel starten? Dein Spielstand wird gelöscht.")) return;
  game = newGame();
  sayingIndex = 0;
  render();
});

render();
