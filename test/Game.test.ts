import { strict as assert } from 'assert';
import { Game } from '../src/lib/Game';

describe('Game', function () {
  describe('#parseMoveString()', function () {
    var gameRedSide = new Game({
      playerName: '',
      playerColor: 'red'
    });
    var gameBlueSide = new Game({
      playerName: '',
      playerColor: 'blue'
    });

    it('Convert move string into object', function () {
      var playerMove = gameRedSide.parseMoveString("a1 - b1");
      assert.ok(playerMove !== null);
      assert.equal(playerMove.type, "move");
      assert.equal(playerMove.startSquare, "a1");
      assert.equal(playerMove.endSquare, "b1");
    });

    it('Convert attack string into object', function () {
      var playerAttack = gameRedSide.parseMoveString("a1 x b1");
      assert.ok(playerAttack !== null);
      assert.equal(playerAttack.type, "attack");
      assert.equal(playerAttack.startSquare, "a1");
      assert.equal(playerAttack.endSquare, "b1");
    });

    it('Convert swap string into object', function () {
      var playerSwap = gameRedSide.parseMoveString("a1 s b1");
      assert.ok(playerSwap !== null);
      assert.equal(playerSwap.type, "swap");
      assert.equal(playerSwap.startSquare, "a1");
      assert.equal(playerSwap.endSquare, "b1");
    });

    it('Convert unknown string', function () {
      var unknownString = gameRedSide.parseMoveString("a1 ? b1");
      assert.equal(unknownString, null);
    });
  });

  describe('#addPlayer()', function () {
    var gameRedSide = new Game({
      playerName: '',
      playerColor: 'red'
    });
    var redPlayerSession = {
      playerName: '',
      playerColor: 'red',
    };
    var bluePlayerSession = {
      playerName: '',
      playerColor: 'blue',
    };

    it('Join game twice as same color', function () {
      // Joining first time as red
      var status = gameRedSide.addPlayer(redPlayerSession);
      assert.equal(status, true);

      // Joining second time as red
      var status = gameRedSide.addPlayer(redPlayerSession);
      assert.equal(status, false);

      // Join as different color
      var status = gameRedSide.addPlayer(bluePlayerSession);
      assert.equal(status, true);
    });
  });

  describe('#removePlayer()', function () {
    var gameRedSide = new Game({
      playerName: '',
      playerColor: 'red'
    });
    var redPlayerSession = {
      playerName: '',
      playerColor: 'red',
    };
    var unknownPlayerSession = {
      playerName: '',
      playerColor: 'unknown',
    };

    it('Join and leave game', function () {
      // Red player
      assert.equal(gameRedSide.players[0].joined, false);

      var status = gameRedSide.addPlayer(redPlayerSession);
      assert.equal(status, true);
      assert.equal(gameRedSide.players[0].joined, true);

      var status = gameRedSide.removePlayer(redPlayerSession);
      assert.equal(status, true);
      assert.equal(gameRedSide.players[0].joined, false);
    });

    it('Unknown player leaves game', function() {
      // Unknown player
      var status = gameRedSide.addPlayer(unknownPlayerSession);
      assert.equal(status, false);
      var status = gameRedSide.removePlayer(unknownPlayerSession);
      assert.equal(status, false);
    })
  });

  describe('#swapPieces()', function () {
    var gameRedSide = new Game({
      playerName: '',
      playerColor: 'red'
    });

    it('Swap pieces', function () {
      // Valid move
      var status = gameRedSide.swapPieces("a1 s a2");
      assert.equal(status, true);

      // Invalid move
      var status = gameRedSide.swapPieces("a1 s unknown");
      assert.equal(status, false);
    });
  });

  describe('#finishSetup()', function () {
    var gameRedSide = new Game({
      playerName: '',
      playerColor: 'red'
    });
    var redPlayerSession = {
      playerName: '',
      playerColor: 'red',
    };
    var bluePlayerSession = {
      playerName: '',
      playerColor: 'blue',
    }
    var status = gameRedSide.addPlayer(redPlayerSession);
    var status = gameRedSide.addPlayer(bluePlayerSession);
    assert.equal(gameRedSide.status, "pending");

    it('Finish game setup', function () {
      var status = gameRedSide.finishSetup(redPlayerSession);
      assert.equal(status, true);
      assert.equal(gameRedSide.status, "pending");

      var status = gameRedSide.finishSetup(bluePlayerSession);
      assert.equal(status, true);
      assert.equal(gameRedSide.status, "ongoing");
    });

    it('Unknown player finishes setup', function(){
      var status = gameRedSide.finishSetup({
        playerName: '',
        playerColor: 'unknown'
      });
      assert.equal(status, false);
    })
  });

  describe('#forfeit()', function () {
    var gameRedSide = new Game({
      playerName: '',
      playerColor: 'red'
    });
    var redPlayerSession = {
      playerName: '',
      playerColor: 'red',
    };

    it('Red player forfeits game', function() {
      assert.equal(gameRedSide.players[0].forfeited, false);

      var status = gameRedSide.forfeit(redPlayerSession);
      assert.equal(status, true);
      assert.equal(gameRedSide.players[0].forfeited, true);
    });

    it('Unknown player forfeits game', function() {
      var status = gameRedSide.forfeit({
        playerName: '',
        playerColor: 'unknown',
      });
      assert.equal(status, false);
    });
  });

});
