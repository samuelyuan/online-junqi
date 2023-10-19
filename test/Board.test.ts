import { strict as assert } from 'assert';
import { Board } from '../src/lib/Board';

describe('Board', function () {
  // Assumes board is filled using starting configuration
  var board = new Board();

  describe('#getMovesForPlayer()', function () {
    it('Get all valid moves for player', function () {
      var blueMoves = board.getMovesForPlayer("blue");
      assert.equal(blueMoves.length, 32);
      var redMoves = board.getMovesForPlayer("red");
      assert.equal(redMoves.length, 34);
    });
  });

  describe('#isCommanderAlive()', function () {
    it('Check if commander is alive at the beginning of the game', function () {
      assert.equal(board.isCommanderAlive("blue"), true);
      assert.equal(board.isCommanderAlive("red"), true);
    });
  });

  describe('#isPlayerFlagCaptured()', function () {
    it('Check if flag is captured at the beginning of the game', function () {
      assert.equal(board.isPlayerFlagCaptured("blue"), false);
      assert.equal(board.isPlayerFlagCaptured("red"), false);
    });
  });

  describe('#getSwapForAll()', function () {
    it('Get all swap moves for both players', function () {
      var swapMoves = board.getSwapForAll();
      assert.equal(swapMoves.length, 1044);
    });
  });

  describe('#evaluateMove()', function () {
    it('Evaluate a move', function () {
      var moveResult = board.evaluateMove('a6', 'a7')

      assert(moveResult != null)
      assert.equal(moveResult.type, 'equal');
      assert.equal(moveResult.startSquare, 'a6')
      assert.equal(moveResult.endSquare, 'a7')
    });
  });
});
