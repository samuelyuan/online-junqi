import { strict as assert } from 'assert';
var GameStore = require('../src/lib/GameStore');

describe('GameStore', function () {
  describe('#addAndRemoveGame()', function () {
    it('Add and remove game', function () {
      var gameStore = new GameStore();
      var gameKey1 = gameStore.add({
        playerName: '',
        playerColor: 'red'
      });
      assert.equal(Object.keys(gameStore.games).length, 1);
      var gameKey2 = gameStore.add({
        playerName: '',
        playerColor: 'red'
      });
      assert.equal(Object.keys(gameStore.games).length, 2);

      var status = gameStore.remove('unknown key');
      assert.equal(status, false);
      var status = gameStore.remove(gameKey1);
      assert.equal(status, true);
      assert.equal(Object.keys(gameStore.games).length, 1);
      var status = gameStore.remove(gameKey2);
      assert.equal(status, true);
      assert.equal(Object.keys(gameStore.games).length, 0);

      clearInterval(gameStore.intervalId);
    });
  });

  describe('#findGame()', function () {
    it('Find game', function () {
      var gameStore = new GameStore();
      var gameKey = gameStore.add({
        playerName: '',
        playerColor: 'red'
      });
      assert.notEqual(gameStore.find(gameKey), false);
      assert.equal(gameStore.find('unknown key'), false);

      clearInterval(gameStore.intervalId);
    });
  });

  describe('#listGame()', function () {
    it('List game', function () {
      var gameStore = new GameStore();
      var redPlayerSession = {
        playerName: '',
        playerColor: 'red'
      };
      var gameKey = gameStore.add(redPlayerSession);
      var currentGame = gameStore.games[gameKey];
      currentGame.addPlayer(redPlayerSession);

      var gameIds = gameStore.list(gameKey)
      assert.equal(gameIds.length, 1);
      assert.equal(gameIds[0], gameKey);

      // Game will be removed from GameStore if no players joined
      currentGame.removePlayer(redPlayerSession);

      var gameIds = gameStore.list(gameKey)
      assert.equal(gameIds.length, 0);

      clearInterval(gameStore.intervalId);
    });
  });
});
