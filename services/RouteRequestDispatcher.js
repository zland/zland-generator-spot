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
var Defer = require('core/Defer');
var GoogleMaps = require('core/google/Maps');
var directionService = new GoogleMaps.DirectionsService();


var DIRECTION_REQUEST_TIMEOUT = 10000;
var WAITING_TIME_BETWEEN_REQUESTS = 5000;
var WAITING_TIME_BETWEEN_EACH_REQUESTS = 500;


var _routeCallback, _positionConverter, _positions = [];


function getPixelPositions(route) {
  var i, len, results, point;
  var results = [];
  for (i = 0, len = route.length; i < len; i++) {
    point = _positionConverter.fromLatLngToDivPixel(route[i])
    results.push({x: point.x, y: point.y});
  }
  return results;
}

function collectPath(routeRequestItem) {
  var deferred, newPoint, request, requestTimeoutId;
  deferred = Defer();

  var source = routeRequestItem.getSource();
  var destination = routeRequestItem.getDestination();

  source = new GoogleMaps.Point(source.x, source.y);
  destination = new GoogleMaps.Point(destination.x, destination.y);

  request = {
    destination: _positionConverter.getLatLng(destination),
    origin: _positionConverter.getLatLngDivPixel(source),
    travelMode: GoogleMaps.TravelMode.WALKING
  };
  requestTimeoutId = setTimeout(function() {
    return deferred.reject('Route request timeout');
  }, DIRECTION_REQUEST_TIMEOUT);

  console.log("route request");

  directionService.route(request, function(response, status) {
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
    _positions.push(getPixelPositions(firstRoute));
  });
  return deferred.promise;
};

var RouteRequestDispatcher = {
  isGenerating: false,

  dispatch: function(routeRequestItems, positionConverter) {
    var count, index, position, promise, routeRequestItem;
    // todo, cancel current request
    _positions = [];
    _positionConverter = positionConverter;
    promise = Promise.resolve();
    count = 0;
    for (index in routeRequestItems) {
      routeRequestItem = routeRequestItems[index];
      promise = promise.then((function(routeRequestItem) {
        return function() {
            return collectPath(routeRequestItem);
        };
      })(routeRequestItem));

      if (count === 5) {
        count = 0;
        promise = promise.then(function() {
          return new Promise(function(resolve) {
            setTimeout((function() {
              resolve();
            }), WAITING_TIME_BETWEEN_REQUESTS);
          });
        });
      } else {
        promise = promise.then(function() {
          return new Promise(function(resolve, reject) {
            // Events.fireEvent('waypointGenerator.newPositions', [_this.waypointHolder]);
            setTimeout(function() {
              console.log("resolve");
              resolve();
            }, WAITING_TIME_BETWEEN_EACH_REQUESTS);
          })
        });
      }
      count++;
    }
    promise = promise.then(function() {
      console.log("done", _positions);
      return _positions;
    });

    promise["catch"](function(e) {
      console.log("error " + arguments);
      console.log("error " + e.stack);
    });

    return promise;
  },

  onRoute: function(callback) {
    _routeCallback = callback;
  }
};

module.exports = RouteRequestDispatcher;
