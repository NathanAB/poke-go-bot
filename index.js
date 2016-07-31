var _ = require('lodash');
var PokemonGO = require('pokemon-go-node-api');
var Promise = require('bluebird');

var config = require('./config.json');
var routes = require('./routes.json');
var pokestops = require('./actions/pokestops');
var catching = require('./actions/catching');
var movement = require('./actions/movement');
var utils = require('./utils');

var username = process.env.PGO_USER || config.user;
var password = process.env.PGO_PASS || config.pass;
var location = config.location;
var gmapsApiKey = config.gmapsApiKey;
var route = routes[config.route];
var location = {
  type: 'coords',
  coords: route[0]
};
var provider = 'ptc';

// Interval between heartbeats in ms
var HEARTBEAT_INTERVAL = 2000;
var VERBOSE = false;
var timeStart = process.hrtime();

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
Pogo.evolves = 0;
Pogo.transfers = 0;
Pogo.verbose = VERBOSE;

Pogo.SetGmapsApiKey(config.gmapsApiKey);

Pogo.init(username, password, location, provider)
  .then(function initSuccess() {
    console.log('[i] Current location: ' + Pogo.playerInfo.locationName);
    console.log('[i] lat/long/alt: : ' + Pogo.playerInfo.latitude + ' ' + Pogo.playerInfo.longitude + ' ' + Pogo.playerInfo.altitude);
    return Pogo.GetInventory();
  })
  .then(function logInventory(inventory) {
    var playerStatsKey = _.findKey(inventory.inventory_delta.inventory_items, 'inventory_item_data.player_stats');
    var playerStats = inventory.inventory_delta.inventory_items[playerStatsKey].inventory_item_data.player_stats;
    var playerPokemon = _.filter(inventory.inventory_delta.inventory_items, 'inventory_item_data.pokemon');
    var playerInventory = _.filter(inventory.inventory_delta.inventory_items, 'inventory_item_data.item');

    Pogo.playerLevel = playerStats.level;
    Pogo.playerPokemon = playerPokemon;
    Pogo.playerInventory = playerInventory;

    return Pogo.GetProfile();
  })
  .then(function logProfileAndBegin(profile) {
    console.log('[i] Username: ' + profile.username);
    console.log('[i] Level: ' + Pogo.playerLevel);
    console.log('[i] Poke Storage: ' + _.size(Pogo.playerPokemon) + ' / ' + profile.poke_storage);
    console.log('[i] Item Storage: ' + _.sumBy(Pogo.playerInventory, 'inventory_item_data.item.count') + ' / ' + profile.item_storage);
    console.log('[i] Stardust: ' + profile.currency[1].amount);

    console.log('Beginning route: ' + config.route);
    setInterval(function () {
      var currentCoords = movement.move(Pogo);

      Pogo.Heartbeat(function (err, hb) {
        if (err) console.log(err);

        // Print nearby pokemon
        if (VERBOSE) utils.printNearby(Pogo, hb);

        pokestops.spinPokestops(Pogo, hb, currentCoords);

        try {
          // Show MapPokemons (catchable) & catch
          for (var i = hb.cells.length - 1; i >= 0; i--) {
            for (var j = hb.cells[i].MapPokemon.length - 1; j >= 0; j--) {   // use async lib with each or eachSeries should be better :)
              var currentPokemon = hb.cells[i].MapPokemon[j];
              catching.engageAndCatchPokemon(Pogo, currentPokemon);
            }
          }
        } catch (error) {
          console.log(error);
          return;
        }

      });
    }, HEARTBEAT_INTERVAL);
  })
  .catch(function pogoFailure(err) {
    throw err;
  });

function exitHandler() {
  var timeElapsed = process.hrtime(timeStart);

  console.log('\n');

  console.log(timeElapsed[0] + 's');
  console.log('Pokemon Caught: ', Pogo.caughtPokemon.length);
  utils.printObject(_.countBy(Pogo.caughtPokemon));
  console.log('Pokemon Evolved: ', Pogo.evolves);
  console.log('Pokemon Transferred: ', Pogo.transfers);
  console.log('Pokestops Spun: ', Pogo.pokestopsSpun);
  console.log('# Items Gained: ', Pogo.itemsGained);
  console.log('XP Gained: ~', Pogo.xpGained);
  console.log('Route waypoints hit:' + Pogo.routeWaypointsHit);
  process.exit();
}

process.on('SIGINT', exitHandler);