var PokemonGO = require('pokemon-go-node-api');
var config = require('./config.json');
var items = require('./items.json');

var username = config.user;
var password = config.pass;
var location = config.location;
var provider = 'ptc';

var b = new PokemonGO.Pokeio();

function getDistanceInM(lat1, lon1, lat2, lon2) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2 - lat1);  // deg2rad below
  var dLon = deg2rad(lon2 - lon1);
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
    ;
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c; // Distance in km
  return d * 1000;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

function engageAndCatchPokemon(pokemon) {

  var pokedexInfo = b.pokemonlist[parseInt(pokemon.PokedexTypeId) - 1];

  b.EncounterPokemon(pokemon, function (suc, dat) {
    b.CatchPokemon(pokemon, 1, 1.950, 1, 1, function (xsuc, xdat) {
      // xdat can provide success chance
      // console.log(xsuc, xdat);
      var status = ['Unexpected error', 'Successful catch', 'Escaped', 'Fled', 'Missed'];
      if (xdat && xdat.Status) {
        console.log('Catching a ' + pokedexInfo.name + '... ' + status[xdat.Status]);
      }
    });
  });
}

// Movement Boundries
// 38.9096936, -77.043339 -- Top Left
// 38.8896936, -77.023339 -- Bottom Right

var minLat = 38.8896936;
var minLong = -77.0433390;

function chooseCoordinates(coords, target){
  var directionLat = Math.random() < (coords.latitude - target.latitude) / 0.02 ? -1 : 1;
  var directionLong = Math.random() < (coords.longitude - target.longitude) / 0.02 ? -1 : 1;

  var deltaLat = Math.random() * 0.00005 + 0.000045;
  var deltaLong = Math.random() * 0.00005 + 0.000045;

  coords.latitude += deltaLat * directionLat;
  coords.longitude += deltaLong * directionLong;
  
  return coords;
}

function chooseNewTarget(){
  var newTarget = {
    latitude: Math.random() * 0.02 + minLat,
    longitude: Math.random() * 0.02 + minLong
  };

  return newTarget;
}

b.SetGmapsApiKey(config.gmapsApiKey);

b.init(username, password, location, provider, function (err) {
  if (err) throw err;

  console.log('[i] Current location: ' + b.playerInfo.locationName);
  console.log('[i] lat/long/alt: : ' + b.playerInfo.latitude + ' ' + b.playerInfo.longitude + ' ' + b.playerInfo.altitude);

  b.GetProfile(function (err, profile) {
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
      latitude: minLat + 0.01,
      longitude: minLong + 0.01
    };

    setInterval(function () {
      var locationCoords = chooseCoordinates(b.GetLocationCoords(), target);

      b.UpdateLocation({ type: 'coords', coords: locationCoords }, function(err, loc){
        if(err){ throw err; }
        console.log('Updating Location [', loc.latitude, ', ', loc.longitude, ']');
        moves--;
      });

      if(moves <= 0){
        target = chooseNewTarget();
        moves = 20;
        console.log('New Target Location: [', target.latitude, ',', target.longitude, ']');
      }

      b.Heartbeat(function (err, hb) {
        if (err) {
          console.log(err);
        }

        // Print nearby pokemon
        var nearby = 'Nearby:';
        for (var i = hb.cells.length - 1; i >= 0; i--) {
          // console.log(JSON.stringify(hb.cells[i], null, '\t'));
          if (hb.cells[i].NearbyPokemon[0]) {
            var pokemon = b.pokemonlist[parseInt(hb.cells[i].NearbyPokemon[0].PokedexNumber) - 1];
            // console.log('[+] There is a ' + pokemon.name + ' at ' + hb.cells[i].NearbyPokemon[0].DistanceMeters.toString() + ' meters');
            nearby += ' ' + pokemon.name;
          }
        }
        console.log(nearby);

        // Show nearby pokestops
        hb.cells.forEach(function searchCell(cell) {
          cell.Fort.forEach(function processFort(fort) {
            if (!fort.Enabled || fort.FortType !== 1) {
              return;
            }
            var dist = getDistanceInM(fort.Latitude, fort.Longitude, locationCoords.latitude, locationCoords.longitude);
            if (dist < 50) {
              b.GetFort(fort.FortId, fort.Latitude, fort.Longitude, function getFort(err, res) {
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

        // Show MapPokemons (catchable) & catch
        for (i = hb.cells.length - 1; i >= 0; i--) {
          for (var j = hb.cells[i].MapPokemon.length - 1; j >= 0; j--) {   // use async lib with each or eachSeries should be better :)
            var currentPokemon = hb.cells[i].MapPokemon[j];

            engageAndCatchPokemon(currentPokemon);

          }
        }
      });
    }, 3500);
  });
});