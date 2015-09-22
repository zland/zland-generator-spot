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

var math = require('core/math');
var mapCalculate = require('core/mapCalculate');
var _ = require('underscore');

var X_POSITION_DISTANCE = 150;
var Y_POSITION_DISTANCE = 200;
var DISTANCE_LIMIT = 350;


function calcPositions(angle, point, limit) {
  var distance, positions, step, steps;
  positions = [];
  steps = math.vectorUnits(angle, X_POSITION_DISTANCE);
  step = _.clone(point);
  distance = X_POSITION_DISTANCE;
  while (distance < limit) {
    step.x += steps.x;
    step.y += steps.y;
    positions.push({
      x: step.x,
      y: step.y
    });
    distance += X_POSITION_DISTANCE;
  }
  return positions;
}


var PointCalculator = {
  calculate: function(position, heading) {
    var angle, halfHeight, p, positions = [], topPoint;

    heading = heading || 0;

    angle = -90 + heading;
    halfHeight = mapCalculate.getHeight() / 2;
    topPoint = _.clone(position);
    p = math.vectorUnits(angle, halfHeight - DISTANCE_LIMIT / 2);

    topPoint.x += p.x;
    topPoint.y += p.y;
    positions.push(topPoint);

    // points to the left
    angle -= 90;
    positions = positions.concat(calcPositions(angle, topPoint, halfHeight));

    // points to the right
    angle += 180;
    positions = positions.concat(calcPositions(angle, topPoint, halfHeight));

    return positions;
  },

  calculateInitialPositions: function() {
    var centerX, centerY, distX, distY, east, north, south, west, windowHeight, windowWidth;
    centerX = mapCalculate.getWidth() / 2;
    centerY = mapCalculate.getHeight() / 2;
    windowHeight = $(window).height();
    windowWidth = $(window).width();
    distX = (windowWidth / 2) * 0.75;
    distY = (windowHeight / 2) * 0.75;
    north = {
      x: centerX,
      y: centerY - distY
    };
    south = {
      x: centerX,
      y: centerY + distY
    };
    east = {
      x: centerX + distX,
      y: centerY
    };
    west = {
      x: centerX - distX,
      y: centerY
    };
    return [north, south, east, west];
  }
};

module.exports = PointCalculator;
