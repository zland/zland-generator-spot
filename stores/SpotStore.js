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

var ChangeEventEmitter = require('core/ChangeEventEmitter');
var assign = require('object-assign');
var Immutable = require('immutable');
var Dispatcher = require('core/Dispatcher');
var math = require('core/math');
var GarbageCollector = require('core/GarbageCollector');
var Constants = require('generatorSpot/Constants');
var MapConstants = require('map/Constants');
var MapStore = require('map/stores/MapStore');
var PointCalculator = require('generatorSpot/services/PointCalculator');
var RouteRequestDispatcher = require('generatorSpot/services/RouteRequestDispatcher');
var RouteRequestItem = require('generatorSpot/services/RouteRequestItem');
var SpotService = require('generatorSpot/services/SpotService');
var PlayerConstants = require('player/Constants');
var CoreConstants = require('core/Constants');
var PlayerStore = require('player/stores/PlayerStore');
var Promise = require('bluebird');
var mapCalculate = require('core/mapCalculate');

var MAX_HEADINGS_COUNT = 20;
var DISTANCE_FOR_POINT_GENERATION = 350;


/**
 * {
 *   <spot_id>: <$spot_element>
 * }
 *
 */
var _spotEls = {};
var _lastGeneratePosition = null;
var _$player = null;
var _garbageCollector = null;

function deleteSpotById(id) {
  SpotService.updateSpots(SpotService.getSpots().delete(id));
}


function garbageCollection() {
  if (!_garbageCollector) {
    _garbageCollector = new GarbageCollector(mapCalculate.getHeight());
  }

  for (var id in _spotEls) {
    if (_garbageCollector.isElementGarbage(PlayerStore.getPlayerElement(), _spotEls[id])) {
      deleteSpotById(id);
    }
  }
}

function handleSpotPositionError(e) {
  console.log(e);
  // console.log("spot position error " + e.stack);
  // console.log("spot position error " + e);
}



function requestPositions(startPosition, points) {
  var routeRequestItems = [];
  points.forEach(function(point) {
    routeRequestItems.push(new RouteRequestItem(point, startPosition));
  });
  return RouteRequestDispatcher.dispatch(routeRequestItems, MapStore.getPositionConverter());
}


function generateNewSpotPositions() {
  var points;

  if (!MapStore.getMapCenterPixel() || !MapStore.getPositionPixel()) {
    return Promise.reject('no position');
  }

  // initial positions will be generated
  if (_lastGeneratePosition === null) {
    _lastGeneratePosition = MapStore.getMapCenterPixel();
    points = PointCalculator.calculateInitialPositions();
    return Promise.resolve([MapStore.getPositionPixel(), points]);
  }

  var mapPosition = MapStore.getMapCenterPixel();
  var distance = math.distance(mapPosition, _lastGeneratePosition).distance;

  if (Math.abs(distance) <= DISTANCE_FOR_POINT_GENERATION) {
    return Promise.reject('Not enough distance for generation');
  }

  // positions with relation to last generation position are generated
  points = PointCalculator.calculate(mapPosition, MapStore.getMagneticHeading());
  _lastGeneratePosition = mapPosition;
  return Promise.resolve([MapStore.getPositionPixel(), points]);
}

function renameTopLeftToPoints(topLeft) {
  return {x: topLeft.left, y: topLeft.top};
}

function revealSpots() {
  var changed = false;

  if (!_$player || !SpotService.getSpots().size) {
    console.log("cannot calculate dist between spots and player");
    return Promise.resolve(changed);
  }

  SpotService.getSpots().forEach(function(spot) {
    if (!spot.get('hidden')) return;
    if (!_spotEls[spot.get('id')]) return;
    var playerPos = renameTopLeftToPoints(_$player.get(0).getBoundingClientRect());
    var spotPos = renameTopLeftToPoints(_spotEls[spot.get('id')].get(0).getBoundingClientRect());
    if (math.distance(playerPos, spotPos).distance < PlayerStore.getPlayer().get('radius')) {
      SpotService.updateSpots(SpotService.getSpots().set(spot.get('id'), spot.set('hidden', false)));
      changed = true;
    }
  });
  return Promise.resolve(changed);
}

var SpotStore = assign({}, ChangeEventEmitter, {
  hasSpots: function() {
    return SpotService.getSpots().size > 0;
  },
  getSpots: function() {
    return SpotService.getSpots();
  },
  getSpotsByName: function(name) {
    return SpotService.getSpots().filter(function(spot) {
      return spot.get('name') === name;
    });
  },
  getRevealedSpotsByName: function(name) {
    return SpotService.getSpots().filter(function(spot) {
      return spot.get('name') === name && spot.get('hidden') === false;
    });
  },
  getSpotElements: function() {
    return _spotEls;
  },
  getSpotElementById: function(id) {
    return _spotEls[id];
  },
  getSpotById: function(id) {
    return SpotService.getSpots().get(id);
  },
  getSpotPosition: function(id) {
    var $spot = this.getSpotElementById(id);
    if (!$spot) {
      return null;
    }
    var rect = $spot.get(0).getBoundingClientRect();
    return {
      x: rect.left,
      y: rect.top
    }
  }
});

SpotStore.dispatchToken = Dispatcher.register(function(action) {

  switch (action.type) {

    case Constants.SPOT_PLACED:
      _spotEls[action.spot.get('id')] = action.$el;
      break;

    case CoreConstants.CORE_CONTINUE:
      SpotService.updateSpots(Immutable.Map());
      _spotEls = {};
      SpotStore.emitChange();

      generateNewSpotPositions()
      .spread(requestPositions)
      .then(SpotService.generateSpots)
      .then(function(hasNewSpot) {
        if (hasNewSpot) SpotStore.emitChange();
      })
      .catch(handleSpotPositionError);
      break;

    case PlayerConstants.PLAYER_PLACED:
      _$player = action.$el;
      break;

    case MapConstants.OVERLAY_PROJECTION:
    case MapConstants.MAP_CENTER:
      generateNewSpotPositions()
      .spread(requestPositions)
      .then(SpotService.generateSpots)
      .then(function(hasNewSpot) {
        if (hasNewSpot) SpotStore.emitChange();
      })
      .catch(handleSpotPositionError);

      revealSpots()
      .then(function(hasZombieChanged) {
        SpotStore.emitChange();
      });

      garbageCollection();
      break;

  }

});



module.exports = SpotStore;
