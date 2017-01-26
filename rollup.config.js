import npm from "rollup-plugin-node-resolve";

export default {
  entry: "src/evzoom.js",
  dest: "build/evzoom.dev.js",
  format: "umd",
  moduleName: "d3",
  plugins: [npm({jsnext: true})]
};