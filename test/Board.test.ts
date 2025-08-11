import { strict as assert } from 'assert';
import { Board } from '../src/lib/Board';

describe('Board', function () {
  describe('#getMovesForPlayer()', function () {
    it('Get moves for blue player', function () {
      const board = new Board();
      const blueMoves = board.getMovesForPlayer("blue");
      assert.equal(blueMoves.length > 0, true);
      const redMoves = board.getMovesForPlayer("red");
      assert.equal(redMoves.length > 0, true);
    });
  });

  describe('#isCommanderAlive()', function () {
    it('Check if commander is alive at the beginning of the game', function () {
      const board = new Board();
      assert.equal(board.isCommanderAlive("blue"), true);
      assert.equal(board.isCommanderAlive("red"), true);
    });
  });

  describe('#isPlayerFlagCaptured()', function () {
    it('Check if flag is captured at the beginning of the game', function () {
      const board = new Board();
      assert.equal(board.isPlayerFlagCaptured("blue"), false);
      assert.equal(board.isPlayerFlagCaptured("red"), false);
    });
  });

  describe('#getSwapForAll()', function () {
    it('Get swap moves for all pieces', function () {
      const board = new Board();
      const swapMoves = board.getSwapForAll();
      assert.equal(swapMoves.length > 0, true);
    });
  });

  describe('#evaluateMove()', function () {
    it('Evaluate move from a6 to a7', function () {
      const board = new Board();
      const moveResult = board.evaluateMove('a6', 'a7')
      assert.equal(moveResult !== null, true);
    });
  });
});
