import { BoardSquarePieceMap, BUNKER_SQUARES, RAIL_LINES } from './BoardConstants';
import { BoardGenerator } from './BoardGenerator';
import { BoardValidator } from './BoardValidator';
import {
  Piece,
  RANK_COMMANDER,
  RANK_ENGINEER,
  RANK_FLAG,
} from './Piece';
import { RailroadNetwork } from './RailroadNetwork';

export interface PlayerMove {
  type: string;
  startSquare: string;
  endSquare: string;
}

export interface SwapMove {
  type: string;
  startSquare: string;
  endSquare: string;
}

export class Board {
  boardState: BoardSquarePieceMap;
  nodeKeys: string[];
  railroadNetwork: RailroadNetwork;
  boardValidator: BoardValidator;

  /*
  Create new board to store pieces
  */
  constructor() {
    var boardGenerator = new BoardGenerator();
    this.boardState = boardGenerator.generateBoard();

    this.boardValidator = new BoardValidator();
    var valid: boolean = this.boardValidator.validateBoard(this.boardState);
    if (!valid) {
      throw new Error("Invalid board state");
    }
    this.nodeKeys = Object.keys(this.boardState);
    this.railroadNetwork = new RailroadNetwork(RAIL_LINES);
  }

  /**
   * Get all the valid/safe moves a player can make.
   * Returns an array of move objects on success or an empty array on failure.
   */
  getMovesForPlayer(playerColor: string): PlayerMove[] {
    var playerSquares: string[] = this.getAllPlayerSquares(this.boardState, playerColor);
    return playerSquares
      .filter((square) => this.boardState[square]!.isMovable())
      .map((square) => this.getValidMoves(square, this.boardState))
      .flat();
  };

  /**
   * Get all possible swaps during the setup phase
   */
  getSwapForAll(): SwapMove[] {
    return Object.keys(this.boardState)
      .filter((square) => this.boardState[square])
      .map((square) => this.getSwapMoves(square, this.boardState))
      .flat();
  };

  /**
   * Swaps pieces on startSquare and endSqaure. Assumes both squares have pieces.
   */
  swapPieces(startSquare: string, endSquare: string): void {
    var startPiece = this.boardState[startSquare];
    var endPiece = this.boardState[endSquare];

    this.boardState[startSquare] = endPiece;
    this.boardState[endSquare] = startPiece;
  }

  getPieceAtSquare(currentSquare: string): Piece | null {
    return this.boardState[currentSquare];
  }

  placePieceAtSquare(currentSquare: string, piece: Piece): void {
    this.boardState[currentSquare] = piece;
  }

  /**
   * Clear this square
   */
  setSquareEmpty(squareLocation: string): void {
    this.boardState[squareLocation] = null;
  }

  /**
   * Determine if a player's flag is captured or not
   */
  isPlayerFlagCaptured(playerColor: string): boolean {
    return !this.doesPieceExist(this.boardState, playerColor, RANK_FLAG);
  };

  /**
   * Determine if a player still has the commander (rank 1). If not, then reveal the flag
   */
  isCommanderAlive(playerColor: string): boolean {
    return this.doesPieceExist(this.boardState, playerColor, RANK_COMMANDER);
  };

  doesPieceExist(boardState: { [key: string]: Piece | null }, playerColor: string, pieceRank: string): boolean {
    var playerSquares = this.getAllPlayerSquares(boardState, playerColor);
    return playerSquares.some((square) => boardState[square]!.getRank() == pieceRank);
  }

  // Evaluate an attack from startSquare to destination
  // Assumes both locations have pieces
  evaluateMove(startSquare: string, destination: string): PlayerMove | null {
    var board = this.boardState;
    // One or more squares is missing pieces
    if (board[startSquare] == null || board[destination] == null) {
      return null;
    }
    var playerPiece = board[startSquare]!;
    var enemyPiece = board[destination]!;
    var compareResult: number = playerPiece.compareRank(enemyPiece);

    var compareResultStringMap = new Map();
    compareResultStringMap.set(1, 'capture'); // greater rank
    compareResultStringMap.set(0, 'equal'); // equal rank
    compareResultStringMap.set(-1, 'dies'); // lower rank

    if (compareResultStringMap.has(compareResult)) {
      return {
        type: compareResultStringMap.get(compareResult),
        startSquare: startSquare,
        endSquare: destination
      };
    }

    return null;
  }

  /**
   * Get all the moves a piece can make (with the exception of flags, landmines, etc.)
   * Returns an array of move objects on success or an empty array on failure.
   */
  getValidMoves(square: string, board: BoardSquarePieceMap): PlayerMove[] {
    var piece = board[square]!;
    var isPieceEngineer = (piece.getRank() === RANK_ENGINEER);
    var reachableSquares = this.railroadNetwork.getReachableSquares(square, isPieceEngineer, board);
    var self = this;
    return Array.from(reachableSquares)
      .filter((destination) => square != destination) // skip itself
      .map(function (destination) {
        const moveType = self.getMoveType(piece, board, destination);
        if (moveType != null) {
          return {
            type: moveType,
            startSquare: square,
            endSquare: destination
          };
        }
        return null;
      })
      .filter((move): move is PlayerMove => move !== null);
  }

  /*
    Piece placement must follow certain rules
    1. Flags can only be placed in one of two headquartes
    2. Landmines in back two rows
    3. Bomb cannot be in the front row
  */
  getSwapMoves(square: string, board: BoardSquarePieceMap): SwapMove[] {
    var piece: Piece = board[square]!;
    return this.getAllPlayerSquares(board, piece.getPieceColor())
      .filter((destination) => square !== destination) // skip itself
      .filter((destination) => this.boardValidator.isDestinationPositionValid(piece.getRank(), square, destination))
      .map((destination) => ({
        type: 'swap',
        startSquare: square,
        endSquare: destination
      }));
  }

  getAllPlayerSquares(boardState: BoardSquarePieceMap, playerColor: string): string[] {
    return Object.keys(boardState)
      .filter((square) => boardState[square])
      .filter((square) => boardState[square]!.getPieceColor() === playerColor[0])
  }

  getMoveType(piece: Piece, board: BoardSquarePieceMap, destination: string): string | null {
    if (board[destination] === null) {
      // If destination square is empty, move piece without attacking
      return 'move';
    } else if (this.isSquareAttackable(piece, board, destination)) {
      return 'attack';
    }
    return null;
  }

  // Check if destination square is occupied by an enemy and the enemy is not in a bunker
  isSquareAttackable(piece: Piece, board: BoardSquarePieceMap, destination: string): boolean {
    return board[destination]!.getPieceColor() !== piece.getPieceColor() &&
      BUNKER_SQUARES.includes(destination) === false;
  }
}







