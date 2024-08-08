// Generated using webpack-cli https://github.com/webpack/webpack-cli
const path = require('path');

const CamundaModelerWebpackPlugin = require('camunda-modeler-webpack-plugin');


module.exports = () => ({
  entry: './modelerPlugin/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',

    // './dist': 'bundle.js',
  },
  plugins: [
    new CamundaModelerWebpackPlugin()

    // Add your plugins here
    // Learn more about plugins from https://webpack.js.org/configuration/plugins/
  ],
  optimization: {
    minimize: false
  },

  module: {
    rules: [
      {
        test: /\.(?:js|mjs|cjs)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              [ '@babel/preset-env', { targets: 'defaults' } ]
            ]
          }
        }
      },
      {
        test: /\.(eot|svg|ttf|woff|woff2|png|jpg|gif)$/i,
        type: 'asset',
      },

      // Add your rules for custom modules here
      // Learn more about loaders from https://webpack.js.org/loaders/
    ],
  },
});