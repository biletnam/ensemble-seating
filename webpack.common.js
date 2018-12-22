const webpack = require('webpack');
const path = require('path');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ScriptExtHtmlWebpackPlugin = require('script-ext-html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const WebpackPwaManifest = require('webpack-pwa-manifest');
const {GenerateSW} = require('workbox-webpack-plugin');

const packageJsonInfo = require(__dirname + '/package.json');
const APP_INFO = {
    VERSION: JSON.stringify(packageJsonInfo.version),
    NAME: JSON.stringify(packageJsonInfo.appName),
    CODENAME: JSON.stringify(packageJsonInfo.appCodename),
    DESCRIPTION: JSON.stringify(packageJsonInfo.description),
    HOMEPAGE: JSON.stringify(packageJsonInfo.homepage)
}

module.exports = {
    entry: './src/main.jsx',
    output: {
        filename: '[name].[contenthash].js',
        path: path.resolve(__dirname, 'dist')
    },
    devServer: {
        contentBase: './',
        host: '0.0.0.0'
    },
    optimization: {
        runtimeChunk: 'single',
        splitChunks: {
            cacheGroups: {
                vendor: {
                    test: /[\\/]node_modules[\\/]/,
                    name: 'vendors',
                    chunks: 'all'
                }
            }
        }
    },
    plugins: [
        new CleanWebpackPlugin('dist'),
        new MiniCssExtractPlugin({
            filename: '[name].[contenthash].css'
        }),
        new HtmlWebpackPlugin({
            template: __dirname + '/src/index.html',
            title: JSON.parse(APP_INFO.NAME),
            description: JSON.parse(APP_INFO.DESCRIPTION),
            homepage: JSON.parse(APP_INFO.HOMEPAGE),
            inject: 'head',
            meta: {
                viewport: 'width=device-width, initial-scale=1'
            }
        }),
        new ScriptExtHtmlWebpackPlugin({
            defaultAttribute: 'defer'
        }),
        new WebpackPwaManifest({
            name: JSON.parse(APP_INFO.NAME),
            short_name: 'Seating',
            description: JSON.parse(APP_INFO.DESCRIPTION),
            background_color: '#4db6ac',
            theme_color: '#4db6ac',
            start_url: '/?source=pwa',
            display: 'standalone',
            orientation: 'any',
            ios: true,
            icons: [
                {
                    src: path.resolve('src/static/logo_512.png'),
                    sizes: [192, 512]
                },
                {
                    src: path.resolve('src/static/apple-touch-icon.png'),
                    size: 180,
                    ios: true
                }
            ]
        }),
        new webpack.DefinePlugin({
            APP_INFO: APP_INFO
        }),
        new CopyWebpackPlugin([
            {
                context: './src/static/',
                from: './favicon*.{ico,png}'
            }
        ]),
        new GenerateSW({
            navigateFallback: '/'
        })
    ],
    module: {
        rules: [
            {
                test: /\.(js|jsx)$/,
                exclude: /(node_modules|bower_components)/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/env', '@babel/react']
                    }
                }
            },
            {
                test: /\.css$/,
                use: [
                    { loader: MiniCssExtractPlugin.loader },
                    { loader: 'css-loader' },
                    { loader: 'postcss-loader' }
                ]
            }
        ]
    }
};