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
      switch(xdat.Status) {
        case 1:
          Pogo.xpGained += 100;
          Pogo.caughtPokemon.push(pokedexInfo.name);
          break;
        case 2:
          Pogo.CatchPokemon(pokemon, 1, 1.950, 1, 1, _catchPokemonHandler);
          break;
        default:
      }
    }
  }
  
  Pogo.EncounterPokemon(pokemon, function (suc, dat) {
    Pogo.CatchPokemon(pokemon, 1, 1.950, 1, 1, _catchPokemonHandler);
  });
}


module.exports = {
  engageAndCatchPokemon
};