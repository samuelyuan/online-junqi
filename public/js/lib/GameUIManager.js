// Constants
const GAME_OVER_TYPES = {
    'checkmate-win': ['alert-success', 'Captured Flag'],
    'checkmate-lose': ['alert-danger', 'Flag Lost'],
    'forfeit-win': ['alert-success', 'Your opponent has surrendered'],
    'forfeit-lose': ['alert-danger', 'You have surrendered'],
    'nopieces-win': ['alert-success', 'Your opponent has no moveable pieces'],
    'nopieces-lose': ['alert-danger', 'You have no moveable pieces left'],
};

const CLASS_NAMES = {
    highlight: 'selected valid-move valid-attack valid-swap',
    lastMove: 'last-move',
};

class GameUIManager {
    constructor() {
        this.gameRoot = this.getElement('game');
        this.messages = this.getElement('messages');
        this.board = this.getElement('board');
        this.squares = null;
        this.gameOverMessage = this.getElement('game-over');
        this.forfeitPrompt = this.getElement('forfeit-game');
        this.playerColor = null;
        this.containers = {
            you: this.getElement('you'),
            opponent: this.getElement('opponent'),
        };
    }

    initBoard(html) {
        this.board.append(html);
        this.squares = this.board.find('.square');
        return this.squares;
    }

    initModals() {
        const modalConfig = { show: false, keyboard: false, backdrop: 'static' };
        this.gameOverMessage.modal(modalConfig);
        this.forfeitPrompt.modal(modalConfig);
    }

    setPlayerColor(color) {
        this.playerColor = color;
    }

    clearMessages() {
        this.messages.empty();
    }

    showErrorMessage(data) {
        const msg = (data === 'handshake unauthorized')
            ? 'Client connection failed'
            : data.message;

        this.messages.append(`<div class="alert alert-danger">${msg}</div>`);
    }

    showForfeitPrompt(callback) {
        this.forfeitPrompt.one('click', '#cancel-forfeit', () => {
            callback(false);
            this.forfeitPrompt.modal('hide');
        });

        this.forfeitPrompt.one('click', '#confirm-forfeit', () => {
            callback(true);
            this.forfeitPrompt.modal('hide');
        });

        this.forfeitPrompt.modal('show');
    }

    showGameOver(type) {
        const header = this.gameOverMessage.find('h2');
        header.removeClass('alert-success alert-danger alert-warning');

        const typeEntry = GAME_OVER_TYPES[type];
        if (!typeEntry) return;

        const [cls, text] = typeEntry;
        header.addClass(cls).text(text);
        this.gameOverMessage.modal('show');
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
        this.squares.removeClass(CLASS_NAMES.highlight);
    }

    getPlayerContainer(color) {
        return color === this.playerColor ? this.containers.you : this.containers.opponent;
    }

    setPlayerName(container, player) {
        const name = container.find('strong');
        if (player.name) {
            name.text(player.joined === false ? "..." : player.name);
        }
    }

    setPlayerStatus(container, player, activeColor, gameStatus) {
        container.removeClass('active-player');
        if (activeColor === player.color) {
            container.addClass('active-player');
        }

        container.removeClass('setup-player ready-player');
        if (player.isSetup === false) {
            container.addClass('setup-player');
        } else if (player.isSetup === true && gameStatus === 'pending') {
            container.addClass('ready-player');
        }
    }

    updatePlayerPanels(players, activeColor, gameStatus) {
        players.forEach(player => {
            const container = this.getPlayerContainer(player.color);
            this.setPlayerName(container, player);
            this.setPlayerStatus(container, player, activeColor, gameStatus);

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
            this.getElement(lastMove.startSquare).addClass(CLASS_NAMES.lastMove);
            this.getElement(lastMove.endSquare).addClass(CLASS_NAMES.lastMove);
        }
    }
}

export default GameUIManager;
