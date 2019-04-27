const merge = require('webpack-merge');
const common = require('./webpack.common.js');
const TerserPlugin = require('terser-webpack-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const HtmlWebpackIncludeAssetsPlugin = require('html-webpack-include-assets-plugin');

const externalAttributes = {
    crossorigin: true
};

module.exports = merge(common, {
    mode: 'production',
    devServer: {
        compress: true
    },
    devtool: 'source-map',
    externals: {
        "react": "React",
        "react-dom": "ReactDOM",
        "react-beautiful-dnd": 'ReactBeautifulDnd',
        'workbox-window': 'window.workbox'
    },
    plugins: [
        new HtmlWebpackIncludeAssetsPlugin({
            assets: [
                {
                    path: 'https://unpkg.com/react@16.8.6/umd/react.production.min.js',
                    attributes: externalAttributes
                },
                {
                    path: 'https://unpkg.com/react-dom@16.8.6/umd/react-dom.production.min.js',
                    attributes: externalAttributes
                },
                {
                    path: 'https://unpkg.com/react-beautiful-dnd@11.0.1/dist/react-beautiful-dnd.min.js',
                    attributes: externalAttributes
                },
                {
                    path: 'https://unpkg.com/workbox-window@4.3.0/build/workbox-window.prod.umd.js',
                    attributes: externalAttributes
                }
            ],
            append: false
        })
    ],
    optimization: {
        minimizer: [
            new TerserPlugin({
                cache: true,
                parallel: true,
                sourceMap: true,
                terserOptions: {
                    output: {
                        comments: false
                    }
                }
            }),
            new OptimizeCSSAssetsPlugin()
        ]
    }
});
