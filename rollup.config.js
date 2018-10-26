import npm from "rollup-plugin-node-resolve";

export default {
  entry: "src/evzoom.js",
  dest: "build/evzoom.dev.js",
  format: "cjs",
  moduleName: "d3",
  plugins: [npm({jsnext: true})]
};