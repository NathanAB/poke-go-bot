var _ = require('lodash');


function managePokemon(Pogo) {
  /*
  // Attempt to evolve all caught pokemon 
  _.forEach(Pogo.playerPokemon, function evolve(pokemon) {
    setTimeout(function () {
      var id = pokemon.inventory_item_data.pokemon.id;
      var pokeId = pokemon.inventory_item_data.pokemon.pokemon_id;

      //console.log(id.low);

      if (pokeId === 19) {
        Pogo.EvolvePokemon(id, function evolutionRes(err, res) {
          if (err && err !== 'No result') { return console.log(err); }
          console.log(res);
        });
      }
    }, 1000);
  });*/
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