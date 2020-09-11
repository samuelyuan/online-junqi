var _ = require('underscore');
var Board = require('./Board');

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

    this.board = new Board();

    this.capturedPieces = [];

    this.validMoves = this.board.getMovesForPlayer('blue', null);

    this.validSwap = this.board.getSwapForAll(null);

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
        var startPiece = this.board.boardState[validMove.startSquare];
        var endPiece = this.board.boardState[validMove.endSquare];
        this.board.boardState[validMove.startSquare] = endPiece;
        this.board.boardState[validMove.endSquare] = startPiece;

        // recalculate
        this.validSwap = this.board.getSwapForAll(validSwap);
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
            this.board.boardState[validMove.endSquare] = validMove.pieceCode;
            this.board.boardState[validMove.startSquare] = null;
            break;

        case 'capture' :
            this.capturedPieces.push(this.board.boardState[validMove.captureSquare]);
            this.board.boardState[validMove.captureSquare] = null;

            this.board.boardState[validMove.endSquare] = validMove.pieceCode;
            this.board.boardState[validMove.startSquare] = null;
            break;

        case 'dies':
            this.board.boardState[validMove.startSquare] = null;
            break;

        case 'equal':
            this.capturedPieces.push(this.board.boardState[validMove.endSquare]);
            this.board.boardState[validMove.startSquare] = null;
            this.board.boardState[validMove.endSquare] = null;
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
    this.validMoves = this.board.getMovesForPlayer(inactivePlayer.color, this.lastMove);

    // Set check status for both players
    _.each(this.players, function(p) {
        p.inCheck = isPlayerFlagCaptured(p.color, this.board.boardState);
        p.hasCommander = isCommanderAlive(p.color, this.board.boardState);
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
