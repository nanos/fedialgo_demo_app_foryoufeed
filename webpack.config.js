const path = require("path");

const HtmlWebpackPlugin = require("html-webpack-plugin");
const WorkboxWebpackPlugin = require('workbox-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');


module.exports = {
    entry: "./src/index.tsx",
    output: {
        filename: "bundle.js",
        path: path.resolve(__dirname, "dist"),
        clean: true,  // Clean the cache each time we build
    },
    resolve: {
        extensions: [".tsx", ".ts", ".js"],
    },
    devtool: "inline-source-map",
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: "ts-loader",
                exclude: /node_modules/,
            },
            {
                test: /\.css$/,
                use: ["style-loader", "css-loader"],
            },
        ],
    },
    plugins: [
        new CopyPlugin({
            patterns: [
                { from: 'assets', to: '' }, // copies all files from assets to dist/
                { from: 'public', to: '' }, // copies all files from public to dist/
            ],
        }),
        new HtmlWebpackPlugin({
            template: "./src/index.html",
        }),
        new WorkboxWebpackPlugin.GenerateSW({
            clientsClaim: true,
            maximumFileSizeToCacheInBytes: 20 * 1024 * 1024,
            skipWaiting: true,
        }),
    ],
    devServer: {
        compress: true,
        port: 3000,
        historyApiFallback: true,
    },
};
