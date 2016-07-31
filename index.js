var PokemonGO = require('pokemon-go-node-api');
var Promise = require('bluebird');

var config = require('./config.json');
var routes = require('./routes.json');
var pokestops = require('./actions/pokestops');
var catching = require('./actions/catching');
var movement = require('./actions/movement');

var username = config.user;
var password = config.pass;
var gmapsApiKey = config.gmapsApiKey;
var route = routes[config.route];
var location = {
  type: 'coords',
  coords: route[0]
};
var provider = 'ptc';

// Interval between heartbeats in ms
var HEARTBEAT_INTERVAL = 3000;
var VERBOSE = false;

var Pogo = new PokemonGO.Pokeio();

// Promisify *some* functions (we'll wanna do promisifyAll eventually...)
Pogo.init = Promise.promisify(Pogo.init);
Pogo.GetInventory = Promise.promisify(Pogo.GetInventory);
Pogo.GetProfile = Promise.promisify(Pogo.GetProfile);

// Set globals
Pogo.caughtPokemon = [];
Pogo.xpGained = 0;
Pogo.pokestopsSpun = 0;
Pogo.itemsGained = 0;
Pogo.route = route;
Pogo.currentDest = 1;
Pogo.routeWaypointsHit = 0;
Pogo.verbose = VERBOSE;

console.time('Time Elapsed');

Pogo.SetGmapsApiKey(config.gmapsApiKey);

Pogo.init(username, password, location, provider)
  .then(function initSuccess() {
    console.log('[i] Current location: ' + Pogo.playerInfo.locationName);
    console.log('[i] lat/long/alt: : ' + Pogo.playerInfo.latitude + ' ' + Pogo.playerInfo.longitude + ' ' + Pogo.playerInfo.altitude);
    return Pogo.GetInventory();
  })
  .then(function logInventory(inventory) {
    // Figure out how to print out the inventory in a sane way
    // console.log(JSON.stringify(inventory, null, '\t'));

    return Pogo.GetProfile();
  })
  .then(function logProfileAndBegin(profile) {
    console.log('[i] Username: ' + profile.username);
    console.log('[i] Poke Storage: ' + profile.poke_storage);
    console.log('[i] Item Storage: ' + profile.item_storage);
    console.log('[i] Stardust: ' + profile.currency[1].amount);   

    var moves = 30;
    var target = {
      latitude: movement.minLat + 0.01,
      longitude: movement.minLong + 0.01
    };

    console.log('Beginning route ' + config.route);   
    setInterval(function () {
      var currentCoords = movement.move(Pogo);

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
        if(VERBOSE) {
          console.log(nearby);
        }

        pokestops.spinPokestops(Pogo, hb, currentCoords);

        // Show MapPokemons (catchable) & catch
        for (i = hb.cells.length - 1; i >= 0; i--) {
          for (var j = hb.cells[i].MapPokemon.length - 1; j >= 0; j--) {   // use async lib with each or eachSeries should be better :)
            var currentPokemon = hb.cells[i].MapPokemon[j];
            catching.engageAndCatchPokemon(Pogo, currentPokemon);
          }
        }
      });
    }, HEARTBEAT_INTERVAL);
  })
  .catch(function pogoFailure(err) {
    throw err;
  });

function exitHandler(){
  console.log('\n');
  console.timeEnd('Time Elapsed');
  console.log('Pokemon Caught:', JSON.stringify(Pogo.caughtPokemon));
  console.log('Pokestops Spun:', Pogo.pokestopsSpun);
  console.log('# Items Gained:', Pogo.itemsGained);
  console.log('XP Gained: ~' + Pogo.xpGained);
  console.log('Route waypoints hit:' + Pogo.routeWaypointsHit);
  process.exit();
}

process.on('SIGINT', exitHandler);