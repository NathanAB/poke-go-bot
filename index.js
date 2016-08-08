var _ = require('lodash');
var PokemonGO = require('pokemon-go-node-api');
var Promise = require('bluebird');

var config = require('./config.json');
var routes = require('./routes.json');
var Pokestops = require('./actions/pokestops');
var Catching = require('./actions/catching');
var Movement = require('./actions/movement');
var InventoryManagement = require('./actions/inventory');
var PokemonManagement = require('./actions/pokemon');
var EggManagement = require('./actions/eggs');
var Utils = require('./utils');

var username = process.argv[2] || process.env.PGO_USER || config.user;
var password = process.argv[3] || process.env.PGO_PASS || config.pass;
var location = config.location;
var gmapsApiKey = config.gmapsApiKey;
var routeName = process.argv[4] || process.env.PGO_ROUTE || config.route;
var route = routes[routeName];
var location = {
  type: 'coords',
  coords: route[0]
};
var provider = process.argv[5] || 'ptc';

// Interval between heartbeats in ms
var HEARTBEAT_INTERVAL = 4000;
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
Pogo.timeStart = timeStart;
Pogo.distWalked = 0;

// Min CP of pokemon to keep
Pogo.minCp = 1500;

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
    var playerEggs = _.remove(playerPokemon, 'inventory_item_data.pokemon.is_egg');
    var playerIncubators = _.find(inventory.inventory_delta.inventory_items, 'inventory_item_data.egg_incubators');

    Pogo.playerStats = playerStats;
    Pogo.playerPokemon = playerPokemon;
    Pogo.playerInventory = playerInventory;
    Pogo.playerEggs = playerEggs.sort(compareEgg);
    Pogo.playerIncubators = playerIncubators.inventory_item_data.egg_incubators.egg_incubator;
    
    return Pogo.GetProfile();
  })
  .then(function logProfile(profile) {
    Pogo.profile = profile;
    console.log('[i] Username: ' + profile.username);
    Utils.printStats(Pogo);
    console.log('[i] Stardust: ' + profile.currency[1].amount + '\n');

    /*if (VERBOSE)*/ PokemonManagement.printPokemonBigTicket(Pogo);
    if (VERBOSE) InventoryManagement.printInventory(Pogo);

    return Pogo.LevelUpRewards(Pogo.playerStats.level, function(err, res){
      if(err) { return; }
      if(res.Status === 1){ console.log('Got Level Up Rewards!'); }
      return;
    });
  })
  .then(function getLevelUpRewards() {
    return InventoryManagement.manageInventory(Pogo);
  })
  .then(function runPokemonManagement() {
    console.log('Finished Inventory Management!\n');
    return PokemonManagement.managePokemon(Pogo);
  })
  .then(function runEggManagement(){
    console.log('Finished Pokemon Management!\n');
    return EggManagement.manageEggs(Pogo);
  })
  .then(function beginRoute() {
    console.log('Finished Egg Management!\n');
    console.log('Beginning route: ' + routeName);
    setInterval(function () {
      var currentCoords = Movement.move(Pogo);
      try {
        Pogo.Heartbeat(function (err, hb) {
          if (err) {
            return console.log(err);
          }
          if (!hb) {
            return console.log('Heartbeat failed.');
          }

          // Print nearby pokemon
          if (VERBOSE) Utils.printNearby(Pogo, hb);

          Pokestops.spinPokestops(Pogo, hb, currentCoords);
          Catching.catchNearby(Pogo, hb);

        });
      } catch (err) {
        consle.log(err);
      }
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
  Utils.printObject(_.countBy(Pogo.caughtPokemon));
  console.log('Pokemon Evolved: ', Pogo.evolves);
  console.log('Pokemon Transferred: ', Pogo.transfers);
  console.log('Pokestops Spun: ', Pogo.pokestopsSpun);
  //console.log('# Items Gained: ', Pogo.itemsGained);
  console.log('XP Gained: ~', Pogo.xpGained);
  console.log(_.floor((Pogo.xpGained / timeElapsed[0]), 2) + ' XP/s');
  console.log('Route waypoints hit:' + Pogo.routeWaypointsHit);
  process.exit();
}

function compareEgg(a, b) {
  if (a.inventory_item_data.pokemon.egg_km_walked_target < b.inventory_item_data.pokemon.egg_km_walked_target) {
    return 1;
  } else if (a.inventory_item_data.pokemon.egg_km_walked_target > b.inventory_item_data.pokemon.egg_km_walked_target) {
    return -1;
  } else
    return 0;
}

// process.on('SIGINT', exitHandler);
// process.on('exit', exitHandler);
// process.on('uncaughtException', exitHandler);
