var _ = require('lodash');
var Utils = require('../utils');
var InventoryManagement = require('./inventory');
var PokemonManagement = require('./pokemon');
var EggManagement = require('./eggs');

var WALK_SPEED = 0.00008;
var VARIANCE = 0.00002;

/**
 * Move our character along a selected route
 */
function move(Pogo) {
  var currentCoords = Pogo.GetLocationCoords();
  var destCoords = Pogo.route[Pogo.currentDest];
  var distToDest = Utils.getDistance(currentCoords.latitude, currentCoords.longitude, destCoords.latitude, destCoords.longitude);

  // If we are at/near our destination, switch destination to next point in the route
  if (distToDest < 25) {
    console.log('\n[i] Arrived at route waypoint ' + Pogo.currentDest);
    Pogo.currentDest = Pogo.currentDest === (Pogo.route.length - 1) ? 0 : Pogo.currentDest + 1;
    destCoords = Pogo.route[Pogo.currentDest];
    Pogo.routeWaypointsHit++;

    if(Pogo.routeWaypointsHit > 5){
      process.exit();
    }

    if (Pogo.currentDest % 2 === 0) {
      InventoryManagement.manageInventory(Pogo).then(function () {
        PokemonManagement.managePokemon(Pogo);
      });
    }

    // This function should DEFINITELY be util
    // Print level and xp as a status update
    Pogo.GetInventory()
      .then(function logInventory(inventory) {
        var playerStatsKey = _.findKey(inventory.inventory_delta.inventory_items, 'inventory_item_data.player_stats');
        var playerStats = inventory.inventory_delta.inventory_items[playerStatsKey].inventory_item_data.player_stats;
        var playerInventory = _.filter(inventory.inventory_delta.inventory_items, 'inventory_item_data.item');
        var playerPokemon = _.filter(inventory.inventory_delta.inventory_items, 'inventory_item_data.pokemon');
        var playerEggs = _.remove(playerPokemon, 'inventory_item_data.pokemon.is_egg');
        var playerIncubators = _.find(inventory.inventory_delta.inventory_items, 'inventory_item_data.egg_incubators');

        // Update inventory
        var oldLevel = Pogo.playerStats.level;
        Pogo.playerStats = playerStats;
        Pogo.playerInventory = playerInventory;
        Pogo.playerPokemon = playerPokemon;
        Pogo.playerEggs = playerEggs;
        Pogo.playerIncubators = playerIncubators.inventory_item_data.egg_incubators.egg_incubator;

        // Report levels up and XP
        if (Pogo.playerStats.level > oldLevel) {
          console.log('\nLEVEL UP!!! Now level', Pogo.playerStats.level, '\n');
        }

        if (Pogo.currentDest % 2 === 1) {
          Utils.printStats(Pogo);
          console.log('[i] Total XP gained:', Pogo.xpGained, '\n');

          EggManagement.manageEggs(Pogo);
        }
      });
  }

  // Calculate delta with some randomness
  var deltaLat = destCoords.latitude - currentCoords.latitude;
  var deltaLong = destCoords.longitude - currentCoords.longitude;
  var deltaSum = Math.abs(deltaLat) + Math.abs(deltaLong);
  var stepLat = deltaLat / deltaSum * WALK_SPEED + _.random(-VARIANCE, VARIANCE, true);
  var stepLong = deltaLong / deltaSum * WALK_SPEED + _.random(-VARIANCE, VARIANCE, true);

  // Apply delta
  var newLat = currentCoords.latitude + stepLat;
  var newLong = currentCoords.longitude + stepLong;

  // Track distance walked
  Pogo.distWalked += Utils.getDistance(currentCoords.latitude, currentCoords.longitude, newLat, newLong);

  // Update location
  Pogo.UpdateLocation({ type: 'coords', coords: {latitude: newLat, longitude: newLong} }, function (err, loc) {
    if (err) {
      throw err;
    }
  });

  if (Pogo.verbose) {
    console.log('Location:', currentCoords.latitude, ',', currentCoords.longitude);
  }

  // Return current location coordinates
  return currentCoords;
}

module.exports = {
  move
};