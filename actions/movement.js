var _ = require('lodash');
var utils = require('../utils');

var WALK_SPEED = 0.00005;
var VARIANCE = 0.00001;

/**
 * Move our character along a selected route
 */
function move(Pogo) {
  var currentCoords = Pogo.GetLocationCoords();
  var destCoords = Pogo.route[Pogo.currentDest];
  var distToDest = utils.getDistance(currentCoords.Latitude, currentCoords.Longitude, destCoords.latitude, destCoords.longitude);

  // If we are at our destination, switch destination to next point in the route
  if(distToDest < 50) {
    console.log('--- Arrived at route waypoint ' + Pogo.currentDest + ' ---');
    Pogo.currentDest = Pogo.currentDest === (Pogo.route.length - 1) ? 0 : Pogo.currentDest + 1;
    destCoords = Pogo.route[Pogo.currentDest];
    Pogo.routeWaypointsHit++;
  }

  // Calculate delta with some randomness
  var deltaLat = destCoords.latitude - currentCoords.latitude;
  var deltaLong = destCoords.longitude - currentCoords.longitude;
  var deltaSum = Math.abs(deltaLat) + Math.abs(deltaLong);
  var stepLat = deltaLat / deltaSum * WALK_SPEED + _.random(-VARIANCE, VARIANCE, true);
  var stepLong = deltaLong / deltaSum * WALK_SPEED + _.random(-VARIANCE, VARIANCE, true);

  // Apply delta
  currentCoords.latitude += stepLat;
  currentCoords.longitude += stepLong;

  // Update location
  Pogo.UpdateLocation({ type: 'coords', coords: currentCoords }, function(err, loc) {
    if(err) {
      throw err;
    }
  });

  if(Pogo.verbose) {
    console.log('Location:', currentCoords.latitude, ',', currentCoords.longitude);
  }

  // Return current location coordinates
  return currentCoords;
}

module.exports = {
  move
};