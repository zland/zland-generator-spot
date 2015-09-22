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
/**
 * yes it has a stupid name
 * its responsible to remove route points
 * that are too near to each other
 */

var math = require('core/math');

var ALLOWED_DISTANCE_BETWEEN_POINTS = 200;

module.exports = {
  removeTooNearPoints: function(route, existingRoutes) {
    var existingPoint, existingRoute, i, index, j, len, len1, point, previousPoint, ref;
    ref = this.routes;
    for (i in existingRoutes) {
      existingRoute = existingRoutes[i];
      for (j in existingRoute) {
        existingPoint = existingRoute[j];
        if (!existingPoint) {
          continue;
        }
        if (route.length === 0) {
          return;
        }
        if (route.length === 2) {
          previousPoint = route[1];
        }
        for (index in route) {
          point = route[index];
          if (math.distance(point, existingPoint).distance < ALLOWED_DISTANCE_BETWEEN_POINTS) {
            route.splice(index, 1);
          }
        }
      }
    }
    if (route.length === 1) {
      route.push(previousPoint);
    }
  }
};
