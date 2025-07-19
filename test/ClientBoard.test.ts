import { strict as assert } from 'assert';
import { ClientBoard } from '../public/js/lib/clientboard.js';

describe('ClientBoard', function () {
    var clientBoard = new ClientBoard();

    describe('#generateBoardHtml()', function () {
        it('3x4 board', function () {
            var numRows = 3;
            var numColumns = 4;
            var boardHtml = clientBoard.generateBoardHtml(numRows, numColumns);

            var topEdge = "<td class='top-edge'></td>";
            var topRow = "<tr><td class='top-left-corner'></td>" + topEdge + topEdge + topEdge + topEdge + "<td class='top-right-corner'></td></tr>";
            var middleSquare = "<td class='square'></td>";
            var middleRow = "<tr><td class='left-edge'></td>" + middleSquare + middleSquare + middleSquare + middleSquare + "<td class='right-edge'></td></tr>";
            var bottomEdge = "<td class='bottom-edge'></td>";
            var bottomRow = "<tr><td class='bottom-left-corner'></td>" + bottomEdge + bottomEdge + bottomEdge + bottomEdge + "<td class='bottom-right-corner'></td></tr>";

            var expectedOutput = topRow + middleRow + middleRow + middleRow + bottomRow;
            assert.equal(boardHtml, expectedOutput);
        });
    });

    describe('#getPieceRank()', function () {
        it('r10', function () {
            var pieceRank = clientBoard.getPieceRank('r10');
            assert.equal(pieceRank, '10');
        });

        it('r10_', function () {
            var pieceRank = clientBoard.getPieceRank('r10_');
            assert.equal(pieceRank, '10');
        });
    });

    describe('#getPieceClasses()', function () {
        it('Null piece', function () {
            var gameState = {};
            var pieceClass = clientBoard.getPieceClasses(null, "red", gameState);
            assert.equal(pieceClass, "empty");
        });

        it('Color missing', function () {
            var gameState = {
                colorMap: {"r": 0, "b": 1},
            };
            assert.throws(() => clientBoard.getPieceClasses("n9", "red", gameState), Error);
        });

        it('Red piece class for red player', function () {
            var gameState = {};
            var pieceClass = clientBoard.getPieceClasses('r9', "red", gameState);
            assert.equal(pieceClass, "red rank9");
        });

        it('Red piece class for blue player is facedown', function () {
            var gameState = {
                colorMap: {"r": 0, "b": 1},
                players: [{isSetup: true, hasCommander: true}, {isSetup: true, hasCommander: true}]
            };
            var pieceClass = clientBoard.getPieceClasses('r9', "blue", gameState);
            assert.equal(pieceClass, "facedown red");
        });

        it('Red piece class during setup', function () {
            var gameState = {
                colorMap: {"r": 0, "b": 1},
                players: [{isSetup: false, hasCommander: true}, {isSetup: true, hasCommander: true}]
            };
            var pieceClass = clientBoard.getPieceClasses('r9', "blue", gameState);
            assert.equal(pieceClass, "");
        });

        it('Red flag class when commander is lost', function () {
            var gameState = {
                colorMap: {"r": 0, "b": 1},
                players: [{isSetup: true, hasCommander: false}, {isSetup: true, hasCommander: true}]
            };
            var pieceClass = clientBoard.getPieceClasses('r11', "blue", gameState);
            assert.equal(pieceClass, "red rank11");
        });
    });
});
