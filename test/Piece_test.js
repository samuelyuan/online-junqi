var assert = require('assert');
var Piece = require('../lib/Piece');

const COMPARE_RANK1_LOSE = -1;
const COMPARE_DRAW = 0;
const COMPARE_RANK1_WIN = 1;

describe('Piece', function () {
  describe('#getters()', function () {
    var piece = new Piece('r', '11');
    assert.equal(piece.getPieceColor(), "r");
    assert.equal(piece.getRank(), "11");
  });

  describe('#bombAttacksLandmine()', function () {
    it('Bomb and landmine both disappear', function () {
      var bombPiece = new Piece('r', '0');
      var landminePiece = new Piece('b', '10');

      var result = bombPiece.compareRank(landminePiece);
      assert.equal(result, COMPARE_DRAW);
    });
  });

  describe('#engineerAttacksLandmine()', function () {
    it('Engineer disables landmine', function () {
      var engineerPiece = new Piece('r', '9');
      var landminePiece = new Piece('b', '10');

      var result = engineerPiece.compareRank(landminePiece);
      assert.equal(result, COMPARE_RANK1_WIN);
    });
  });

  describe('#weakerUnitAttacksStrongerUnit()', function () {
    it('Weaker unit loses', function () {
      var rank5Piece = new Piece('r', '5');
      var rank3Piece = new Piece('b', '3');

      var result = rank5Piece.compareRank(rank3Piece);
      assert.equal(result, COMPARE_RANK1_LOSE);
    });
  });

  describe('#strongerUnitAttacksWeakerUnit()', function () {
    it('Stronger unit wins', function () {
      var rank2Piece = new Piece('r', '2');
      var rank4Piece = new Piece('b', '4');

      var result = rank2Piece.compareRank(rank4Piece);
      assert.equal(result, COMPARE_RANK1_WIN);
    });
  });

  describe('#unitAttacksEqualRank()', function () {
    it('Both pieces disappear', function () {
      var rank2RedPiece = new Piece('r', '2');
      var rank2BluePiece = new Piece('b', '2');

      var result = rank2RedPiece.compareRank(rank2BluePiece);
      assert.equal(result, COMPARE_DRAW);
    });
  });
});
