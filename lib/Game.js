var _ = require('underscore');
var Board = require('./Board');

/*
 * The Game object
 */

const STATUS_PENDING = "pending";
const STATUS_ONGOING = "ongoing";

/**
 * Create new game and initialize
 */
function Game(params)
{
    // pending/ongoing/defeat/forfeit
    this.status = STATUS_PENDING;

    this.activePlayer = null;

    this.players = [
        {color: null, name: null, joined: false, isSetup: false, inCheck: false, hasCommander: true, hasMoveablePieces: true, forfeited: false},
        {color: null, name: null, joined: false, isSetup: false, inCheck: false, hasCommander: true, hasMoveablePieces: true, forfeited: false}
    ];

    this.board = new Board();

    this.capturedPieces = [];

    this.validMoves = this.board.getMovesForPlayer('blue');

    this.validSwap = this.board.getSwapForAll();

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
    const DEFAULT_PLAYER_COLOR = 'blue';
    // Find player in question
    var p = _.findWhere(this.players, {color: playerData.playerColor});
    if (!p) { return false; }

    // Set player info
    p.isSetup = true;

    // If both players have joined and finish setting up, start the game
    if (this.players[0].joined && this.players[0].isSetup && this.players[1].joined && this.players[1].isSetup && this.status === STATUS_PENDING)
    {
        this.activePlayer = _.findWhere(this.players, {color: DEFAULT_PLAYER_COLOR});
        // Generate valid moves based on latest board configuration
        this.validMoves = this.board.getMovesForPlayer(DEFAULT_PLAYER_COLOR);
        this.validSwap = [];
        this.status = STATUS_ONGOING;
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
    if (this.status === STATUS_PENDING) {
        var validSwap = _.findWhere(this.validSwap, parseMoveString(moveString));

        if (!validSwap) {
            return false;
        }

        var validMove = validSwap;
        this.board.swapPieces(validMove.startSquare, validMove.endSquare);

        // recalculate
        this.validSwap = this.board.getSwapForAll();
        return true;
    }

    // player can't swap units during the game
    this.validSwap = [];

    // Test if move is valid
    var validMove = _.findWhere(this.validMoves, parseMoveString(moveString));

    if (!validMove) {
        return false;
    }

    // Apply move
    switch (validMove.type) {
        case 'move' :
            this.board.boardState[validMove.endSquare] = validMove.pieceCode;
            this.board.setSquareEmpty(validMove.startSquare);
            break;

        case 'capture' :
            this.capturedPieces.push(this.board.boardState[validMove.captureSquare]);
            this.board.setSquareEmpty(validMove.captureSquare);

            this.board.boardState[validMove.endSquare] = validMove.pieceCode;
            this.board.setSquareEmpty(validMove.startSquare);
            break;

        case 'dies':
            this.board.setSquareEmpty(validMove.startSquare);
            break;

        case 'equal':
            this.capturedPieces.push(this.board.boardState[validMove.endSquare]);
            this.board.setSquareEmpty(validMove.startSquare);
            this.board.setSquareEmpty(validMove.endSquare);
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
    this.validMoves = this.board.getMovesForPlayer(inactivePlayer.color);

    // Set check status for both players
    _.each(this.players, function(p) {
        p.inCheck = this.board.isPlayerFlagCaptured(p.color);
        p.hasCommander = this.board.isCommanderAlive(p.color);
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
    if (this.status === STATUS_ONGOING)
    {
        this.activePlayer = inactivePlayer;
    }

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
