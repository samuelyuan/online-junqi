var Graph = require('./Graph');

var graph;

function RailroadNetwork(railLines) {
  graph = new Graph();
  this.railLines = railLines;
}

// Get all the reachable squares from the current square
// A square is not reachable if it is not accessible or it passes through another unit
// Returns a set of strings
RailroadNetwork.prototype.getReachableSquares = function(currentSquare, isPieceEngineer, boardState)
{
  // If the piece is not on the railroad, it can only move one space
  if (!this.isOnRail(currentSquare))
  {
    return graph.getAdjacentNeighbors(currentSquare);
  }

  var singleRail = this.getAllRailroadsFromSquare(currentSquare);

  // BFS search on the railroads
  var reachableSquares = [];
  var visited = new Set();

  visited.add(currentSquare);
  reachableSquares.push(currentSquare);

  var self = this;
  while (reachableSquares.length != 0)
  {
    var iterSquare = reachableSquares.shift();
    var neighbors = graph.getAdjacentNeighbors(iterSquare);

    neighbors.forEach(function(nextSquare) {
      // Skip if not on the railroad
      if (!self.isOnRail(nextSquare))
      {
        return;
      }

      // Keep moving if the neighbor is on the railroad
      // not visited
      if (visited.has(nextSquare) === false)
      {
        // if the piece is not an engineer, check if it is on the same railroad
        if (isPieceEngineer === false && singleRail.indexOf(nextSquare) == -1) {
          // skip if not accessible without turning
          return;
        }

        // visited
        visited.add(nextSquare);

        // empty
        if (boardState[nextSquare] === null) {
          // explore this square and its neighbors
          reachableSquares.push(nextSquare);
        }
      }
    });
  }

  // include squares that aren't on the railroad
  var neighbors = graph.getAdjacentNeighbors(currentSquare);
  neighbors.forEach(function(square) {
    visited.add(square);
  });

  return visited;
}

RailroadNetwork.prototype.isOnRail = function(currentSquare)
{
  for (var i = 0; i < this.railLines.length; i++) {
    if (this.railLines[i].includes(currentSquare)) {
      return true;
    }
  }
  return false;
}

RailroadNetwork.prototype.getAllRailroadsFromSquare = function(currentSquare) {
  // get all positions that are accessible on the same railroad
  var singleRail = [];
  this.railLines.forEach(function(railroad) {
    // accessible
    if (railroad.includes(currentSquare)) {
      singleRail = singleRail.concat(railroad);
    }
  });
  return singleRail;
}

module.exports = RailroadNetwork;
