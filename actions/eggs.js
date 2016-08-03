var _ = require('lodash');
var Promise = require('bluebird');

function manageEggs(Pogo) {
  console.log('[i] Running Egg Management');
  return getHatchedEggs(Pogo)
    .then(incubateEggs);
}

function getHatchedEggs(Pogo) {
  return new Promise(function (resolve, reject) {
    Pogo.GetHatchedEggs(function (err, res) {
      if (err) {
        console.log('Get Hatched Eggs Error: ' + err);
        return resolve();
      }

      if (res.success) {
        _.forEach(res.pokemon_id, function (pokemon) {
          console.log('Hatched Pokemon: ');
        });
      }
      return resolve(Pogo);
    });
  });
}

function incubateEggs(Pogo) {
  Promise.each(Pogo.playerIncubators, function (incubator) {
    useIncubator(Pogo, incubator.item_id);
  });
}

function useIncubator(Pogo, incubator) {
  return new Promise(function (resolve, reject) {
    var i = 0;
    var max = _.size(Pogo.playerEggs);

    setInterval(function processEggs() {
      if (i >= max) {
        resolve();
        return false;
      }

      var egg = Pogo.playerEggs[i].inventory_item_data.pokemon;
      var eggId = egg.id;
      var eggKm = egg.egg_km_walked_target;

      Pogo.UseItemEggIncubator(incubator, eggId, function (err, res) {
        if (err) { resolve(); return false; }

        if (res.Status === 1) {
          console.log('Successfully incubated ' + eggKm + 'KM egg');
          resolve(); 
          return false;
        } else if (res.Status === 5) {
          resolve();
          return false;
        }
      });

      ++i;
    }, 1000);
  });
}

module.exports = {
  manageEggs
};