const webpack = require('webpack') // eslint-disable-line node/no-unpublished-require

const babelrc = require('./.babelrc.json')
const { version } = require('./package.json')

module.exports = {
  entry: {
    Account: './src',
  },
  output: {
    filename: './dist/account.js',
    libraryTarget: 'umd',
    library: '[name]',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules\/(?!debug)/,
        use: {
          loader: 'babel-loader',
          options: babelrc.env.umd,
        },
      },
    ],
  },
  plugins: [
    new webpack.DefinePlugin({
      __VERSION__: JSON.stringify(version),
    }),
  ],
  target: 'web',
}
