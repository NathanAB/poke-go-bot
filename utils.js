var _ = require('lodash');

/**
 * Gets a distance (in meters) of two coordinates
 * @returns {float} distance
 */
function getDistance(lat1, lon1, lat2, lon2) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2 - lat1);  // deg2rad below
  var dLon = deg2rad(lon2 - lon1);
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
    ;
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c; // Distance in km
  return d * 1000;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

function printNearby(Pogo, hb) {
  var nearby = 'Nearby:';
  for (var i = hb.cells.length - 1; i >= 0; i--) {
    // console.log(JSON.stringify(hb.cells[i], null, '\t'));
    if (hb.cells[i].NearbyPokemon[0]) {
      var pokemon = Pogo.pokemonlist[parseInt(hb.cells[i].NearbyPokemon[0].PokedexNumber) - 1];
      // console.log('[+] There is a ' + pokemon.name + ' at ' + hb.cells[i].NearbyPokemon[0].DistanceMeters.toString() + ' meters');
      nearby += ' ' + pokemon.name;
    }
  }
  console.log(nearby);
}

function printObject(obj) {
  for (var key in obj) {
    console.log(key + ' x' + obj[key]);
  }
}

function printStats(Pogo) {
  var timeElapsed = process.hrtime(Pogo.timeStart);
  var currXp = Pogo.playerStats.experience;
  var reqXp = Pogo.playerStats.next_level_xp;
  var xpLeft = reqXp - currXp;
  var xps = _.floor((Pogo.xpGained / timeElapsed[0]), 2);
  var minsRemaining = _.floor((xpLeft / xps) / 60);

  // TODO - write levels.json and store level requirements so we can calc level%
  // var xpPercent = (currXp / reqXp * 100).toFixed(0);

  console.log('[i] Level: ' + Pogo.playerStats.level);
  console.log('[i] Poke Storage: ' + _.size(Pogo.playerPokemon) + ' / ' + Pogo.profile.poke_storage);
  console.log('[i] Item Storage: ' + _.sumBy(Pogo.playerInventory, 'inventory_item_data.item.count') + ' / ' + Pogo.profile.item_storage);
  console.log('[i] XP Rate: ' + xps + ' XP/s');
  console.log('[i] XP Remaining to Level '  + (Pogo.playerStats.level + 1) + ': ' + (xpLeft / 1000).toFixed(1) + 'k (~' + minsRemaining + ' mins rem)');
  console.log('[i] Total distance walked: ' + Math.round(Pogo.distWalked) + 'm');
}

module.exports = {
  getDistance,
  printNearby,
  printObject,
  printStats
};