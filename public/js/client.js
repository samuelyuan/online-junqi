import { BoardHighlighter } from "./lib/boardhighlighter.js";
import { ClientBoard } from "./lib/clientboard.js";
import SocketManager from './lib/SocketManager.js';
import GameUIManager from './lib/GameUIManager.js';

var Client = (function (window) {

    var gameState = null;

    var gameID = null;
    var playerColor = null;
    var playerName = null;

    var gameClasses = null;

    var clientBoard = new ClientBoard();
    var boardHighlighter = null;

    var socketManager = new SocketManager();
    var uiManager = new GameUIManager();

    /**
    * Initialize the UI
    */
    var init = function (config) {
        gameID = config.gameID;
        playerColor = config.playerColor;
        playerName = config.playerName;

        uiManager.setPlayerColor(playerColor);

        var numRows = 12;
        var numColumns = 5;
        var boardHtml = clientBoard.generateBoardHtml(numRows, numColumns);
        var squares = uiManager.initBoard(boardHtml);
        uiManager.initModals();

        var colorClasses = "red blue";
        var rankClasses = "";
        for (var i = 0; i <= 11; i++) {
            rankClasses += "rank" + i + " ";
        }
        gameClasses = colorClasses + " " + rankClasses + " not-moved empty selected " +
            "valid-move valid-attack valid-swap last-move";

        // Create socket connection and join game
        socketManager.connect(gameID);

        // Subscribe to socket events
        socketManager.on('update', function (data) {
            //console.log(data);
            gameState = data;
            update();
        });

        socketManager.on('error', function (data) {
            //console.log(data);
            uiManager.showErrorMessage(data);
        });

        // Define board based on player's perspective
        clientBoard.assignSquareIds(squares, playerColor);

        boardHighlighter = new BoardHighlighter(squares, gameState);

        // Attach event handlers
        attachDOMEventHandlers();
    };

    var callbackHighlightSwap = function (color, rank) {
        return function (ev) {
            //for setup, swap pieces
            for (var i = 0; i < gameState.players.length; i++) {
                if (gameState.players[i].color === playerColor && gameState.players[i].isSetup === false) {
                    boardHighlighter.highlightValidSwap(gameState, color + rank, ev.target);
                }
            }
        }
    }

    var callbackHighlightMoves = function (color, rank) {
        return function (ev) {
            //Show moves for player
            if (gameState.activePlayer && gameState.activePlayer.color === playerColor) {
                boardHighlighter.highlightValidMoves(gameState, color + rank, ev.target);
            }
        }
    };

    /**
     * Attach DOM event handlers
     */
    var attachDOMEventHandlers = function () {
        var baseString = '.' + playerColor + '.rank';
        var squares = uiManager.getSquares();

        // All pieces can be swapped
        for (var i = 0; i <= 11; i++) {
            uiManager.gameRoot.on('click', baseString + i.toString(), callbackHighlightSwap(playerColor[0], i.toString()));
        }

        // Only highlight movable pieces
        for (var i = 0; i < 10; i++) {
            uiManager.gameRoot.on('click', baseString + i.toString(), callbackHighlightMoves(playerColor[0], i.toString()));
        }

        // Clear all move highlights
        uiManager.gameRoot.on('click', '.empty', function (ev) {
            uiManager.clearHighlights();
        });

        // Perform a regular move
        uiManager.gameRoot.on('click', '.valid-move', function (ev) {
            var m = generateMoveString(ev.target, '-');
            uiManager.clearMessages();
            socketManager.sendMove(gameID, m);
        });

        // Attack the opponent's piece
        uiManager.gameRoot.on('click', '.valid-attack', function (ev) {
            var m = generateMoveString(ev.target, 'x');
            uiManager.clearMessages();
            socketManager.sendMove(gameID, m);
        });

        //Swap pieces
        uiManager.gameRoot.on('click', '.valid-swap', function (ev) {
            var m = boardHighlighter.getSwapString();
            uiManager.clearMessages();
            socketManager.sendMove(gameID, m);
        });

        //Finish setup
        uiManager.gameRoot.on('click', '#finishSetup', function (ev) {
            socketManager.finishSetup(gameID);
        });

        // Forfeit game
        uiManager.gameRoot.on('click', '#forfeit', function (ev) {
            uiManager.showForfeitPrompt(function (confirmed) {
                if (confirmed) {
                    uiManager.clearMessages();
                    socketManager.forfeit(gameID);
                }
            });
        });
    };

    var generateMoveString = function (destinationSquare, symbol) {
        const selection = boardHighlighter.getSelection();
        var piece = selection.pieceStr;
        var src = uiManager.getElement(selection.squareId);
        var dest = uiManager.getElementFromDOM(destinationSquare);

        uiManager.clearHighlights();

        var pieceClass = clientBoard.getPieceClasses(piece, playerColor, gameState);

        // Move piece on board
        src.removeClass(pieceClass).addClass('empty');
        dest.removeClass('empty').addClass(pieceClass);

        // Return move string
        return selection.squareId + ' ' + symbol + ' ' + dest.attr('id');
    }

    /**
     * Update UI from game state
     */
    var update = function () {
        const activeColor = gameState.activePlayer?.color;

        // Update player info
        uiManager.updatePlayerPanels(gameState.players, activeColor, gameState.status);

        // Update board
        uiManager.renderBoard(gameState.board, playerColor, gameState, clientBoard, gameClasses);

        // Highlight last move
        uiManager.highlightLastMove(gameState.lastMove);

        // Identify you and opponent
        const you = gameState.players.find(p => p.color === playerColor);
        const opponent = gameState.players.find(p => p.color !== playerColor);

        // Test for checkmate
        if (gameState.status === 'checkmate') {
            if (opponent.inCheck) { uiManager.showGameOver('checkmate-win'); }
            if (you.inCheck) { uiManager.showGameOver('checkmate-lose'); }
        }

        // Test for stalemate
        if (gameState.status === 'nopieces') {
            if (!opponent.hasMoveablePieces) { uiManager.showGameOver('nopieces-win'); }
            if (!you.hasMoveablePieces) { uiManager.showGameOver('nopieces-lose'); }
        }

        // Test for forfeit
        if (gameState.status === 'forfeit') {
            if (opponent.forfeited) { uiManager.showGameOver('forfeit-win'); }
            if (you.forfeited) { uiManager.showGameOver('forfeit-lose'); }
        }
    };

    return init;
})(window);

export default Client;