# Asset Manifest Webpack Plugin

Webpack plugin for creating an asset manifest

## Installation

    npm i --save-dev asset-manifest-webpack-plugin

## Usage

Example Webpack configuration:

    var Webpack = require('webpack');
    var AssetManifestPlugin = require('asset-manifest-webpack-plugin');
    var Path = require('path');

    var assetsPath = Path.join(__dirname, 'src/assets');

    var webpackConfig = {
      resolve: {
        extensions: ['', '.js']
      },
      entry: {
        app: Path.join(assetsPath, 'app.js')
      },
      output: {
        path: Path.join(__dirname, 'public/assets'),
        publicPath: '/assets/',
        filename: '[name].[chunkhash].js'
      },
      module: {
        loaders: [{
          test: /\.js$/,
          exclude: /node_modules/,
          loader: 'babel-loader'
        }]
      },
      plugins: [
        new AssetManifestPlugin({
          outputFile: Path.join(assetsPath, 'manifest.json'),
          publicPath: '/assets/'
        })
      ]
    };

    module.exports = webpackConfig;

Example template helper:

    import Handlebars from 'handlebars';
    import manifest from './manifest';

    Handlebars.registerHelper('asset', (filename) => {
      const asset = manifest.assets[filename];

      if (!asset) {
        throw new Error(`Unable to find ${filename} in asset manifest`);
      }

      return asset;
    });
