// Helper functions
export function clearHighlights(squares) {
    squares.removeClass('selected valid-move valid-attack valid-swap');
}

export function showErrorMessage(messages, data) {
    const msg = (data === 'handshake unauthorized')
        ? 'Client connection failed'
        : data.message;

    messages.append(`<div class="alert alert-danger">${msg}</div>`);
}

export function showGameOverMessage(gameOverMessage, type) {
    const header = gameOverMessage.find('h2');
    header.removeClass('alert-success alert-danger alert-warning');

    const typeToText = {
        'checkmate-win': ['alert-success', 'Captured Flag'],
        'checkmate-lose': ['alert-danger', 'Flag Lost'],
        'forfeit-win': ['alert-success', 'Your opponent has surrendered'],
        'forfeit-lose': ['alert-danger', 'You have surrendered'],
        'nopieces-win': ['alert-success', 'Your opponent has no moveable pieces'],
        'nopieces-lose': ['alert-danger', 'You have no moveable pieces left'],
    };

    const [cls, text] = typeToText[type];
    header.addClass(cls).text(text);
    gameOverMessage.modal('show');
}

export function showForfeitPrompt(forfeitPrompt, callback) {
    forfeitPrompt.one('click', '#cancel-forfeit', function () {
        callback(false);
        forfeitPrompt.modal('hide');
    });

    forfeitPrompt.one('click', '#confirm-forfeit', function () {
        callback(true);
        forfeitPrompt.modal('hide');
    });

    forfeitPrompt.modal('show');
}

class GameUIManager {
    constructor() {
        this.container = $('#game');
        this.messages = $('#messages');
        this.board = $('#board');
        this.squares = null;
        this.gameOverMessage = $('#game-over');
        this.forfeitPrompt = $('#forfeit-game');
        this.playerColor = null; // will be set via init
    }

    initBoard(html) {
        this.board.append(html);
        this.squares = this.board.find('.square');
        return this.squares;
    }

    initModals() {
        this.gameOverMessage.modal({ show: false, keyboard: false, backdrop: 'static' });
        this.forfeitPrompt.modal({ show: false, keyboard: false, backdrop: 'static' });
    }

    setPlayerColor(color) {
        this.playerColor = color;
    }

    clearMessages() {
        this.messages.empty();
    }

    showErrorMessage(errorData) {
        showErrorMessage(this.messages, errorData);
    }

    showForfeitPrompt(callback) {
        showForfeitPrompt(this.forfeitPrompt, callback);
    }

    showGameOver(type) {
        showGameOverMessage(this.gameOverMessage, type);
    }

    getElement(id) {
        return $('#' + id);
    }

    getElementFromDOM(domNode) {
        return $(domNode);
    }

    getSquares() {
        return this.squares;
    }

    clearHighlights() {
        this.squares.removeClass('selected valid-move valid-attack valid-swap');
    }

    updatePlayerPanels(players, activeColor, gameStatus) {
        players.forEach(player => {
            const container = (player.color === this.playerColor) ? $('#you') : $('#opponent');
            const name = container.find('strong');
            const status = container.find('.status');
            const captures = container.find('ul');

            // Name
            if (player.name) {
                if (player.joined === false) {
                    name.text("...");
                } else {
                    name.text(player.name);
                }
            }

            // Active status
            container.removeClass('active-player');
            if (activeColor === player.color) {
                container.addClass('active-player');
            }

            // Setup status
            container.removeClass('setup-player ready-player');
            if (player.isSetup === false) {
                container.addClass('setup-player');
            } else if (player.isSetup === true && gameStatus === 'pending') {
                container.addClass('ready-player');
            }

            // Check status
            /*status.removeClass('label label-danger').text('');
            if (player.inCheck) {
                status.addClass('label label-danger').text('Check');
            }*/

            // Captured pieces
            /*captures.empty();
            for (let j = 0; j < gameState.capturedPieces.length; j++) {
                if (gameState.capturedPieces[j][0] !== player.color[0]) {
                    captures.append('<li class="' + getPieceClasses(gameState.capturedPieces[j]) + '"></li>');
                }
            }*/
        });
    }

    renderBoard(boardState, playerColor, gameState, clientBoard, gameClasses) {
        for (const sq in boardState) {
            const piece = boardState[sq];
            const pieceStr = piece == null ? null : (piece.colorChar + piece.rankStr);
            const pieceClass = clientBoard.getPieceClasses(pieceStr, playerColor, gameState);
            this.getElement(sq).removeClass(gameClasses).addClass(pieceClass);
        }
    }

    highlightLastMove(lastMove) {
        if (!lastMove) return;
        if (lastMove.type === 'move' || lastMove.type === 'attack') {
            this.getElement(lastMove.startSquare).addClass('last-move');
            this.getElement(lastMove.endSquare).addClass('last-move');
        }
    }
}

export default GameUIManager;
