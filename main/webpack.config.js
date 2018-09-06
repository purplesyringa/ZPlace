const path = require("path");
const webpack = require("webpack");
const UglifyJSPlugin = require("uglifyjs-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const BundleAnalyzerPlugin = require("webpack-bundle-analyzer").BundleAnalyzerPlugin;

const common = require("./webpack.common.js");

let externChunks = require("./extern-chunks").map(obj => {
	const chunk = Object.keys(obj)[0];
	return {
		chunk,
		regexp: obj[chunk]
	};
});
let chunkPlugins = [];

for(let i = 0; i < externChunks.length; i++) {
	const name = (externChunks[i + 1] || {chunk: "entry"}).chunk;
	const regexp = externChunks[i].regexp;
	chunkPlugins.push(
		new webpack.optimize.CommonsChunkPlugin({
			name,
			minChunks: module => !regexp.test(module.resource || "")
		})
	);
}

module.exports = [
	common(
		{
			main: ["babel-polyfill", "./main.js"]
		},
		[
			new HtmlWebpackPlugin({
				title: "ZPlace",
				template: "./index.html",
				seo: {
					keywords: "zeronet,place,rplace",
					description: "ZPlace (aka /r/place)"
				}
			}),
			new CopyWebpackPlugin([
				{
					from: "./dbschema.json",
					to: "./dbschema.json"
				}
			]),
			new CopyWebpackPlugin([
				{
					from: "./content.json",
					to: "./content.json"
				}
			]),
			new CopyWebpackPlugin([
				{
					from: "./p2p.json",
					to: "./p2p.json"
				}
			]),
			new CopyWebpackPlugin([
				{
					from: "./data",
					to: "./data"
				}
			]),

			new BundleAnalyzerPlugin({
				analyzerPort: 8275
			})
		].concat(chunkPlugins),
		{
			extern: false
		},
		undefined,
		path.resolve(__dirname, "./dist")
	)
];