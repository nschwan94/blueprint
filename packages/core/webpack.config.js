/**
 * Copyright 2017 Palantir Technologies, Inc. All rights reserved.
 * Licensed under the terms of the LICENSE file distributed with this project.
 */

const { baseConfig, COMMON_EXTERNALS } = require("@blueprintjs/webpack-build-scripts");
const path = require("path");

module.exports = Object.assign({}, baseConfig, {
    entry: {
        "core.bundle": [
            "./src/index.ts"
        ],
    },

    externals: COMMON_EXTERNALS,

    output: {
        filename: "[name].js",
        library: ["Blueprint", "Core"],
        libraryTarget: "umd",
        path: path.resolve(__dirname, "./dist")
    },
});
