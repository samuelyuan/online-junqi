import { ClientBoard } from "./lib/clientboard.js";

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

    var selection = null;

    var prevSelectedSquare = null;
    var curSelectedSquare = null;
    var swapStr = null;

    var gameOverMessage = null;
    var forfeitPrompt = null;

    var clientBoard = new ClientBoard();

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
        assignSquares();

        // Attach event handlers
        attachDOMEventHandlers();
        attachSocketEventHandlers();

        // Initialize modal popup windows
        gameOverMessage.modal({ show: false, keyboard: false, backdrop: 'static' });
        forfeitPrompt.modal({ show: false, keyboard: false, backdrop: 'static' });

        // Join game
        socket.emit('join', gameID);
    };

    /**
    * Assign square IDs and labels based on player's perspective
    */
    var assignSquares = function () {
        var fileLabels = ['A', 'B', 'C', 'D', 'E'];
        var rankLabels = [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
        var squareIDs = [
            'a12', 'b12', 'c12', 'd12', 'e12',
            'a11', 'b11', 'c11', 'd11', 'e11',
            'a10', 'b10', 'c10', 'd10', 'e10',
            'a9', 'b9', 'c9', 'd9', 'e9',
            'a8', 'b8', 'c8', 'd8', 'e8',
            'a7', 'b7', 'c7', 'd7', 'e7',
            'a6', 'b6', 'c6', 'd6', 'e6',
            'a5', 'b5', 'c5', 'd5', 'e5',
            'a4', 'b4', 'c4', 'd4', 'e4',
            'a3', 'b3', 'c3', 'd3', 'e3',
            'a2', 'b2', 'c2', 'd2', 'e2',
            'a1', 'b1', 'c1', 'd1', 'e1'
        ];

        if (playerColor === 'red') {
            fileLabels.reverse();
            rankLabels.reverse();
            squareIDs.reverse();
        }

        // Set file and rank labels
        /* $('.top-edge').each(function(i) { $(this).text(fileLabels[i]); });
         $('.right-edge').each(function(i) { $(this).text(rankLabels[i]); });
         $('.bottom-edge').each(function(i) { $(this).text(fileLabels[i]); });
         $('.left-edge').each(function(i) { $(this).text(rankLabels[i]); });*/

        // Set square IDs
        squares.each(function (i) {
            $(this).attr('id', squareIDs[i]);
        });
    };

    var callbackHighlightSwap = function (color, rank) {
        return function (ev) {
            //for setup, swap pieces
            for (var i = 0; i < gameState.players.length; i++) {
                if (gameState.players[i].color === playerColor && gameState.players[i].isSetup === false) {
                    highlightValidSwap(color + rank, ev.target);
                }
            }
        }
    }

    var callbackHighlightMoves = function (color, rank) {
        return function (ev) {
            //Show moves for player
            if (gameState.activePlayer && gameState.activePlayer.color === playerColor) {
                highlightValidMoves(color + rank, ev.target);
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
            clearHighlights();
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
            var m = swapStr;

            messages.empty();
            socket.emit('move', { gameID: gameID, move: m });
        });

        //Finish setup
        container.on('click', '#finishSetup', function (ev) {
            socket.emit('finishSetup', gameID);
        });


        // Forfeit game
        container.on('click', '#forfeit', function (ev) {
            showForfeitPrompt(function (confirmed) {
                if (confirmed) {
                    messages.empty();
                    socket.emit('forfeit', gameID);
                }
            });

        });
    };

    var generateMoveString = function (destinationSquare, symbol) {
        var piece = selection.pieceStr;
        var src = $('#' + selection.squareId);
        var dest = $(destinationSquare);

        clearHighlights();

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
            showErrorMessage(data);
        });
    };

    var highlightValidSwap = function (piece, selectedSquare) {
        var square = $(selectedSquare);
        var move = null;

        // Set selection object
        selection = {
            pieceStr: piece,
            squareId: square.attr('id'),
        };

        // Highlight the selected square
        squares.removeClass('selected');
        square.addClass('selected');

        curSelectedSquare = square.attr('id');
        swapStr = curSelectedSquare + ' ' + 's' + ' ' + prevSelectedSquare;

        // Highlight any valid moves
        squares.removeClass('valid-swap');
        for (var i = 0; i < gameState.validSwap.length; i++) {
            move = gameState.validSwap[i];

            if (move.type === 'swap') {
                if (move.startSquare === square.attr('id')) {
                    prevSelectedSquare = square.attr('id');
                    $('#' + move.endSquare).addClass('valid-swap');
                }
            }
        }
    }

    /**
    * Highlight valid moves for the selected piece
    */
    var highlightValidMoves = function (piece, selectedSquare) {
        var square = $(selectedSquare);
        var move = null;

        // Set selection object
        selection = {
            pieceStr: piece,
            squareId: square.attr('id'),
        };

        // Highlight the selected square
        squares.removeClass('selected');
        square.addClass('selected');

        // Highlight any valid moves
        squares.removeClass('valid-move valid-attack');
        for (var i = 0; i < gameState.validMoves.length; i++) {
            move = gameState.validMoves[i];

            if (move.type === 'move') {
                // Highlight empty squares to move to
                if (move.startSquare === square.attr('id')) {
                    $('#' + move.endSquare).addClass('valid-move');
                }
            }
            else if (move.type === 'attack') {
                // Highlight squares with enemy pieces
                if (move.startSquare === square.attr('id')) {
                    $('#' + move.endSquare).addClass('valid-attack');
                }
            }
        }
    };

    /**
    * Clear valid move highlights
    */
    var clearHighlights = function () {
        squares.removeClass('selected');
        squares.removeClass('valid-move');
        squares.removeClass('valid-attack');
        squares.removeClass('valid-swap');
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
            if (opponent.inCheck) { showGameOverMessage('checkmate-win'); }
            if (you.inCheck) { showGameOverMessage('checkmate-lose'); }
        }

        // Test for stalemate
        if (gameState.status === 'nopieces') {
            if (opponent.hasMoveablePieces === false) { showGameOverMessage('nopieces-win'); }
            if (you.hasMoveablePieces === false) { showGameOverMessage('nopieces-lose'); }
        }

        // Test for forfeit
        if (gameState.status === 'forfeit') {
            if (opponent.forfeited) { showGameOverMessage('forfeit-win'); }
            if (you.forfeited) { showGameOverMessage('forfeit-lose'); }
        }
    };

    /**
     * Display an error message on the page
     */
    var showErrorMessage = function (data) {
        var msg, html = '';

        if (data == 'handshake unauthorized') {
            msg = 'Client connection failed';
        } else {
            msg = data.message;
        }

        html = '<div class="alert alert-danger">' + msg + '</div>';
        messages.append(html);
    };

    /**
     * Display the "Game Over" window
     */
    var showGameOverMessage = function (type) {
        var header = gameOverMessage.find('h2');

        // Set the header's content and CSS classes
        header.removeClass('alert-success alert-danger alert-warning');
        switch (type) {
            case 'checkmate-win': header.addClass('alert-success').text('Captured Flag'); break;
            case 'checkmate-lose': header.addClass('alert-danger').text('Flag Lost'); break;
            case 'forfeit-win': header.addClass('alert-success').text('Your opponent has surrendered'); break;
            case 'forfeit-lose': header.addClass('alert-danger').text('You have surrendered'); break;
            case 'nopieces-win': header.addClass('alert-success').text('Your opponent has no moveable pieces'); break;
            case 'nopieces-lose': header.addClass('alert-danger').text('You have no moveable pieces left'); break;
        }
        gameOverMessage.modal('show');
    };

    /**
     * Display the "Forfeit Game" confirmation prompt
     */
    var showForfeitPrompt = function (callback) {
        // Temporarily attach click handler for the Cancel button, note the use of .one()
        forfeitPrompt.one('click', '#cancel-forfeit', function (ev) {
            callback(false);
            forfeitPrompt.modal('hide');
        });

        // Temporarily attach click handler for the Confirm button, note the use of .one()
        forfeitPrompt.one('click', '#confirm-forfeit', function (ev) {
            callback(true);
            forfeitPrompt.modal('hide');
        });

        forfeitPrompt.modal('show');
    };

    return init;
})(window);

export default Client;