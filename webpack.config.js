const path = require("path");

const CopyPlugin = require('copy-webpack-plugin');
const Dotenv = require('dotenv-webpack');
const HtmlWebpackPlugin = require("html-webpack-plugin");
const ReactRefreshTypeScript = require('react-refresh-typescript');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');
const WorkboxWebpackPlugin = require('workbox-webpack-plugin');

const isDevelopment = process.env.NODE_ENV !== 'production';
const envMsg = `* [WEBPACK] process.env.NODE_ENV: ${process.env.NODE_ENV} *`;
console.log(`${'*'.repeat(envMsg.length)}\n${envMsg}\n${'*'.repeat(envMsg.length)}`);
console.log(`\nprocess.env.DEBUG: ${process.env.DEBUG}\n\n`);


module.exports = {
    entry: "./src/index.tsx",
    output: {
        clean: true,  // Clean the cache each time we build
        filename: "bundle.js",
        path: path.resolve(__dirname, "dist"),
    },
    resolve: {
        extensions: [".js", ".json", ".tsx", ".ts"],
    },
    devtool: "inline-source-map",
    mode: isDevelopment ? 'development' : 'production',

    module: {
        rules: [
            {
                test: /\.[jt]sx?$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: require.resolve('ts-loader'),
                        options: {
                            getCustomTransformers: () => ({
                                before: [isDevelopment && ReactRefreshTypeScript()].filter(Boolean),
                            }),
                            transpileOnly: isDevelopment,
                        },
                    },
                ],
            },
            {
                test: /\.css$/,
                use: ["style-loader", "css-loader"],
            },
        ],
    },

    plugins: [
        isDevelopment && new ReactRefreshWebpackPlugin(),
        new CopyPlugin({
            patterns: [
                { from: 'assets', to: '' }, // copies all files from assets to dist/
                { from: 'public', to: '' }, // copies all files from public to dist/
            ],
        }),
        new Dotenv(),
        new HtmlWebpackPlugin({
            template: "./src/index.html",
        }),
        new WorkboxWebpackPlugin.GenerateSW({
            // WorkboxWebpackPlugin docs: https://developer.chrome.com/docs/workbox/modules/workbox-webpack-plugin/
            clientsClaim: true,
            maximumFileSizeToCacheInBytes: 20 * 1024 * 1024,
            skipWaiting: true,
        }),
    ].filter(Boolean),

    devServer: {
        compress: true,
        historyApiFallback: true,
        hot: true,
        port: 3000,
    },
};
