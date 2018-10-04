var _ = require('underscore');

/*
 * The Game object
 */

/**
 * Create new game and initialize
 */
function Game(params) 
{
    // pending/ongoing/defeat/forfeit
    this.status = 'pending';

    this.activePlayer = null;

    this.players = [
        {color: null, name: null, joined: false, isSetup: false, inCheck: false, hasCommander: true, hasMoveablePieces: true, forfeited: false},
        {color: null, name: null, joined: false, isSetup: false, inCheck: false, hasCommander: true, hasMoveablePieces: true, forfeited: false}
    ];

    this.board = {
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

    this.capturedPieces = [];

    this.validMoves = getMovesForPlayer('blue', this.board, null);
    
    this.validSwap = getSwapForAll(this.board, null);

    this.lastMove = null;

    this.modifiedOn = Date.now();

    // Set player colors
    // params.playerColor is the color of the player who created the game
    if (params.playerColor === 'red') 
    {
        this.players[0].color = 'red';
        this.players[1].color = 'blue';
    }
    else if (params.playerColor === 'blue')
    {
        this.players[0].color = 'blue';
        this.players[1].color = 'red';
    }
}

/**
 * Add player to game, and after both players have joined activate the game.
 * Returns true on success and false on failure.
 */
Game.prototype.addPlayer = function(playerData) 
{
    // Check for an open spot
    var p = _.findWhere(this.players, {color: playerData.playerColor, joined: false});
    if (!p) { return false; }

    // Set player info
    p.name = playerData.playerName;
    p.joined = true;

    this.modifiedOn = Date.now();

    return true;
};

/**
 * Remove player from game, this does not end the game, players may come and go as they please.
 * Returns true on success and false on failure.
 */
Game.prototype.removePlayer = function(playerData) 
{
    // Find player in question
    var p = _.findWhere(this.players, {color: playerData.playerColor});
    if (!p) { return false; }

    // Set player info
    p.joined = false;

    this.modifiedOn = Date.now();

    return true;
};

/*
Finalize the setup
*/
Game.prototype.finishSetup = function(playerData) 
{
    // Find player in question
    var p = _.findWhere(this.players, {color: playerData.playerColor});
    if (!p) { return false; }

    // Set player info
    p.isSetup = true;
    
    // If both players have joined and finish setting up, start the game
    if (this.players[0].joined && this.players[0].isSetup && this.players[1].joined && this.players[1].isSetup && this.status === 'pending') 
    {
        this.activePlayer = _.findWhere(this.players, {color: 'blue'});
        this.status = 'ongoing';
    }

    this.modifiedOn = Date.now();

    return true;
}

/**
 * Apply move and regenerate game state.
 * Returns true on success and false on failure.
 */
Game.prototype.move = function(moveString) 
{
    if (this.status === "pending") {
        var validSwap = _.findWhere(this.validSwap, parseMoveString(moveString));
        
        if (!validSwap) {
            return false;
        }
        
        var validMove = validSwap;
        var startPiece = this.board[validMove.startSquare];
        var endPiece = this.board[validMove.endSquare];
        this.board[validMove.startSquare] = endPiece;
        this.board[validMove.endSquare] = startPiece;
        
        // recalculate
        this.validSwap = getSwapForAll(this.board, validSwap);
        return true;
    }
    
    // Test if move is valid
    var validMove = _.findWhere(this.validMoves, parseMoveString(moveString));

    if (!validMove) { 
        return false; 
    }
    
    // Apply move
    switch (validMove.type) {
        case 'move' :
            this.board[validMove.endSquare] = validMove.pieceCode;
            this.board[validMove.startSquare] = null;
            break;

        case 'capture' :
            this.capturedPieces.push(this.board[validMove.captureSquare]);
            this.board[validMove.captureSquare] = null;

            this.board[validMove.endSquare] = validMove.pieceCode;
            this.board[validMove.startSquare] = null;
            break;  

        case 'dies':
            this.board[validMove.startSquare] = null;
            break;

        case 'equal':
            this.capturedPieces.push(this.board[validMove.endSquare]);
            this.board[validMove.startSquare] = null;
            this.board[validMove.endSquare] = null;
            break;
            
        default : break;
    };

    // Set this move as last move
    this.lastMove = validMove;

    // Get inactive player
    var inactivePlayer = _.find(this.players, function(p) {
        return (p === this.activePlayer) ? false : true;
    }, this);

    // Regenerate valid moves
    this.validMoves = getMovesForPlayer(inactivePlayer.color, this.board, this.lastMove);

    // Set check status for both players
    _.each(this.players, function(p) {
        p.inCheck = isPlayerFlagCaptured(p.color, this.board);
        p.hasCommander = isCommanderAlive(p.color, this.board);
    }, this);
    

    // Test for checkmate or stalemate
    if (this.validMoves.length === 0) 
    {
        inactivePlayer.hasMoveablePieces = false;
    }
    
    if (inactivePlayer.inCheck)
    {
        this.status = 'checkmate';
    }
    
    if (inactivePlayer.hasMoveablePieces === false)
    {
        this.status = 'nopieces';
    }
    
    // Toggle active player
    if (this.status === 'ongoing') { this.activePlayer = inactivePlayer; }

    this.modifiedOn = Date.now();

    return true;
};

/**
 * Apply a player's forfeit to the game.
 * Returns true on success and false on failure.
 */
Game.prototype.forfeit = function(playerData) {

  // Find player in question
  var p = _.findWhere(this.players, {color: playerData.playerColor});
  if (!p) { return false; }

  // Set player info
  p.forfeited = true;

  // Set game status
  this.status = 'forfeit';

  this.modifiedOn = Date.now();

  return true;
};

/*
 * Private Utility Functions
 */

var getSwapForAll = function(board) {
  var moves = [];
  var piece, square = null;

  // Loop board
  for (square in board) 
  {
    piece = board[square];

    // Skip empty squares and opponent's pieces
    if (piece === null) { continue; }
    //if (piece[0] !== playerColor[0]) { continue; }

    moves.push.apply(moves, getSwapMoves(piece, square, board)); 
  }

  return moves;
};

/*
Piece placement must follow certain rules
1. Flags can only be placed in one of two headquartes
2. Landmines in back two rows
3. Bomb cannot be in the front row
*/
var getSwapMoves = function(piece, square, board) {
    var moves = [];

    var destination, move = null;

    // Loop all moves
    for (var i = 1; i <= 5; i++)
    { 
        //Loop through all the numbers
          for (var j = 1; j <= 12; j++)
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
                  if (getPieceCode(piece).substring(1) == 0)
                  {
                      //don't allow front row placement
                      if (j !== 6 && j !== 7) { moves.push(swapMove); }
                  }
                  else if (getPieceCode(piece).substring(1) == 10)
                  {
                      //landmines only in back two rows
                      if (j === 1 || j === 2 || j === 11 || j === 12) { moves.push(swapMove); }
                  }
                  else if (getPieceCode(piece).substring(1) == 11)
                  {
                      //flag can only go in headquarters
                      if (square === 'b1' && destination === 'd1') { moves.push(swapMove); }
                      if (square === 'd1' && destination === 'b1') { moves.push(swapMove); }
                      if (square === 'b12' && destination === 'd12') { moves.push(swapMove); }
                      if (square === 'd12' && destination === 'b12') { moves.push(swapMove); }
                  }
                  else
                  {
                        moves.push(swapMove);
                  }
              }
          }
      }

    return moves;
};


/**
 * Get all the valid/safe moves a player can make.
 * Returns an array of move objects on success or an empty array on failure.
 */
var getMovesForPlayer = function(playerColor, board, lastMove) {
  var moves = [];
  var piece, square = null;

  // Loop board
  for (square in board) 
  {
    piece = board[square];

    // Skip empty squares and opponent's pieces
    if (piece === null) { continue; }
    if (piece[0] !== playerColor[0]) { continue; }

    // Collect all moves for all of player's pieces
    // Make sure the piece can move (it's not a flag (11) nor a landmine (10))
    if (piece.substring(1, 2) != '10' && piece.substring(1, 2) != '11')
    {
        moves.push.apply(moves, getValidMoves(piece, square, board));
    }
  }

  return moves;
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

var getSafeMove = function(piece, square, destination)
{
    move = {
        type        : 'move',
        pieceCode   : getPieceCode(piece),
        startSquare : square,
        endSquare   : destination
   };
    
   return move;
}

var getAttackMove = function(board, piece, square, destination)
{
    var rankEnemy = getPieceCode(board[destination]).substring(1);
    var rankPlayer = getPieceCode(getPieceCode(piece)).substring(1);
    
    var compareResult = compareRank(rankPlayer, rankEnemy);
    
    // greater rank
    if (compareResult === 1)
    {
        return {
            type          : 'capture',
            pieceCode     : getPieceCode(piece),
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
                pieceCode   : getPieceCode(piece),
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
                pieceCode   : getPieceCode(piece),
                startSquare : square,
                endSquare   : destination,
                dieSquare   : square
        };
    }
}

var isBunkerSquare = function(square) {
    var bunkerSquares = ['b3', 'd3', 'c4', 'b5', 'd5', 'b8', 'd8', 'c9', 'b10', 'd10'];
    return bunkerSquares.indexOf(square) > -1;
}

var isSquareAttackable = function(piece, board, square) {
    return (board[square][0] !== piece[0] && isBunkerSquare(square) === false)
}

/**
 * Get all the moves a piece can make (with the exception of flags, landmines, etc.)
 * Returns an array of move objects on success or an empty array on failure.
 */
var getValidMoves = function(piece, square, board) 
{
    var moves = [];
    
    // bfs
    var reachableSquares = getReachableSquares(square, getPieceCode(piece).substring(1), board);
    reachableSquares.forEach(function(destination) {
        if (destination == square) { return; }
        
        // If destination square is empty
        if (board[destination] == null) {
          moves.push(getSafeMove(piece, square, destination));
        }
        // If destination square is occupied by an enemey and the enemy is not in a bunker
        else if (isSquareAttackable(piece, board, destination)) {
           moves.push(getAttackMove(board, piece, square, destination));
        }
    });
    return moves;
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

// compares rank1 and rank2
// returns  1 if rank1 is greater than rank2
//          0 if they are equal
//          -1 if rank 1 is lower than rank2
var compareRank = function(rank1, rank2)
{
    var UNIT_BOMB = 0;
    var UNIT_ENGINEER = 9;
    var UNIT_LANDMINE = 10;
    var UNIT_FLAG = 11;
        
    // the opponent is a bomb, which destorys any piece that hits it
    if (rank1 == UNIT_BOMB || rank2 == UNIT_BOMB)
    {
        return 0;
    }
    
    // the opponent is a flag, which any of your pieces can capture
    if (rank2 == UNIT_FLAG)
    {
        return 1;
    }
    
    // the opponent is a landmine, which only the engineer can disable
    if (rank2 == UNIT_LANDMINE)
    {
        //engineer disables landmine
        if (rank1 == UNIT_ENGINEER) {
            return 1;
        } else {
            // no other piece can disable it
            return -1;
        }
    }
    
    // 2 regular pieces
    // the lower the number, the higher the rank (1 beats 2, 2 beats 3, etc.)
    if (rank1 >= 1 && rank1 <= 9 && rank2 >= 1 && rank2 <= 9)
    {
        if (rank1 < rank2) {
            return 1;
        } else if (rank1 === rank2) {
            return 0;
        } else {
            return -1;
        }
    }
}

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

var getReachableSquares = function(currentSquare, piece, board) 
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
                    var ENGINEER = "9";
                    // if the piece is not an engineer, check if it is on the same railroad
                    if (piece !== ENGINEER && singleRail.indexOf(nextSquare) == -1) {
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

/**
 * Determine if a player's flag is captured or not
 */
var isPlayerFlagCaptured = function(playerColor, board) {
    var flagSquare = null;
    var moves = [];

    // Set player and opponent color
    if (playerColor === 'red') {
        playerColor = 'r';
    } else if (playerColor === 'blue') {
        playerColor = 'b';
    }
    
     // Find the flag square
    for (var sq in board) 
    {
        if (board[sq] && board[sq].substring(0, 3) === playerColor + '11') 
        {
            // Flag is still there
            return false;
        }
    }
    
    // Flag has been captured
    return true;
};

/**
 * Determine if a player still has the commander (rank 1). If not, then reveal the flag
 */
var isCommanderAlive = function(playerColor, board) {
    var commanderSquare = null;
    var moves = [];

    // Set player and opponent color
    if (playerColor === 'red') {
        playerColor = 'r';
    } else if (playerColor === 'blue') {
        playerColor = 'b';
    }
    
     // Find the square
    for (var sq in board) 
    {
        if (board[sq] === playerColor + '1' || board[sq] === playerColor + '1_')
        {
            // Still there
            return true;
        }
    }
    
    
    //commander is dead
    return false;
};


/**
 * Apply an x and y offset to a starting square to get a destination square.
 * Returns the destination square on success or false on failure.
 */
var transformSquare = function(square, transform) {
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

  var num2alpha = function(n) {
    switch (n) {
       case 1: return 'a';
       case 2: return 'b';
       case 3: return 'c';
       case 4: return 'd';
       case 5: return 'e';
      default: return 'f'; // out of bounds
    }
  };

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

/**
 * Parse a move string and convert it to an object.
 * Returns the move object on success or null on failure.
 */
var parseMoveString = function(moveString) 
{
    var moveStrArr = moveString.split(" ");
    
    // Moves
    if (moveStrArr[2] === '-') 
    {
        return {
            type        : 'move',
            pieceCode   : moveStrArr[0],
            startSquare : moveStrArr[1],
            endSquare   : moveStrArr[3]
        }
    }
    // Captures a lower ranking piece
    else if (moveStrArr[2] === 'x') 
    {
        return {
            type          : 'capture',
            pieceCode     : moveStrArr[0],
            startSquare   : moveStrArr[1],
            endSquare     : moveStrArr[3],
            captureSquare : moveStrArr[3]
        }
    }
    //Lose to a higher ranking piece
    else if (moveStrArr[2] === 'o')
    {
         return {
            type          : 'dies',
            pieceCode     : moveStrArr[0],
            startSquare   : moveStrArr[1],
            endSquare     : moveStrArr[3],
            dieSquare     : moveStrArr[1]
        }
    }
    //both pieces die
    else if (moveStrArr[2] === '=')
    {
        return {
            type          : 'equal',
            pieceCode     : moveStrArr[0],
            startSquare   : moveStrArr[1],
            endSquare     : moveStrArr[3],
            dieSquare1     : moveStrArr[1],
            dieSquare2     : moveStrArr[3]
        }
    }
    //swapping pieces (only allowed during setup)
    else if (moveStrArr[2] === 's')
    {
        return {
            type          : 'swap',
            pieceCode     : moveStrArr[0],
            startSquare   : moveStrArr[1],
            endSquare     : moveStrArr[3]
        }
    }
    else 
    {
        return null;
    }
};

// Export the game object
module.exports = Game;