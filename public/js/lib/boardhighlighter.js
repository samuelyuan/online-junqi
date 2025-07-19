export class BoardHighlighter {
    constructor(squares) {
        this.squares = squares;
        this.selection = null;
        this.curSelectedSquare = null;
        this.prevSelectedSquare = null;
        this.swapStr = null;
    }

    highlightValidSwap(gameState, piece, selectedSquareEl) {
        const square = $(selectedSquareEl);
        const squareId = square.attr('id');
        this.selection = {
            pieceStr: piece,
            squareId
        };

        this.curSelectedSquare = squareId;
        this.swapStr = `${this.curSelectedSquare} s ${this.prevSelectedSquare}`;

        this.squares.removeClass('selected');
        square.addClass('selected');

        this.squares.removeClass('valid-swap');

        for (const move of gameState.validSwap) {
            if (move.type === 'swap' && move.startSquare === squareId) {
                this.prevSelectedSquare = squareId;
                $(`#${move.endSquare}`).addClass('valid-swap');
            }
        }
    }

    highlightValidMoves(gameState, piece, selectedSquareEl) {
        const square = $(selectedSquareEl);
        const squareId = square.attr('id');

        this.selection = {
            pieceStr: piece,
            squareId
        };

        this.squares.removeClass('selected');
        square.addClass('selected');

        this.squares.removeClass('valid-move valid-attack');

        for (const move of gameState.validMoves) {
            if (move.startSquare === squareId) {
                if (move.type === 'move') {
                    $(`#${move.endSquare}`).addClass('valid-move');
                } else if (move.type === 'attack') {
                    $(`#${move.endSquare}`).addClass('valid-attack');
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
