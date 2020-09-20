/*
* Defines the adjacency graph for nodes on the board.
*/
function Graph() {
  var graphNodesEdges = initializeGraph();

  this.nodes = graphNodesEdges.nodes;
  this.neighborMap = graphNodesEdges.neighborMap;
}

var frontRowSquares = ['a6', 'b6', 'c6', 'd6', 'e6', 'a7', 'b7', 'c7', 'd7', 'e7'];
var bunkerSquares = ['b3', 'd3', 'c4', 'b5', 'd5', 'b8', 'd8', 'c9', 'b10', 'd10'];
var headquarterSquares = ['b1', 'd1', 'b12', 'd12'];
// Bunker squares connect in 8 directions
var bunkerTransforms = [
  {x:+0, y:+1}, {x:+1, y:+1},
  {x:+1, y:+0}, {x:+1, y:-1},
  {x:+0, y:-1}, {x:-1, y:-1},
  {x:-1, y:+0}, {x:-1, y:+1}
];
// Most squares connect in 4 directions
var crossTransforms = [
  {x:+0, y:+1}, {x:+1, y:+0},
  {x:+0, y:-1}, {x:-1, y:+0}
]

Graph.prototype.getAdjacentNeighbors = function(currentSquare) {
  return this.neighborMap[currentSquare];
}

var initializeGraph = function() {
  var nodes = initializeNodes();
  var neighborMap = initializeEdges(nodes);

  return {
    nodes: nodes,
    neighborMap: neighborMap
  }
}

var initializeNodes = function() {
  var allNodes = [];
  var columnList = ['a', 'b', 'c', 'd', 'e'];
  columnList.forEach(function(columnChar) {
    for (var row = 1; row <= 12; row++) {
      var nodeKey = columnChar + parseInt(row);
      allNodes.push(nodeKey);
    }
  });

  return allNodes;
}

var initializeEdges = function(nodes) {
  var neighborMap = {};

  nodes.forEach(function(currentSquare) {
    // Exclude front row because the neighbor could end up in the opponent's side
    if (frontRowSquares.includes(currentSquare)) {
      return;
    }
    var adjacentSquares = getMoves(currentSquare, crossTransforms);
    adjacentSquares.forEach(function(newSquare) {
      addEdge(neighborMap, currentSquare, newSquare);
    });
  });

  bunkerSquares.forEach(function(currentSquare) {
    var adjacentSquares = getMoves(currentSquare, bunkerTransforms);
    adjacentSquares.forEach(function(newSquare) {
      addEdge(neighborMap, currentSquare, newSquare);
    });
  });

  addEdgesInFrontRowSamePlayer(neighborMap)
  addEdgesBetweenDifferentPlayers(neighborMap);

  // Set headquarter squares to immobile
  headquarterSquares.forEach(function(square) {
    neighborMap[square].clear();
  });

  return neighborMap;
}

var addEdgesInFrontRowSamePlayer = function(neighborMap) {
  // Player 1: a6 <-> b6 <-> c6 <-> d6 <-> e6
  addEdge(neighborMap, "b6", "a6");
  addEdge(neighborMap, "b6", "c6");
  addEdge(neighborMap, "d6", "c6");
  addEdge(neighborMap, "d6", "e6");
  // Player 2: a7 <-> b7 <-> c7 <-> d7 <-> e7
  addEdge(neighborMap, "b7", "a7");
  addEdge(neighborMap, "b7", "c7");
  addEdge(neighborMap, "d7", "c7");
  addEdge(neighborMap, "d7", "e7");
}

var addEdgesBetweenDifferentPlayers = function(neighborMap) {
  // Add edges between front row nodes on the opposite side
  addEdge(neighborMap, "a6", "a7");
  addEdge(neighborMap, "c6", "c7");
  addEdge(neighborMap, "e6", "e7");
}

var getMoves = function(square, transforms) {
    return transforms
      .map((move) => transformSquare(square, move))
      .filter((newSquare) => newSquare != null)
}

/**
 * Apply an x and y offset to a starting square to get a destination square.
 * Returns the destination square on success, otherwise returns null
 */
var transformSquare = function(square, transform) {
  // Parse square
  var file = square[0];
  var rank = parseInt(square.substring(1, square.length), 10);

  // Apply transform
  var destFile = alpha2num(file) + transform.x;
  var destRank = rank + transform.y;

  // Check boundaries
  if (destFile < 1 || destFile > 5) { return null; }
  if (destRank < 1 || destRank > 12) { return null; }

  // Return new square
  return num2alpha(destFile) + destRank;
};

// Add an unconnected edge between node1 and node2
var addEdge = function(neighborMap, node1Key, node2Key) {
  // Initialize an empty list for the new nodes
  if (!(node1Key in neighborMap)) {
    neighborMap[node1Key] = new Set();
  }
  if (!(node2Key in neighborMap)) {
    neighborMap[node2Key] = new Set();
  }

  // Add the nodes
  neighborMap[node1Key].add(node2Key);
  neighborMap[node2Key].add(node1Key);
}

var alpha2num = function(a) {
  switch (a) {
    case 'a': return 1;
    case 'b': return 2;
    case 'c': return 3;
    case 'd': return 4;
    case 'e': return 5;
    default : return 6; // out of bounds
  }
};

var num2alpha = function(n)
{
    switch (n)
    {
       case 1: return 'a';
       case 2: return 'b';
       case 3: return 'c';
       case 4: return 'd';
       case 5: return 'e';
      default: return 'f'; // out of bounds
    }
};

module.exports = Graph;
