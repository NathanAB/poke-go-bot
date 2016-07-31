var _ = require('lodash');
var Promise = require('bluebird');
var Catching = require('./catching');

function managePokemon(Pogo) {
  return new Promise(function (resolve, reject) {
    console.log('Running Pokemon Management...');
    var i = 0;
    var max = Pogo.playerPokemon.length;

    // Process pokemon every 1000ms
    setInterval(function processPokemon() {
      if(i >= max) {
        console.log('Finished Pokemong Management!\n');
        resolve();
        return false;
      }
      
      var pokemon = Pogo.playerPokemon[i].inventory_item_data.pokemon;
      // console.log(pokemon);
      var pokemonId = pokemon.id;
      var pokedexId = pokemon.pokemon_id;
      var cp = pokemon.cp;
      var pokemonData = Pogo.pokemonlist[pokedexId - 1];

      // We won't touch 1000+ cp pokemon
      if(cp < 1000) {
        Catching.evolveOrTransferPokemon(Pogo, pokemonData, pokemonId);
      }
        
      ++i;
    }, 1000);
  });
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

module.exports = {
  managePokemon,
  printPokemon,
  printPokemonGrouped
};