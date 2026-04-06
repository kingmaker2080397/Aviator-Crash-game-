let balance = 1000;
let currentMultiplier = 1.00;
let isPlaying = false;
let gameInterval;
let crashPoint;

const balanceDisplay = document.getElementById('balance');
const multiplierDisplay = document.getElementById('multiplier');
const betButton = document.getElementById('bet-button');
const cashoutButton = document.getElementById('cashout-button');
const resultDisplay = document.getElementById('result');
const betInput = document.getElementById('bet-amount');

betButton.addEventListener('click', () => {
    const betAmount = parseFloat(betInput.value);

    if (betAmount > 0 && balance >= betAmount) {
        // Start Game
        balance -= betAmount;
        balanceDisplay.innerText = balance;
        
        isPlaying = true;
        currentMultiplier = 1.00;
        crashPoint = (Math.random() * 5 + 1).toFixed(2); // Random crash between 1x and 6x
        
        betButton.disabled = true;
        cashoutButton.disabled = false;
        resultDisplay.innerText = "Flying...";
        resultDisplay.style.color = "#aaa";

        gameInterval = setInterval(() => {
            currentMultiplier += 0.01;
            multiplierDisplay.innerText = currentMultiplier.toFixed(2) + "x";

            if (currentMultiplier >= crashPoint) {
                crashGame();
            }
        }, 100);
    } else {
        alert("Invalid Balance!");
    }
});

cashoutButton.addEventListener('click', () => {
    if (isPlaying) {
        const winAmount = parseFloat(betInput.value) * currentMultiplier;
        balance += winAmount;
        balanceDisplay.innerText = balance.toFixed(2);
        
        resultDisplay.innerText = `Won: ₹${winAmount.toFixed(2)}`;
        resultDisplay.style.color = "#4caf50";
        resetGame();
    }
});

function crashGame() {
    resultDisplay.innerText = `Crashed at ${currentMultiplier.toFixed(2)}x`;
    resultDisplay.style.color = "#f44336";
    resetGame();
}

function resetGame() {
    clearInterval(gameInterval);
    isPlaying = false;
    betButton.disabled = false;
    cashoutButton.disabled = true;
                                           }
                                            
