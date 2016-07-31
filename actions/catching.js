var SUCCESS_STATUS = ['ERROR :(', 'SUCCESS!', 'ESCAPED! Trying again...', 'FLED!', 'MISSED!'];

/**
 * Engage and catch a pokemon.
 * 
 * @param {PokeIO}  Pogo    PokeIO API
 * @param {Pokemon} pokemon Pokemon to catch
 */
function engageAndCatchPokemon(Pogo, pokemon) {

  var pokedexInfo = Pogo.pokemonlist[parseInt(pokemon.PokedexTypeId) - 1];

  function _catchPokemonHandler(xsuc, xdat) {
    if (xdat && xdat.Status) {
      console.log('Catching a ' + pokedexInfo.name + '... ' + SUCCESS_STATUS[xdat.Status]);
      switch (xdat.Status) {
        case 1:
          Pogo.xpGained += 100;
          Pogo.caughtPokemon.push(pokedexInfo.name);
          evolveOrTransferPokemon(Pogo, pokedexInfo, xdat.CapturedPokemonId);
          break;
        case 2:
          Pogo.CatchPokemon(pokemon, 1, 1.950, 1, 1, _catchPokemonHandler);
          break;
        default:
      }
    }
  }

  // To Implement: Use Razz Berry and Greatball for rare pokemon

  Pogo.EncounterPokemon(pokemon, function (suc, dat) {
    Pogo.CatchPokemon(pokemon, 1, 1.950, 1, 1, _catchPokemonHandler);
  });
}

function catchNearby(Pogo, hb) {
  try {
    // Show MapPokemons (catchable) & catch
    for (var i = hb.cells.length - 1; i >= 0; i--) {
      for (var j = hb.cells[i].MapPokemon.length - 1; j >= 0; j--) {   // use async lib with each or eachSeries should be better :)
        var currentPokemon = hb.cells[i].MapPokemon[j];
        engageAndCatchPokemon(Pogo, currentPokemon);
      }
    }
  } catch (err) {
    console.log('Catching Error: ' + err);
  }
}

function evolveOrTransferPokemon(Pogo, pokemon, pokemonId) {

  // Attempt to evolve all caught pokemon
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
    console.log(err);
  }

}

module.exports = {
  catchNearby,
  engageAndCatchPokemon,
  evolveOrTransferPokemon
};