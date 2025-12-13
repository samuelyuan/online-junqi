import { BoardRenderer } from "./lib/BoardRenderer.js";
import SocketManager from './lib/SocketManager.js';
import GameUIManager from './lib/GameUIManager.js';
import {
    BOARD_ROWS,
    BOARD_COLUMNS,
    MIN_RANK,
    MAX_RANK,
    MAX_MOVABLE_RANK,
    RANK_PREFIX,
    CSS_CLASSES,
    MOVE_SYMBOLS,
    GAME_STATUS,
    GAME_OVER_TYPES,
    ELEMENT_IDS,
    SELECTORS
} from './lib/constants.js';

// Module-level state (ES6 modules provide scope, no IIFE needed)
let gameState = null;
let gameID = null;
let playerColor = null;
let playerName = null;
let gameClasses = null;

const boardRenderer = new BoardRenderer();
const socketManager = new SocketManager();
const uiManager = new GameUIManager();

/**
 * Initialize the UI
 */
const init = (config) => {
    gameID = config.gameID;
    playerColor = config.playerColor;
    playerName = config.playerName;

    uiManager.setPlayerColor(playerColor);

    const boardHtml = boardRenderer.generateBoardHtml(BOARD_ROWS, BOARD_COLUMNS);
    const squares = uiManager.initBoard(boardHtml);
    uiManager.initModals();

    gameClasses = boardRenderer.generateAllGameClasses();

    // Create socket connection and join game
    socketManager.connect(gameID);

    // Subscribe to socket events
    socketManager.on('update', (data) => {
        gameState = data;
        update();
    });

    socketManager.on('error', (data) => {
        uiManager.showErrorMessage(data);
    });

    // Define board based on player's perspective
    boardRenderer.assignSquareIds(squares, playerColor);

    // Attach event handlers
    attachDOMEventHandlers();
};

const callbackHighlightSwap = (color, rank) => {
    return (ev) => {
        //for setup, swap pieces
        for (let i = 0; i < gameState.players.length; i++) {
            if (gameState.players[i].color === playerColor && gameState.players[i].isSetup === false) {
                uiManager.highlightValidSwap(gameState, color + rank, ev.target);
            }
        }
    };
};

const callbackHighlightMoves = (color, rank) => {
    return (ev) => {
        //Show moves for player
        if (gameState.activePlayer && gameState.activePlayer.color === playerColor) {
            uiManager.highlightValidMoves(gameState, color + rank, ev.target);
        }
    };
};

/**
 * Attach DOM event handlers
 */
const attachDOMEventHandlers = () => {
    const baseString = `.${playerColor}.${RANK_PREFIX}`;
    const squares = uiManager.getSquares();

    // All pieces can be swapped
    for (let i = MIN_RANK; i <= MAX_RANK; i++) {
        uiManager.gameRoot.on('click', `${baseString}${i}`, callbackHighlightSwap(playerColor[0], i.toString()));
    }

    // Only highlight movable pieces
    for (let i = MIN_RANK; i < MAX_MOVABLE_RANK; i++) {
        uiManager.gameRoot.on('click', `${baseString}${i}`, callbackHighlightMoves(playerColor[0], i.toString()));
    }

    // Clear all move highlights
    uiManager.gameRoot.on('click', SELECTORS.EMPTY, (ev) => {
        uiManager.clearHighlights();
    });

    // Perform a regular move
    uiManager.gameRoot.on('click', SELECTORS.VALID_MOVE, (ev) => {
        const m = generateMoveString(ev.target, MOVE_SYMBOLS.MOVE);
        uiManager.clearMessages();
        socketManager.sendMove(gameID, m);
    });

    // Attack the opponent's piece
    uiManager.gameRoot.on('click', SELECTORS.VALID_ATTACK, (ev) => {
        const m = generateMoveString(ev.target, MOVE_SYMBOLS.ATTACK);
        uiManager.clearMessages();
        socketManager.sendMove(gameID, m);
    });

    //Swap pieces
    uiManager.gameRoot.on('click', SELECTORS.VALID_SWAP, (ev) => {
        const m = uiManager.getSwapString();
        uiManager.clearMessages();
        socketManager.sendMove(gameID, m);
    });

    //Finish setup
    uiManager.gameRoot.on('click', `#${ELEMENT_IDS.FINISH_SETUP}`, (ev) => {
        socketManager.finishSetup(gameID);
    });

    // Forfeit game
    uiManager.gameRoot.on('click', `#${ELEMENT_IDS.FORFEIT}`, (ev) => {
        uiManager.showForfeitPrompt((confirmed) => {
            if (confirmed) {
                uiManager.clearMessages();
                socketManager.forfeit(gameID);
            }
        });
    });
};

const generateMoveString = (destinationSquare, symbol) => {
    const selection = uiManager.getSelection();
    const piece = selection.pieceStr;
    const src = uiManager.getElement(selection.squareId);
    const dest = uiManager.getElementFromDOM(destinationSquare);

    uiManager.clearHighlights();

    const pieceClass = boardRenderer.getPieceClasses(piece, playerColor, gameState);

    // Move piece on board
    src.removeClass(pieceClass).addClass(CSS_CLASSES.EMPTY);
    dest.removeClass(CSS_CLASSES.EMPTY).addClass(pieceClass);

    // Return move string
    return selection.squareId + ' ' + symbol + ' ' + dest.attr('id');
};

/**
 * Update UI from game state
 */
const update = () => {
    const activeColor = gameState.activePlayer?.color;

    // Update player info
    uiManager.updatePlayerPanels(gameState.players, activeColor, gameState.status);

    // Update board
    uiManager.renderBoard(gameState.board, playerColor, gameState, boardRenderer, gameClasses);

    // Highlight last move
    uiManager.highlightLastMove(gameState.lastMove);

    // Identify you and opponent
    const you = gameState.players.find(p => p.color === playerColor);
    const opponent = gameState.players.find(p => p.color !== playerColor);

    // Test for checkmate
    if (gameState.status === GAME_STATUS.CHECKMATE) {
        if (opponent.inCheck) { uiManager.showGameOver(GAME_OVER_TYPES.CHECKMATE_WIN); }
        if (you.inCheck) { uiManager.showGameOver(GAME_OVER_TYPES.CHECKMATE_LOSE); }
    }

    // Test for stalemate
    if (gameState.status === GAME_STATUS.NOPIECES) {
        if (!opponent.hasMoveablePieces) { uiManager.showGameOver(GAME_OVER_TYPES.NOPIECES_WIN); }
        if (!you.hasMoveablePieces) { uiManager.showGameOver(GAME_OVER_TYPES.NOPIECES_LOSE); }
    }

    // Test for forfeit
    if (gameState.status === GAME_STATUS.FORFEIT) {
        if (opponent.forfeited) { uiManager.showGameOver(GAME_OVER_TYPES.FORFEIT_WIN); }
        if (you.forfeited) { uiManager.showGameOver(GAME_OVER_TYPES.FORFEIT_LOSE); }
    }
};

const Client = init;

export default Client;