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
/*
 * Webpack development server configuration
 *
 * This file is set up for serving the webpack-dev-server, which will watch for changes and recompile as required if
 * the subfolder /webpack-dev-server/ is visited. Visiting the root will not automatically reload.
 */
var webpack = require('webpack'),
    path = require('path'),
    RewirePlugin = require("rewire-webpack");

module.exports = {

  output: {
    filename: 'main.js',
    path: __dirname + '/www/build',
    publicPath: 'build/'
  },

  context: __dirname + "/www",

  cache: true,
  watch: true,
  watchDelay: 500,
  debug: true,
  devtool: 'cheap-source-map',
  entry: './test.jsx',

  stats: {
    colors: true,
    reasons: true
  },

  resolve: {
    moduleDirectories: ['node_modules'],
    extensions: ['', '.js', '.coffee', '.scss', '.css', '.json', '.jsx'],
    alias: {
      // 'styles': __dirname + '/src/styles',
      // 'mixins': __dirname + '/src/mixins',
      // 'components': __dirname + '/src/components/',
      'backbone': __dirname + '/node_modules/backbone/backbone.js',
      'underscore': __dirname + '/node_modules/underscore/underscore.js',
      'jquery': __dirname + '/node_modules/jquery/dist/jquery.js',
      bluebird: __dirname + '/node_modules/bluebird/js/browser/bluebird.min',
      'bootstrap': __dirname + '/node_modules/bootstrap',
      'fontawesome': __dirname + '/node_modules/font-awesome',
      'handlebars': __dirname + '/node_modules/handlebars/dist/handlebars',
      'moment': __dirname + '/node_modules/moment/min/moment.min',
      'jquery-translate3d': __dirname + '/node_modules/jquery-translate3d/jquery-translate3d.js',
      'whenjs': __dirname + '/node_modules/when',
      'react': __dirname + '/node_modules/react/dist/react-with-addons',
      'crypto-js': __dirname + '/node_modules/crypto-js',

      // assets
      'assets': __dirname + '/www/assets',


      // zland modules
      'core': __dirname + '/node_modules/zland-core',
      'console': __dirname + '/node_modules/zland-console',
      'crosshair': __dirname + '/node_modules/zland-crosshair',
      'game': __dirname + '/node_modules/zland-game',
      'generator': __dirname + '/node_modules/zland-generator',
      'map': __dirname,
      'player': __dirname + '/node_modules/zland-player',
      'weapon': __dirname + '/node_modules/zland-weapon',
      'zombie': __dirname + '/node_modules/zland-zombie',
      'api': __dirname + '/node_modules/zland-api',
      'stats': __dirname + '/node_modules/zland-stats',
      'auth': __dirname + '/node_modules/zland-auth',
      'sensors': __dirname + '/node_modules/zland-sensors',
      'generatorSpots': __dirname + '/node_modules/zland-generator-world-points',

      'configuration': __dirname + '/config/config'
    }
  },
  module: {
    preLoaders: [],
    loaders: [{
        test: /\.coffee$/,
        loader: "coffee-loader"
    }, {
      test: /\.css$/,
      loader: 'style-loader!css-loader'
    }, {
      test: /\.(png|jpg|woff|woff2|eot|ttf|svg).*$/,
      loader: 'url-loader?limit=8192'
    }, {
      test: /\.(json).*$/,
      loader: 'json-loader'
    }, {
      test: /\.(jsx).*$/,
      loader: 'jsx-loader'
    },

    // { test: /\.(woff|woff2).*$/, loader: "url-loader?limit=10000&mimetype=application/font-woff" },
    // { test: /\.ttf.*$/,  loader: "url-loader?limit=10000&mimetype=application/octet-stream" },
    // { test: /\.eot.*$/,  loader: "file-loader" },
    // { test: /\.svg.*$/,  loader: "url-loader?limit=10000&mimetype=image/svg+xml" },

    {
      test: /\.scss$/,
      loader: "style!css!sass?" +
          "includePaths[]=" +
            (path.resolve(__dirname, "./node_modules")) + "&" +
          "includePaths[]=" +
            __dirname
    }]
  },

  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoErrorsPlugin(),
    new webpack.ProvidePlugin({
        "bootstrap": "bootstrap",
        $: "jquery",
        jQuery: "jquery",
        "window.jQuery": "jquery",
        "Backbone": "backbone",
        "window.Backbone": "backbone",
        "_": "underscore"
    }),
    new RewirePlugin()
  ]

};
