/* ===========================
   imposter Party - script.js
   =========================== */

/* State */
let roles = [];
let currentPlayer = 0;
let playerNames = [];
let countdown = 60;
let timer = null;

/* Elements */
const setupScreen = () => document.getElementById("setupScreen");
const playerListScreen = () => document.getElementById("playerListScreen");
const revealScreen = () => document.getElementById("revealScreen");
const timerScreen = () => document.getElementById("timerScreen");
const finalScreen = () => document.getElementById("finalScreen");

const playerCountInput = () => document.getElementById("playerCount");
const imposterCountInput = () => document.getElementById("imposterCount");
const wordListInput = () => document.getElementById("wordList");
const fakeWordInput = () => document.getElementById("fakeWord");
const timerLengthInput = () => document.getElementById("timerLength");

const playerPreview = () => document.getElementById("playerPreview");
const playerListContainer = () => document.getElementById("playerList");

const playerHeader = () => document.getElementById("playerHeader");
const roleTextEl = () => document.getElementById("roleText");
const roleHiddenEl = () => document.getElementById("roleHidden");
const revealBtn = () => document.getElementById("revealBtn");
const nextBtn = () => document.getElementById("nextBtn");

const timerDisplay = () => document.getElementById("timerDisplay");
const stopTimerBtn = () => document.getElementById("stopTimerBtn");
const showimpostersBtn = () => document.getElementById("showimpostersBtn");

const imposterList = () => document.getElementById("imposterList");
const confettiLayer = () => document.getElementById("confettiLayer");

/* Init on DOM ready */
document.addEventListener("DOMContentLoaded", () => {
  bindSetupButtons();
  generatePlayerPreview();
});

/* ----------------------
   Setup bindings
   ---------------------- */
function bindSetupButtons() {
  document.getElementById("editPlayersBtn").addEventListener("click", openPlayerList);
  document.getElementById("startBtn").addEventListener("click", startGame);
  document.getElementById("addPlayerBtn").addEventListener("click", addPlayer);
  document.getElementById("donePlayersBtn").addEventListener("click", closePlayerList);
  document.getElementById("addPlayerBtn")?.addEventListener("click", addPlayer);
  document.getElementById("startBtn").addEventListener("click", startGame);
  document.getElementById("newGameClearBtn").addEventListener("click", clearAll);

  playerCountInput().addEventListener("input", onPlayerCountChanged);

  // reveal screen
  revealBtn().addEventListener("click", toggleReveal);
  nextBtn().addEventListener("click", onNextPlayer);

  // timer screen
  stopTimerBtn().addEventListener("click", stopTimerEarly);
  showimpostersBtn().addEventListener("click", showimposters);

  // final screen controls
  document.getElementById("playAgainBtn").addEventListener("click", playAgain);
  document.getElementById("resetBtn").addEventListener("click", resetEverything);
}

/* ----------------------
   Player list editor
   ---------------------- */
function openPlayerList() {
  // ensure playerNames array matches count
  const count = Math.max(0, parseInt(playerCountInput().value || 0));
  while (playerNames.length < count) playerNames.push(`Player ${playerNames.length+1}`);
  playerNames = playerNames.slice(0, count);

  renderPlayerList();
  setupScreen().classList.add("hidden");
  playerListScreen().classList.remove("hidden");
}

function renderPlayerList() {
  const container = playerListContainer();
  container.innerHTML = "";
  playerNames.forEach((name, i) => {
    const row = document.createElement("div");
    row.className = "player-row";

    const input = document.createElement("input");
    input.value = name;
    input.placeholder = `Player ${i+1}`;
    input.addEventListener("input", () => { playerNames[i] = input.value || `Player ${i+1}`; generatePlayerPreview(); });

    const removeBtn = document.createElement("button");
    removeBtn.textContent = "✖";
    removeBtn.className = "btn ghost";
    removeBtn.style.padding = "8px 10px";
    removeBtn.addEventListener("click", () => { playerNames.splice(i,1); renderPlayerList(); generatePlayerPreview(); });

    row.appendChild(input);
    row.appendChild(removeBtn);
    container.appendChild(row);
  });
}

function addPlayer() {
  playerNames.push(`Player ${playerNames.length+1}`);
  renderPlayerList();
  generatePlayerPreview();
}

function closePlayerList() {
  // ensure count input syncs
  playerCountInput().value = playerNames.length;
  playerListScreen().classList.add("hidden");
  setupScreen().classList.remove("hidden");
}

/* preview little pills under setup */
function generatePlayerPreview() {
  const count = Math.max(3, parseInt(playerCountInput().value || 3));
  const container = playerPreview();
  container.innerHTML = "";
  // prefer names if available
  for (let i=0;i<count;i++){
    const pill = document.createElement("div");
    pill.className = "pill";
    pill.textContent = playerNames[i] || `Player ${i+1}`;
    container.appendChild(pill);
  }
}

/* when number changed, update preview and names array */
function onPlayerCountChanged(){
  const newCount = Math.max(3, parseInt(playerCountInput().value || 3));
  playerCountInput().value = newCount;
  if (playerNames.length > newCount) playerNames = playerNames.slice(0,newCount);
  while (playerNames.length < newCount) playerNames.push(`Player ${playerNames.length+1}`);
  generatePlayerPreview();
}

/* Clear all fields */
function clearAll(){
  playerNames = [];
  playerCountInput().value = 5;
  imposterCountInput().value = 1;
  wordListInput().value = "apple, castle, astronaut, coffee, concert";
  timerLengthInput().value = 60;
  fakeWordInput().value = "Imposter";
  generatePlayerPreview();
}

/* ----------------------
   Game start & role creation
   ---------------------- */
function startGame(){
  // pull current settings (do not destroy them)
  const playerCount = Math.max(3, parseInt(playerCountInput().value || 3));
  const imposterCount = Math.max(1, parseInt(imposterCountInput().value || 1));
  const rawWords = wordListInput().value || "";
  const fakeWord = (fakeWordInput().value || "Imposter");
  const words = rawWords.split(/[\n,]+/).map(s=>s.trim()).filter(Boolean);
  const chosenWord = words.length ? words[Math.floor(Math.random()*words.length)] : "WORD";

  // ensure playerNames length
  while (playerNames.length < playerCount) playerNames.push(`Player ${playerNames.length+1}`);
  playerNames = playerNames.slice(0, playerCount);

  // pick imposters
  const imposterIndexes = new Set();
  while (imposterIndexes.size < Math.min(imposterCount, playerCount)) {
    imposterIndexes.add(Math.floor(Math.random()*playerCount));
  }

  // build roles
  roles = [];
  for (let i=0;i<playerCount;i++){
    const isimposter = imposterIndexes.has(i);
    roles.push({
      name: playerNames[i] || `Player ${i+1}`,
      isimposter,
      word: isimposter ? fakeWord : chosenWord
    });
  }

  // set timer length
  countdown = Math.max(10, parseInt(timerLengthInput().value || 60));

  // start reveal flow
  currentPlayer = 0;
  setupScreen().classList.add("hidden");
  playerListScreen().classList.add("hidden");
  finalScreen().classList.add("hidden");

  showRevealScreen();
}

/* ----------------------
   Reveal flow (pass the phone)
   ---------------------- */
function showRevealScreen(){
  revealScreen().classList.remove("hidden");
  playerHeader().innerText = roles[currentPlayer].name;
  roleTextEl().innerText = roles[currentPlayer].word;
  hideRoleText(); // hide by default
  roleHiddenEl().classList.remove("hidden");
  revealBtn().innerText = "Show My Word";
  // ensure next button disabled until they reveal maybe? We'll allow always.
}

/* Toggle reveal/hide word */
function toggleReveal(){
  const rt = roleTextEl();
  const rh = roleHiddenEl();
  if (rt.classList.contains("hidden")){
    rt.classList.remove("hidden");
    rh.classList.add("hidden");
    revealBtn().innerText = "Hide My Word";
    // subtle confetti for non-imposter? optional - reserved for final reveal
  } else {
    rt.classList.add("hidden");
    rh.classList.remove("hidden");
    revealBtn().innerText = "Show My Word";
  }
}

/* go to next player or start timer */
function onNextPlayer(){
  currentPlayer++;
  if (currentPlayer >= roles.length){
    // move to timer screen
    revealScreen().classList.add("hidden");
    startTimerScreen();
  } else {
    // show next player's reveal card
    playerHeader().innerText = roles[currentPlayer].name;
    roleTextEl().innerText = roles[currentPlayer].word;
    hideRoleText();
    roleHiddenEl().classList.remove("hidden");
    revealBtn().innerText = "Show My Word";
  }
}

function hideRoleText(){
  roleTextEl().classList.add("hidden");
}

/* ----------------------
   Timer logic
   ---------------------- */
function startTimerScreen(){
  timerScreen().classList.remove("hidden");
  showimpostersBtn().classList.add("hidden");
  timerDisplay().innerText = countdown;
  // clear any previous timer
  if (timer) { clearInterval(timer); timer = null; }
  let t = countdown;
  timerDisplay().innerText = t;
  timer = setInterval(() => {
    t--;
    timerDisplay().innerText = t;
    if (t <= 0){
      clearInterval(timer);
      timer = null;
      showimpostersBtn().classList.remove("hidden");
    }
  }, 1000);
}

/* Stop timer early */
function stopTimerEarly(){
  if (timer){ clearInterval(timer); timer = null; }
  timerDisplay().innerText = "0";
  showimpostersBtn().classList.remove("hidden");
}

/* ----------------------
   Final reveal
   ---------------------- */
function showimposters(){
  timerScreen().classList.add("hidden");
  finalScreen().classList.remove("hidden");

  // clear list and populate
  const list = imposterList();
  list.innerHTML = "";
  let found = false;
  roles.forEach(r=>{
    if (r.isimposter){
      const tag = document.createElement("div");
      tag.className = "imposter-tag";
      tag.innerText = r.name;
      list.appendChild(tag);
      found = true;
    }
  });

  // if no imposter found (shouldn't happen), show message
  if (!found){
    const p = document.createElement("p");
    p.innerText = "No imposters detected!";
    list.appendChild(p);
  }

  // confetti celebration
  launchConfetti();
}

/* ----------------------
   Play again & reset
   ---------------------- */
function playAgain(){
  // keep all settings as-is, reshuffle roles & pick new word
  finalScreen().classList.add("hidden");
  // pick new word & imposters using current settings
  startGame();
}

function resetEverything(){
  // reset to setup and clear roles
  roles = [];
  currentPlayer = 0;
  finalScreen().classList.add("hidden");
  timerScreen().classList.add("hidden");
  revealScreen().classList.add("hidden");
  playerListScreen().classList.add("hidden");
  setupScreen().classList.remove("hidden");
  // keep existing field values but do not clear them unless user uses Clear All
}

/* ----------------------
   Confetti (simple)
   ---------------------- */
function launchConfetti(){
  const layer = confettiLayer();
  if (!layer) return;
  layer.innerHTML = ""; // clear old
  const colors = ["#FF4F70","#FFCF6B","#4F9DFF","#7AF7C9","#C67BFF","#FF8EC8"];
  const count = 40;
  for (let i=0;i<count;i++){
    const el = document.createElement("div");
    el.className = "confetti";
    const size = Math.random()*10 + 8;
    el.style.position = "absolute";
    el.style.left = `${Math.random()*100}%`;
    el.style.top = `${-10 - Math.random()*20}%`;
    el.style.width = `${size}px`;
    el.style.height = `${size*0.6}px`;
    el.style.background = colors[Math.floor(Math.random()*colors.length)];
    el.style.opacity = `${0.9 - Math.random()*0.4}`;
    el.style.borderRadius = "2px";
    el.style.transform = `rotate(${Math.random()*360}deg)`;
    el.style.pointerEvents = "none";
    el.style.zIndex = 9999;
    layer.appendChild(el);

    // animate
    const duration = 2000 + Math.random()*1200;
    el.animate([
      { transform: `translateY(0) rotate(${Math.random()*360}deg)`, opacity:1 },
      { transform: `translateY(${window.innerHeight + 200}px) rotate(${Math.random()*720}deg)`, opacity:0.6 }
    ], { duration: duration, easing: "cubic-bezier(.2,.7,.2,1)" });

    // remove after done
    setTimeout(()=>{ try{ el.remove(); }catch(e){} }, duration + 50);
  }
}

/* End of script.js */
