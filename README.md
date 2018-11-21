# EVzoom
Take it for a spin @ https://debbiemarkslab.github.io/EVzoom/

[EVzoom](https://marks.hms.harvard.edu/evzoom/) is an interactive, embeddable tool for visualizing [undirected graphical models](https://en.wikipedia.org/wiki/Markov_random_field) of protein families. Since these models explicitly parameterize all possible combinations of amino acids at all pairs of positions in a sequence, they contain far too much information to depict statically.

EVzoom lets you zoom in on any pair of positions in a protein family and see both inferred couplings between amino acids and [sequence logos](https://en.wikipedia.org/wiki/Sequence_logo) that summarize conservation statistics.
<p align="center"><img src="https://marks.hms.harvard.edu/evzoom/evzoom.gif" width="500"></p>

EVzoom is based on SVG and powered by [D3](https://d3js.org/).

## Inference
EVzoom is designed to be used with models inferred by [plmc](https://github.com/debbiemarkslab/plmc). The [examples](https://github.com/debbiemarkslab/plmc#examples) in the plmc repo show how to export JSON-formatted model files for EVzoom.

Want to work directly with the couplings in an EVzoom visualization? Check out the [EVmutation](https://github.com/debbiemarkslab/EVmutation) Python package written by Thomas Hopf.

## Embedding
Embedding EVzoom takes two lines

```html
<div id="evzoom-viewer" data-couplings="/data/dhfr.json"> </div>
<script src="dist/evzoom.js"></script>
```

The `data-couplings` tag specifies the URL for the json file. This tag can be overridden by appending a query string `?data=JSON_URL` to the URL. An example of the tag-based approach is available in `example/evzoom.html`. To take it for a spin and serve it from your filesystem, run `python -m SimpleHTTPServer 8000` in the root of the repository (requires Python 2.7) and navigate to `localhost:8000/example/evzoom.html` in your browser.

## Author
EVzoom was written by [John Ingraham](mailto:john.ingraham@gmail.com) in [Debora Marks' lab](https://marks.hms.harvard.edu/) at Harvard Medical School
