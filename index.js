var PokemonGO = require('pokemon-go-node-api');

var username = process.env.PGO_USERNAME || 'USER';
var password = process.env.PGO_PASSWORD || 'PASS';
var provider = 'ptc';
var location = {
  type: 'coords',
  coords: {
    latitude: 38.91649225483398,
    longitude: -77.04155915224943
  }
};

var b = new PokemonGO.Pokeio();

b.init(username, password, location, provider, function(err) {
    if (err) throw err;

    console.log('[i] Current location: ' + b.playerInfo.locationName);
    console.log('[i] lat/long/alt: : ' + b.playerInfo.latitude + ' ' + b.playerInfo.longitude + ' ' + b.playerInfo.altitude);

    b.GetProfile(function(err, profile) {
        if (err) throw err;

        console.log('[i] Username: ' + profile.username);
        console.log('[i] Poke Storage: ' + profile.poke_storage);
        console.log('[i] Item Storage: ' + profile.item_storage);

        var poke = 0;
        if (profile.currency[0].amount) {
            poke = profile.currency[0].amount;
        }

        console.log('[i] Pokecoin: ' + poke);
        console.log('[i] Stardust: ' + profile.currency[1].amount);

        setInterval(function(){
            var locationCoords = b.GetLocationCoords();
            locationCoords.latitude += Math.random() * 0.00005 + 0.00005;
            locationCoords.longitude += Math.random() * 0.00005 + 0.00005;
            b.SetLocation({ type: 'coords', coords: locationCoords }, function setLocationRes(err, loc) {
                if(err) {
                  throw err;
                }

                console.log('Updating Location [Lat', loc.latitude, ', Long', loc.longitude, ']');
              });
            b.Heartbeat(function(err,hb) {
                if(err) {
                    console.log(err);
                }

                for (var i = hb.cells.length - 1; i >= 0; i--) {
                    if(hb.cells[i].NearbyPokemon[0]) {
                        //console.log(a.pokemonlist[0])
                        var pokemon = b.pokemonlist[parseInt(hb.cells[i].NearbyPokemon[0].PokedexNumber)-1];
                        console.log('[+] There is a ' + pokemon.name + ' at ' + hb.cells[i].NearbyPokemon[0].DistanceMeters.toString() + ' meters');
                    }
                }

                // Show MapPokemons (catchable) & catch
                for (i = hb.cells.length - 1; i >= 0; i--) {
                    for (var j = hb.cells[i].MapPokemon.length - 1; j >= 0; j--)
                    {   // use async lib with each or eachSeries should be better :)
                        var currentPokemon = hb.cells[i].MapPokemon[j];

                        (function(currentPokemon) {
                            var pokedexInfo = b.pokemonlist[parseInt(currentPokemon.PokedexTypeId)-1];
                            console.log('[+] There is a ' + pokedexInfo.name + ' near!! I can try to catch it!');

                            b.EncounterPokemon(currentPokemon, function(suc, dat) {
                                console.log('Encountering pokemon ' + pokedexInfo.name + '...');
                                b.CatchPokemon(currentPokemon, 1, 1.950, 1, 1, function(xsuc, xdat) {
                                    console.log(xsuc, xdat);
                                    var status = ['Unexpected error', 'Successful catch', 'Catch Escape', 'Catch Flee', 'Missed Catch'];
                                    if (xdat.Status) {
                                      console.log(status[xdat.Status]);
                                    }
                                });
                            });
                        })(currentPokemon);

                    }
                    }
            });
        }, 3500);

    });
});