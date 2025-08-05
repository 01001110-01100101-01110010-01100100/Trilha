document.addEventListener('DOMContentLoaded', () => {

    const ELEMENTS = {
        mainMenu: document.getElementById('main-menu'),
        menuContent: document.getElementById('menu-content'),
        difficultySelection: document.getElementById('difficulty-selection'),
        gameContainer: document.getElementById('game-container'),
        tabuleiro: document.getElementById('tabuleiro'),
        message: document.getElementById('message'),
        gameModeTitle: document.getElementById('game-mode-title'),
        creditsModal: document.getElementById('credits-modal'),
        gameOverModal: document.getElementById('game-over-modal'),
        gameOverMessage: document.getElementById('game-over-message'),
        howToPlayModal: document.getElementById('how-to-play-modal'),
    };

    const BUTTONS = {
        pvp: document.getElementById('pvp-button'),
        pvc: document.getElementById('pvc-button'),
        credits: document.getElementById('credits-button'),
        difficulty: document.querySelectorAll('.difficulty-button'),
        reset: document.getElementById('reset-button'),
        backToMenu: document.getElementById('back-to-menu-button'),
        playAgain: document.getElementById('play-again-button'),
        modalBackToMenu: document.getElementById('modal-back-to-menu-button'),
        howToPlay: document.getElementById('how-to-play-button'),
    };

    const SOUNDS = {
        click: document.getElementById('sound-click'),
        move: document.getElementById('sound-move'),
        win: document.getElementById('sound-win'),
    };
    
    const PIECE_SVG = {
        'X': `<svg viewBox="0 0 100 100"><defs><linearGradient id="gradX" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#ff7e95; stop-opacity:1" /><stop offset="100%" style="stop-color:#e94560; stop-opacity:1" /></linearGradient></defs><line x1="15" y1="15" x2="85" y2="85" stroke="url(#gradX)" stroke-width="15" stroke-linecap="round"/><line x1="85" y1="15" x2="15" y2="85" stroke="url(#gradX)" stroke-width="15" stroke-linecap="round"/></svg>`,
        'O': `<svg viewBox="0 0 100 100"><defs><radialGradient id="gradO" cx="35%" cy="35%" r="65%"><stop offset="0%" style="stop-color:#90f5d0; stop-opacity:1" /><stop offset="100%" style="stop-color:#45e4a3; stop-opacity:1" /></radialGradient></defs><circle cx="50" cy="50" r="40" stroke="#3cde9a" stroke-width="6" fill="url(#gradO)"/></svg>`
    };

    const CONNECTIONS = { 1: [2, 4, 5], 2: [1, 3, 5], 3: [2, 6, 5], 4: [1, 5, 7], 5: [1, 2, 3, 4, 6, 7, 8, 9], 6: [3, 5, 9], 7: [4, 8, 5], 8: [7, 9, 5], 9: [6, 8, 5] };
    const WINNING_LINES = [ [1, 5, 9], [3, 5, 7], [2, 5, 8], [4, 5, 6] ];
    
    let state = {
        board: Array(9).fill(null),
        currentPlayer: 'X',
        selectedPieceIndex: null,
        gameOver: false,
        gameMode: 'pvp',
        difficultyLevel: 'medium',
        humanPlayer: 'O',
        aiPlayer: 'X',
        casas: [],
    };

   
    const playSound = (sound) => { if (sound) { sound.currentTime = 0; sound.play().catch(e => console.error("Erro ao tocar som:", e)); } };

    const setupBoard = () => {
        ELEMENTS.tabuleiro.innerHTML = '';
        state.casas = [];
        for (let i = 0; i < 9; i++) {
            const casa = document.createElement('div');
            casa.classList.add('casa');
            casa.dataset.casa = i + 1;
            casa.addEventListener('click', handleCasaClick);
            ELEMENTS.tabuleiro.appendChild(casa);
            state.casas[i] = casa;
        }
    };
    
    const showScreen = (screen) => {
        ELEMENTS.mainMenu.style.display = (screen === 'menu') ? 'block' : 'none';
        ELEMENTS.gameContainer.style.display = (screen === 'game') ? 'flex' : 'none';
    };

    const toggleModal = (modal, show) => { if (modal) modal.style.display = show ? 'flex' : 'none'; };

    const backToMenu = () => {
        toggleModal(ELEMENTS.gameOverModal, false);
        showScreen('menu');
        setTimeout(() => {
            ELEMENTS.menuContent.classList.remove('slide-left');
            ELEMENTS.difficultySelection.classList.remove('slide-in');
        }, 10);
    };

  
    const startGame = (mode) => {
        state.gameMode = mode;
        const difficultyText = state.difficultyLevel.charAt(0).toUpperCase() + state.difficultyLevel.slice(1);
        ELEMENTS.gameModeTitle.textContent = mode === 'pvp' ? "Jogador vs Jogador" : `Nível - ${difficultyText}`;
        showScreen('game');
        initializeGame();
    };

    const initializeGame = () => {
        state.board.fill(null);
        state.board[0] = 'X'; state.board[1] = 'X'; state.board[2] = 'X';
        state.board[6] = 'O'; state.board[7] = 'O'; state.board[8] = 'O';
        state.gameOver = false;
        state.selectedPieceIndex = null;
        state.currentPlayer = 'O';
        toggleModal(ELEMENTS.gameOverModal, false);
        state.casas.forEach(c => c.classList.remove('win-line'));
        updateMessageState();
        renderBoard();
        if (state.gameMode === 'pvc' && state.currentPlayer === state.aiPlayer) { aiTurn(); }
    };

    const renderBoard = () => {
        state.casas.forEach((casa, index) => {
            casa.innerHTML = '';
            if (state.board[index]) {
                const piece = document.createElement('div');
                piece.classList.add('piece', `player-${state.board[index]}`);
                piece.innerHTML = PIECE_SVG[state.board[index]];
                casa.appendChild(piece);
            }
        });
    };

    const updateMessageState = () => {
        if (state.gameOver) return;
        let msg = state.gameMode === 'pvc' 
            ? (state.currentPlayer === state.humanPlayer ? 'Sua Vez (O)' : 'Vez do Computador (X)')
            : `Vez do Jogador ${state.currentPlayer}`;
        ELEMENTS.message.textContent = msg;
    };

    const clearHighlights = () => state.casas.forEach(c => c.classList.remove('selected', 'possible-move'));

    const highlightPossibleMoves = (fromIndex) => {
        const fromPos = parseInt(state.casas[fromIndex].dataset.casa);
        CONNECTIONS[fromPos].forEach(toPos => {
            if (state.board[toPos - 1] === null) {
                state.casas[toPos - 1].classList.add('possible-move');
            }
        });
    };

    function handleCasaClick(event) {
        if (state.gameOver || (state.gameMode === 'pvc' && state.currentPlayer === state.aiPlayer)) return;
        const clickedIndex = state.casas.indexOf(event.currentTarget);
        if (state.selectedPieceIndex !== null) {
            const fromPos = parseInt(state.casas[state.selectedPieceIndex].dataset.casa);
            const toPos = parseInt(event.currentTarget.dataset.casa);
            if (state.board[clickedIndex] === null && CONNECTIONS[fromPos].includes(toPos)) {
                executeMove(state.selectedPieceIndex, clickedIndex);
            } else {
                playSound(SOUNDS.click);
                clearHighlights();
                state.selectedPieceIndex = null;
            }
        } else if (state.board[clickedIndex] === state.currentPlayer) {
            playSound(SOUNDS.click);
            state.selectedPieceIndex = clickedIndex;
            clearHighlights();
            event.currentTarget.classList.add('selected');
            highlightPossibleMoves(clickedIndex);
        }
    }

    const executeMove = (fromIndex, toIndex) => {
        playSound(SOUNDS.move);
        state.board[toIndex] = state.board[fromIndex];
        state.board[fromIndex] = null;
        state.selectedPieceIndex = null;
        clearHighlights();
        renderBoard();
        if (checkWin(state.board, state.currentPlayer)) {
            endGame(state.currentPlayer);
            return;
        }
        switchPlayer();
    };

    const endGame = (winner) => {
        playSound(SOUNDS.win);
        state.gameOver = true;
        let winnerMsg = "Empate!";
        if (winner) {
            winnerMsg = state.gameMode === 'pvc' 
                ? (winner === state.humanPlayer ? 'Parabéns! Você venceu!' : 'O Computador venceu!')
                : `Jogador ${winner} venceu!`;
            const winningLine = checkWin(state.board, winner);
            if (winningLine) winningLine.forEach(pos => state.casas[pos - 1].classList.add('win-line'));
        }
        ELEMENTS.message.textContent = winnerMsg;
        setTimeout(() => {
            ELEMENTS.gameOverMessage.textContent = winnerMsg;
            toggleModal(ELEMENTS.gameOverModal, true);
        }, 1500);
    }
    
    const switchPlayer = () => {
        state.currentPlayer = (state.currentPlayer === 'X') ? 'O' : 'X';
        updateMessageState();
        if (state.gameMode === 'pvc' && state.currentPlayer === state.aiPlayer && !state.gameOver) {
            aiTurn();
        }
    };
    
    const aiTurn = () => {
        ELEMENTS.tabuleiro.style.pointerEvents = 'none';
        setTimeout(() => { 
            aiMove(); 
            ELEMENTS.tabuleiro.style.pointerEvents = 'auto'; 
        }, 1000); 
    };

    const checkWin = (board, player) => {
        for (const line of WINNING_LINES) {
            if (line.every(pos => board[pos - 1] === player)) return line;
        }
        return null;
    };

  

    const getAllPossibleMoves = (player, board) => {
        const moves = [];
        for (let i = 0; i < 9; i++) {
            if (board[i] === player) {
                const fromPos = i + 1;
                CONNECTIONS[fromPos].forEach(toPos => {
                    const toIndex = toPos - 1;
                    if (board[toIndex] === null) moves.push({ from: i, to: toIndex });
                });
            }
        }
        return moves;
    };
    
    
    const aiMove = () => {
        if (state.gameOver) return;
        let move;
        switch(state.difficultyLevel) {
            case 'easy':   move = aiMoveEasy();   break;
            case 'medium': move = aiMoveMedium(); break;
            case 'hard':   move = aiMoveHard();   break;
        }
        if (move) {
            executeMove(move.from, move.to);
        } else {
            console.log("IA: Nenhum movimento válido encontrado.");
        }
    };
    
   
    const aiMoveEasy = () => {
        const possibleMoves = getAllPossibleMoves(state.aiPlayer, state.board);
        return possibleMoves.length > 0 ? possibleMoves[Math.floor(Math.random() * possibleMoves.length)] : null;
    };


    const aiMoveMedium = () => {
        let bestScore = -Infinity;
        let bestMove = null;
        const possibleMoves = getAllPossibleMoves(state.aiPlayer, state.board);

        for (const move of possibleMoves) {
            let tempBoard = [...state.board];
            tempBoard[move.to] = state.aiPlayer;
            tempBoard[move.from] = null;
            let score = minimaxSimple(tempBoard, 0, false); 
            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }
        return bestMove || aiMoveEasy(); 
    };

    const minimaxSimple = (board, depth, isMaximizing) => {
        if (checkWin(board, state.aiPlayer)) return 10 - depth;
        if (checkWin(board, state.humanPlayer)) return -10 + depth;
        if (depth > 4) return 0; 

        const moves = getAllPossibleMoves(isMaximizing ? state.aiPlayer : state.humanPlayer, board);
        if (moves.length === 0) return 0;

        if (isMaximizing) {
            let bestScore = -Infinity;
            for (const move of moves) {
                let tempBoard = [...board]; tempBoard[move.to] = state.aiPlayer; tempBoard[move.from] = null;
                bestScore = Math.max(bestScore, minimaxSimple(tempBoard, depth + 1, false));
            }
            return bestScore;
        } else {
            let bestScore = Infinity;
            for (const move of moves) {
                let tempBoard = [...board]; tempBoard[move.to] = state.humanPlayer; tempBoard[move.from] = null;
                bestScore = Math.min(bestScore, minimaxSimple(tempBoard, depth + 1, true));
            }
            return bestScore;
        }
    };

   
    const aiMoveHard = () => {
        let bestScore = -Infinity;
        let bestMove = null;
        const possibleMoves = getAllPossibleMoves(state.aiPlayer, state.board);

        for (const move of possibleMoves) {
            let tempBoard = [...state.board];
            tempBoard[move.to] = state.aiPlayer;
            tempBoard[move.from] = null;
          
            let score = minimaxAlphaBeta(tempBoard, 0, -Infinity, Infinity, false);
            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }
        return bestMove || aiMoveEasy(); 
    };
    
   
    const evaluateBoard = (board) => {
        let score = 0;
        
        if (board[4] === state.aiPlayer) score += 1;
        if (board[4] === state.humanPlayer) score -= 1;
        
     
        const aiMoves = getAllPossibleMoves(state.aiPlayer, board).length;
        const humanMoves = getAllPossibleMoves(state.humanPlayer, board).length;
        score += (aiMoves - humanMoves) * 0.1; 

        return score;
    }

    const minimaxAlphaBeta = (board, depth, alpha, beta, isMaximizing) => {
        if (checkWin(board, state.aiPlayer)) return 1000 - depth;
        if (checkWin(board, state.humanPlayer)) return -1000 + depth;
        
        const availableMoves = getAllPossibleMoves(isMaximizing ? state.aiPlayer : state.humanPlayer, board);
        if (availableMoves.length === 0) return 0;
        if (depth > 8) return evaluateBoard(board);

        if (isMaximizing) { 
            let maxEval = -Infinity;
            for (const move of availableMoves) {
                let tempBoard = [...board]; tempBoard[move.to] = state.aiPlayer; tempBoard[move.from] = null;
                let evaluation = minimaxAlphaBeta(tempBoard, depth + 1, alpha, beta, false);
                maxEval = Math.max(maxEval, evaluation);
                alpha = Math.max(alpha, evaluation); 
                if (beta <= alpha) break; 
            }
            return maxEval;
        } else { 
            let minEval = Infinity;
            for (const move of availableMoves) {
                let tempBoard = [...board]; tempBoard[move.to] = state.humanPlayer; tempBoard[move.from] = null;
                let evaluation = minimaxAlphaBeta(tempBoard, depth + 1, alpha, beta, true);
                minEval = Math.min(minEval, evaluation);
                beta = Math.min(beta, evaluation); 
                if (beta <= alpha) break; 
            }
            return minEval;
        }
    };

    BUTTONS.pvp.addEventListener('click', () => { playSound(SOUNDS.click); startGame('pvp'); });
    BUTTONS.pvc.addEventListener('click', () => { playSound(SOUNDS.click); ELEMENTS.menuContent.classList.add('slide-left'); ELEMENTS.difficultySelection.classList.add('slide-in'); });
    BUTTONS.difficulty.forEach(button => button.addEventListener('click', () => { playSound(SOUNDS.click); state.difficultyLevel = button.dataset.difficulty; startGame('pvc'); }));
    BUTTONS.reset.addEventListener('click', () => { playSound(SOUNDS.click); initializeGame(); });
    BUTTONS.playAgain.addEventListener('click', () => { playSound(SOUNDS.click); initializeGame(); });
    BUTTONS.backToMenu.addEventListener('click', () => { playSound(SOUNDS.click); backToMenu(); });
    BUTTONS.modalBackToMenu.addEventListener('click', () => { playSound(SOUNDS.click); backToMenu(); });
    BUTTONS.credits.addEventListener('click', () => { playSound(SOUNDS.click); toggleModal(ELEMENTS.creditsModal, true); });
    BUTTONS.howToPlay.addEventListener('click', () => { playSound(SOUNDS.click); toggleModal(ELEMENTS.howToPlayModal, true); });
    document.querySelectorAll('.modal-overlay').forEach(modal => modal.addEventListener('click', (e) => { if (e.target === modal) { playSound(SOUNDS.click); toggleModal(modal, false); } }));
    document.querySelectorAll('.modal-close-button').forEach(btn => btn.addEventListener('click', () => { playSound(SOUNDS.click); toggleModal(btn.closest('.modal-overlay'), false); }));

    setupBoard();
});