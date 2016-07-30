var utils = require('../utils');
var items = require('../items.json');

/**
 * Look for and spin any nearby pokestops, reporting items gained.
 * 
 * @param {PokeIO}    Pogo      PokeIO API
 * @param {Heartbeat} hb        Heartbeat object
 * @param {Location}  coords    Current player coordinates
 */
function spinPokestops(Pogo, hb, coords) {
  // Show nearby pokestops
  hb.cells.forEach(function searchCell(cell) {
    cell.Fort.forEach(function processFort(fort) {
      if (!fort.Enabled || fort.FortType !== 1) {
        return;
      }
      var dist = utils.getDistance(fort.Latitude, fort.Longitude, coords.latitude, coords.longitude);
      if (dist < 50) {
        Pogo.GetFort(fort.FortId, fort.Latitude, fort.Longitude, function getFort(err, res) {
          if (err) {
            return /*console.log('Error spinning pokestop: ' + err)*/;
          }

          // Don't care about failed Pokestop spins -- Maybe in Verbose mode
          // Reference node_modules/pokemon-go-node-api/pokemon.proto#1013
          if (res.result === 1) {
            console.log('Spun pokestop! Acquired:');
            res.items_awarded.forEach(function printLoot(item) {
              console.log(items[item.item_id]);
            });
          }
        });
      }
    });
  });
}

module.exports = {
  spinPokestops
};