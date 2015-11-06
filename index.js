var fs = require('fs');
var path = require('path');
var md5 = require('md5');
var named = require('named-regexp').named;

/**
 * Webpack plugin for creating an asset manifest JSON file.
 * @param {Object} options - The configuration options for plugin.
 * @param {string} options.outputFile - The full path for manifest JSON file.
 * @param {string} options.publicPath - The path for assets from the client's perspective.
 * @param {boolean} [options.noHash=false] - Use true if assets don't include a hash.
 * @param {boolean} [options.excludeSourceMaps=true] - If true manifest won't include
 *                                                     source maps.
 * @param {Object} [options.assetMatcher] - Regexp with groups for matching asset parts.
 */
var AssetManifestWebpackPlugin = function(options) {
	if (!options.outputFile) throw new Error("Output file required");
	if (!options.publicPath) throw new Error("Public path required");
	
	if (typeof options.noHash !== 'boolean') {
		options.noHash = false;
	}

	if (typeof options.excludeSourceMaps !== 'boolean') {
		options.excludeSourceMaps = true;
	}

	if (!options.assetMatcher) {
		if (options.noHash) {
			options.assetMatcher =
				/^(:<name>[\w-]+)\.(:<ext>([a-z]+\.?){1,2})$/i;
		}
		else {
			options.assetMatcher =
				/^(:<name>[\w-]+)\.(:<hash>[a-z0-9]+)\.(:<ext>([a-z]+\.?){1,2})$/i;
		}
	}

	options.assetMatcher = named(options.assetMatcher);

	this.options = options;
};

/**
 * Returns asset filename without hash. Returns false if asset is a source map and
 * option.excludeSourceMaps is true.
 * @param {string} asset - The filename for an assets from webpack.
 */
AssetManifestWebpackPlugin.prototype.unhashAsset = function(asset) {
	var assetParts = this.options.assetMatcher.exec(asset);

	if (!assetParts) {
		throw new Error("Invalid asset matcher for " + asset);
	}

	assetParts = assetParts.captures;

	if (!assetParts.name.length) {
		throw new Error("Unable to find name for " + asset);
	}
	else if (!assetParts.ext.length) {
		throw new Error("Unable to find extension for " + asset);
	}

	if (this.options.excludeSourceMaps && assetParts.ext[0].match(/\.map$/i)) {
		return false;
	}

	return [assetParts.name, assetParts.ext].join('.');
};


/**
 * Hooks into webpack and uses stats to write a manifest JSON file.
 * @param {Object} compiler - The webpack compiler object.
 */
AssetManifestWebpackPlugin.prototype.apply = function(compiler) {
	var self = this;

	compiler.plugin('done', function (stats) {
		var manifest = {
			publicPath: self.options.publicPath,
			assets: {}
		};

		var assets = stats.compilation.assets;

		Object.keys(assets).forEach(function (asset) {
			var unhashedAsset = self.unhashAsset(asset);

			if (unhashedAsset) {
				manifest.assets[unhashedAsset] = path.join(self.options.publicPath, asset);
			}
		});

		manifest.hash = md5(JSON.stringify(manifest));

		var manfiestJson = JSON.stringify(manifest, null, 2);

		fs.writeFileSync(self.options.outputFile, manfiestJson, 'utf-8');
	});
};

module.exports = AssetManifestWebpackPlugin;
