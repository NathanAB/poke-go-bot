var _ = require('lodash');
var items = require('../items.json');

function manageInventory(Pogo) {

  _.forEach(Pogo.playerInventory, function (item) {
    var itemId = item.inventory_item_data.item.item;
    var itemCount = item.inventory_item_data.item.count;
    var itemMax = items[itemId].max;

    if (itemCount > itemMax)
      Pogo.DropItem(itemId, (itemCount - itemMax), function (err, res) { return; });
  });
}

module.exports = {
  manageInventory
};