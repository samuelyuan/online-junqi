import { describe, it } from 'node:test';
import { strict as assert } from 'assert';
import { Board } from '../src/lib/Board';
import { BoardValidator } from '../src/lib/BoardValidator';
import { HEADQUARTER_SQUARE_GROUP } from '../src/lib/BoardConstants';
import { PieceRank } from '../src/lib/Piece';

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

  describe('#shufflePlayerPieces()', function () {
    it('Keeps the board valid and leaves the opponent untouched', function () {
      const board = new Board();
      const opponentSquaresBefore = JSON.stringify(
        Object.keys(board.boardState)
          .filter((square) => board.boardState[square]?.getPieceColor() === 'r')
          .map((square) => [square, board.boardState[square]!.getRank()])
      );
      const blueRanksBefore = Object.keys(board.boardState)
        .filter((square) => board.boardState[square]?.getPieceColor() === 'b')
        .map((square) => board.boardState[square]!.getRank())
        .sort();

      board.shufflePlayerPieces('blue');

      const opponentSquaresAfter = JSON.stringify(
        Object.keys(board.boardState)
          .filter((square) => board.boardState[square]?.getPieceColor() === 'r')
          .map((square) => [square, board.boardState[square]!.getRank()])
      );
      const blueRanksAfter = Object.keys(board.boardState)
        .filter((square) => board.boardState[square]?.getPieceColor() === 'b')
        .map((square) => board.boardState[square]!.getRank())
        .sort();

      // Same multiset of pieces, just rearranged
      assert.deepEqual(blueRanksAfter, blueRanksBefore);
      // Opponent's side is untouched
      assert.equal(opponentSquaresAfter, opponentSquaresBefore);
      // Resulting board still follows all placement rules
      assert.equal(new BoardValidator().validateBoard(board.boardState), true);
    });

    it('Only ever places a landmine or lieutenant in the non-flag headquarters square', function () {
      const allowedRanks = [PieceRank.LANDMINE, PieceRank.LIEUTENANT];
      for (let i = 0; i < 50; i++) {
        const board = new Board();
        board.shufflePlayerPieces('blue');
        const nonFlagHqSquare = HEADQUARTER_SQUARE_GROUP[0].find(
          (square) => board.boardState[square]!.getRank() !== PieceRank.FLAG
        )!;
        assert.equal(allowedRanks.includes(board.boardState[nonFlagHqSquare]!.getRank()), true);
      }
    });

    it('Never places all 3 landmines on the headquarters row', function () {
      const HQ_ROW = ['a1', 'b1', 'c1', 'd1', 'e1'];
      for (let i = 0; i < 50; i++) {
        const board = new Board();
        board.shufflePlayerPieces('blue');
        const landminesOnHqRow = HQ_ROW.filter(
          (square) => board.boardState[square]!.getRank() === PieceRank.LANDMINE
        ).length;
        assert.equal(landminesOnHqRow < 3, true);
      }
    });

    it('Restricts the HQ row center square and both non-flag corners appropriately', function () {
      const HQ_ROW = ['a1', 'b1', 'c1', 'd1', 'e1'];
      const centerAllowedRanks = [PieceRank.LIEUTENANT, PieceRank.LANDMINE];
      const farCornerAllowedRanks = [PieceRank.CAPTAIN, PieceRank.LIEUTENANT, PieceRank.LANDMINE];
      const nearCornerExcludedRanks = [PieceRank.FLAG, PieceRank.COMMANDER, PieceRank.GENERAL, PieceRank.BOMB, PieceRank.ENGINEER];

      for (let i = 0; i < 50; i++) {
        const board = new Board();
        board.shufflePlayerPieces('blue');

        const flagSquare = HQ_ROW.find((square) => board.boardState[square]!.getRank() === PieceRank.FLAG)!;
        const nearFlagCorner = (flagSquare === 'b1' ? 'a' : 'e') + '1';
        const farFlagCorner = (flagSquare === 'b1' ? 'e' : 'a') + '1';

        // Center is stricter than the far corner: vacating it exposes both HQ squares at once
        assert.equal(centerAllowedRanks.includes(board.boardState['c1']!.getRank()), true);
        assert.equal(farCornerAllowedRanks.includes(board.boardState[farFlagCorner]!.getRank()), true);
        assert.equal(nearCornerExcludedRanks.includes(board.boardState[nearFlagCorner]!.getRank()), false);

        // Bomb is excluded from the entire HQ row, not just the front row
        HQ_ROW.forEach((square) => {
          assert.notEqual(board.boardState[square]!.getRank(), PieceRank.BOMB);
        });
      }
    });

    it('Keeps Engineer off the exposed a/c/e front-row squares, and stays valid', function () {
      const validator = new BoardValidator();
      const EXPOSED_FRONT_ROW = ['a6', 'c6', 'e6'];

      for (let i = 0; i < 50; i++) {
        const board = new Board();
        board.shufflePlayerPieces('blue');

        EXPOSED_FRONT_ROW.forEach((square) => {
          assert.notEqual(board.boardState[square]!.getRank(), PieceRank.ENGINEER);
        });
        assert.equal(validator.validateBoard(board.boardState), true);
      }
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
