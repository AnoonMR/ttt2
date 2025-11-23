// ---------- GAME SETUP ----------
const cells = document.querySelectorAll(".cell");
const statusText = document.getElementById("status");
const resetBtn = document.getElementById("reset-btn");
const modeAiBtn = document.getElementById("mode-ai");
const mode2pBtn = document.getElementById("mode-2p");
const aiInfoBox = document.getElementById("ai-info");
const aiDetails = document.getElementById("ai-details");

let board = ["", "", "", "", "", "", "", "", ""];
let currentPlayer = "X";
let isGameOver = false;

// Modes: "ai" or "2p"
let mode = "ai";

// Define players for AI mode
const humanPlayer = "X";
const aiPlayer = "O";

// Winning patterns
const winPatterns = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

// ---------- EVENT LISTENERS ----------
cells.forEach((cell) => {
  cell.addEventListener("click", onCellClick);
});

resetBtn.addEventListener("click", resetGame);

modeAiBtn.addEventListener("click", () => {
  if (mode !== "ai") {
    mode = "ai";
    modeAiBtn.classList.add("active");
    mode2pBtn.classList.remove("active");
    aiInfoBox.classList.remove("muted");
    resetGame();
  }
});

mode2pBtn.addEventListener("click", () => {
  if (mode !== "2p") {
    mode = "2p";
    mode2pBtn.classList.add("active");
    modeAiBtn.classList.remove("active");
    aiInfoBox.classList.add("muted");
    aiDetails.textContent =
      "Currently in 2 Player mode. Switch back to Vs AI to see Minimax details.";
    resetGame();
  }
});

// ---------- UI HELPERS ----------
function updateBoardUI() {
  cells.forEach((cell, index) => {
    cell.textContent = board[index];
    if (board[index] !== "") {
      cell.classList.add("taken");
    } else {
      cell.classList.remove("taken");
    }
  });
}

function updateStatus(message) {
  if (message) {
    statusText.textContent = message;
    return;
  }

  const modeLabel = mode === "ai" ? "Vs AI" : "2 Player";
  if (isGameOver) {
    // Don't overwrite final status
    return;
  }
  statusText.textContent = `Mode: ${modeLabel} | Turn: ${currentPlayer}`;
}

function highlightWin(pattern) {
  pattern.forEach((index) => {
    cells[index].classList.add("win");
  });
}

// ---------- GAME LOGIC ----------
function onCellClick(e) {
  const index = parseInt(e.target.getAttribute("data-index"), 10);

  if (isGameOver || board[index] !== "") return;

  if (mode === "ai") {
    // Human plays only as X
    if (currentPlayer !== humanPlayer) return;

    makeMove(index, currentPlayer);

    const winner = checkWinner(board);
    if (winner || isBoardFull(board)) {
      endGame(winner);
      return;
    }

    currentPlayer = aiPlayer;
    updateStatus();

    // Small delay for visual clarity
    setTimeout(() => {
      aiMove();
    }, 250);
  } else {
    // 2 Player mode
    makeMove(index, currentPlayer);

    const winner = checkWinner(board);
    if (winner || isBoardFull(board)) {
      endGame(winner);
      return;
    }

    currentPlayer = currentPlayer === "X" ? "O" : "X";
    updateStatus();
  }
}

function makeMove(index, player) {
  board[index] = player;
  updateBoardUI();
}

function endGame(winner) {
  isGameOver = true;

  if (winner) {
    const pattern = getWinningPattern(board);
    if (pattern) {
      highlightWin(pattern);
    }
    updateStatus(`Game Over: ${winner} wins!`);
  } else {
    updateStatus("Game Over: It's a draw!");
  }
}

// ---------- CHECK FUNCTIONS ----------
function checkWinner(b) {
  for (let pattern of winPatterns) {
    const [a, c, d] = pattern;
    if (b[a] && b[a] === b[c] && b[a] === b[d]) {
      return b[a]; // "X" or "O"
    }
  }
  return null;
}

function getWinningPattern(b) {
  for (let pattern of winPatterns) {
    const [a, c, d] = pattern;
    if (b[a] && b[a] === b[c] && b[a] === b[d]) {
      return pattern;
    }
  }
  return null;
}

function isBoardFull(b) {
  return b.every((cell) => cell !== "");
}

// ---------- MINIMAX IMPLEMENTATION ----------
function aiMove() {
  // Get best move using minimax
  const result = getBestMove(board);
  const bestIndex = result.index;

  if (bestIndex === -1) {
    // No moves left (should not really happen because we checked before)
    const winner = checkWinner(board);
    endGame(winner);
    return;
  }

  makeMove(bestIndex, aiPlayer);

  // Show some info about minimax calculation
  aiDetails.textContent =
    `AI used Minimax and evaluated ${result.nodesExplored} possible board states. ` +
    `Best move score: ${result.bestScore}. (AI is '${aiPlayer}', Human is '${humanPlayer}')`;

  const winner = checkWinner(board);
  if (winner || isBoardFull(board)) {
    endGame(winner);
    return;
  }

  currentPlayer = humanPlayer;
  updateStatus();
}

// Wrapper to choose best move
function getBestMove(b) {
  let bestScore = -Infinity;
  let bestIndex = -1;

  const nodesCounter = { count: 0 };

  for (let i = 0; i < 9; i++) {
    if (b[i] === "") {
      b[i] = aiPlayer;
      const score = minimax(b, 0, false, nodesCounter);
      b[i] = "";

      if (score > bestScore) {
        bestScore = score;
        bestIndex = i;
      }
    }
  }

  return {
    index: bestIndex,
    bestScore: bestScore,
    nodesExplored: nodesCounter.count,
  };
}

/**
 * Minimax function
 * b: current board
 * depth: recursion depth
 * isMaximizing: true if it's AI's turn, false if human's turn
 * nodesCounter: object to count how many nodes were explored
 */
function minimax(b, depth, isMaximizing, nodesCounter) {
  nodesCounter.count++;

  const winner = checkWinner(b);
  if (winner === aiPlayer) {
    // The sooner AI wins, the higher the score
    return 10 - depth;
  } else if (winner === humanPlayer) {
    // The later AI loses, the better (less negative)
    return depth - 10;
  } else if (isBoardFull(b)) {
    return 0; // Draw
  }

  if (isMaximizing) {
    let best = -Infinity;
    for (let i = 0; i < 9; i++) {
      if (b[i] === "") {
        b[i] = aiPlayer;
        const value = minimax(b, depth + 1, false, nodesCounter);
        b[i] = "";
        best = Math.max(best, value);
      }
    }
    return best;
  } else {
    let best = Infinity;
    for (let i = 0; i < 9; i++) {
      if (b[i] === "") {
        b[i] = humanPlayer;
        const value = minimax(b, depth + 1, true, nodesCounter);
        b[i] = "";
        best = Math.min(best, value);
      }
    }
    return best;
  }
}

// ---------- RESET ----------
function resetGame() {
  board = ["", "", "", "", "", "", "", "", ""];
  currentPlayer = "X";
  isGameOver = false;

  cells.forEach((cell) => {
    cell.classList.remove("win");
  });

  updateBoardUI();

  const modeLabel = mode === "ai" ? "Vs AI" : "2 Player";
  updateStatus(`Mode: ${modeLabel} | Turn: ${currentPlayer}`);

  if (mode === "ai") {
    aiDetails.textContent =
      "When you play your move (as 'X'), the AI ('O') will use Minimax to choose its best response. " +
      "This panel shows how many positions it checked.";
  }
}

// Start fresh
resetGame();
