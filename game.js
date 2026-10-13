const STORAGE_KEY = "bernd-knauer-rpg-save";
const SHOP = [
  { id: "knueppel", name: "Kanal-Knüppel", kind: "Waffe", cost: 35, attack: 4 },
  { id: "jacke", name: "Lederjacke", kind: "Schutz", cost: 45, defense: 3 },
  { id: "kette", name: "Schwere Kette", kind: "Waffe", cost: 80, attack: 8 },
  { id: "weste", name: "Motorradweste", kind: "Schutz", cost: 100, defense: 7 },
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
];
const BOSS = {
  name: "Laboe Blue Brothers – Anführer",
  health: 105,
  attack: 15,
  xp: 100,
  cash: 150,
  boss: true,
};

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
    log: ["Bernd und seine Gang machen sich auf, das Viertel zurückzuerobern."],
  };
}

function loadGame() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && typeof saved === "object") {
      return { ...newGame(), ...saved, battle: null };
    }
  } catch {
    // Ignore invalid or unavailable local save data and start a fresh game.
  }
  return newGame();
}

let game = loadGame();
let guarding = false;

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
  saveGame();
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
byId("reset-button").addEventListener("click", () => {
  if (!window.confirm("Wirklich ein neues Spiel starten? Dein Spielstand wird gelöscht.")) return;
  game = newGame();
  render();
});

render();
