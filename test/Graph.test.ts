import { strict as assert } from 'assert';
import { Graph } from '../src/lib/Graph';

describe('Graph', function () {
  var graph = new Graph();

  describe('#headquartersImmobile()', function () {
    it('headquarter nodes should have no neighbors', function () {
      ["b1", "d1", "b12", "d12"].forEach(function(square) {
        var neighbors = graph.getAdjacentNeighbors(square);
        assert.equal(neighbors.size, 0);
      });
    });
  });

  describe('#graphNodeSize()', function () {
    it('graphs should only contains nodes on the board', function () {
      // each player has 30 nodes and there are 2 players
      var totalCount = 2*30;
      assert.equal(graph.nodes.length, totalCount);
      assert.equal(Object.keys(graph.neighborMap).length, totalCount);
    });
  });

  describe('#bunkerNeighborSize()', function () {
    it('bunker nodes should have 8 neighbors', function () {
      ['b3', 'd3', 'c4', 'b5', 'd5', 'b8', 'd8', 'c9', 'b10', 'd10'].forEach(function(square) {
        var neighbors = graph.getAdjacentNeighbors(square);
        assert.equal(neighbors.size, 8);
      });
    });
  });

  describe('#bunkerNodeNeighbors()', function () {
    it("validate a single bunker node's neighbors", function () {
      var neighbors = graph.getAdjacentNeighbors("b3");
      assert.equal(neighbors.size, 8);
      assert.equal(neighbors.has("a2"), true);
      assert.equal(neighbors.has("b2"), true);
      assert.equal(neighbors.has("c2"), true);
      assert.equal(neighbors.has("a3"), true);
      assert.equal(neighbors.has("c3"), true);
      assert.equal(neighbors.has("a4"), true);
      assert.equal(neighbors.has("b4"), true);
      assert.equal(neighbors.has("c4"), true);
    });
  });

  describe('#frontNodeNeighborsConnectToOpponent()', function () {
    it("validate a single front row node that leads outside the player's territory", function () {
      var neighbors = graph.getAdjacentNeighbors("a6");
      assert.equal(neighbors.size, 4);
      assert.equal(neighbors.has("a7"), true);
      assert.equal(neighbors.has("a5"), true);
      assert.equal(neighbors.has("b6"), true);
      assert.equal(neighbors.has("b5"), true);
    });
  });

  describe('#frontNodeNeighborsDoesNotConnectToOpponent()', function () {
    it("validate a single front row node that can't access opponent's territory", function () {
      var neighbors = graph.getAdjacentNeighbors("b6");
      assert.equal(neighbors.size, 3);
      assert.equal(neighbors.has("c6"), true);
      assert.equal(neighbors.has("a6"), true);
      assert.equal(neighbors.has("b5"), true);
    });
  });
});
