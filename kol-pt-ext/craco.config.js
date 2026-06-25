const MiniCssExtractPlugin = require("mini-css-extract-plugin");



module.exports = {
  webpack: {
    /**
     * @description
     * Configures webpack for the extension build
     *
     * @param webpackConfig - The base webpack configuration
     * @param root0 - The environment and paths object
     * @param root0.env - The current environment
     * @param root0.paths - The project paths
     * @returns The modified webpack configuration
     */
    configure: (webpackConfig, { env, paths }) => {
      webpackConfig.plugins.forEach((plugin) => {
        if (plugin instanceof MiniCssExtractPlugin) {
          plugin.options.filename = ({ chunk }) => {
            if (chunk.name === "content") {
              return "static/css/content.css";
            }

            return "static/css/[name].[contenthash:8].module.css";
          };
        }
      });

      return {
        ...webpackConfig,
        entry: {
          main: [env === "development" && require.resolve("react-dev-utils/webpackHotDevClient"), paths.appIndexJs].filter(Boolean),
          background: "./src/services/background.service.ts",
          content: "./src/services/content.service.ts",
        },
        output: {
          ...webpackConfig.output,
          filename: "static/js/[name].js",
        },
        optimization: {
          ...webpackConfig.optimization,
          runtimeChunk: false,
        },
      };
    },
    resolve: {
      extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
    },
  },
};
