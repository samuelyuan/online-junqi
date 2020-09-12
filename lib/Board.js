/*
Create new board to store pieces
*/
function Board()
{
  this.boardState = {
      a12: 'r10_', b12: 'r11_', c12: 'r10_', d12: 'r0_', e12: 'r0_',
      a11: 'r9_', b11: 'r10_', c11: 'r9_', d11: 'r2_', e11: 'r9_',
      a10: 'r6_',  b10: null,  c10: 'r6_',  d10: null,  e10: 'r5_',
      a9: 'r1_',  b9: 'r3_',  c9: null,  d9: 'r3_',  e9: 'r5_',
      a8: 'r8_', b8: null, c8: 'r8_', d8: null, e8: 'r8_',
      a7: 'r7_', b7: 'r7_', c7: 'r7_', d7: 'r4_', e7: 'r4_',
      a6: 'b7_',  b6: 'b2_',  c6: 'b7_',  d6: 'b3_',  e6: 'b7_',
      a5: 'b4_',  b5: null,  c5: 'b5_',  d5: null,  e5: 'b4_',
      a4: 'b8_',  b4: 'b3_',  c4: null,  d4: 'b1_',  e4: 'b8_',
      a3: 'b6_',  b3: null,  c3: 'b8_',  d3: null,  e3: 'b5_',
      a2: 'b9_', b2: 'b10_', c2: 'b10_', d2: 'b9_', e2: 'b9_',
      a1: 'b0_', b1: 'b11_', c1: 'b10_', d1: 'b0_', e1: 'b6_',
  };
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
  var moves = [];
  var piece, square = null;

  // Loop board
  for (square in this.boardState)
  {
    piece = this.boardState[square];

    // Skip empty squares and opponent's pieces
    if (piece === null) { continue; }
    if (piece[0] !== playerColor[0]) { continue; }

    // Collect all moves for all of player's pieces
    // Make sure the piece can move (it's not a flag (11) nor a landmine (10))
    var pieceRank = getRank(piece);
    if (pieceRank != RANK_LANDMINE && pieceRank != RANK_FLAG)
    {
        moves.push.apply(moves, getValidMoves(piece, square, this.boardState));
    }
  }

  return moves;
};

/**
 * Get all possible swaps during the setup phase
 */
Board.prototype.getSwapForAll = function() {
  var moves = [];
  var piece, square = null;

  // Loop board
  for (square in this.boardState)
  {
    piece = this.boardState[square];

    // Skip empty squares and opponent's pieces
    if (piece === null) { continue; }
    //if (piece[0] !== playerColor[0]) { continue; }

    moves.push.apply(moves, getSwapMoves(piece, square, this.boardState));
  }

  return moves;
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

var doesPieceExist = function(boardState, playerColor, pieceRank)
{
    // Set player and opponent color
    if (playerColor === 'red') {
        playerColor = 'r';
    } else if (playerColor === 'blue') {
        playerColor = 'b';
    }

     // Find the square
    for (var sq in boardState)
    {
        var piece = boardState[sq];
        if (piece && getPieceColor(piece) == playerColor && getRank(piece) == pieceRank)
        {
            // The piece is still there
            return true;
        }
    }

    // The piece has been removed
    return false;
}

/**
 * Get all the moves a piece can make (with the exception of flags, landmines, etc.)
 * Returns an array of move objects on success or an empty array on failure.
 */
var getValidMoves = function(piece, square, board)
{
    var moves = [];

    // bfs
    var pieceRank = getRank(piece);
    var reachableSquares = getReachableSquares(square, pieceRank, board);
    reachableSquares.forEach(function(destination) {
        if (destination == square) { return; }

        // If destination square is empty
        if (board[destination] == null) {
          moves.push(getSafeMove(piece, square, destination));
        }
        // If destination square is occupied by an enemey and the enemy is not in a bunker
        else if (isSquareAttackable(piece, board, destination)) {
          var attackMove = getAttackMove(board, piece, square, destination);
          if (attackMove != null) {
            moves.push(attackMove);
          }
        }
    });
    return moves;
}

var getReachableSquares = function(currentSquare, pieceRank, board)
{
    var railroadArray = [['a2', 'a3', 'a4', 'a5', 'a6', 'a7', 'a8', 'a9', 'a10', 'a11'],
                 ['e2', 'e3', 'e4', 'e5', 'e6', 'e7', 'e8', 'e9', 'e10', 'e11'],
                 ['a2', 'b2', 'c2', 'd2', 'e2'],
                 ['a6', 'b6', 'c6', 'd6', 'e6'],
                 ['a7', 'b7', 'c7', 'd7', 'e7'],
                 ['a11', 'b11', 'c11', 'd11', 'e11']];

    var isOnRail = function(currentSquare, railroadArray)
    {
        for (var i = 0; i < railroadArray.length; i++) {
            if (railroadArray[i].indexOf(currentSquare) != -1) {
                return true;
            }
        }
        return false;
    }

    // If the piece is not on the railroad, it can only move one space
    if (!isOnRail(currentSquare, railroadArray))
    {
        return getAdjacentNeighbors(currentSquare);
    }

    var singleRail = [];
    // get all positions that are accessible on the same railroad
    railroadArray.forEach(function(railroad) {
        // accessible
        if (railroad.indexOf(currentSquare) != -1) {
            singleRail = singleRail.concat(railroad);
        }
    });

    // BFS search on the railroads
    var reachableSquares = [];
    var visited = [];

    visited.push(currentSquare);
    reachableSquares.push(currentSquare);
    while (reachableSquares.length != 0)
    {
        var iterSquare = reachableSquares.shift();
        var neighbors = getAdjacentNeighbors(iterSquare);

        neighbors.forEach(function(nextSquare) {
            // Keep moving if the neighbor is on the railroad
            if (isOnRail(nextSquare, railroadArray))
            {
                // not visited
                if (visited.lastIndexOf(nextSquare) === -1)
                {
                    // if the piece is not an engineer, check if it is on the same railroad
                    if (pieceRank !== RANK_ENGINEER && singleRail.indexOf(nextSquare) == -1) {
                        // skip if not accessible without turning
                        return;
                    }

                    // visited
                    visited.push(nextSquare);

                    // empty
                    if (board[nextSquare] === null) {
                        // explore this square and its neighbors
                        reachableSquares.push(nextSquare);
                    }
                }
            }
        });
    }

    // include squares that aren't on the railroad
    var neighbors = getAdjacentNeighbors(currentSquare);
    neighbors.forEach(function(square) {
        visited.push(square);
    });

    return visited;
}

var getSafeMove = function(piece, square, destination)
{
    return {
        type        : 'move',
        pieceCode   : getPieceCode(piece),
        startSquare : square,
        endSquare   : destination
   };
}

var getAttackMove = function(board, piece, square, destination)
{
    var rankEnemy = getRank(board[destination]);
    var rankPlayer = getRank(piece);

    var compareResult = compareRank(rankPlayer, rankEnemy);

    playerPieceCode = getPieceCode(piece)
    // greater rank
    if (compareResult === 1)
    {
        return {
            type          : 'capture',
            pieceCode     : playerPieceCode,
            startSquare   : square,
            endSquare     : destination,
            captureSquare : destination
        };
    }
    // equal rank
    else if (compareResult === 0)
    {
       return {
                type        : 'equal',
                pieceCode   : playerPieceCode,
                startSquare : square,
                endSquare   : destination,
                dieSquare1  : square,
                dieSquare2  : destination
        };
    }
    // lower rank
    else if (compareResult === -1)
    {
        return {
                type        : 'dies',
                pieceCode   : playerPieceCode,
                startSquare : square,
                endSquare   : destination,
                dieSquare   : square
        };
    }

    return null;
}

// compares rank1 and rank2
// returns  1 if rank1 is greater than rank2
//          0 if they are equal
//          -1 if rank 1 is lower than rank2
// Input parameters are strings
// TOOO: convert to integers
var compareRank = function(rank1, rank2)
{
    const COMPARE_RANK1_LOSE = -1;
    const COMPARE_DRAW = 0;
    const COMPARE_RANK1_WIN = 1;

    // the opponent is a bomb, which destorys any piece that hits it
    if (rank1 == RANK_BOMB || rank2 == RANK_BOMB)
    {
        return COMPARE_DRAW;
    }

    // the opponent is a flag, which any of your pieces can capture
    if (rank2 == RANK_FLAG)
    {
        return COMPARE_RANK1_WIN;
    }

    // the opponent is a landmine, which only the engineer can disable
    if (rank2 == RANK_LANDMINE)
    {
        //engineer disables landmine
        if (rank1 == RANK_ENGINEER) {
            return COMPARE_RANK1_WIN;
        } else {
            // no other piece can disable it
            return COMPARE_RANK1_LOSE;
        }
    }

    // 2 regular pieces
    // the lower the number, the higher the rank (1 beats 2, 2 beats 3, etc.)
    var rank1Int = parseInt(rank1);
    var rank2Int = parseInt(rank2);
    if (rank1Int >= 1 && rank1Int <= 9 && rank2Int >= 1 && rank2Int <= 9)
    {
        if (rank1Int < rank2Int) {
            return COMPARE_RANK1_WIN;
        } else if (rank1Int === rank2Int) {
            return COMPARE_DRAW;
        } else {
            return COMPARE_RANK1_LOSE;
        }
    }

    // should not reach this point
    return COMPARE_DRAW;
}

var isBunkerSquare = function(square) {
    var bunkerSquares = ['b3', 'd3', 'c4', 'b5', 'd5', 'b8', 'd8', 'c9', 'b10', 'd10'];
    return bunkerSquares.indexOf(square) > -1;
}

var isSquareAttackable = function(piece, board, square) {
    return (board[square][0] !== piece[0] && isBunkerSquare(square) === false)
}

var getAllOuterLocations = function() {
    var allOuterLocations = [];

    // left and right columns
    for (var i = 1; i <= 12; i++) {
        allOuterLocations.push("a" + i.toString());
        allOuterLocations.push("e" + i.toString());
    }

    // columsn near edge
    [2, 11].forEach(function(i) {
        allOuterLocations.push("b" + i.toString());
        allOuterLocations.push("d" + i.toString());
    });

    // center column
    [2, 6, 7, 11].forEach(function(i) {
        allOuterLocations.push("c" + i.toString());
    });
    return allOuterLocations;
}

var getAdjacentNeighbors = function(currentSquare)
{
    var getMoves = function(square, transforms) {
        var validMoves = [];
        transforms.forEach(function(move) {
            destination = transformSquare(square, move);
            if (!destination) {
                return;
            }
            validMoves.push(destination);
        });
        return validMoves;
    }

    // unit in bunker squares can move in 8 directions
    if (isBunkerSquare(currentSquare)) {
        var transforms = [
            {x:+0, y:+1}, {x:+1, y:+1},
            {x:+1, y:+0}, {x:+1, y:-1},
            {x:+0, y:-1}, {x:-1, y:-1},
            {x:-1, y:+0}, {x:-1, y:+1}
        ];
        return getMoves(currentSquare, transforms);
    }

    // unit in cross squares can only move in 4 directions
    var crossSquares =  ['c3', 'b4', 'd4', 'c5', 'c8', 'b9', 'd9', 'c10'];
    if (crossSquares.indexOf(currentSquare) > -1) {
         var transforms = [
            {x:+0, y:+1}, {x:+1, y:+0},
            {x:+0, y:-1}, {x:-1, y:+0}
        ];
        return getMoves(currentSquare, transforms);
    }

    var allOuterLocations = getAllOuterLocations();

    // get adjacent squares in 4 directions
    var moveMap = {};
    allOuterLocations.forEach(function(square) {
        var transforms = [
                {x:+0, y:+1}, {x:+1, y:+0},
                {x:+0, y:-1}, {x:-1, y:+0}
        ];
        moveMap[square] = getMoves(square, transforms);
    });

    // Add additional links to bunkers
    moveMap['a2'].push('b3');
    moveMap['c2'].push('b3', 'd3');
    moveMap['e2'].push('d3');

    moveMap['a4'].push('b3', 'b5');
    moveMap['e4'].push('d3', 'd5');

    moveMap['a6'].push('b5');
    moveMap['b6'] = ['a6', 'c6', 'b5'];
    moveMap['c6'].push('b5', 'd5');
    moveMap['d6'] = ['c6', 'e6', 'd5'];
    moveMap['e6'].push('d5');

    //center

    moveMap['a7'].push('b8');
    moveMap['b7'] = ['a7', 'c7', 'b8'];
    moveMap['c7'].push('b8', 'd8');
    moveMap['d7'] = ['c7', 'e7', 'd8'];
    moveMap['e7'].push('d8');

    moveMap['a9'].push('b8', 'b10');
    moveMap['e9'].push('d8', 'd10');

    moveMap['a11'].push('b10');
    moveMap['c11'].push('b10', 'd10');
    moveMap['e11'].push('d10');

    if (!(currentSquare in moveMap)) {
        return [];
    }

    return moveMap[currentSquare];
}

/*
Piece placement must follow certain rules
1. Flags can only be placed in one of two headquartes
2. Landmines in back two rows
3. Bomb cannot be in the front row
*/
var getSwapMoves = function(piece, square, board) {
    var moves = [];

    var destination, move = null;

    const NUM_COLS = 5;
    const NUM_ROWS = 12;

    // Loop all moves
    for (var i = 1; i <= NUM_COLS; i++)
    {
        //Loop through all the numbers
          for (var j = 1; j <= NUM_ROWS; j++)
          {
              destination = num2alpha(i) + j;

              //skip itself
              if (square === destination) { continue; }

              var swapMove = {
                    type          : 'swap',
                    pieceCode     : getPieceCode(piece),
                    startSquare   : square,
                    endSquare     : destination
                };

               // If destination square has a piece and the piece is on the same team
              if (board[destination] !== null && board[destination][0] === piece[0])
              {
                  var pieceRank = getRank(piece);
                  if (isDestinationPositionValid(pieceRank, square, destination, j))
                  {
                        moves.push(swapMove);
                  }
              }
          }
      }

    return moves;
};

var isDestinationPositionValid = function(pieceRank, current, destination, destRowNum) {
  // Check if piece has restrictions
  if (pieceRank == RANK_BOMB)
  {
      return isValidBombPosition(destRowNum);
  }
  else if (pieceRank == RANK_LANDMINE)
  {
      return isValidLandminePosition(destRowNum);
  }
  else if (pieceRank == RANK_FLAG)
  {
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
  var isPlayer1Headquarters = (current === 'b1' && destination === 'd1') || (current === 'd1' && destination === 'b1');
  var isPlayer2Headquarters = (current === 'b12' && destination === 'd12') || (current === 'd12' && destination === 'b12');
  return isPlayer1Headquarters || isPlayer2Headquarters;
}

/**
 * Apply an x and y offset to a starting square to get a destination square.
 * Returns the destination square on success or false on failure.
 */
var transformSquare = function(square, transform) {
  // Parse square
  var file = square[0];
  var rank = parseInt(getRank(square), 10);

  // Apply transform
  var destFile = alpha2num(file) + transform.x;
  var destRank = rank + transform.y;

  // Check boundaries
  if (destFile < 1 || destFile > 5) { return false; }
  if (destRank < 1 || destRank > 12) { return false; }

  // Return new square
  return num2alpha(destFile) + destRank;
};

//ex: r10 would refer to red rank 10
var getPieceCode = function(piece)
{
    if (piece[piece.length - 1] == '_')
    {
        return piece.substring(0, piece.length - 1);
    }
    else
    {
        return piece.substring(0, piece.length);
    }
}

var getPieceColor = function(piece)
{
  return piece[0];
}

var getRank = function(piece)
{
    //the last letter might have a _ character
    //the first letter is the player color,  everything else is the rank
    if (piece[piece.length - 1] == '_')
    {
        return piece.substring(1, piece.length - 1);
    }
    else
    {
        return piece.substring(1, piece.length);
    }
}

var alpha2num = function(a) {
  switch (a) {
    case 'a': return 1;
    case 'b': return 2;
    case 'c': return 3;
    case 'd': return 4;
    case 'e': return 5;
    default : return 6; // out of bounds
  }
};

var num2alpha = function(n)
{
    switch (n)
    {
       case 1: return 'a';
       case 2: return 'b';
       case 3: return 'c';
       case 4: return 'd';
       case 5: return 'e';
      default: return 'f'; // out of bounds
    }
};

// Export the board object
module.exports = Board;
