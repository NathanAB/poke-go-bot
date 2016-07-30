var _ = require('lodash');

// Movement Boundries
// 38.9096936, -77.043339 -- Top Left
// 38.8896936, -77.023339 -- Bottom Right

var minLat = 38.8896936;
var minLong = -77.0433390;

function chooseCoordinates(coords, target){
  var directionLat = Math.random() < (coords.latitude - target.latitude) / 0.02 ? -1 : 1;
  var directionLong = Math.random() < (coords.longitude - target.longitude) / 0.02 ? -1 : 1;

  var deltaLat = _.random(0, 0.000095, true);
  var deltaLong = _.random(0, 0.000095, true);

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

module.exports = {
  minLat,
  minLong,
  chooseCoordinates,
  chooseNewTarget
};