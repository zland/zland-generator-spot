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

var Immutable = require('immutable');
var _spots = Immutable.Map();
var RouteCompleter = require('generatorSpot/services/RouteCompleter');
var RouteReducer = require('generatorSpot/services/RouteReducer');
var SpotFactories = require('spotfactories/Generators');
var MapStore = require('map/stores/MapStore');
var PlayerService = require('player/services/PlayerService');
var runningSpotIds = 0;
var SpotFactories = require('spotfactories/Generators');


module.exports = {
  getSpots: function() {
    return _spots;
  },
  updateSpots: function(spots) {
    _spots = spots;
  },

  generateSpots: function(positions) {
    var route, existingRoutes = [], zombie, hasNewSpot = false;

    for (var i in positions) {
      route = positions[i];
      route = RouteCompleter.complete(route);
      RouteReducer.removeTooNearPoints(route, existingRoutes);

      if (!route.length) {
        console.error('no valid positions found');
        continue;
      }
      existingRoutes.push(route);

      var distance = MapStore.distanceBetweenCenterAndPosition(route[0]);

      if (Math.abs(distance) <= PlayerService.getPlayer().get('radius')) {
        console.error('zombie distance too near to player');
        continue;
      }

      // other spots needs to be generated here randomly
      // not just zombies, instead weapons, items, other funny things
      zombie = SpotFactories['zombie'](route, runningSpotIds++);

      if (zombie) {
        hasNewSpot = true;
        _spots = _spots.set(zombie.get('id'), zombie);
      }
    }

    return hasNewSpot;
  }
}
