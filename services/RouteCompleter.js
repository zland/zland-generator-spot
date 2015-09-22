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

var DISTANCE_LIMIT_WIHIN_ROUTE = 300;

function getInsertPointsBetweenTheseTwo(p1, p2, dist) {
  var distanceBetweenPoints, i, j, newPoint, points, possiblePointsCount, previousPoint, ref;
  possiblePointsCount = Math.floor(dist / DISTANCE_LIMIT_WIHIN_ROUTE);
  if (possiblePointsCount === 0) {
    return [];
  }
  previousPoint = p1;
  distanceBetweenPoints = DISTANCE_LIMIT_WIHIN_ROUTE;
  points = [];
  for (i = j = 1, ref = possiblePointsCount; 1 <= ref ? j <= ref : j >= ref; i = 1 <= ref ? ++j : --j) {
    newPoint = math.units(math.calculateAngle(previousPoint, p2, false), DISTANCE_LIMIT_WIHIN_ROUTE);
    newPoint.x += previousPoint.x;
    newPoint.y += previousPoint.y;
    previousPoint = newPoint;
    points.push(newPoint);
    distanceBetweenPoints += DISTANCE_LIMIT_WIHIN_ROUTE;
  }
  return points;
}


var RouteCompleter = {

  complete: function(route) {
    var args, dist, index, point, points, previousPoint, routeClone, runningIndex;
    previousPoint = null;
    runningIndex = 0;
    routeClone = route.slice();
    for (index in routeClone) {
      point = routeClone[index];
      if (!previousPoint) {
        previousPoint = point;
        runningIndex++;
        continue;
      }
      dist = math.distance(point, previousPoint);
      if (dist.distance >= DISTANCE_LIMIT_WIHIN_ROUTE) {
        points = getInsertPointsBetweenTheseTwo(previousPoint, point, dist.distance);
        if (points.length) {
          args = [runningIndex, 0].concat(points);
          Array.prototype.splice.apply(route, args);
          runningIndex += points.length + 1;
        } else {
          runningIndex++;
        }
      } else {
        runningIndex++;
      }
      previousPoint = point;
    }
    return route;
  }
};

module.exports = RouteCompleter;
