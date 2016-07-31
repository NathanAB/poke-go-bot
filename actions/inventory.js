var _ = require('lodash');
var items = require('../items.json');
var Catching = require('./catching');

/**
 * Manage inventory by dropping items over max quantity set in items.json
 * 
 * @param {PokeIO}  Pogo    PokeIO API
 */

function manageInventory(Pogo) {

  _.forEach(Pogo.playerInventory, function (item) {
    var itemId = item.inventory_item_data.item.item;
    var itemCount = item.inventory_item_data.item.count;
    var itemMax = items[itemId].max;
    var itemDiff = itemCount - itemMax;

    if (itemCount > itemMax) {
      Pogo.DropItem(itemId, itemDiff, function (err, res) {
        if (err) { console.log(err); return; }
        console.log('Dropped ' + itemDiff + ' ' + items[itemId].name + '(s). Previous: ' + itemCount + ' Max: ' + itemMax);
        return;
      });
    }
  });
}

function managePokemon(Pogo) {
  return new Promise(function (resolve, reject) {
    console.log('Cleaning up Pokemon inventory...');
    var i = 0;
    var max = Pogo.playerPokemon.length;

    // Process pokemon every 750ms
    setInterval(function processPokemon() {
      if(i >= max) {
        resolve();
        return false;
      }
      
      var pokemon = Pogo.playerPokemon[i].inventory_item_data.pokemon;
      var pokemonId = pokemon.pokemon_id;
      var cp = pokemon.cp;
      var pokemonData = Pogo.pokemonlist[pokemonId - 1];

      // We won't touch 1000+ cp pokemon
      if(cp > 1000) {
        return;
      }

      Catching.evolveOrTransferPokemon(Pogo, pokemonData, pokemonId);
      ++i;
    }, 350);
  });
}

function printInventory(Pogo) {

  _.forEach(Pogo.playerInventory, function (item) {
    var itemId = item.inventory_item_data.item.item;
    var itemCount = item.inventory_item_data.item.count || 0;

    console.log(items[itemId].name + ' x' + itemCount + ' (Max: ' + items[itemId].max + ')');
  });
  console.log('');
}

module.exports = {
  manageInventory,
  managePokemon,
  printInventory
};