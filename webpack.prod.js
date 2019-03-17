const merge = require('webpack-merge');
const common = require('./webpack.common.js');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
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
        "react-beautiful-dnd": 'ReactBeautifulDnd'
    },
    plugins: [
        new HtmlWebpackIncludeAssetsPlugin({
            assets: [
                {
                    path: 'https://unpkg.com/react@16.8.4/umd/react.production.min.js',
                    attributes: externalAttributes
                },
                {
                    path: 'https://unpkg.com/react-dom@16.8.4/umd/react-dom.production.min.js',
                    attributes: externalAttributes
                },
                {
                    path: 'https://unpkg.com/react-beautiful-dnd@10.1.0/dist/react-beautiful-dnd.min.js',
                    attributes: externalAttributes
                }
            ],
            append: false
        })
    ],
    optimization: {
        minimizer: [
            new UglifyJsPlugin({
                cache: true,
                parallel: true,
                sourceMap: true,
                uglifyOptions: {
                    output: {
                        comments: false
                    }
                }
            }),
            new OptimizeCSSAssetsPlugin()
        ]
    }
});
