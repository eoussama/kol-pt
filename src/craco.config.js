const MiniCssExtractPlugin = require("mini-css-extract-plugin");



module.exports = {
  webpack: {
    configure: (webpackConfig, { env, paths }) => {
      webpackConfig.plugins.forEach(plugin => {
        if (plugin instanceof MiniCssExtractPlugin) {
          plugin.options.filename = ({ chunk }) => {
            if (chunk.name === 'content') {
              return 'static/css/content.css';
            }

            return 'static/css/[name].[contenthash:8].module.css';
          };
        }
      });

      return {
        ...webpackConfig,
        entry: {
          main: [env === 'development' && require.resolve('react-dev-utils/webpackHotDevClient'), paths.appIndexJs].filter(Boolean),
          content: './src/chromeServices/content.ts',
          background: './src/chromeServices/background.ts',
        },
        output: {
          ...webpackConfig.output,
          filename: 'static/js/[name].js',
        },
        optimization: {
          ...webpackConfig.optimization,
          runtimeChunk: false
        }
      }
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
    }
  }
}