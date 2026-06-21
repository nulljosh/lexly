// ============================================================
// Lingo Games Module
// Interactive mini-games: Chess, 2048, Memory, Minesweeper, Snake
// ============================================================

const GAMES_REGISTRY = {
    chess: { name: 'Chess', icon: 'fa-solid fa-chess-board', level: '2-Player' },
    game2048: { name: '2048', icon: 'fa-solid fa-table-cells-large', level: 'Puzzle' },
    memory: { name: 'Memory', icon: 'fa-solid fa-clone', level: 'Card Match' },
    minesweeper: { name: 'Minesweeper', icon: 'fa-solid fa-bomb', level: 'Classic' },
    snake: { name: 'Snake', icon: 'fa-solid fa-worm', level: 'Arcade' }
};

let activeGame = null;
let gameAnimFrame = null;
const GAME_SCORES_KEY = 'lingo.gameScores';

function loadGameScores() {
    try { return JSON.parse(localStorage.getItem(GAME_SCORES_KEY)) || {}; } catch (_) { return {}; }
}

function saveGameScore(gameId, score) {
    const scores = loadGameScores();
    if (!scores[gameId] || score > scores[gameId]) scores[gameId] = score;
    localStorage.setItem(GAME_SCORES_KEY, JSON.stringify(scores));
}

function getGameHighScore(gameId) {
    return loadGameScores()[gameId] || 0;
}

function trackGamePlayed(gameId) {
    const key = 'lingo.gamesPlayed';
    let played;
    try { played = JSON.parse(localStorage.getItem(key)) || []; } catch (_) { played = []; }
    if (!played.includes(gameId)) played.push(gameId);
    localStorage.setItem(key, JSON.stringify(played));
    return played;
}

function checkGameTrophies(gameId, score) {
    const played = trackGamePlayed(gameId);
    if (played.length >= 3 && typeof saveAchievement === 'function') saveAchievement('gamer');
    if (gameId === 'snake' && score >= 100) saveAchievement('snakemaster');
    if (gameId === 'game2048' && score >= 500) saveAchievement('puzzler');
    if (gameId === 'minesweeper') saveAchievement('minesweep');
    if (gameId === 'chess') saveAchievement('checkmate');
}

function isGameCategory(category) {
    return category === 'games';
}

function isGameSubject(subjectId) {
    return subjectId in GAMES_REGISTRY;
}

function startGame(gameId) {
    document.getElementById('subjectSelection').style.display = 'none';
    const container = document.getElementById('gameContainer');
    container.classList.add('active');
    container.textContent = '';
    activeGame = gameId;

    const header = document.createElement('div');
    header.className = 'game-header';

    const backBtn = document.createElement('button');
    backBtn.className = 'btn game-back-btn';
    const backIcon = document.createElement('i');
    backIcon.className = 'fa-solid fa-arrow-left';
    backBtn.appendChild(backIcon);
    backBtn.appendChild(document.createTextNode(' Back'));
    backBtn.addEventListener('click', exitGame);

    const title = document.createElement('h2');
    title.className = 'game-title';
    title.textContent = GAMES_REGISTRY[gameId].name;

    const restartBtn = document.createElement('button');
    restartBtn.className = 'btn game-restart-btn';
    const restartIcon = document.createElement('i');
    restartIcon.className = 'fa-solid fa-rotate-right';
    restartBtn.appendChild(restartIcon);
    restartBtn.addEventListener('click', () => startGame(gameId));

    header.appendChild(backBtn);
    header.appendChild(title);
    header.appendChild(restartBtn);
    container.appendChild(header);

    const board = document.createElement('div');
    board.className = 'game-board';
    board.id = 'gameBoard';
    container.appendChild(board);

    switch (gameId) {
        case 'chess': initChess(board); break;
        case 'game2048': init2048(board); break;
        case 'memory': initMemory(board); break;
        case 'minesweeper': initMinesweeper(board); break;
        case 'snake': initSnake(board); break;
    }
}

function exitGame() {
    if (gameAnimFrame) {
        cancelAnimationFrame(gameAnimFrame);
        gameAnimFrame = null;
    }
    activeGame = null;
    const container = document.getElementById('gameContainer');
    container.classList.remove('active');
    container.textContent = '';
    document.getElementById('subjectSelection').style.display = 'block';
    renderSubjects(gameState.selectedCategory);
}

function awardGameXP(amount) {
    gameState.xp += amount;
    updateStats();
    saveProgress({ xp: gameState.xp });
    const xpStat = document.querySelector('.stat-xp');
    if (xpStat) {
        xpStat.style.position = 'relative';
        const floater = document.createElement('span');
        floater.className = 'xp-float';
        floater.textContent = '+' + amount;
        xpStat.appendChild(floater);
        setTimeout(() => floater.remove(), 1000);
    }
}

// ============================================================
// CHESS -- 2 player local
// ============================================================

function initChess(board) {
    board.className = 'game-board chess-board-wrapper';

    const PIECES = {
        K: '\u2654', Q: '\u2655', R: '\u2656', B: '\u2657', N: '\u2658', P: '\u2659',
        k: '\u265A', q: '\u265B', r: '\u265C', b: '\u265D', n: '\u265E', p: '\u265F'
    };

    const initialBoard = [
        ['r','n','b','q','k','b','n','r'],
        ['p','p','p','p','p','p','p','p'],
        [' ',' ',' ',' ',' ',' ',' ',' '],
        [' ',' ',' ',' ',' ',' ',' ',' '],
        [' ',' ',' ',' ',' ',' ',' ',' '],
        [' ',' ',' ',' ',' ',' ',' ',' '],
        ['P','P','P','P','P','P','P','P'],
        ['R','N','B','Q','K','B','N','R']
    ];

    let chessState = {
        board: initialBoard.map(row => [...row]),
        turn: 'white',
        selected: null,
        gameOver: false,
        castling: { K: true, Q: true, k: true, q: true },
        enPassant: null
    };

    function isWhite(piece) { return piece !== ' ' && piece === piece.toUpperCase(); }
    function isBlack(piece) { return piece !== ' ' && piece === piece.toLowerCase(); }
    function isOwnPiece(piece, turn) { return turn === 'white' ? isWhite(piece) : isBlack(piece); }

    function findKing(b, white) {
        const k = white ? 'K' : 'k';
        for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) if (b[r][c] === k) return [r, c];
        return null;
    }

    function isSquareAttacked(b, tr, tc, byWhite) {
        for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
            const p = b[r][c];
            if (p === ' ' || (byWhite ? !isWhite(p) : !isBlack(p))) continue;
            if (getRawMoves(r, c, b).some(([mr, mc]) => mr === tr && mc === tc)) return true;
        }
        return false;
    }

    function isInCheck(b, whiteKing) {
        const k = findKing(b, whiteKing);
        return !k || isSquareAttacked(b, k[0], k[1], !whiteKing);
    }

    function getLegalMoves(row, col, b, turn) {
        return getRawMoves(row, col, b).filter(([r, c]) => {
            const copy = b.map(rw => [...rw]);
            copy[r][c] = copy[row][col]; copy[row][col] = ' ';
            return !isInCheck(copy, turn === 'white');
        });
    }

    function hasAnyLegal(b, turn) {
        for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
            if (!isOwnPiece(b[r][c], turn)) continue;
            if (getLegalMoves(r, c, b, turn).length > 0) return true;
        }
        return false;
    }

    function getRawMoves(row, col, b) {
        const piece = b[row][col];
        const moves = [];
        const type = piece.toLowerCase();
        const white = isWhite(piece);

        function addIfValid(r, c) {
            if (r < 0 || r > 7 || c < 0 || c > 7) return false;
            if (b[r][c] === ' ') { moves.push([r, c]); return true; }
            if ((white && isBlack(b[r][c])) || (!white && isWhite(b[r][c]))) {
                moves.push([r, c]);
            }
            return false;
        }

        function addSliding(dirs) {
            dirs.forEach(([dr, dc]) => {
                for (let i = 1; i < 8; i++) {
                    const nr = row + dr * i;
                    const nc = col + dc * i;
                    if (nr < 0 || nr > 7 || nc < 0 || nc > 7) break;
                    if (b[nr][nc] === ' ') { moves.push([nr, nc]); continue; }
                    if ((white && isBlack(b[nr][nc])) || (!white && isWhite(b[nr][nc]))) moves.push([nr, nc]);
                    break;
                }
            });
        }

        switch (type) {
            case 'p': {
                const dir = white ? -1 : 1;
                const startRow = white ? 6 : 1;
                if (row + dir >= 0 && row + dir <= 7 && b[row + dir][col] === ' ') {
                    moves.push([row + dir, col]);
                    if (row === startRow && b[row + dir * 2][col] === ' ') {
                        moves.push([row + dir * 2, col]);
                    }
                }
                [-1, 1].forEach(dc => {
                    const nr = row + dir;
                    const nc = col + dc;
                    if (nr >= 0 && nr <= 7 && nc >= 0 && nc <= 7) {
                        if ((white && isBlack(b[nr][nc])) || (!white && isWhite(b[nr][nc]))) {
                            moves.push([nr, nc]);
                        }
                        if (chessState.enPassant && chessState.enPassant[0] === nr && chessState.enPassant[1] === nc) {
                            moves.push([nr, nc]);
                        }
                    }
                });
                break;
            }
            case 'r': addSliding([[0,1],[0,-1],[1,0],[-1,0]]); break;
            case 'b': addSliding([[1,1],[1,-1],[-1,1],[-1,-1]]); break;
            case 'q': addSliding([[0,1],[0,-1],[1,0],[-1,0],[1,1],[1,-1],[-1,1],[-1,-1]]); break;
            case 'n':
                [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]].forEach(([dr,dc]) => addIfValid(row+dr, col+dc));
                break;
            case 'k':
                [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]].forEach(([dr,dc]) => addIfValid(row+dr, col+dc));
                // Castling
                if (white && row === 7 && col === 4) {
                    if (chessState.castling.K && b[7][5] === ' ' && b[7][6] === ' ' && b[7][7] === 'R'
                        && !isSquareAttacked(b, 7, 4, true) && !isSquareAttacked(b, 7, 5, true) && !isSquareAttacked(b, 7, 6, true))
                        moves.push([7, 6]);
                    if (chessState.castling.Q && b[7][3] === ' ' && b[7][2] === ' ' && b[7][1] === ' ' && b[7][0] === 'R'
                        && !isSquareAttacked(b, 7, 4, true) && !isSquareAttacked(b, 7, 3, true) && !isSquareAttacked(b, 7, 2, true))
                        moves.push([7, 2]);
                } else if (!white && row === 0 && col === 4) {
                    if (chessState.castling.k && b[0][5] === ' ' && b[0][6] === ' ' && b[0][7] === 'r'
                        && !isSquareAttacked(b, 0, 4, false) && !isSquareAttacked(b, 0, 5, false) && !isSquareAttacked(b, 0, 6, false))
                        moves.push([0, 6]);
                    if (chessState.castling.q && b[0][3] === ' ' && b[0][2] === ' ' && b[0][1] === ' ' && b[0][0] === 'r'
                        && !isSquareAttacked(b, 0, 4, false) && !isSquareAttacked(b, 0, 3, false) && !isSquareAttacked(b, 0, 2, false))
                        moves.push([0, 2]);
                }
                break;
        }
        return moves;
    }

    const statusDiv = document.createElement('div');
    statusDiv.className = 'chess-status';
    statusDiv.textContent = 'White to move';
    board.appendChild(statusDiv);

    const grid = document.createElement('div');
    grid.className = 'chess-grid';
    board.appendChild(grid);

    function render() {
        grid.textContent = '';
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const cell = document.createElement('div');
                const isDark = (r + c) % 2 === 1;
                cell.className = 'chess-cell' + (isDark ? ' dark' : ' light');

                if (chessState.selected && chessState.selected[0] === r && chessState.selected[1] === c) {
                    cell.classList.add('selected');
                }

                if (chessState.selected) {
                    const validMoves = getLegalMoves(chessState.selected[0], chessState.selected[1], chessState.board, chessState.turn);
                    if (validMoves.some(([mr, mc]) => mr === r && mc === c)) {
                        cell.classList.add('valid-move');
                    }
                }

                const piece = chessState.board[r][c];
                if (piece !== ' ') {
                    const pieceEl = document.createElement('span');
                    pieceEl.className = 'chess-piece' + (isWhite(piece) ? ' white-piece' : ' black-piece');
                    pieceEl.textContent = PIECES[piece];
                    cell.appendChild(pieceEl);
                }

                cell.addEventListener('click', () => handleChessClick(r, c));
                grid.appendChild(cell);
            }
        }
    }

    function handleChessClick(r, c) {
        if (chessState.gameOver) return;
        const piece = chessState.board[r][c];

        if (chessState.selected) {
            const [sr, sc] = chessState.selected;
            const legalMoves = getLegalMoves(sr, sc, chessState.board, chessState.turn);
            const isValid = legalMoves.some(([mr, mc]) => mr === r && mc === c);

            if (isValid) {
                const movedPiece = chessState.board[sr][sc];
                // En passant capture
                if (movedPiece.toLowerCase() === 'p' && chessState.enPassant && chessState.enPassant[0] === r && chessState.enPassant[1] === c) {
                    chessState.board[sr][c] = ' ';
                }
                // Castling execution
                if (movedPiece.toLowerCase() === 'k' && Math.abs(c - sc) === 2) {
                    if (c === 6) { chessState.board[sr][5] = chessState.board[sr][7]; chessState.board[sr][7] = ' '; }
                    if (c === 2) { chessState.board[sr][3] = chessState.board[sr][0]; chessState.board[sr][0] = ' '; }
                }
                chessState.board[r][c] = chessState.board[sr][sc];
                chessState.board[sr][sc] = ' ';

                // En passant tracking
                if (movedPiece.toLowerCase() === 'p' && Math.abs(r - sr) === 2) {
                    chessState.enPassant = [(sr + r) / 2, sc];
                } else {
                    chessState.enPassant = null;
                }
                // Castling rights
                if (movedPiece === 'K') { chessState.castling.K = false; chessState.castling.Q = false; }
                if (movedPiece === 'k') { chessState.castling.k = false; chessState.castling.q = false; }
                if (movedPiece === 'R' && sr === 7 && sc === 7) chessState.castling.K = false;
                if (movedPiece === 'R' && sr === 7 && sc === 0) chessState.castling.Q = false;
                if (movedPiece === 'r' && sr === 0 && sc === 7) chessState.castling.k = false;
                if (movedPiece === 'r' && sr === 0 && sc === 0) chessState.castling.q = false;

                if (chessState.board[r][c] === 'P' && r === 0) chessState.board[r][c] = 'Q';
                if (chessState.board[r][c] === 'p' && r === 7) chessState.board[r][c] = 'q';

                chessState.turn = chessState.turn === 'white' ? 'black' : 'white';

                const inCheck = isInCheck(chessState.board, chessState.turn === 'white');
                const canMove = hasAnyLegal(chessState.board, chessState.turn);

                if (!canMove) {
                    chessState.gameOver = true;
                    if (inCheck) {
                        const winner = chessState.turn === 'white' ? 'Black' : 'White';
                        statusDiv.textContent = 'Checkmate -- ' + winner + ' wins!';
                    } else {
                        statusDiv.textContent = 'Stalemate -- Draw';
                    }
                    statusDiv.classList.add('game-won');
                    awardGameXP(50);
                    checkGameTrophies('chess', 1);
                } else if (inCheck) {
                    statusDiv.textContent = (chessState.turn === 'white' ? 'White' : 'Black') + ' to move -- Check!';
                } else {
                    statusDiv.textContent = (chessState.turn === 'white' ? 'White' : 'Black') + ' to move';
                }
                chessState.selected = null;
            } else if (isOwnPiece(piece, chessState.turn)) {
                chessState.selected = [r, c];
            } else {
                chessState.selected = null;
            }
        } else if (isOwnPiece(piece, chessState.turn)) {
            chessState.selected = [r, c];
        }
        render();
    }

    render();
}

// ============================================================
// 2048
// ============================================================

function init2048(board) {
    board.className = 'game-board game-2048-wrapper';

    let grid = Array.from({ length: 4 }, () => Array(4).fill(0));
    let score = 0;
    let won = false;
    let lost = false;

    function addTile() {
        const empty = [];
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 4; c++) {
                if (grid[r][c] === 0) empty.push([r, c]);
            }
        }
        if (empty.length === 0) return;
        const [r, c] = empty[Math.floor(Math.random() * empty.length)];
        grid[r][c] = Math.random() < 0.9 ? 2 : 4;
    }

    function canMove() {
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 4; c++) {
                if (grid[r][c] === 0) return true;
                if (c < 3 && grid[r][c] === grid[r][c + 1]) return true;
                if (r < 3 && grid[r][c] === grid[r + 1][c]) return true;
            }
        }
        return false;
    }

    function slide(row) {
        let arr = row.filter(v => v !== 0);
        for (let i = 0; i < arr.length - 1; i++) {
            if (arr[i] === arr[i + 1]) {
                arr[i] *= 2;
                score += arr[i];
                if (arr[i] === 2048 && !won) { won = true; }
                arr[i + 1] = 0;
            }
        }
        arr = arr.filter(v => v !== 0);
        while (arr.length < 4) arr.push(0);
        return arr;
    }

    function move(direction) {
        if (lost) return;
        const prev = JSON.stringify(grid);

        if (direction === 'left') {
            for (let r = 0; r < 4; r++) grid[r] = slide(grid[r]);
        } else if (direction === 'right') {
            for (let r = 0; r < 4; r++) grid[r] = slide(grid[r].reverse()).reverse();
        } else if (direction === 'up') {
            for (let c = 0; c < 4; c++) {
                let col = [grid[0][c], grid[1][c], grid[2][c], grid[3][c]];
                col = slide(col);
                for (let r = 0; r < 4; r++) grid[r][c] = col[r];
            }
        } else if (direction === 'down') {
            for (let c = 0; c < 4; c++) {
                let col = [grid[3][c], grid[2][c], grid[1][c], grid[0][c]];
                col = slide(col);
                for (let r = 0; r < 4; r++) grid[3 - r][c] = col[r];
            }
        }

        if (JSON.stringify(grid) !== prev) {
            addTile();
            if (!canMove()) {
                lost = true;
                awardGameXP(Math.floor(score / 100));
                saveGameScore('game2048', score);
                checkGameTrophies('game2048', score);
            }
        }
        render();
    }

    const scoreDiv = document.createElement('div');
    scoreDiv.className = 'game-2048-score';
    scoreDiv.textContent = 'Score: 0';
    board.appendChild(scoreDiv);

    const gridEl = document.createElement('div');
    gridEl.className = 'game-2048-grid';
    board.appendChild(gridEl);

    const instructions = document.createElement('div');
    instructions.className = 'game-instructions';
    instructions.textContent = 'Arrow keys or swipe to move tiles';
    board.appendChild(instructions);

    function render() {
        gridEl.textContent = '';
        scoreDiv.textContent = 'Score: ' + score;
        if (won) scoreDiv.textContent += ' -- You reached 2048!';
        if (lost) scoreDiv.textContent += ' -- Game Over';

        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 4; c++) {
                const cell = document.createElement('div');
                cell.className = 'tile-2048';
                const val = grid[r][c];
                if (val > 0) {
                    cell.textContent = val;
                    cell.dataset.value = val;
                }
                gridEl.appendChild(cell);
            }
        }
    }

    function handleKey(e) {
        if (activeGame !== 'game2048') { document.removeEventListener('keydown', handleKey); return; }
        const map = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' };
        if (map[e.key]) { e.preventDefault(); move(map[e.key]); }
    }
    document.addEventListener('keydown', handleKey);

    let tx = 0, ty = 0;
    gridEl.addEventListener('touchstart', e => { tx = e.changedTouches[0].screenX; ty = e.changedTouches[0].screenY; }, { passive: true });
    gridEl.addEventListener('touchend', e => {
        const dx = e.changedTouches[0].screenX - tx;
        const dy = e.changedTouches[0].screenY - ty;
        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 30) move(dx > 0 ? 'right' : 'left');
        else if (Math.abs(dy) > 30) move(dy > 0 ? 'down' : 'up');
    }, { passive: true });

    addTile();
    addTile();
    render();
}

// ============================================================
// MEMORY -- card match
// ============================================================

function initMemory(board) {
    board.className = 'game-board memory-wrapper';

    const SYMBOLS = [
        '\u2660', '\u2665', '\u2666', '\u2663',
        '\u2605', '\u263A', '\u2602', '\u2708'
    ];
    const pairs = [...SYMBOLS, ...SYMBOLS];
    for (let i = pairs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
    }

    let flipped = [];
    let matched = new Set();
    let moves = 0;
    let locked = false;

    const statsDiv = document.createElement('div');
    statsDiv.className = 'memory-stats';
    statsDiv.textContent = 'Moves: 0 | Matched: 0/8';
    board.appendChild(statsDiv);

    const gridEl = document.createElement('div');
    gridEl.className = 'memory-grid';
    board.appendChild(gridEl);

    function render() {
        gridEl.textContent = '';
        statsDiv.textContent = 'Moves: ' + moves + ' | Matched: ' + matched.size + '/8';

        pairs.forEach((symbol, i) => {
            const card = document.createElement('div');
            card.className = 'memory-card';
            if (flipped.includes(i) || matched.has(i)) {
                card.classList.add('flipped');
                card.textContent = symbol;
            }
            if (matched.has(i)) card.classList.add('matched');

            card.addEventListener('click', () => handleCardClick(i));
            gridEl.appendChild(card);
        });
    }

    function handleCardClick(i) {
        if (locked || flipped.includes(i) || matched.has(i)) return;
        flipped.push(i);
        render();

        if (flipped.length === 2) {
            moves++;
            locked = true;
            const [a, b] = flipped;
            if (pairs[a] === pairs[b]) {
                matched.add(a);
                matched.add(b);
                flipped = [];
                locked = false;
                render();
                if (matched.size === pairs.length) {
                    statsDiv.textContent = 'Complete in ' + moves + ' moves!';
                    awardGameXP(Math.max(10, 50 - moves));
                    saveGameScore('memory', 100 - moves);
                    if (moves <= 12) checkGameTrophies('memory', moves);
                    else trackGamePlayed('memory');
                }
            } else {
                setTimeout(() => {
                    flipped = [];
                    locked = false;
                    render();
                }, 800);
            }
        }
    }

    render();
}

// ============================================================
// MINESWEEPER
// ============================================================

function initMinesweeper(board) {
    board.className = 'game-board minesweeper-wrapper';

    const ROWS = 9;
    const COLS = 9;
    const MINES = 10;

    let grid = Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => ({
        mine: false, revealed: false, flagged: false, adjacent: 0
    })));
    let gameOver = false;
    let firstClick = true;
    let revealedCount = 0;

    function placeMines(safeR, safeC) {
        let placed = 0;
        while (placed < MINES) {
            const r = Math.floor(Math.random() * ROWS);
            const c = Math.floor(Math.random() * COLS);
            if (grid[r][c].mine) continue;
            if (Math.abs(r - safeR) <= 1 && Math.abs(c - safeC) <= 1) continue;
            grid[r][c].mine = true;
            placed++;
        }
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                if (grid[r][c].mine) continue;
                let count = 0;
                for (let dr = -1; dr <= 1; dr++) {
                    for (let dc = -1; dc <= 1; dc++) {
                        const nr = r + dr, nc = c + dc;
                        if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && grid[nr][nc].mine) count++;
                    }
                }
                grid[r][c].adjacent = count;
            }
        }
    }

    function reveal(r, c) {
        if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return;
        if (grid[r][c].revealed || grid[r][c].flagged) return;
        grid[r][c].revealed = true;
        revealedCount++;
        if (grid[r][c].adjacent === 0 && !grid[r][c].mine) {
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    reveal(r + dr, c + dc);
                }
            }
        }
    }

    const flagsLeft = document.createElement('div');
    flagsLeft.className = 'mine-status';
    board.appendChild(flagsLeft);

    const gridEl = document.createElement('div');
    gridEl.className = 'mine-grid';
    gridEl.style.gridTemplateColumns = 'repeat(' + COLS + ', 1fr)';
    board.appendChild(gridEl);

    const instructions = document.createElement('div');
    instructions.className = 'game-instructions';
    instructions.textContent = 'Click to reveal, right-click or long-press to flag';
    board.appendChild(instructions);

    function updateFlagCount() {
        const flagCount = grid.flat().filter(c => c.flagged).length;
        flagsLeft.textContent = 'Mines: ' + (MINES - flagCount);
        if (gameOver) {
            flagsLeft.textContent = grid.flat().some(c => c.mine && c.revealed) ? 'Game Over' : 'You Win!';
        }
    }

    function render() {
        gridEl.textContent = '';
        updateFlagCount();

        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const cell = document.createElement('div');
                cell.className = 'mine-cell';

                if (grid[r][c].revealed) {
                    cell.classList.add('revealed');
                    if (grid[r][c].mine) {
                        cell.classList.add('mine');
                        cell.textContent = '\uD83D\uDCA3';
                    } else if (grid[r][c].adjacent > 0) {
                        cell.textContent = grid[r][c].adjacent;
                        cell.dataset.num = grid[r][c].adjacent;
                    }
                } else if (grid[r][c].flagged) {
                    cell.classList.add('flagged');
                    cell.textContent = '\uD83D\uDEA9';
                }

                cell.addEventListener('click', () => handleClick(r, c));
                cell.addEventListener('contextmenu', (e) => { e.preventDefault(); handleFlag(r, c); });
                let pressTimer;
                cell.addEventListener('touchstart', () => { pressTimer = setTimeout(() => handleFlag(r, c), 500); }, { passive: true });
                cell.addEventListener('touchend', () => clearTimeout(pressTimer), { passive: true });
                cell.addEventListener('touchmove', () => clearTimeout(pressTimer), { passive: true });

                gridEl.appendChild(cell);
            }
        }
    }

    function handleClick(r, c) {
        if (gameOver || grid[r][c].flagged) return;
        if (firstClick) { placeMines(r, c); firstClick = false; }
        if (grid[r][c].mine) {
            gameOver = true;
            grid.flat().filter(c => c.mine).forEach(c => c.revealed = true);
            render();
            return;
        }
        reveal(r, c);
        if (revealedCount === ROWS * COLS - MINES) {
            gameOver = true;
            awardGameXP(30);
            checkGameTrophies('minesweeper', 1);
        }
        render();
    }

    function handleFlag(r, c) {
        if (gameOver || grid[r][c].revealed) return;
        grid[r][c].flagged = !grid[r][c].flagged;
        render();
    }

    render();
}

// ============================================================
// SNAKE
// ============================================================

function initSnake(board) {
    board.className = 'game-board snake-wrapper';

    const SIZE = 15;
    const CELL = Math.min(24, Math.floor((Math.min(window.innerWidth - 48, 400)) / SIZE));

    let snake = [{ x: 7, y: 7 }];
    let dir = { x: 1, y: 0 };
    let nextDir = { x: 1, y: 0 };
    let food = null;
    let snakeScore = 0;
    let running = false;
    let dead = false;
    let speed = 150;

    function placeFood() {
        const occupied = new Set(snake.map(s => s.x + ',' + s.y));
        const empty = [];
        for (let x = 0; x < SIZE; x++) {
            for (let y = 0; y < SIZE; y++) {
                if (!occupied.has(x + ',' + y)) empty.push({ x, y });
            }
        }
        food = empty[Math.floor(Math.random() * empty.length)];
    }

    const scoreDiv = document.createElement('div');
    scoreDiv.className = 'snake-score';
    scoreDiv.textContent = 'Score: 0';
    board.appendChild(scoreDiv);

    const canvas = document.createElement('canvas');
    canvas.width = SIZE * CELL;
    canvas.height = SIZE * CELL;
    canvas.className = 'snake-canvas';
    board.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    const instructions = document.createElement('div');
    instructions.className = 'game-instructions';
    instructions.textContent = 'Arrow keys or swipe to move. Press any key to start.';
    board.appendChild(instructions);

    // Touch d-pad controls
    const controls = document.createElement('div');
    controls.className = 'snake-controls';
    [
        { label: '\u25B2', dx: 0, dy: -1, cls: 'up' },
        { label: '\u25C0', dx: -1, dy: 0, cls: 'left' },
        { label: '\u25B6', dx: 1, dy: 0, cls: 'right' },
        { label: '\u25BC', dx: 0, dy: 1, cls: 'down' }
    ].forEach(({ label, dx, dy, cls }) => {
        const btn = document.createElement('button');
        btn.className = 'btn snake-dir-btn snake-dir-' + cls;
        btn.textContent = label;
        btn.addEventListener('click', () => {
            if (!running && !dead) { running = true; }
            if (dir.x !== -dx || dir.y !== -dy) nextDir = { x: dx, y: dy };
        });
        controls.appendChild(btn);
    });
    board.appendChild(controls);

    function draw() {
        const darkMode = document.documentElement.getAttribute('data-theme') !== 'light';
        ctx.fillStyle = darkMode ? '#111f16' : '#e2ddd3';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = darkMode ? '#1e3326' : '#d0ccc3';
        ctx.lineWidth = 0.5;
        for (let i = 0; i <= SIZE; i++) {
            ctx.beginPath(); ctx.moveTo(i * CELL, 0); ctx.lineTo(i * CELL, SIZE * CELL); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0, i * CELL); ctx.lineTo(SIZE * CELL, i * CELL); ctx.stroke();
        }

        if (food) {
            ctx.fillStyle = '#d4a843';
            ctx.beginPath();
            ctx.arc(food.x * CELL + CELL / 2, food.y * CELL + CELL / 2, CELL / 2 - 2, 0, Math.PI * 2);
            ctx.fill();
        }

        snake.forEach((seg, i) => {
            ctx.fillStyle = i === 0 ? '#3d9e6a' : '#2d7a50';
            ctx.fillRect(seg.x * CELL + 1, seg.y * CELL + 1, CELL - 2, CELL - 2);
        });

        if (dead) {
            ctx.fillStyle = darkMode ? 'rgba(12,26,18,0.7)' : 'rgba(245,242,235,0.7)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = darkMode ? '#e8e4da' : '#1a2e20';
            ctx.font = 'bold ' + CELL + 'px "DM Sans", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
        }
    }

    function tick() {
        if (!running || dead) return;
        dir = { ...nextDir };
        const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

        if (head.x < 0 || head.x >= SIZE || head.y < 0 || head.y >= SIZE) {
            dead = true;
            running = false;
            awardGameXP(snakeScore);
            draw();
            return;
        }
        if (snake.some(s => s.x === head.x && s.y === head.y)) {
            dead = true;
            running = false;
            awardGameXP(snakeScore);
            draw();
            return;
        }

        snake.unshift(head);
        if (food && head.x === food.x && head.y === food.y) {
            snakeScore += 10;
            scoreDiv.textContent = 'Score: ' + snakeScore;
            placeFood();
            if (speed > 80) speed -= 2;
        } else {
            snake.pop();
        }
        draw();
    }

    function gameLoop() {
        if (activeGame !== 'snake') return;
        tick();
        setTimeout(() => { gameAnimFrame = requestAnimationFrame(gameLoop); }, speed);
    }

    function handleKey(e) {
        if (activeGame !== 'snake') { document.removeEventListener('keydown', handleKey); return; }
        if (!running && !dead) { running = true; }
        const map = {
            ArrowUp: { x: 0, y: -1 }, ArrowDown: { x: 0, y: 1 },
            ArrowLeft: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 }
        };
        if (map[e.key]) {
            e.preventDefault();
            const nd = map[e.key];
            if (dir.x !== -nd.x || dir.y !== -nd.y) nextDir = nd;
        }
    }
    document.addEventListener('keydown', handleKey);

    let sx = 0, sy = 0;
    canvas.addEventListener('touchstart', e => { sx = e.changedTouches[0].screenX; sy = e.changedTouches[0].screenY; }, { passive: true });
    canvas.addEventListener('touchend', e => {
        if (!running && !dead) running = true;
        const dx = e.changedTouches[0].screenX - sx;
        const dy = e.changedTouches[0].screenY - sy;
        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 20) {
            const nd = dx > 0 ? { x: 1, y: 0 } : { x: -1, y: 0 };
            if (dir.x !== -nd.x || dir.y !== -nd.y) nextDir = nd;
        } else if (Math.abs(dy) > 20) {
            const nd = dy > 0 ? { x: 0, y: 1 } : { x: 0, y: -1 };
            if (dir.x !== -nd.x || dir.y !== -nd.y) nextDir = nd;
        }
    }, { passive: true });

    placeFood();
    draw();
    gameLoop();
}
