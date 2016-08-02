var _ = require('lodash');
var Promise = require('bluebird');

var items = require('../items.json');

/**
 * Manage inventory by dropping items over max quantity set in items.json
 * 
 * @param {PokeIO}  Pogo    PokeIO API
 */

function manageInventory(Pogo) {
  return new Promise(function (resolve, reject) {
    console.log('[1] Running Inventory Management...');
    var i = 0;
    var max = Pogo.playerInventory.length;

    setInterval(function processItem() {
      if(i >= max) {
        resolve();
        return false;
      }

      manageItem(Pogo, Pogo.playerInventory[i]);

      ++i;
    }, 1000);
  });
}

function manageItem(Pogo, item) {
  var itemId = item.inventory_item_data.item.item_id;
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
}

function printInventory(Pogo) {

  _.forEach(Pogo.playerInventory, function (item) {
    var itemId = item.inventory_item_data.item.item_id;
    var itemCount = item.inventory_item_data.item.count || 0;

    console.log(items[itemId].name + ' x' + itemCount + ' (Max: ' + items[itemId].max + ')');
  });
  console.log('');
}

module.exports = {
  manageInventory,
  manageItem,
  printInventory
};