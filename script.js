const baseNames = ["the_fool", "the_magician", "the_high_priestess", "the_empress", "the_emperor", "the_hierophant", "the_lovers", "the_chariot", "strength", "the_hermit", "wheel_of_fortune", "justice", "the_hanged_man", "death", "temperance", "the_devil", "the_tower", "the_star", "the_moon", "the_sun", "judgement", "the_world"];
let arcanaDeck = baseNames.map(name => ({ name: name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), id: name }));

let targetCard = null, currentRound = 1, score = 0, cardsInPlay = 22, gameHistory = [];
let deckSuffix = "", deckExt = ".png";
const maxRounds = 5;

window.onload = () => {
    document.getElementById('deck-enhanced').onclick = () => setDeck('enhanced');
    document.getElementById('deck-classic').onclick = () => setDeck('classic');
    document.getElementById('btn-easy').addEventListener('click', () => unlockAndStart(2));
    document.getElementById('btn-medium').addEventListener('click', () => unlockAndStart(5));
    document.getElementById('btn-hard').addEventListener('click', () => unlockAndStart(22));
    document.getElementById('restart-btn').addEventListener('click', showStartScreen);
    document.getElementById('next-round-btn').addEventListener('click', advanceRound);
};

function setDeck(type) {
    if ((type === 'classic' && deckSuffix === '_classic') || (type === 'enhanced' && deckSuffix === '')) return;

    deckSuffix = (type === 'classic') ? "_classic" : "";
    deckExt = (type === 'classic') ? ".jpg" : ".png";
    
    document.getElementById('deck-enhanced').classList.toggle('active', type === 'enhanced');
    document.getElementById('deck-classic').classList.toggle('active', type === 'classic');

    const mask = document.getElementById('card-mask');
    mask.style.transition = 'opacity 0.3s ease-in-out';
    mask.style.opacity = '0'; 
    
    setTimeout(() => {
        mask.src = `darkodeck/${type === 'classic' ? 'classic_deck_back' : 'darko_deck_back'}${deckExt}`;
        mask.style.opacity = '1';
        setTimeout(() => {
            mask.style.transition = 'none'; // We remove transition because we use animations now
            mask.style.opacity = ''; 
        }, 300);
    }, 300);
}

function unlockAndStart(diff) {
    ['reveal-sfx', 'success-sfx', 'fail-sfx'].forEach(id => {
        let a = document.getElementById(id);
        a.play().then(() => { a.pause(); a.currentTime = 0; }).catch(() => {});
    });
    startGame(diff);
}

function hideAllScreens() { document.querySelectorAll('.game-screen').forEach(s => s.classList.add('hidden')); }
function showStartScreen() { hideAllScreens(); document.getElementById('start-screen').classList.remove('hidden'); }
function startGame(diff) { cardsInPlay = diff; currentRound = 1; score = 0; gameHistory = []; initGame(); }

function initGame() {
    hideAllScreens();
    document.getElementById('scrying-state').classList.remove('hidden');
    document.getElementById('round-tracker').innerText = `Round ${currentRound} of ${maxRounds}`;

    const mask = document.getElementById('card-mask');
    mask.src = `darkodeck/${deckSuffix === "_classic" ? 'classic_deck_back' : 'darko_deck_back'}${deckExt}`;
    mask.style.transition = 'none'; mask.classList.remove('dissolving', 'wobble'); 
    
    targetCard = arcanaDeck[Math.floor(Math.random() * arcanaDeck.length)];
    document.getElementById('target-card').src = `darkodeck/${targetCard.id}${deckSuffix}${deckExt}`;
    
    let gridCards = [targetCard];
    let remaining = arcanaDeck.filter(c => c.name !== targetCard.name).sort(() => Math.random() - 0.5);
    for (let i = 0; i < cardsInPlay - 1; i++) gridCards.push(remaining[i]);
    gridCards.sort(() => Math.random() - 0.5);

    const grid = document.getElementById('grid-selection');
    grid.innerHTML = ''; 
    gridCards.forEach(card => {
        let img = document.createElement('img');
        img.src = `darkodeck/${card.id}${deckSuffix}${deckExt}`;
        img.className = 'grid-card';
        // Pass 'this' (the image element) to apply the glow to it
        img.onclick = function() { handleGuess(card.name, this); };
        grid.appendChild(img);
    });
}

document.getElementById('ready-btn').addEventListener('click', () => { hideAllScreens(); document.getElementById('selection-state').classList.remove('hidden'); });

function handleGuess(guessedCardName, clickedCardElement) {
    const isCorrect = guessedCardName === targetCard.name;
    
    // 1. Apply the Aura flash immediately to the clicked card
    clickedCardElement.classList.add(isCorrect ? 'correct-glow' : 'wrong-glow');
    
    // Disable pointer events on the grid to prevent double-clicking while waiting
    document.getElementById('grid-selection').style.pointerEvents = 'none';

    // 2. Wait a moment to let the player see the flash before clearing the screen
    setTimeout(() => {
        hideAllScreens();
        document.getElementById('revealing-state').classList.remove('hidden');
        document.getElementById('reveal-sfx').play();
        
        gameHistory.push({ round: currentRound, guessed: guessedCardName, actual: targetCard.name, isCorrect: isCorrect });

        const mask = document.getElementById('card-mask');
        mask.classList.add('wobble');
        
        // 3. Stop wobble and start Ethereal Smoke dissolve
        setTimeout(() => { 
            mask.classList.remove('wobble'); 
            mask.classList.add('dissolving'); 
        }, 800);
        
        // 4. Show the result messages after the smoke clears (2 seconds)
        setTimeout(() => {
            document.getElementById('revealing-state').classList.add('hidden');
            const msg = document.getElementById('message-text');
            if (isCorrect) {
                score++;
                msg.innerText = `The veil lifts. You sensed ${targetCard.name}.`;
                document.getElementById('success-sfx').play();
            } else {
                msg.innerText = `Shadows clouded your vision. It was ${targetCard.name}.`;
                document.getElementById('fail-sfx').play();
            }
            document.getElementById('message-area').classList.remove('hidden');
            
            // Re-enable pointer events for the next round
            document.getElementById('grid-selection').style.pointerEvents = 'auto';
            
            setTimeout(() => document.getElementById('next-round-btn').classList.remove('hidden'), 1000);
        }, 2800); 
    }, 700); // 700ms pause to admire the aura glow
}

function advanceRound() { currentRound < maxRounds ? (currentRound++, initGame()) : showEndScreen(); }
function showEndScreen() {
    hideAllScreens();
    document.getElementById('final-score').innerText = `Spiritual Resonance: ${score} / ${maxRounds}`;
    let historyHtml = '<div id="journal-log"><h4>Your Readings:</h4>';
    gameHistory.forEach(h => historyHtml += `<p>${h.isCorrect ? '✨' : '🌑'} R${h.round}: ${h.guessed} / ${h.actual}</p>`);
    historyHtml += '</div>';
    document.getElementById('final-verdict').innerHTML = historyHtml;
    document.getElementById('end-screen').classList.remove('hidden');
}