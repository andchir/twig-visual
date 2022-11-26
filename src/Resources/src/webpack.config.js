var Encore = require('@symfony/webpack-encore');

Encore
    .setOutputPath('../public/dist')
    .setPublicPath('.')
    .setManifestKeyPrefix('twigvisual_build')
    .addEntry('twigvisual.min', './index.js')
    .addStyleEntry('twigvisual_styles.min', [
        '../src/node_modules/animate.css/animate.css',
        '../public/css/twigvisual.css'
    ])
    .cleanupOutputBeforeBuild()
    .enableSourceMaps(!Encore.isProduction())
    .disableSingleRuntimeChunk();

module.exports = Encore.getWebpackConfig();
