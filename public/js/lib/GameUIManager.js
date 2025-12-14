import {
    CSS_CLASSES,
    ELEMENT_IDS,
    SELECTORS,
    GAME_OVER_MESSAGES,
    ERROR_MESSAGES,
    GAME_STATUS
} from './constants.js';

class GameUIManager {
    constructor() {
        this.gameRoot = this.getElement(ELEMENT_IDS.GAME);
        this.messages = this.getElement(ELEMENT_IDS.MESSAGES);
        this.board = this.getElement(ELEMENT_IDS.BOARD);
        this.squares = null;
        this.gameOverMessage = this.getElement(ELEMENT_IDS.GAME_OVER);
        this.forfeitPrompt = this.getElement(ELEMENT_IDS.FORFEIT_GAME);
        this.playerColor = null;
        this.containers = {
            you: this.getElement(ELEMENT_IDS.YOU),
            opponent: this.getElement(ELEMENT_IDS.OPPONENT),
        };
        // Selection state for board highlighting
        this.selection = null;
        this.curSelectedSquare = null;
        this.prevSelectedSquare = null;
        this.swapStr = null;
    }

    initBoard(html) {
        this.board.append(html);
        this.squares = this.board.find(SELECTORS.SQUARE);
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
        const msg = (data === ERROR_MESSAGES.HANDSHAKE_UNAUTHORIZED)
            ? ERROR_MESSAGES.CLIENT_CONNECTION_FAILED
            : data.message;

        // Use .text() to safely escape user input
        const alertDiv = $('<div>')
            .addClass(`alert ${CSS_CLASSES.ALERT_DANGER}`)
            .text(msg);
        
        this.messages.append(alertDiv);
    }

    showForfeitPrompt(callback) {
        this.forfeitPrompt.one('click', `#${ELEMENT_IDS.CANCEL_FORFEIT}`, () => {
            callback(false);
            this.forfeitPrompt.modal('hide');
        });

        this.forfeitPrompt.one('click', `#${ELEMENT_IDS.CONFIRM_FORFEIT}`, () => {
            callback(true);
            this.forfeitPrompt.modal('hide');
        });

        this.forfeitPrompt.modal('show');
    }

    showGameOver(type) {
        const header = this.gameOverMessage.find('h2');
        header.removeClass(`${CSS_CLASSES.ALERT_SUCCESS} ${CSS_CLASSES.ALERT_DANGER} ${CSS_CLASSES.ALERT_WARNING}`);

        const typeEntry = GAME_OVER_MESSAGES[type];
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
        this.squares.removeClass(CSS_CLASSES.HIGHLIGHT);
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
        container.removeClass(CSS_CLASSES.ACTIVE_PLAYER);
        if (activeColor === player.color) {
            container.addClass(CSS_CLASSES.ACTIVE_PLAYER);
        }

        container.removeClass(`${CSS_CLASSES.SETUP_PLAYER} ${CSS_CLASSES.READY_PLAYER}`);
        if (player.isSetup === false) {
            container.addClass(CSS_CLASSES.SETUP_PLAYER);
        } else if (player.isSetup === true && gameStatus === GAME_STATUS.PENDING) {
            container.addClass(CSS_CLASSES.READY_PLAYER);
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

    renderBoard(boardState, playerColor, gameState, boardRenderer, gameClasses) {
        for (const sq in boardState) {
            const piece = boardState[sq];
            const pieceStr = piece == null ? null : (piece.colorChar + piece.rank.toString());
            const pieceClass = boardRenderer.getPieceClasses(pieceStr, playerColor, gameState);
            this.getElement(sq).removeClass(gameClasses).addClass(pieceClass);
        }
    }

    highlightLastMove(lastMove) {
        if (!lastMove) return;
        if (lastMove.type === 'move' || lastMove.type === 'attack') {
            this.getElement(lastMove.startSquare).addClass(CSS_CLASSES.LAST_MOVE);
            this.getElement(lastMove.endSquare).addClass(CSS_CLASSES.LAST_MOVE);
        }
    }

    highlightValidSwap(gameState, piece, selectedSquareEl) {
        const square = this.getElementFromDOM(selectedSquareEl);
        const squareId = square.attr('id');
        this.selection = {
            pieceStr: piece,
            squareId
        };

        this.curSelectedSquare = squareId;
        this.swapStr = `${this.curSelectedSquare} s ${this.prevSelectedSquare}`;

        this.squares.removeClass(CSS_CLASSES.SELECTED);
        square.addClass(CSS_CLASSES.SELECTED);

        this.squares.removeClass(CSS_CLASSES.VALID_SWAP);

        for (const move of gameState.validSwap) {
            if (move.type === 'swap' && move.startSquare === squareId) {
                this.prevSelectedSquare = squareId;
                this.getElement(move.endSquare).addClass(CSS_CLASSES.VALID_SWAP);
            }
        }
    }

    highlightValidMoves(gameState, piece, selectedSquareEl) {
        const square = this.getElementFromDOM(selectedSquareEl);
        const squareId = square.attr('id');

        this.selection = {
            pieceStr: piece,
            squareId
        };

        this.squares.removeClass(CSS_CLASSES.SELECTED);
        square.addClass(CSS_CLASSES.SELECTED);

        this.squares.removeClass(`${CSS_CLASSES.VALID_MOVE} ${CSS_CLASSES.VALID_ATTACK}`);

        for (const move of gameState.validMoves) {
            if (move.startSquare === squareId) {
                if (move.type === 'move') {
                    this.getElement(move.endSquare).addClass(CSS_CLASSES.VALID_MOVE);
                } else if (move.type === 'attack') {
                    this.getElement(move.endSquare).addClass(CSS_CLASSES.VALID_ATTACK);
                }
            }
        }
    }

    getSelection() {
        return this.selection;
    }

    getSwapString() {
        return this.swapStr;
    }
}

export default GameUIManager;
