var _ = require('lodash');
var utils = require('../utils');
var InventoryManagement = require('./inventory');

var WALK_SPEED = 0.00005;
var VARIANCE = 0.00001;

/**
 * Move our character along a selected route
 */
function move(Pogo) {
  var currentCoords = Pogo.GetLocationCoords();
  var destCoords = Pogo.route[Pogo.currentDest];
  var distToDest = utils.getDistance(currentCoords.latitude, currentCoords.longitude, destCoords.latitude, destCoords.longitude);

  // If we are at/near our destination, switch destination to next point in the route
  if(distToDest < 25) {
    console.log('--- Arrived at route waypoint ' + Pogo.currentDest + ' ---');
    Pogo.currentDest = Pogo.currentDest === (Pogo.route.length - 1) ? 0 : Pogo.currentDest + 1;
    destCoords = Pogo.route[Pogo.currentDest];
    Pogo.routeWaypointsHit++;

    InventoryManagement.manageInventory(Pogo);

    // This funcion should be util
    // Print level and xp as a status update
    Pogo.GetInventory()
      .then(function logInventory(inventory) {
        var playerStatsKey = _.findKey(inventory.inventory_delta.inventory_items, 'inventory_item_data.player_stats');
        var playerStats = inventory.inventory_delta.inventory_items[playerStatsKey].inventory_item_data.player_stats;
        var playerInventory = _.filter(inventory.inventory_delta.inventory_items, 'inventory_item_data.item');

        // Update inventory
        Pogo.playerInventory = playerInventory;

        // Report levels up and XP
        if(Pogo.playerLevel < playerStats.level) {
          console.log('LEVEL UP!!! Now level', Pogo.playerLevel = playerStats.level);
        }
        console.log('Total experience gained:', Pogo.xpGained);
      });
  }

  // Calculate delta with some randomness
  var deltaLat = destCoords.latitude - currentCoords.latitude;
  var deltaLong = destCoords.longitude - currentCoords.longitude;
  var deltaSum = Math.abs(deltaLat) + Math.abs(deltaLong);
  var stepLat = deltaLat / deltaSum * WALK_SPEED + _.random(-VARIANCE, VARIANCE, true);
  var stepLong = deltaLong / deltaSum * WALK_SPEED + _.random(-VARIANCE, VARIANCE, true);

  // Apply delta
  currentCoords.latitude += stepLat;
  currentCoords.longitude += stepLong;

  // Update location
  Pogo.UpdateLocation({ type: 'coords', coords: currentCoords }, function(err, loc) {
    if(err) {
      throw err;
    }
  });

  if(Pogo.verbose) {
    console.log('Location:', currentCoords.latitude, ',', currentCoords.longitude);
  }

  // Return current location coordinates
  return currentCoords;
}

module.exports = {
  move
};