import { BoardSquarePieceMap, BUNKER_SQUARES, HEADQUARTER_SQUARE_GROUP, HEADQUARTER_SQUARES } from './BoardConstants';
import {
    Piece,
    PieceRank,
} from './Piece';

export class BoardValidator {
    validateBoard(board: BoardSquarePieceMap): boolean {
        return Object.keys(board).every(square => {
            // Bunker squares should always be empty in beginning
            if (BUNKER_SQUARES.includes(square)) {
                return board[square] === null;
            }

            // All other squares must have a piece
            var piece: Piece | null = board[square];
            if (!piece) {
                return false;
            }

            var squareRowNum: number = this.getBoardSquareRow(square);
            if (piece.getRank() === PieceRank.BOMB) {
                return this.isValidBombPosition(squareRowNum);
            } else if (piece.getRank() === PieceRank.LANDMINE) {
                return this.isValidLandminePosition(squareRowNum);
            } else if (piece.getRank() === PieceRank.FLAG) {
                // flag must be in headquarters
                return HEADQUARTER_SQUARES.includes(square);
            }

            return true;
        });
    }

    // Assumes current position is valid
    isDestinationPositionValid(pieceRank: string, current: string, destination: string): boolean {
        var destRowNum: number = this.getBoardSquareRow(destination);
        // Check if piece has restrictions
        if (pieceRank === PieceRank.BOMB.toString()) {
            return this.isValidBombPosition(destRowNum);
        } else if (pieceRank === PieceRank.LANDMINE.toString()) {
            return this.isValidLandminePosition(destRowNum);
        } else if (pieceRank === PieceRank.FLAG.toString()) {
            return this.isValidFlagPosition(current, destination);
        }

        // piece has no restrictions
        // can be placed anywhere on the player's side
        return true;
    }

    getBoardSquareRow(square: string): number {
        return parseInt(square.substring(1, square.length));
    }

    isValidBombPosition(rowNum: number): boolean {
        // don't allow front row placement
        var isPlayer1FrontRow = (rowNum === 6);
        var isPlayer2FrontRow = (rowNum === 7);
        return !isPlayer1FrontRow && !isPlayer2FrontRow;
    }

    isValidLandminePosition(rowNum: number): boolean {
        // landmines only in back two rows
        var isPlayer1BackTwoRows = (rowNum === 1 || rowNum === 2);
        var isPlayer2BackTwoRows = (rowNum === 11 || rowNum === 12);
        return isPlayer1BackTwoRows || isPlayer2BackTwoRows;
    }

    isValidFlagPosition(current: string, destination: string): boolean {
        // flag can only go in headquarters
        var isPlayer1Headquarters = HEADQUARTER_SQUARE_GROUP[0].includes(current) && HEADQUARTER_SQUARE_GROUP[0].includes(destination) && current != destination;
        var isPlayer2Headquarters = HEADQUARTER_SQUARE_GROUP[1].includes(current) && HEADQUARTER_SQUARE_GROUP[1].includes(destination) && current != destination;
        return isPlayer1Headquarters || isPlayer2Headquarters;
    }
}