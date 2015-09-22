/*!
 * Copyright 2015 Florian Biewald
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

var Promise = require('bluebird');
var GoogleMaps = require('core/google/Map');
var directionService = new GoogleMaps.DirectionsService();

var DIRECTION_REQUEST_TIMEOUT = 10000;
var WAITING_TIME_BETWEEN_REQUESTS = 5000;
var WAITING_TIME_BETWEEN_EACH_REQUESTS = 500;

function collectPath(position) {
  var deferred, newPoint, request, requestTimeoutId;
  deferred = whenjs.defer();
  newPoint = new GoogleMaps.Point(position.x, position.y);
  request = {
    destination: this.destination,
    origin: _positionConverter.getLatLng(newPoint),
    travelMode: GoogleMaps.TravelMode.WALKING
  };
  requestTimeoutId = setTimeout(function() {
    return deferred.reject('Route request timeout');
  }, DIRECTION_REQUEST_TIMEOUT);
  log("route request");
  directionService.route(request, (function(_this) {
    return function(response, status) {
      var firstRoute, pos, positions;
      console.log("request done");
      clearTimeout(requestTimeoutId);
      deferred.resolve('Route request done');
      if (status !== GoogleMaps.DirectionsStatus.OK) {
        console.error("Cannot get direction. status is: " + status);
        return;
      }
      if (!response.routes || !response.routes.length) {
        console.error("No route in response");
        return;
      }
      if (!response.routes[0].overview_path) {
        console.error("overview path not found");
        return;
      }
      firstRoute = response.routes[0].overview_path;
      if (firstRoute.length < 2) {
        console.error("only one path point");
        return;
      }
      positions = (function() {
        var i, len, results;
        results = [];
        for (i = 0, len = firstRoute.length; i < len; i++) {
          pos = firstRoute[i];
          results.push(_positionConverter.getPixels(pos));
        }
        return results;
      }).call(_this);
      _this.routes.push(positions.slice());
      _this.waypointCompleter.completeRoute(positions);
      _this.waypointHolder.reduceToValidPoints(positions);
      if (!positions.length) {
        console.error('no valid positions found.');
        return;
      }
      return _this.waypointHolder.addRoute(positions);
    };
  })(this));
  return deferred.promise;
};

var RouteService = {
  isGenerating: false,
  request: function(startPosition, destination, positionConverter) {
    _positionConverter = positionConverter;
    _startPosition = startPosition;
    _destination = destination;
  },

  generate: function() {
    var count, index, position, promise, zombie;
    this.isGenerating = true;
    promise = Promise.resolve();
    count = 0;
    for (index in this.positions) {
      position = this.positions[index];
      zombie = _.clone(position);
      zombie.type = 'idle';
      promise = promise.then((function(zombie) {
        return function() {
            return collectPath(zombie);
        };
      })(zombie));

      if (count === 5) {
        count = 0;
        promise = promise.then(
          new Promise(function(resolve) {
            setTimeout((function() {
              resolve();
            }), WAITING_TIME_BETWEEN_REQUESTS);
          });
        );
      } else {
        promise = promise.then(new Promise(function(resolve, reject) {
          // Events.fireEvent('waypointGenerator.newPositions', [_this.waypointHolder]);
          setTimeout(function() {
            resolve();
          }, WAITING_TIME_BETWEEN_EACH_REQUESTS);
        }));
      }
      count++;
    }
    promise = promise.then(function() {
      console.log("done", arguments);
      return _this.isGenerating = false;
    });

    promise["catch"](function() {
      console.log("route service error " + arguments);
      log("generator error", arguments, true);
      return _this.isGenerating = false;
    });
    return this;
  },
  noMoreZombiesLeft: function() {
    return this.zombies.length === 0;
  },

  error: function(msg) {
    throw new Error(msg);
  }
};

module.exports = RouteService;
