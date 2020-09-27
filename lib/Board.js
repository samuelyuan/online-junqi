var Piece = require('./Piece');
var RailroadNetwork = require('./RailroadNetwork');

const PLAYER1_LEFT_RAIL = ['a2', 'a3', 'a4', 'a5', 'a6'];
const PLAYER1_RIGHT_RAIL = ['e2', 'e3', 'e4', 'e5', 'e6'];
const PLAYER1_BACK_ROW_RAIL = ['a2', 'b2', 'c2', 'd2', 'e2'];
const PLAYER1_FRONT_ROW_RAIL = ['a6', 'b6', 'c6', 'd6', 'e6'];

const PLAYER2_LEFT_RAIL = ['e7', 'e8', 'e9', 'e10', 'e11'];
const PLAYER2_RIGHT_RAIL = ['a7', 'a8', 'a9', 'a10', 'a11'];
const PLAYER2_FRONT_ROW_RAIL = ['a7', 'b7', 'c7', 'd7', 'e7'];
const PLAYER2_BACK_ROW_RAIL = ['a11', 'b11', 'c11', 'd11', 'e11'];

// left and right is inverted depending on the player's perspective
const LEFT_RAIL = PLAYER1_LEFT_RAIL.concat(PLAYER2_RIGHT_RAIL);
const RIGHT_RAIL = PLAYER1_RIGHT_RAIL.concat(PLAYER2_LEFT_RAIL);

const RAIL_LINES = [
  LEFT_RAIL,
  RIGHT_RAIL,
  PLAYER1_BACK_ROW_RAIL,
  PLAYER1_FRONT_ROW_RAIL,
  PLAYER2_FRONT_ROW_RAIL,
  PLAYER2_BACK_ROW_RAIL
];

const BUNKER_SQUARES = ['b3', 'd3', 'c4', 'b5', 'd5', 'b8', 'd8', 'c9', 'b10', 'd10'];
const HEADQUARTER_SQUARES = [['b1', 'd1'], ['b12', 'd12']];

var railroadNetwork, nodeKeys;
/*
Create new board to store pieces
*/
function Board()
{
  this.boardState = {
      a12: new Piece('r', '10'), b12: new Piece('r', '11'), c12: new Piece('r', '10'), d12: new Piece('r', '0'), e12: new Piece('r', '0'),
      a11: new Piece('r', '9'),  b11: new Piece('r', '10'), c11: new Piece('r', '9'), d11: new Piece('r', '2'), e11: new Piece('r', '9'),
      a10: new Piece('r', '6'),  b10: null,                 c10: new Piece('r', '6'), d10: null,                e10: new Piece('r', '5'),
      a9:  new Piece('r', '1'),  b9: new Piece('r', '3'),   c9: null,                 d9: new Piece('r', '3'),  e9: new Piece('r', '5'),
      a8:  new Piece('r', '8'),  b8: null,                  c8: new Piece('r', '8'),  d8: null,                 e8: new Piece('r', '8'),
      a7:  new Piece('r', '7'),  b7: new Piece('r', '7'),   c7: new Piece('r', '7'),  d7: new Piece('r', '4'), e7: new Piece('r', '4'),
      a6:  new Piece('b', '7'),  b6: new Piece('b', '2'),   c6: new Piece('b', '7'),  d6: new Piece('b', '3'),  e6: new Piece('b', '7'),
      a5:  new Piece('b', '4'),  b5: null,                  c5: new Piece('b', '5'),  d5: null,                 e5: new Piece('b', '4'),
      a4:  new Piece('b', '8'),  b4: new Piece('b', '3'),   c4: null,                 d4: new Piece('b', '1'),  e4: new Piece('b', '8'),
      a3:  new Piece('b', '6'),  b3: null,                  c3: new Piece('b', '8'),  d3: null,                 e3: new Piece('b', '5'),
      a2:  new Piece('b', '9'),  b2: new Piece('b', '10'),  c2: new Piece('b', '10'), d2: new Piece('b', '9'), e2: new Piece('b', '9'),
      a1:  new Piece('b', '0'),  b1: new Piece('b', '11'),  c1: new Piece('b', '10'), d1: new Piece('b', '0'), e1: new Piece('b', '6')
  };

  nodeKeys = Object.keys(this.boardState);
  railroadNetwork = new RailroadNetwork(RAIL_LINES);
}

const RANK_BOMB = "0";
const RANK_COMMANDER = "1";
const RANK_ENGINEER = "9";
const RANK_LANDMINE = "10";
const RANK_FLAG = "11";

/**
 * Get all the valid/safe moves a player can make.
 * Returns an array of move objects on success or an empty array on failure.
 */
 Board.prototype.getMovesForPlayer = function(playerColor) {
   var playerSquares = getAllPlayerSquares(this.boardState, playerColor);
   return playerSquares
    .filter((square) => this.boardState[square].isMovable())
    .map((square) => getValidMoves(square, this.boardState))
    .flat();
 };

/**
 * Get all possible swaps during the setup phase
 */
Board.prototype.getSwapForAll = function() {
  return Object.keys(this.boardState)
    .filter((square) => this.boardState[square])
    .map((square) => getSwapMoves(square, this.boardState))
    .flat();
};

/**
 * Swaps pieces on startSquare and endSqaure. Assumes both squares have pieces.
 */
Board.prototype.swapPieces = function(startSquare, endSquare) {
  var startPiece = this.boardState[startSquare];
  var endPiece = this.boardState[endSquare];

  this.boardState[startSquare] = endPiece;
  this.boardState[endSquare] = startPiece;
}

Board.prototype.getPieceAtSquare = function(currentSquare) {
  return this.boardState[currentSquare];
}

Board.prototype.placePieceAtSquare = function(currentSquare, piece) {
  return this.boardState[currentSquare] = piece;
}

/**
 * Clear this square
 */
Board.prototype.setSquareEmpty = function(squareLocation) {
  this.boardState[squareLocation] = null;
}

/**
 * Determine if a player's flag is captured or not
 */
Board.prototype.isPlayerFlagCaptured = function(playerColor) {
    return !doesPieceExist(this.boardState, playerColor, RANK_FLAG);
};

/**
 * Determine if a player still has the commander (rank 1). If not, then reveal the flag
 */
Board.prototype.isCommanderAlive = function(playerColor) {
    return doesPieceExist(this.boardState, playerColor, RANK_COMMANDER);
};

// Evaluate an attack from startSquare to destination
// Assumes both locations have pieces
Board.prototype.evaluateMove = function(startSquare, destination) {
    var board = this.boardState;
    // One or more squares is missing pieces
    if (board[startSquare] == null || board[destination] == null) {
        return null;
    }
    var playerPiece = board[startSquare];
    var enemyPiece = board[destination];
    var compareResult = playerPiece.compareRank(enemyPiece);

    var compareResultStringMap = new Map();
    compareResultStringMap.set(1, 'capture'); // greater rank
    compareResultStringMap.set(0, 'equal'); // equal rank
    compareResultStringMap.set(-1, 'dies'); // lower rank

    if (compareResultStringMap.has(compareResult)) {
      return {
          type          : compareResultStringMap.get(compareResult),
          startSquare   : startSquare,
          endSquare     : destination
      };
    }

    return null;
}

var doesPieceExist = function(boardState, playerColor, pieceRank) {
    var playerSquares = getAllPlayerSquares(boardState, playerColor);
    return playerSquares.some((square) => boardState[square].getRank() == pieceRank);
}

var getAllPlayerSquares = function(boardState, playerColor) {
  return Object.keys(boardState)
    .filter((square) => boardState[square])
    .filter((square) => boardState[square].getPieceColor() === playerColor[0])
}

/**
 * Get all the moves a piece can make (with the exception of flags, landmines, etc.)
 * Returns an array of move objects on success or an empty array on failure.
 */
var getValidMoves = function(square, board)
{
    var piece = board[square];
    var isPieceEngineer = (piece.getRank() === RANK_ENGINEER);
    var reachableSquares = railroadNetwork.getReachableSquares(square, isPieceEngineer, board);
    return Array.from(reachableSquares)
      .filter((destination) => square != destination) // skip itself
      .map(function(destination) {
        var moveType = getMoveType(piece, board, destination);
        if (moveType != null) {
          return {
            type        : moveType,
            startSquare : square,
            endSquare   : destination
          };
        }
        return null;
      })
      .filter((move) => move);
}

var getMoveType = function(piece, board, destination) {
  if (board[destination] === null) {
    // If destination square is empty, move piece without attacking
    return 'move';
  } else if (isSquareAttackable(piece, board, destination)) {
    return 'attack';
  }
  return null;
}

// Check if destination square is occupied by an enemy and the enemy is not in a bunker
var isSquareAttackable = function(piece, board, destination) {
    return board[destination].getPieceColor() !== piece.getPieceColor() &&
      BUNKER_SQUARES.includes(destination) === false;
}

/*
Piece placement must follow certain rules
1. Flags can only be placed in one of two headquartes
2. Landmines in back two rows
3. Bomb cannot be in the front row
*/
var getSwapMoves = function(square, board) {
  var piece = board[square];
  return getAllPlayerSquares(board, piece.getPieceColor())
    .filter((destination) => square !== destination) // skip itself
    .filter((destination) => isDestinationPositionValid(piece.getRank(), square, destination))
    .map((destination) => ({
      type          : 'swap',
      startSquare   : square,
      endSquare     : destination
    }));
}

var isDestinationPositionValid = function(pieceRank, current, destination) {
  var destRowNum = parseInt(destination.substr(1, destination.length));
  // Check if piece has restrictions
  if (pieceRank == RANK_BOMB) {
      return isValidBombPosition(destRowNum);
  }
  else if (pieceRank == RANK_LANDMINE) {
      return isValidLandminePosition(destRowNum);
  }
  else if (pieceRank == RANK_FLAG) {
      return isValidFlagPosition(current, destination);
  }

  // piece has no restrictions
  // can be placed anywhere on the player's side
  return true;
}

var isValidBombPosition = function(rowNum) {
  // don't allow front row placement
  var isPlayer1FrontRow = (rowNum === 6);
  var isPlayer2FrontRow = (rowNum === 7);
  return !isPlayer1FrontRow && !isPlayer2FrontRow;
}

var isValidLandminePosition = function(rowNum) {
  // landmines only in back two rows
  var isPlayer1BackTwoRows = (rowNum === 1 || rowNum === 2);
  var isPlayer2BackTwoRows = (rowNum === 11 || rowNum === 12);
  return isPlayer1BackTwoRows || isPlayer2BackTwoRows;
}

var isValidFlagPosition = function(current, destination) {
  // flag can only go in headquarters
  var isPlayer1Headquarters = HEADQUARTER_SQUARES[0].includes(current) && HEADQUARTER_SQUARES[0].includes(destination) && current != destination;
  var isPlayer2Headquarters = HEADQUARTER_SQUARES[1].includes(current) && HEADQUARTER_SQUARES[1].includes(destination) && current != destination;
  return isPlayer1Headquarters || isPlayer2Headquarters;
}

// Export the board object
module.exports = Board;
