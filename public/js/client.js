import { BoardHighlighter } from "./lib/boardhighlighter.js";
import { ClientBoard } from "./lib/clientboard.js";
import {
    clearHighlights,
    showErrorMessage,
    showGameOverMessage,
    showForfeitPrompt
} from './lib/uihelpers.js';

var Client = (function (window) {

    var socket = null;
    var gameState = null;

    var gameID = null;
    var playerColor = null;
    var playerName = null;

    var container = null;
    var messages = null;
    var board = null;
    var squares = null;

    var gameClasses = null;

    var gameOverMessage = null;
    var forfeitPrompt = null;

    var clientBoard = new ClientBoard();
    var boardHighlighter = null; 

    /**
    * Initialize the UI
    */
    var init = function (config) {
        gameID = config.gameID;
        playerColor = config.playerColor;
        playerName = config.playerName;

        container = $('#game');
        messages = $('#messages');
        board = $('#board');

        var numRows = 12;
        var numColumns = 5;
        var boardHtml = clientBoard.generateBoardHtml(numRows, numColumns);
        board.append(boardHtml);

        squares = board.find('.square');
        var setupButton = $('#finishSetup');

        gameOverMessage = $('#game-over');
        forfeitPrompt = $('#forfeit-game');

        var colorClasses = "red blue";
        var rankClasses = "";
        for (var i = 0; i <= 11; i++) {
            rankClasses += "rank" + i + " ";
        }
        gameClasses = colorClasses + " " + rankClasses + " not-moved empty selected " +
            "valid-move valid-attack valid-swap last-move";

        // Create socket connection
        socket = io.connect();

        // Define board based on player's perspective
        clientBoard.assignSquareIds(squares, playerColor);

        boardHighlighter = new BoardHighlighter(squares, gameState);

        // Attach event handlers
        attachDOMEventHandlers();
        attachSocketEventHandlers();

        // Initialize modal popup windows
        gameOverMessage.modal({ show: false, keyboard: false, backdrop: 'static' });
        forfeitPrompt.modal({ show: false, keyboard: false, backdrop: 'static' });

        // Join game
        socket.emit('join', gameID);
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
        // All pieces can be swapped
        for (var i = 0; i <= 11; i++) {
            container.on('click', baseString + i.toString(), callbackHighlightSwap(playerColor[0], i.toString()));
        }

        // Only highlight movable pieces
        for (var i = 0; i < 10; i++) {
            container.on('click', baseString + i.toString(), callbackHighlightMoves(playerColor[0], i.toString()));
        }

        // Clear all move highlights
        container.on('click', '.empty', function (ev) {
            clearHighlights(squares);
        });

        // Perform a regular move
        container.on('click', '.valid-move', function (ev) {
            var m = generateMoveString(ev.target, '-');

            messages.empty();
            socket.emit('move', { gameID: gameID, move: m });
        });

        // Attack the opponent's piece
        container.on('click', '.valid-attack', function (ev) {
            var m = generateMoveString(ev.target, 'x');

            messages.empty();
            socket.emit('move', { gameID: gameID, move: m });
        });

        //Swap pieces
        container.on('click', '.valid-swap', function (ev) {
            var m = boardHighlighter.getSwapString();

            messages.empty();
            socket.emit('move', { gameID: gameID, move: m });
        });

        //Finish setup
        container.on('click', '#finishSetup', function (ev) {
            socket.emit('finishSetup', gameID);
        });


        // Forfeit game
        container.on('click', '#forfeit', function (ev) {
            showForfeitPrompt(forfeitPrompt, function (confirmed) {
                if (confirmed) {
                    messages.empty();
                    socket.emit('forfeit', gameID);
                }
            });

        });
    };

    var generateMoveString = function (destinationSquare, symbol) {
        const selection = boardHighlighter.getSelection();
        var piece = selection.pieceStr;
        var src = $('#' + selection.squareId);
        var dest = $(destinationSquare);

        clearHighlights(squares);

        var pieceClass = clientBoard.getPieceClasses(piece, playerColor, gameState);

        // Move piece on board
        src.removeClass(pieceClass).addClass('empty');
        dest.removeClass('empty').addClass(pieceClass);

        // Return move string
        return selection.squareId + ' ' + symbol + ' ' + dest.attr('id');
    }

    /**
    * Attach Socket.IO event handlers
    */
    var attachSocketEventHandlers = function () {
        // Update UI with new game state
        socket.on('update', function (data) {
            //console.log(data);
            gameState = data;
            update();
        });

        // Display an error
        socket.on('error', function (data) {
            //console.log(data);
            showErrorMessage(messages, data);
        });
    };

    /**
     * Update UI from game state
     */
    var update = function () {
        var you, opponent = null;

        var container, name, status, captures = null;

        // Update player info
        for (var i = 0; i < gameState.players.length; i++) {
            // Determine if player is you or opponent
            if (gameState.players[i].color === playerColor) {
                you = gameState.players[i];
                container = $('#you');
            }
            else if (gameState.players[i].color !== playerColor) {
                opponent = gameState.players[i];
                container = $('#opponent');
            }

            name = container.find('strong');
            status = container.find('.status');
            captures = container.find('ul');

            // Name
            if (gameState.players[i].name) {
                //if the player quits midgame, don't show any name
                if (gameState.players[i].joined === false) {
                    name.text("...");
                    gameState.players[i].name = null;
                }
                else {
                    name.text(gameState.players[i].name);
                }
            }

            // Active Status
            container.removeClass('active-player');
            if (gameState.activePlayer && gameState.activePlayer.color === gameState.players[i].color) {
                container.addClass('active-player');
            }

            //Setup Status
            container.removeClass('setup-player ready-player');
            if (gameState.players[i].isSetup === false) {
                container.addClass('setup-player');
            }
            else if (gameState.players[i].isSetup === true && gameState.status === 'pending') {
                container.addClass('ready-player');
            }

            // Check Status
            /*status.removeClass('label label-danger').text('');
            if (gameState.players[i].inCheck) {
              status.addClass('label label-danger').text('Check');
            }*/

            // Captured Pieces
            /*captures.empty();
            for (var j=0; j<gameState.capturedPieces.length; j++) {
              if (gameState.capturedPieces[j][0] !== gameState.players[i].color[0]) {
                captures.append('<li class="'+getPieceClasses(gameState.capturedPieces[j])+'"></li>');
              }
            }*/
        }

        // Update board
        for (var sq in gameState.board.boardState) {
            var piece = gameState.board.boardState[sq];
            var pieceStr = (piece == null) ? null : (piece.colorChar + piece.rankStr);
            var pieceClass = clientBoard.getPieceClasses(pieceStr, playerColor, gameState);
            $('#' + sq).removeClass(gameClasses).addClass(pieceClass);
        }

        // Highlight last move
        if (gameState.lastMove) {
            if (gameState.lastMove.type === 'move' || gameState.lastMove.type === 'attack') {
                $('#' + gameState.lastMove.startSquare).addClass('last-move');
                $('#' + gameState.lastMove.endSquare).addClass('last-move');
            }
        }

        // Test for checkmate
        if (gameState.status === 'checkmate') {
            if (opponent.inCheck) { showGameOverMessage(gameOverMessage, 'checkmate-win'); }
            if (you.inCheck) { showGameOverMessage(gameOverMessage, 'checkmate-lose'); }
        }

        // Test for stalemate
        if (gameState.status === 'nopieces') {
            if (opponent.hasMoveablePieces === false) { showGameOverMessage(gameOverMessage, 'nopieces-win'); }
            if (you.hasMoveablePieces === false) { showGameOverMessage(gameOverMessage, 'nopieces-lose'); }
        }

        // Test for forfeit
        if (gameState.status === 'forfeit') {
            if (opponent.forfeited) { showGameOverMessage(gameOverMessage, 'forfeit-win'); }
            if (you.forfeited) { showGameOverMessage(gameOverMessage, 'forfeit-lose'); }
        }
    };

    return init;
})(window);

export default Client;