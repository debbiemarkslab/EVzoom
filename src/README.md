
# Compiling EVzoom
Note: The following is only required for development. A compiled, ready-to-run version of EVzoom is provided at dist/evzoom.js.

## Install dependencies
EVzoom is bundled and minified with the Node.js packages `rollup` and `uglifyjs`. After installing Node, these dependencies can be globally installed with

    npm install -g rollup
    npm install -g uglify-js

## Building
To build EVzoom, run

    npm install
    npm run build

This will build evzoom into dist/evzoom.js.