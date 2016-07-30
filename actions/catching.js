/**
 * Engage and catch a pokemon.
 * 
 * @param {PokeIO}  Pogo    PokeIO API
 * @param {Pokemon} pokemon Pokemon to catch
 */
function engageAndCatchPokemon(Pogo, pokemon) {

  var pokedexInfo = Pogo.pokemonlist[parseInt(pokemon.PokedexTypeId) - 1];

  Pogo.EncounterPokemon(pokemon, function (suc, dat) {
    Pogo.CatchPokemon(pokemon, 1, 1.950, 1, 1, function (xsuc, xdat) {
      // xdat can provide success chance
      // console.log(xsuc, xdat);
      var status = ['Unexpected error', 'Success', 'Escaped', 'Fled', 'Missed'];
      if (xdat && xdat.Status) {
        console.log('Catching a ' + pokedexInfo.name + '... ' + status[xdat.Status]);
        if(xdat.Status === 1){
          Pogo.caughtPokemon.push(pokedexInfo.name);
        }
      }
    });
  });
}

module.exports = {
  engageAndCatchPokemon
};