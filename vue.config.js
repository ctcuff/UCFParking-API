const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const webpack = require('webpack');

module.exports = {
  outputDir: 'api/dist',
  // Relative to outpuDir
  assetsDir: 'static',
  productionSourceMap: false,
  configureWebpack: {
    plugins: [
      // Prevents moment from loading unnecessary
      // locales that increase build size
      new webpack.ContextReplacementPlugin(/moment[\/\\]locale$/, /en/),
      // new BundleAnalyzerPlugin(),
    ]
  }
};
