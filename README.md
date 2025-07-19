# online-junqi

An open source Junqi app that can be played directly in your browser. This app was developed with Node.js and Websockets.

You can create a new game or join an existing one. When you join a game, you are given the inital layout of pieces and you can setup your board. To swap pieces, you click on the first location you want to swap and click on the second location to confirm the swap. The game will enforce the rules and prevent you from doing an invalid swap like placing a flag outside of the headquarters.

The objective of the game is to capture your opponent's flag. Whoever captures the opponent's flag first wins the game.

For a more detailed version of the game's rules, you can refer to [this page](https://en.wikipedia.org/wiki/Luzhanqi).

<div style="display:inline-block;">
<img src="https://github.com/samuelyuan/online-junqi/raw/master/images/menu.png" alt="Menu" width="400px" height="200px" />
<img src="https://github.com/samuelyuan/online-junqi/raw/master/images/game.png" alt="Gane" width="400px" height="200px" />
</div>

Getting Started
---

1. Clone the project

2. Install npm dependencies
```
cd online-junqi
npm install
```

3. Compile Typescript
```
npm run build
```

4. Run nodejs
```
npm run start
```

5. Visit localhost:3000 to view the page.

Unit Tests
---

Run unit tests
```
npm run test
```

Run unit tests with coverage. Results will be generated in coverage folder.
```
npm run test:coverage
```

## How it Works

This implementation of Junqi is a 1v1 variant, where both players’ front lines are directly connected without intermediate railroads that typically exist in the 2v2 version.

### Board Layout

* Each player starts with a 6-row by 5-column section (30 total positions).
* 5 of those positions are reserved for bunkers, leaving 25 pieces per player.
* The combined board is 12 rows by 5 columns.

### Board Representation

* The board is modeled as a map, where:
  * Keys are positions like `"a1"` (column letter `a-e`, row number `1-12`)
  * Values are pieces like `"r10"` (e.g., red player’s rank 10 piece)
* Piece notation:
  * First character: player color (`r` for red, `b` for blue)
  * Following number: piece rank (`0`–`11`)
    * Rank `0`: Bomb (炸弹)
    * Rank `1`: Field Marshal (司令)
    * Rank `11`: Flag (军旗)

### Core Classes

* `Board`
  * Stores the current board state
  * Compares piece rankings during combat
  * Enforces setup rules: e.g., where flags, landmines, and bombs may be placed
* `Graph`
  * Represents adjacency between board positions
  * Each node is a square; edges are created for direct (orthogonal) neighbors
* `RailroadNetwork`
  * Handles multi-tile movement using BFS (Breadth-First Search)
  * Determines legal movement for units on railroad tiles
    * Regular pieces can move along a straight railroad line
    * Engineers (工兵) can turn at corners and switch between intersecting rail lines
  * When not on a railroad, unit movement is restricted to basic adjacency (via `Graph`)

Reference
---

https://github.com/thebinarypenguin/socket.io-chess
