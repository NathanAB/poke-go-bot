var PokemonGO = require('pokemon-go-node-api');
var config = require('./config.json');
var items = require('./items.json');

// Load Actions
var pokestops = require('./actions/pokestops');
var catching = require('./actions/catching');
var movement = require('./actions/movement');

var username = config.user;
var password = config.pass;
var location = config.location;
var provider = 'ptc';

var Pogo = new PokemonGO.Pokeio();

Pogo.SetGmapsApiKey(config.gmapsApiKey);

Pogo.init(username, password, location, provider, function (err) {
  if (err) throw err;

  console.log('[i] Current location: ' + Pogo.playerInfo.locationName);
  console.log('[i] lat/long/alt: : ' + Pogo.playerInfo.latitude + ' ' + Pogo.playerInfo.longitude + ' ' + Pogo.playerInfo.altitude);

  Pogo.GetProfile(function (err, profile) {
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

    var moves = 30;
    var target = {
      latitude: movement.minLat + 0.01,
      longitude: movement.minLong + 0.01
    };

    setInterval(function () {
      var locationCoords = movement.chooseCoordinates(Pogo.GetLocationCoords(), target);

      Pogo.UpdateLocation({ type: 'coords', coords: locationCoords }, function(err, loc){
        if(err){ throw err; }
        console.log('Updating Location [', loc.latitude, ', ', loc.longitude, ']');
        moves--;
      });

      if(moves <= 0){

        target = movement.chooseNewTarget();
        moves = 20;
        console.log('New Target Location: [', target.latitude, ',', target.longitude, ']');
      }

      Pogo.Heartbeat(function (err, hb) {
        if (err) {
          console.log(err);
        }

        // Print nearby pokemon
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

        pokestops.spinPokestops(Pogo, hb, locationCoords);

        // Show MapPokemons (catchable) & catch
        for (i = hb.cells.length - 1; i >= 0; i--) {
          for (var j = hb.cells[i].MapPokemon.length - 1; j >= 0; j--) {   // use async lib with each or eachSeries should be better :)
            var currentPokemon = hb.cells[i].MapPokemon[j];
            catching.engageAndCatchPokemon(Pogo, currentPokemon);
          }
        }
      });
    }, 3000);
  });
});