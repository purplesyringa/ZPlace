const path = require("path");

const BABEL = {
	loader: "babel-loader",
	options: {
		presets: ["env", "stage-0"],
		plugins: [
			"syntax-decorators",
			"transform-decorators-legacy",
			[
				"babel-plugin-transform-builtin-extend", {
					globals: ["Error", "Array"]
				}
			],
			"transform-class-properties",
			"transform-object-rest-spread"
		]
	}
};

module.exports = (entry, plugins, defs, library, outputPath) => {
	return {
		context: path.resolve(__dirname, "./src"),
		entry,
		output: {
			path: outputPath,
			publicPath: "./",
			filename: "[name].js",
			library
		},
		resolve: {
			alias: {
				"@": path.resolve(__dirname, "src")
			}
		},
		node: {
			fs: "empty",
			module: "empty",
			net: "empty"
		},
		module: {
			rules: [
				{
					test: /\.vue$/,
					loader: "vue-loader",
					options: {
						loaders: {
							scss: "vue-style-loader!css-loader!sass-loader",
							sass: "vue-style-loader!css-loader!sass-loader?indentedSyntax",
							js: BABEL
						}
					}
				},
				{
					test: /\.css$/,
					loader: "style-loader!css-loader"
				},
				{
					test: /\.s[ac]ss$/,
					loader: "style-loader!css-loader!sass-loader?indentedSyntax"
				},
				{
					test: /\.js$/,
					use: [
						BABEL,
						{
							loader: "eslint-loader"
						},
						{
							loader: "ifdef-loader",
							options: defs
						}
					],
					exclude: /node_modules|sass-compiler[\/\\].*\.exclude\.js$/
				},
				{
					test: /\.js$/,
					loader: "raw-loader",
					include: /sass-compiler[\/\\].*\.raw\.exclude\.js$/
				},
				{
					test: /\.js$/,
					use: [
						BABEL
					],
					include: /zero-dev-lib/
				},
				{
					test: /\.(gif|jpe?g|png)$/,
					loader: "file-loader"
				},
				{
					test: /\.svg$/,
					loader: "url-loader",
					options: {
						mimetype: "image/svg+xml"
					}
				},
				{
					test: /\.(ttf|otf|eot|woff2?)$/,
					loader: "file-loader?name=fonts/[name].[ext]"
				}
			]
		},
		plugins
	};
};