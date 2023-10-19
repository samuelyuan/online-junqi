# online-junqi

An open source Junqi app that can be played directly in your browser. This app was developed with Node.js and Websockets.

http://junqi.herokuapp.com/

You can create a new game or join an existing one. When you join a game, you are given the inital layout of pieces and you can setup your board. To swap pieces, you click on the first location you want to swap and click on the second location to confirm the swap. The game will enforce the rules and prevent you from doing an invalid swap like placing a flag outside of the headquarters.

The objective of the game is to capture your opponent's flag. Whoever captures the opponent's flag first wins the game.

For a more detailed version of the game's rules, you can refer to [this page](https://en.wikipedia.org/wiki/Luzhanqi).

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

How it Works
---

The variant of the Junqi game is 1v1 and the two player's front rows are directly connected. There are no intermediate railroads that would exist if the game were to be 2v2. Each player's starting locations have 6 rows and 5 columns, which would generate 30 locations, but 5 of the locations are reserved for bunkers and the remaining 25 are the player's pieces.

If we combine both players locations, the board consists of 12 rows by 5 columns. The board state is defined as a map, where the key is the board position, e.g. "a1", and the value denotes the piece, e.g. r10. The board position has the column at the beginning (a, b, c, d, e) and the row number at the end from 1-12. The board piece has the color at the beginning ('r' for red, 'b' for blue) and a rank after (0-11). Generally the lower the rank, the more powerful the piece. Bombs (炸弹) have rank 0, field marshal (司令) has rank 1. The lowest rank 11 is for the flag (军旗).

The Board class is responsible for storing the board state, comparing the rankings between pieces, and setting special rules for some of the board locations, such as valid flag locations, valid landmine rows, valid bomb rows etc. The player isn't allowed to setup the pieces

The Graph class is responsible for defining the adjacency graph for the nodes on the board. Each node is a board location and an edge will be added between two nodes if they are directly adjacent.

The RailroadNetwork class is responsible for doing BFS search and allowing units to move across multiple locations, since the units are using the railroad to transport themselves. If the piece isn't on a railroad, the adjacent neighbors are the same as the neighbors in the graph. If the piece is on a railroad, the adjacent neighbors would be all the pieces on the same railroad line and any adjacent neighbors which are one move away without the railroad. Engineers (工兵) are given an exception where they can turn corners and access any location on other railroad lines. The BFS search works by using the current unit's position as the starting point and checking whether each adjacent neighbor is on the railroad and only adds adjacent railroad nodes to the list of reachable nodes.

Screenshots
---

<img src="https://github.com/samuelyuan/online-junqi/raw/master/images/menu.png" alt="Menu" width="400px" height="200px" />
<img src="https://github.com/samuelyuan/online-junqi/raw/master/images/game.png" alt="Gane" width="400px" height="200px" />

Credits
---

While writing the code, I looked at an existing online multiplayer nodejs app on Github called the
Socket.io Chess project. Though I have had to modify a lot of the code, it served as a good framework for learning
and experimenting.

https://github.com/thebinarypenguin/socket.io-chess
