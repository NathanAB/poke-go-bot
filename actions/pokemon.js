var _ = require('lodash');
var Promise = require('bluebird');

function managePokemon(Pogo) {
  return new Promise(function (resolve, reject) {
    console.log('[i] Running Pokemon Management...');
    var i = 0;
    var max = Pogo.playerPokemon.length;

    trimPokemon(Pogo).then(function () {

      // Leave evolving to be done manually for level 21+
      if (Pogo.playerStats.level > 20) {
        manageUpgrades(Pogo).then(function () {
          resolve();
          return;
        });
      }

      console.log('[i] Evolving or transforming Pokemon...');
      // Process pokemon every 1000ms
      setInterval(function processPokemon() {
        if (i >= max) {
          resolve();
          return false;
        }

        // Make sure pokemon exists and we aren't out of sync -- this has crashed before
        // Could be because of server issues? Has happened to multiple bots at once
        if (Pogo.playerPokemon[i] && Pogo.playerPokemon[i].inventory_item_data) {
          var pokemon = Pogo.playerPokemon[i].inventory_item_data.pokemon;
          var pokemonId = pokemon.id;
          var pokedexId = pokemon.pokemon_id;
          var pokemonCp = pokemon.cp;
          var pokemonData = Pogo.pokemonlist[pokedexId - 1];

          // We won't touch 1000+ cp pokemon
          if (pokemonCp < Pogo.minCp && pokemonData && !pokemonData.prev_evolution) {
            evolveOrTransferPokemon(Pogo, pokemonData, pokemonId);
          }
        }

        ++i;
      }, 1000);
    });
  });
}

// Remove multiples of middle and final evolution pokemon
function trimPokemon(Pogo) {
  return new Promise(function (resolve, reject) {
    console.log('Trimming Pokemon...');
    var groupedPokemon = _.groupBy(Pogo.playerPokemon, 'inventory_item_data.pokemon.pokemon_id');
    var pokemonToTrim = [];

    // Remove Null entries
    _.remove(groupedPokemon, 'null');

    _.forEach(groupedPokemon, function (pokemonGroup, key) {
      var pokedexInfo = Pogo.pokemonlist[key - 1];

      if (_.size(pokemonGroup) > 1 && pokedexInfo/* && (!pokedexInfo.next_evolution || (pokedexInfo.next_evolution && pokedexInfo.prev_evolution))*/) {

        // Don't trim >= 1000 CP Pokemon
        _.remove(pokemonGroup, function (n) {
          return n.inventory_item_data.pokemon.cp >= 1000;
        });

        // Sort greatest to least
        pokemonGroup.sort(compareCp);

        // Push all but the strongest to be trimmed
        if (_.size(pokemonGroup) > 1) {
          pokemonGroup = _.tail(pokemonGroup);
          if (Pogo.verbose) console.log(pokedexInfo.name + ' x' + _.size(pokemonGroup));
          _.forEach(pokemonGroup, function (value) {
            pokemonToTrim.push(value);
          });
        }
      }
    });
    trimBatch(Pogo, pokemonToTrim).then(function () {
      resolve();
    });
  });
}

function trimBatch(Pogo, batch) {
  return new Promise(function (resolve, reject) {
    var i = 0;
    var max = _.size(batch);

    setInterval(function processPokemon() {
      if (i >= max) {
        resolve();
        return false;
      }

      var pokemon = batch[i].inventory_item_data.pokemon;
      var pokemonId = pokemon.id;
      var pokedexInfo = Pogo.pokemonlist[pokemon.pokemon_id - 1];

      Pogo.TransferPokemon(pokemonId, function (err, res) {
        if (err) { return console.log('Trim Error: ' + err); }
        if (res.Status === 1) {
          Pogo.transfers++;
          console.log('Trimmed: ' + pokedexInfo.name + ' ' + pokemon.cp + ' CP');
        }
      });

      ++i;
    }, 1000);
  });
}

function compareCp(a, b) {
  if (a.inventory_item_data.pokemon.cp < b.inventory_item_data.pokemon.cp) {
    return 1;
  } else if (a.inventory_item_data.pokemon.cp > b.inventory_item_data.pokemon.cp) {
    return -1;
  } else
    return 0;
}

function evolveOrTransferPokemon(Pogo, pokemon, pokemonId) {
  try {
    Pogo.EvolvePokemon(pokemonId, function evolutionRes(err, res) {
      if (err) { return console.log('Evolution Error: ' + err); }

      if (res.Result === 1) {
        console.log('Successfully evolved ' + pokemon.name);
        Pogo.xpGained += 500;
        Pogo.evolves++;
      } else if (res.Result === 3) {
        // Transfer when evolvable but not enough candy
        Pogo.TransferPokemon(pokemonId, function (err, res) {
          if (err) { return console.log('Transfer Error: ' + err); }
          if (res.Status === 1) {
            Pogo.transfers++;
            console.log('Smelted ' + pokemon.name + ' down for candy');
          }
        });
      }
    });
  } catch (err) {
    console.log('Catch or Transfer Error: ' + err);
  }
}

function manageUpgrades(Pogo) {
  return new Promise(function (resolve, reject) {
    console.log('[i] Upgrading Pokemon...');
    var groupedPokemon = _.groupBy(Pogo.playerPokemon, 'inventory_item_data.pokemon.pokemon_id');
    var pokemonToUpgrade = [];

    // Remove Null entries
    _.remove(groupedPokemon, 'null');

    _.forEach(groupedPokemon, function (pokemonGroup, key) {
      var pokedexInfo = Pogo.pokemonlist[key - 1];

      if (pokedexInfo && !pokedexInfo.next_evolution && pokedexInfo.rarity >= 5) {
        // Sort greatest to least
        pokemonGroup.sort(compareCp);
        pokemonToUpgrade.push(_.head(pokemonGroup));
      }
    });
    upgradeBatch(Pogo, pokemonToUpgrade).then(function () {
      resolve();
    });
  });

}

function upgradePokemon(Pogo, pokemon, pokemonId) {
  try {
    Pogo.UpgradePokemon(pokemonId, function upgradeRes(err, res) {
      if (err) { return console.log('Upgrade Error: ' + err); }

      if (res.Result === 1) {
        console.log('Successfully upgraded ' + Pogo.pokemonlist[pokemon.pokemon_id - 1].name);
      } else {
        console.log('Upgrade Error: ' + res.Result);
      }
    });
  } catch (err) {
    console.log('Upgrade Error: ' + err);
  }
}

function upgradeBatch(Pogo, batch) {
  return new Promise(function (resolve, reject) {
    var i = 0;
    var max = _.size(batch);

    setInterval(function processPokemon() {
      if (i >= max) {
        resolve();
        return false;
      }

      var pokemon = batch[i].inventory_item_data.pokemon;
      var pokemonId = pokemon.id;

      upgradePokemon(Pogo, pokemon, pokemonId);

      ++i;
    }, 1000);
  });
}

function manageEggs(Pogo) {



}

function printPokemon(Pogo) {

  console.log('Total Pokemon: ' + _.size(Pogo.playerPokemon) + '\n');

  _.forEach(Pogo.playerPokemon, function (pokemon) {
    var id = pokemon.inventory_item_data.pokemon.id;
    var pokemonId = pokemon.inventory_item_data.pokemon.pokemon_id;
    var pokedexInfo = Pogo.pokemonlist[pokemonId - 1];

    // Eggs seem to be included in Pokemon Count !!
    if (pokedexInfo && pokedexInfo.name) {
      console.log(pokedexInfo.name);
    }
  });
  console.log('');
}

function printPokemonGrouped(Pogo) {

  console.log('Total Pokemon: ' + _.size(Pogo.playerPokemon) + '\n');

  var groupedPokemon = _.countBy(Pogo.playerPokemon, 'inventory_item_data.pokemon.pokemon_id');

  _.forEach(groupedPokemon, function (value, key) {
    if (Pogo.pokemonlist[key - 1])
      console.log(Pogo.pokemonlist[key - 1].name + ' x' + value);
  });
  console.log('');
}

function printPokemonBigTicket(Pogo) {

  console.log('Big Ticket Pokemon:')

  _.forEach(Pogo.playerPokemon, function (pokemon) {
    var id = pokemon.inventory_item_data.pokemon.id;
    var pokemonId = pokemon.inventory_item_data.pokemon.pokemon_id;
    var pokemonCp = pokemon.inventory_item_data.pokemon.cp;
    var pokedexInfo = Pogo.pokemonlist[pokemonId - 1];

    if (pokedexInfo && pokedexInfo.name && (pokedexInfo.rarity >= 5 || pokemonCp > 1000)) {
      console.log(pokedexInfo.name + ' CP: ' + pokemonCp);
    }
  });
  console.log('');
}

module.exports = {
  managePokemon,
  trimPokemon,
  printPokemon,
  printPokemonGrouped,
  printPokemonBigTicket,
  evolveOrTransferPokemon
};