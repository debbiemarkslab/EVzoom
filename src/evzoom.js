/**
 * @file evzoom
 * @private
 * @author John Ingraham <john.ingraham@gmail.com>
 */

import * as d3 from "d3";

// Utility functions
function dist(xi, yi, xj, yj) { return Math.sqrt((xi - xj) * (xi - xj) + (yi - yj) * (yi - yj)); }

// Monospace from Google Fonts for Logo text
d3.select("body")
    .append("link")
    .attr("href", "https://fonts.googleapis.com/css?family=Inconsolata")
    .attr("rel", "stylesheet");

var EVzoom = {
    svg: {
        height: 650,
        width: 650
    },
    axis: {
        left: 70,
        right: 520,
        top: 100,
        bottom: 550,
        color: "white"
    },
    grid: {
        spacing: 10,
        lineWidth: 0.5,
        color: "#D0D0D0",
        crosshairs: {
            opacity: 0.06,
            color: "gray",
            label: {
                font: "sans-serif",
                fontSize: "10px",
                padX: 4,
                padY: 11,
                duration: 200
            }
        }
    },
    shadow: {
        dx: 5,
        dy: 5,
        std: 8,
        scale: 0.2
    },
    legend: {
        left: 70,
        right: 520,
        top: 565,
        bottom: 590,
        rx: 10,
        ry: 10,
        padX: 15,
        padY: 5,
        fill: "none",
        stroke: "none",
        font: "sans-serif",
        fontSize: "10px",
        rows: 2,
        columns: 7,
        glyph: {
            width: 6,
            height: 6,
            textX: 5,
            textY: 3.5,
            content: [
                {idx: 0, label: "Positive", group: "positive"},
                {idx: 1, label: "Polar -OH", group: "hydroxyl"},
                {idx: 2, label: "Hydrophobic", group: "hydrophobic"},
                {idx: 3, label: "Cysteine", group: "cysteine"},
                {idx: 7, label: "Negative", group: "negative"},
                {idx: 8, label: "Polar -CON", group: "amide"},
                {idx: 9, label: "Aromatic", group: "aromatic"}
            ]
        },
        magnitude: {
            idx: 4,
            textX: 13,
            textY: 3.5,
            shiftX: 43,
            offsets: [-27, -16, -7, 0, 5],
            radii: [6, 5, 4, 3, 2]
        },
        cmap: {
            idx: 11,
            leftX: -25,
            leftY: 3.5,
            rightX: 26,
            rightY: 3.5,
            shiftX: 30,
            height: 6,
            width: 42,
            blocks: 7
        }
    },
    logo: {
        data: [],
        font: ["Inconsolata", "sans-serif"],
        height: 25,
        fontScale: 0.2,
        bitScale: 4,
        opacity: 1.0,
        pad: 2,
        axis: {
            pad: 2,
            max: Math.log2(20),
            majorTicks: [0, 1, 2, 3, 4],
            minorTicks: [0.5, 1.5, 2.5],
            majorLength: 2.5,
            minorLength: 1,
            textX: -6,
            stroke: "black",
            strokeWidth: 0.5
        },
        zoom: {
            height: 60,
            lift: 40,
            width: 150,
            radius: 5,
            fontScale: 1.5,
            duration: 100,
            destroyDuration: 150,
            delay: 0,
            opacity: 0,
            easeFun: d3.easeCubic,
            underline: {
                color: "gray",
                width: 0.5,
                pad: 2.5,
                notchRadius: 2.5,
                notchHeight: 3,
                duration: 300,
                delay: 75
            }
        }
    },
    couplings: {
        data: [],
        fill: "#B8B8B8",
        highlight: "gray",
        matchColor: "white",
        stroke: "white",
        strokeWidth: 0.5,
        maxRadius: 3.5
    },
    times: {
        globalTick: 10,
        destroyDuration: 0,
        buildDuration: 300,
        matchedTimeThreshold: 150
    },
    matrix: {
        x: 335,
        y: 650,
        cellSize: 15,
        opacity: 0.8,
        gridColor: "#D0D0D0",
        gridWidth: 0.5,
        textUp: 2,
        textOver: 2.5,
        font: "Inconsolata",
        fontSize: "20px",
        background: {
            fill: "white",
            stroke: "#D0D0D0",
            strokeWidth: 0.5,
            padRight: 19,
            padTop: 19,
            padLeft: 5,
            padBottom: 5,
            opacity: 0.8
        },
        cscale: d3.scaleLinear().domain([-1, 0, 1]).range(["#3A2CB1", "white", "#FFCF22"]) // Purple and gold FFE83F
    },
    state: {
        viewerLoaded: 0,
        x: 0,
        y: 0,
        i: 0,
        j: 0,
        iOld: 0,
        jOld: 0,
        focus: -1,
        zoomBuilt: 0,
        matchedTime: 0,
        matchedBuilt: 0
    }
};

EVzoom.aaGroups = { ".":"gr", "-":"gr", "G":"hydrophobic", "A":"hydrophobic", "I":"hydrophobic", "V":"hydrophobic",
    "L":"hydrophobic", "M":"hydrophobic", "F":"aromatic", "Y":"aromatic", "W":"aromatic", "H":"positive",
    "C":"cysteine", "P":"hydrophobic", "K":"positive", "R":"positive", "D":"negative", "E":"negative",
    "Q":"amide", "N":"amide", "S":"hydroxyl", "T":"hydroxyl"};
// Color scheme from MSAviewer.org
EVzoom.groupColors = {hydrophobic:"#33cc00", aromatic:"#009900", cysteine:"#ffff00", positive:"#cc0000",
    negative:"#0033ff", amide:"#6600cc", hydroxyl:"#0099ff"};
// Color scheme 1
EVzoom.groupColors = {hydrophobic:"#FFC107", aromatic:"#FF9800", cysteine:"#8BC34A", positive:"#FF4081",
    negative:"#448AFF", amide:"#5E35B1", hydroxyl:"#673AB7"};
// Color scheme 2
EVzoom.groupColors = {hydrophobic:"#E0E0E0", aromatic:"#BDBDBD", cysteine:"#FFC107", positive:"#FF4081",
    negative:"#448AFF", amide:"#7C4DFF", hydroxyl:"#7C4DFF"};
// Color scheme 3
EVzoom.aaGroups = { ".":"gr", "-":"gr", "G":"hydrophobic", "A":"hydrophobic", "I":"hydrophobic", "V":"hydrophobic",
    "L":"hydrophobic", "M":"hydrophobic", "F":"aromatic", "Y":"aromatic", "W":"aromatic", "H":"positive",
    "C":"cysteine", "P":"hydrophobic", "K":"positive", "R":"positive", "D":"negative", "E":"negative",
    "Q":"polar", "N":"polar", "S":"polar", "T":"polar"};
EVzoom.groupColors = {hydrophobic:"#D0D0D0", aromatic:"#888888", cysteine:"#8BC34A", positive:"#F61C76",
    negative:"#03A9F4", polar:"#1565C0"};
// Color scheme 4
EVzoom.groupColors = {hydrophobic:"#B0B0B0", aromatic:"#707070", cysteine:"#8BC34A", positive:"#F61C76",
    negative:"#03A9F4", polar:"#1565C0"};
// Color scheme 4
EVzoom.groupColors = {hydrophobic:"#888888", aromatic:"#404040", cysteine:"#9E9D24", positive:"#F61C76",
    negative:"#03A9F4", polar:"#1565C0"};
EVzoom.legend.glyph.content = [
    {idx: 0, label: "Positive", group: "positive"},
    {idx: 1, label: "Polar", group: "polar"},
    {idx: 2, label: "Hydrophobic", group: "hydrophobic"},
    {idx: 8, label: "Cysteine", group: "cysteine"},
    {idx: 7, label: "Negative", group: "negative"},
    {idx: 9, label: "Aromatic", group: "aromatic"}
];

// Functions for the coordinate system
EVzoom.plotWidth = function() { return EVzoom.axis.right - EVzoom.axis.left; };
EVzoom.plotHeight = function() { return EVzoom.axis.bottom - EVzoom.axis.top; };
EVzoom.iToX = function(i) { return EVzoom.axis.left + i * (EVzoom.axis.right - EVzoom.axis.left) / EVzoom.logo.data.length; };
EVzoom.jToY = function(j) { return EVzoom.axis.top + j * (EVzoom.axis.bottom - EVzoom.axis.top) / EVzoom.logo.data.length; };
EVzoom.focusLength = function(d) { return d * (EVzoom.axis.right - EVzoom.axis.left) / EVzoom.logo.data.length; };
EVzoom.barWidth = function() { return (EVzoom.axis.right - EVzoom.axis.left) / EVzoom.logo.data.length; };
EVzoom.radiusFun = function(r) { return  EVzoom.couplings.maxRadius * Math.sqrt(r);}

EVzoom.tick = function() {
    // Timer for counting things
    var coordsChanged = ((EVzoom.state.i !== EVzoom.state.iOld) || (EVzoom.state.j !== EVzoom.state.jOld));
    if (EVzoom.state.viewerLoaded > 0) {
        if (EVzoom.state.matchedBuilt === 0 && !coordsChanged) {
            EVzoom.state.matchedTime += EVzoom.times.globalTick;
        } else {
            EVzoom.state.matchedTime = 0;
        }
    }

    var matchedDelay = EVzoom.state.matchedTime - EVzoom.times.matchedTimeThreshold;
    if (matchedDelay > 0 && matchedDelay < EVzoom.times.globalTick) EVzoom.update();
}

EVzoom.update = function() {
    var couplings = EVzoom.couplings.data;
    var logo = EVzoom.logo.data;

    // State changes since last tick
    var onPlot = EVzoom.state.y > EVzoom.axis.top && EVzoom.state.y < EVzoom.axis.bottom
        && EVzoom.state.x > EVzoom.axis.left && EVzoom.state.x < EVzoom.axis.right;
    var coordsChanged = ((EVzoom.state.i !== EVzoom.state.iOld) || (EVzoom.state.j !== EVzoom.state.jOld));
    var delayOver = EVzoom.state.matchedTime > EVzoom.times.matchedTimeThreshold;

    if (EVzoom.state.viewerLoaded > 0 && (coordsChanged || (delayOver && EVzoom.state.matchedBuilt === 0))) {
        // Matrix drawing
        if (onPlot && (((EVzoom.state.matchedBuilt === 0) && delayOver)
            || ((EVzoom.state.matchedBuilt === 1) && coordsChanged))) {
            EVzoom.state.matchedBuilt = 1;
            // Test if currently focused on contact
            var match = -1;
            for (var c = 0; c < couplings.length; c++) {
                if ((couplings[c].i - 1 === EVzoom.state.i) && (couplings[c].j - 1 === EVzoom.state.j)) match = c;
            }

            // Destroy if we find something new or we get too far
            var focusDist = 0;
            if (EVzoom.state.focus >= 0) {
                focusDist = dist(EVzoom.state.i, EVzoom.state.j, couplings[EVzoom.state.focus].i - 1, couplings[EVzoom.state.focus].j - 1)
                    - EVzoom.radiusFun(couplings[EVzoom.state.focus].score);
            }
            if (focusDist > EVzoom.logo.zoom.radius) {
                d3.selectAll("#legendCmap")
                    .transition()
                    .attr("opacity", 0)
                    .delay(0)
                    .duration(EVzoom.times.destroyDuration);
                d3.select("#matrixBG")
                    .transition()
                    .attr("opacity", 0)
                    .delay(0)
                    .duration(EVzoom.times.buildDuration);
                for (var i = 0; i < 20; i++) {
                    for (var j = 0; j < 20; j++) {
                        d3.select("#" + "disp" + i + "-" + j)
                            .transition()
                            .style("opacity", 0)
                            .delay(0)
                            .duration(EVzoom.times.destroyDuration);
                        d3.select("#" + "biC" + i)
                            .transition()
                            .style("opacity", 0)
                            .delay(0)
                            .duration(EVzoom.times.destroyDuration);
                        d3.select("#" + "bjC" + j)
                            .transition()
                            .style("opacity", 0)
                            .delay(0)
                            .duration(EVzoom.times.destroyDuration);
                    }
                }
                EVzoom.state.focus = -1;
                EVzoom.state.matchedBuilt = 0;
                EVzoom.state.matchedTime = 0;
            }

            //======================== Begin Display Widget ==========================\
            // Expand matrix at new match
            if ((match >= 0) && (match !== EVzoom.state.focus)) {
                // console.log("Zooming at " + (EVzoom.state.i + 1) + ", " + (EVzoom.state.j + 1))
                // Destroy old
                for (var i = 0; i < 20; i++) {
                    for (var j = 0; j < 20; j++) {
                        EVzoom.matrix.nodes.cells[i][j]
                            .transition()
                            .style("opacity", 0)
                            .delay(0)
                            .duration(EVzoom.times.destroyDuration);
                        EVzoom.matrix.nodes.iLabels[i]
                            .transition()
                            .style("opacity", 0);
                        EVzoom.matrix.nodes.jLabels[j]
                            .transition()
                            .style("opacity", 0);
                    }
                }
                // Build new
                var ix = EVzoom.state.i + 1;
                var jx = EVzoom.state.j + 1;
                EVzoom.couplings.nodes.circles[match]
                    .transition()
                    .attr("fill", EVzoom.couplings.fill)
                    .delay(0)
                    .duration(EVzoom.times.buildDuration);

                // Move display widget
                var subX = EVzoom.iToX(EVzoom.state.i) + EVzoom.matrix.background.padLeft;
                var subY = EVzoom.jToY(EVzoom.state.j) + EVzoom.matrix.background.padTop;
                var matWidth = couplings[match].matrix.length * EVzoom.matrix.cellSize
                    + EVzoom.matrix.background.padRight + EVzoom.matrix.background.padLeft;
                var matHeight = couplings[match].matrix[0].length * EVzoom.matrix.cellSize
                    + EVzoom.matrix.background.padTop + EVzoom.matrix.background.padBottom;
                // Background
                d3.selectAll("#legendCmap")
                    .transition()
                    .attr("opacity", 1)
                    .delay(EVzoom.times.destroyDuration)
                    .duration(EVzoom.times.buildDuration);
                d3.select("#matrixBG")
                    .attr("x", subX - EVzoom.matrix.background.padLeft)
                    .attr("y", subY - EVzoom.matrix.background.padTop)
                    .attr("width", 0)
                    .attr("height", 0);
                d3.select("#matrixBG")
                    .transition()
                    .attr("width", matWidth)
                    .attr("height", matHeight)
                    .attr("opacity", EVzoom.matrix.background.opacity)
                    .delay(EVzoom.times.destroyDuration)
                    .duration(EVzoom.times.buildDuration);
                // Matrix
                for (var i = 0; i < couplings[match].matrix.length; i++) {
                    for (var j = 0; j < couplings[match].matrix[i].length; j++) {
                        EVzoom.matrix.nodes.cells[i][j]
                            .style("opacity", 0)
                            .attr("x", subX)
                            .attr("y", subY)
                            .attr("width", 0)
                            .attr("height", 0);
                        EVzoom.matrix.nodes.cells[i][j]
                            .transition()
                            .style("opacity", EVzoom.matrix.opacity)
                            .style("stroke", EVzoom.matrix.gridColor)
                            .style("stroke-width", EVzoom.matrix.gridWidth)
                            .style("fill", EVzoom.matrix.cscale(couplings[match].matrix[i][j]))
                            .attr("x", subX + i * EVzoom.matrix.cellSize)
                            .attr("y", subY + j * EVzoom.matrix.cellSize)
                            .attr("width", EVzoom.matrix.cellSize)
                            .attr("height", EVzoom.matrix.cellSize)
                            .delay(EVzoom.times.destroyDuration)
                            .duration(EVzoom.times.buildDuration);
                        // Text move
                        var xshift = subX + i * EVzoom.matrix.cellSize + EVzoom.matrix.textOver;
                        var yshift = subY - EVzoom.matrix.textUp;
                        EVzoom.matrix.nodes.iLabels[i]
                            .attr("transform", "translate(" + xshift +  "," + yshift + ")")
                            .text(couplings[match].iC[i])
                            .transition()
                            .style("fill", EVzoom.groupColors[EVzoom.aaGroups[couplings[match].iC[i]]])
                            .style("opacity", 1)
                            .delay(EVzoom.times.destroyDuration)
                            .duration(EVzoom.times.buildDuration);
                        xshift = subX + couplings[match].matrix.length * EVzoom.matrix.cellSize + EVzoom.matrix.textUp;
                        yshift = subY + j * EVzoom.matrix.cellSize + EVzoom.matrix.textOver;
                        EVzoom.matrix.nodes.jLabels[j]
                            .text(couplings[match].jC[j])
                            .attr("transform", "translate(" + xshift +  "," + yshift + ") rotate(90)")
                            .transition()
                            .style("fill", EVzoom.groupColors[EVzoom.aaGroups[couplings[match].jC[j]]])
                            .style("opacity", 1)
                            .delay(EVzoom.times.destroyDuration)
                            .duration(EVzoom.times.buildDuration);
                    }
                }
                EVzoom.state.focus = match;
            }
        }
        //========================= End Display Widget ===========================


        if (coordsChanged) {
            // Move the crosshairs if on the grid
            if ((EVzoom.state.zoomBuilt === 1) && onPlot)  {
                var starti = Math.max(0, EVzoom.state.i - EVzoom.logo.zoom.radius);
                var stopi = Math.min(logo.length - 1, EVzoom.state.i + EVzoom.logo.zoom.radius);
                var startj = Math.max(0, EVzoom.state.j - EVzoom.logo.zoom.radius);
                var stopj = Math.min(logo.length - 1, EVzoom.state.j + EVzoom.logo.zoom.radius);
                d3.select("#wVert")
                    .attr("x", EVzoom.iToX(starti))
                    .attr("width", EVzoom.jToY(stopi) - EVzoom.jToY(starti))
                    .attr("opacity", EVzoom.grid.crosshairs.opacity);
                d3.select("#wHoriz")
                    .attr("y", EVzoom.jToY(startj))
                    .attr("height", EVzoom.jToY(stopj) - EVzoom.jToY(startj))
                    .attr("opacity", EVzoom.grid.crosshairs.opacity);
                // Label the vertical axis (horizontal crosshair)
                var jString = EVzoom.map.indices[EVzoom.state.j].toString();
                if (EVzoom.map.letters[EVzoom.state.j] !== "-") {
                    jString += " " + EVzoom.map.letters[EVzoom.state.j].toString();
                }
                d3.select("#vZoomIndex")
                    .attr("x", EVzoom.axis.left - EVzoom.grid.crosshairs.label.padX)
                    .attr("y", EVzoom.jToY(EVzoom.state.j))
                    .attr("opacity", 1)
                    .text(jString);
                // Label the horizontal axis (vertical crosshair)
                var iString = EVzoom.map.indices[EVzoom.state.i].toString();
                if (EVzoom.map.letters[EVzoom.state.i] !== "-") {
                    iString += " " + EVzoom.map.letters[EVzoom.state.i].toString();
                }
                d3.select("#hZoomIndex")
                    .attr("x", EVzoom.iToX(EVzoom.state.i))
                    .attr("y", EVzoom.axis.bottom + EVzoom.grid.crosshairs.label.padY)
                    .attr("opacity", 1)
                    .text(iString);
            } else {
                // Hide if off
                d3.select("#wVert")
                    .attr("opacity", 0);
                d3.select("#wHoriz")
                    .attr("opacity", 0);
                d3.select("#vZoomIndex")
                    .transition()
                    .attr("opacity", 0)
                    .duration(EVzoom.grid.crosshairs.label.duration)
                    .delay(0);
                d3.select("#hZoomIndex")
                    .transition()
                    .attr("opacity", 0)
                    .duration(EVzoom.grid.crosshairs.label.duration)
                    .delay(0);
            }

            // Highlight the relevant couplings
            for (var c = 0; c < couplings.length; c++) {
                if (onPlot &&
                    ((couplings[c].i - 1 >= EVzoom.state.i - EVzoom.logo.zoom.radius && couplings[c].i - 1 <= EVzoom.state.i + EVzoom.logo.zoom.radius) ||
                        (couplings[c].j - 1 >= EVzoom.state.j - EVzoom.logo.zoom.radius && couplings[c].j - 1 <= EVzoom.state.j + EVzoom.logo.zoom.radius))) {
                    EVzoom.couplings.nodes.circles[c]
                        .attr("fill", EVzoom.couplings.highlight);
                } else {
                    EVzoom.couplings.nodes.circles[c]
                        .attr("fill", EVzoom.couplings.fill);
                }
            }
        }

        if ((EVzoom.state.zoomBuilt === 1) && !onPlot) {
            // Contract Horizontal
            var starti = Math.max(0, EVzoom.state.iOld - EVzoom.logo.zoom.radius);
            var stopi = Math.min(logo.length - 1, EVzoom.state.iOld + EVzoom.logo.zoom.radius);
            for (var i = starti; i <= stopi; i++) {
                var cumulative = 0;
                for (var j = 0; j < logo[i].length; j++) {
                    var xshift = EVzoom.iToX(i);
                    var yshift = EVzoom.axis.top - EVzoom.logo.pad - cumulative;
                    var scale = logo[i][j].bits / EVzoom.logo.bitScale;
                    var blockHeight = (logo[i][j].bits /  EVzoom.logo.bitScale) * EVzoom.logo.height;
                    // Transition letters
                    EVzoom.logo.nodes.hLetters[i][j]
                        .transition()
                        .attr("transform", "translate(" + xshift +  "," + yshift + ") rotate(0) scale(" + EVzoom.logo.fontScale + "," + scale + ")")
                        .attr("opacity",  0)
                        .duration(EVzoom.logo.zoom.destroyDuration)
                        .delay(EVzoom.logo.zoom.delay);
                    // Transition blocks
                    EVzoom.logo.nodes.hBlocks[i][j]
                        .transition()
                        .attr("opacity", EVzoom.logo.opacity)
                        .attr("x", xshift)
                        .attr("y", yshift - blockHeight)
                        .attr("width", EVzoom.barWidth())
                        .attr("height", blockHeight)
                        .duration(EVzoom.logo.zoom.destroyDuration)
                        .delay(EVzoom.logo.zoom.delay);
                    cumulative = cumulative + blockHeight;
                }
            }
            // Contract Vertical
            starti = Math.max(0, EVzoom.state.jOld - EVzoom.logo.zoom.radius);
            stopi = Math.min(logo.length - 1, EVzoom.state.jOld + EVzoom.logo.zoom.radius);
            for (var i = 0; i < logo.length; i++) {
                var cumulative = 0;
                for (var j = 0; j < logo[i].length; j++) {
                    var yshift = EVzoom.jToY(i);
                    var xshift = EVzoom.axis.right + EVzoom.logo.pad + cumulative;
                    var scale = logo[i][j].bits / EVzoom.logo.bitScale;
                    var blockHeight = (logo[i][j].bits / EVzoom.logo.bitScale) * EVzoom.logo.height;
                    // Transitions
                    EVzoom.logo.nodes.vLetters[i][j]
                        .transition()
                        .attr("transform", "translate(" + xshift +  "," + yshift + ") rotate(90) scale(" + EVzoom.logo.fontScale + "," + scale + ")")
                        .attr("opacity",  0)
                        .duration(EVzoom.logo.zoom.destroyDuration)
                        .delay(EVzoom.logo.zoom.delay);
                    // Transition blocks
                    EVzoom.logo.nodes.vBlocks[i][j]
                        .transition()
                        .attr("x", xshift)
                        .attr("y", yshift)
                        .attr("opacity", EVzoom.logo.opacity)
                        .attr("width", blockHeight)
                        .attr("height", EVzoom.barWidth())
                        .duration(EVzoom.logo.zoom.destroyDuration)
                        .delay(EVzoom.logo.zoom.delay);
                    cumulative = cumulative + blockHeight;
                }
            }
            // Destroy zoom lines
            d3.select("#hZoomLine")
                .transition()
                .attr("opacity", 0)
                .duration(EVzoom.logo.zoom.duration)
                .delay(EVzoom.logo.zoom.delay);
            d3.select("#hZoomNotch")
                .transition()
                .attr("d", notchPath1)
                .attr("opacity", 0)
                .duration(EVzoom.logo.zoom.duration)
                .delay(EVzoom.logo.zoom.delay);
            d3.select("#vZoomLine")
                .transition()
                .attr("opacity", 0)
                .duration(EVzoom.logo.zoom.duration)
                .delay(EVzoom.logo.zoom.delay);
            d3.select("#vZoomNotch")
                .transition()
                .attr("d", notchPath1)
                .attr("opacity", 0)
                .duration(EVzoom.logo.zoom.duration)
                .delay(EVzoom.logo.zoom.delay);
            EVzoom.state.zoomBuilt = 0;
        }

        // Logo zooming
        if (onPlot && coordsChanged) {
            // Horizontal update
            // Determine any new positions
            var starti = Math.max(0, EVzoom.state.i - EVzoom.logo.zoom.radius);
            var stopi = Math.min(logo.length - 1, EVzoom.state.i + EVzoom.logo.zoom.radius);
            if (EVzoom.state.i !== EVzoom.state.iOld) {
                /// Expand focused columns
                var zoomLetterWidth = EVzoom.logo.zoom.width / (1 + 2 * EVzoom.logo.zoom.radius);
                var xcenter = EVzoom.iToX(EVzoom.state.i);
                for (var i = starti; i <= stopi; i++) {
                    var cumulative = 0;
                    for (var j = 0; j < logo[i].length; j++) {
                        var xshift = xcenter + (i - EVzoom.state.i - 0.5) * zoomLetterWidth;
                        var yshift = EVzoom.axis.top - EVzoom.logo.zoom.lift - cumulative;
                        var blockHeight = (logo[i][j].bits / EVzoom.logo.bitScale) * EVzoom.logo.zoom.height;
                        var scale = logo[i][j].bits / EVzoom.logo.bitScale * 4;
                        // Transition letters
                        EVzoom.logo.nodes.hLetters[i][j]
                            .transition()
                            .attr("transform", "translate(" + xshift +  "," + yshift + ") rotate(0) scale(" + EVzoom.logo.zoom.fontScale + "," + scale + ")")
                            .attr("opacity",  1)
                            .duration(EVzoom.logo.zoom.duration)
                            .delay(EVzoom.logo.zoom.delay)
                            .ease(EVzoom.logo.zoom.easeFun);
                        // Transition blocks
                        EVzoom.logo.nodes.hBlocks[i][j]
                            .transition()
                            .attr("x", xshift)
                            .attr("y", yshift - blockHeight)
                            // .attr("opacity",  0.4 * Math.abs(i - EVzoom.state.i) / EVzoom.logo.zoom.radius * Math.abs(i - EVzoom.state.i) / EVzoom.logo.zoom.radius)
                            // .attr("opacity",  0.5 / (Math.abs(i - EVzoom.state.i)**2 + 1))
                            // .attr("opacity",  (i == EVzoom.state.i ? 0 : 0))
                            .attr("opacity",  EVzoom.logo.zoom.opacity)
                            .attr("width", zoomLetterWidth)
                            .attr("height", blockHeight)
                            .duration(EVzoom.logo.zoom.duration)
                            .delay(EVzoom.logo.zoom.delay)
                            .ease(EVzoom.logo.zoom.easeFun);
                        cumulative = cumulative + blockHeight;
                    }
                }
                // Contract unfocused columns
                var oldstarti = Math.max(0, EVzoom.state.iOld - EVzoom.logo.zoom.radius);
                var oldstopi = Math.min(logo.length - 1, EVzoom.state.iOld + EVzoom.logo.zoom.radius);
                for (var i = oldstarti; i <= oldstopi; i++) {
                    if (i < starti | i > stopi) {
                        var cumulative = 0;
                        for (var j = 0; j < logo[i].length; j++) {
                            var xshift = EVzoom.iToX(i);
                            var yshift = EVzoom.axis.top - EVzoom.logo.pad - cumulative;
                            var scale = logo[i][j].bits / EVzoom.logo.bitScale;
                            var blockHeight = (logo[i][j].bits / EVzoom.logo.bitScale) * EVzoom.logo.height;
                            // Transition letters
                            EVzoom.logo.nodes.hLetters[i][j]
                                .transition()
                                .attr("transform", "translate(" + xshift +  "," + yshift + ") rotate(0) scale(" + EVzoom.logo.fontScale + "," + scale + ")")
                                .attr("opacity",  0)
                                .duration(EVzoom.logo.zoom.duration)
                                .delay(EVzoom.logo.zoom.delay)
                                .ease(EVzoom.logo.zoom.easeFun);
                            // Transition blocks
                            EVzoom.logo.nodes.hBlocks[i][j]
                                .transition()
                                .attr("x", xshift)
                                .attr("y", yshift - blockHeight)
                                .attr("opacity", EVzoom.logo.opacity)
                                .attr("width", EVzoom.barWidth())
                                .attr("height", blockHeight)
                                .duration(EVzoom.logo.zoom.duration)
                                .delay(EVzoom.logo.zoom.delay)
                                .ease(EVzoom.logo.zoom.easeFun);
                            cumulative = cumulative + blockHeight;
                        }
                    }
                }
                // Move the underline
                var xleft = xcenter + (starti - EVzoom.state.i - 0.5) * zoomLetterWidth;
                var xright = xcenter + (stopi + 1 - EVzoom.state.i - 0.5) * zoomLetterWidth;
                var yshift = EVzoom.axis.top - EVzoom.logo.zoom.lift + EVzoom.logo.zoom.underline.pad;
                d3.select("#hZoomLine")
                    .transition()
                    .attr("x1", xcenter)
                    .attr("x2", xcenter)
                    .attr("y1", yshift)
                    .attr("y2", yshift)
                    .attr("opacity", 1)
                    .duration(0)
                    .delay(0)
                    .transition()
                    .attr("x1", xleft)
                    .attr("x2", xright)
                    .duration(EVzoom.logo.zoom.underline.duration)
                    .delay(EVzoom.logo.zoom.underline.delay);
                var rad = EVzoom.logo.zoom.underline.notchRadius;
                var notchPath1 = "M" + (xcenter - rad) + "," + yshift
                    + "L" + (xcenter + rad) + "," + yshift
                    + "L" + xcenter + "," + yshift + "Z";
                var notchPath2 = "M" + (xcenter - rad) + "," + yshift
                    + "L" + (xcenter + rad) + "," + yshift
                    + "L" + xcenter + "," + (yshift + EVzoom.logo.zoom.underline.notchHeight) + "Z";
                d3.select("#hZoomNotch")
                    .transition()
                    .attr("d", notchPath1)
                    .attr("opacity", 1)
                    .duration(0)
                    .delay(0)
                    .transition()
                    .attr("d", notchPath2)
                    .duration(EVzoom.logo.zoom.underline.duration)
                    .delay(EVzoom.logo.zoom.underline.delay);
            }

            // Vertical update
            // Determine any new positions
            var starti = Math.max(0, EVzoom.state.j - EVzoom.logo.zoom.radius);
            var stopi = Math.min(logo.length - 1, EVzoom.state.j + EVzoom.logo.zoom.radius);
            if (EVzoom.state.j != EVzoom.state.jOld) {
                var zoomLetterWidth = EVzoom.logo.zoom.width / (1 + 2 * EVzoom.logo.zoom.radius);
                // Expand focused columns
                var ycenter = EVzoom.jToY(EVzoom.state.j);
                for (var i = starti; i <= stopi; i++) {
                    var cumulative = 0;
                    for (var j = 0; j < logo[i].length; j++) {
                        var yshift = ycenter + (i - EVzoom.state.j - 0.5) * zoomLetterWidth;
                        var xshift = EVzoom.axis.right + EVzoom.logo.zoom.lift + cumulative;
                        var blockHeight = (logo[i][j].bits / EVzoom.logo.bitScale) * EVzoom.logo.zoom.height;
                        var scale = logo[i][j].bits / EVzoom.logo.bitScale * 4;
                        // Transitions
                        EVzoom.logo.nodes.vLetters[i][j]
                            .transition()
                            .attr("transform", "translate(" + xshift +  "," + yshift + ") rotate(90) scale(" + EVzoom.logo.zoom.fontScale + "," + scale + ")")
                            .attr("opacity",  1)
                            .duration(EVzoom.logo.zoom.duration)
                            .delay(EVzoom.logo.zoom.delay)
                            .ease(EVzoom.logo.zoom.easeFun);
                        // Transition blocks
                        EVzoom.logo.nodes.vBlocks[i][j]
                            .transition()
                            .attr("x", xshift)
                            .attr("y", yshift)
                            .attr("opacity",  EVzoom.logo.zoom.opacity)
                            .attr("width", blockHeight)
                            .attr("height", zoomLetterWidth)
                            .duration(EVzoom.logo.zoom.duration)
                            .delay(EVzoom.logo.zoom.delay)
                            .ease(EVzoom.logo.zoom.easeFun);
                        cumulative = cumulative + blockHeight;
                    }
                }
                // Contract unfocused columns
                var oldstarti = Math.max(0, EVzoom.state.jOld - EVzoom.logo.zoom.radius);
                var oldstopi = Math.min(logo.length - 1, EVzoom.state.jOld + EVzoom.logo.zoom.radius);
                for (var i = oldstarti; i <= oldstopi; i++) {
                    if (i < starti | i > stopi) {
                        var cumulative = 0;
                        for (var j = 0; j < logo[i].length; j++) {
                            var yshift = EVzoom.jToY(i);
                            var xshift = EVzoom.axis.right + EVzoom.logo.pad + cumulative;
                            var scale = logo[i][j].bits / EVzoom.logo.bitScale;
                            var blockHeight = (logo[i][j].bits / EVzoom.logo.bitScale) * EVzoom.logo.height;
                            // Transitions
                            EVzoom.logo.nodes.vLetters[i][j]
                                .transition()
                                .attr("transform", "translate(" + xshift +  "," + yshift + ") rotate(90) scale(" + EVzoom.logo.fontScale + "," + scale + ")")
                                .attr("opacity",  0)
                                .duration(EVzoom.logo.zoom.duration)
                                .delay(EVzoom.logo.zoom.delay)
                                .ease(EVzoom.logo.zoom.easeFun);
                            // Transition blocks
                            EVzoom.logo.nodes.vBlocks[i][j]
                                .transition()
                                .attr("x", xshift)
                                .attr("y", yshift)
                                .attr("opacity", EVzoom.logo.opacity)
                                .attr("width", blockHeight)
                                .attr("height", EVzoom.barWidth())
                                .duration(EVzoom.logo.zoom.duration)
                                .delay(EVzoom.logo.zoom.delay)
                                .ease(EVzoom.logo.zoom.easeFun);
                            cumulative = cumulative + blockHeight;
                        }
                    }
                }
                // Move the underline
                var ytop = ycenter + (starti - EVzoom.state.j - 0.5) * zoomLetterWidth;
                var ybottom = ycenter + (stopi + 1 - EVzoom.state.j - 0.5) * zoomLetterWidth;
                var xshift = EVzoom.axis.right + EVzoom.logo.zoom.lift - EVzoom.logo.zoom.underline.pad;
                d3.select("#vZoomLine")
                    .transition()
                    .attr("x1", xshift)
                    .attr("x2", xshift)
                    .attr("y1", ycenter)
                    .attr("y2", ycenter)
                    .attr("opacity", 1)
                    .duration(0)
                    .delay(0)
                    .transition()
                    .attr("y1", ytop)
                    .attr("y2", ybottom)
                    .duration(EVzoom.logo.zoom.underline.duration)
                    .delay(EVzoom.logo.zoom.underline.delay);
                var rad = EVzoom.logo.zoom.underline.notchRadius;
                var notchPath1 = "M" + xshift + "," + (ycenter - rad)
                    + "L" + xshift + "," + (ycenter + rad)
                    + "L" + xshift + "," + ycenter + "Z";
                var notchPath2 = "M" + xshift + "," + (ycenter - rad)
                    + "L" + xshift + "," + (ycenter + rad)
                    + "L" + (xshift - EVzoom.logo.zoom.underline.notchHeight) + "," + ycenter + "Z";
                d3.select("#vZoomNotch")
                    .transition()
                    .attr("d", notchPath1)
                    .attr("opacity", 1)
                    .duration(0)
                    .delay(0)
                    .transition()
                    .attr("d", notchPath2)
                    .duration(EVzoom.logo.zoom.underline.duration)
                    .delay(EVzoom.logo.zoom.underline.delay);
            }
            EVzoom.state.zoomBuilt = 1;
        }
    }
    // Update state
    EVzoom.state.iOld = EVzoom.state.i;
    EVzoom.state.jOld = EVzoom.state.j;
};
// End of EVzoom.update()

EVzoom.focusIJ = function() {
    var L = EVzoom.logo.data.length;
    var ix = Math.floor((EVzoom.state.x - EVzoom.axis.left) / (EVzoom.axis.right - EVzoom.axis.left) * L);
    var jx = Math.floor((EVzoom.state.y - EVzoom.axis.top) / (EVzoom.axis.bottom - EVzoom.axis.top) * L);
    var closest = 0;
    var best = L + 1;
    // Find closest i,j
    var couplings = EVzoom.couplings.data;
    for (var c = 0; c < couplings.length; c++) {
        var edgeDist = dist(ix, jx, couplings[c].i - 1, couplings[c].j - 1) - EVzoom.radiusFun(couplings[c].score);
        if (edgeDist < best) {
            best = edgeDist;
            closest = c;
        }
    }
    EVzoom.state.i = couplings[closest].i - 1;
    EVzoom.state.j = couplings[closest].j - 1;
    EVzoom.update();
};

EVzoom.mouseMove = function() {
    var mouse = d3.mouse(this);
    EVzoom.state.x = mouse[0];
    EVzoom.state.y = mouse[1];
    var L = EVzoom.logo.data.length;
    var ix = Math.floor((EVzoom.state.x - EVzoom.axis.left) / (EVzoom.axis.right - EVzoom.axis.left) * L);
    var jx = Math.floor((EVzoom.state.y - EVzoom.axis.top) / (EVzoom.axis.bottom - EVzoom.axis.top) * L);
    EVzoom.state.i = ix;
    EVzoom.state.j = jx;

    // Snappy snapping
    var closest = 0;
    var best = L + 1;
    // Find closest i,j
    var couplings = EVzoom.couplings.data;
    for (var c = 0; c < couplings.length; c++) {
        var edgeDist = dist(ix, jx, couplings[c].i - 1, couplings[c].j - 1) - EVzoom.radiusFun(couplings[c].score);
        if (edgeDist < best) {
            best = edgeDist;
            closest = c;
        }
    }
    if (best < 0) {
        EVzoom.state.i = couplings[closest].i - 1;
        EVzoom.state.j = couplings[closest].j - 1;
    }
    EVzoom.update();
};

EVzoom.buildSVG = function() {
    var logo = EVzoom.logo.data;
    var couplings = EVzoom.couplings.data;

    // Set up canvas
    var plot = d3.select("#evzoom-viewer")
        .append("svg")
        .attr("width", EVzoom.svg.width)
        .attr("height", EVzoom.svg.height)
        .attr("overflow", "visible")
        .style("overflow", "visible")
        .on("mousemove", EVzoom.mouseMove);

    // Draw axis
    var axis = plot.append("rect")
        .attr("x", EVzoom.iToX(0))
        .attr("y", EVzoom.jToY(0))
        .attr("fill", EVzoom.axis.color)
        .attr("stroke","white")
        .attr("width", EVzoom.plotWidth())
        .attr("height", EVzoom.plotHeight());

    // Filter for drop shadows
    EVzoom.shadow.filter = plot.append("defs")
        .append("filter")
        .attr("id", "drop-shadow")
        .attr("x", "-50%")
        .attr("y", "-50%")
        .attr("width", "200%")
        .attr("height", "200%");
    EVzoom.shadow.filter.append("feOffset")
        .attr("in", "SourceAlpha")
        .attr("dx", EVzoom.shadow.dx)
        .attr("dy", EVzoom.shadow.dy)
        .attr("result", "offsetAlpha");
    EVzoom.shadow.filter.append("feGaussianBlur")
        .attr("in", "offsetAlpha")
        .attr("stdDeviation", EVzoom.shadow.std)
        .attr("result", "blur-out");
    EVzoom.shadow.filter.append("feColorMatrix")
        .attr("in", "blur-out")
        .attr("values", "0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 " + EVzoom.shadow.scale + " 0")
        .attr("result","shadow")
    EVzoom.shadow.filter.append("feBlend")
        .attr("in", "SourceGraphic")
        .attr("in2", "shadow")
        .attr("mode", "normal");

    // Draw gridlines
    for (var i = 0; i < EVzoom.logo.data.length; i++) {
        if (EVzoom.map.indices[i] % EVzoom.grid.spacing === 0) {
            // Horizontal
            plot.append("line")
                .attr("x1", EVzoom.axis.left)
                .attr("y1", EVzoom.jToY(i))
                .attr("x2", EVzoom.axis.right)
                .attr("y2", EVzoom.jToY(i))
                .attr("stroke", EVzoom.grid.color)
                .attr("stroke-width", EVzoom.grid.lineWidth);

            // Vertical
            plot.append("line")
                .attr("x1", EVzoom.iToX(i))
                .attr("y1", EVzoom.axis.top)
                .attr("x2", EVzoom.iToX(i))
                .attr("y2", EVzoom.axis.bottom)
                .attr("stroke", EVzoom.grid.color)
                .attr("stroke-width", EVzoom.grid.lineWidth);
        }
    }
    // Horizontal Top & Bottom
    plot.append("line")
        .attr("x1", EVzoom.axis.left)
        .attr("x2", EVzoom.axis.right)
        .attr("y1", EVzoom.jToY(0))
        .attr("y2", EVzoom.jToY(0))
        .attr("stroke", EVzoom.grid.color)
        .attr("stroke-width", EVzoom.grid.lineWidth);
    plot.append("line")
        .attr("x1", EVzoom.axis.left)
        .attr("x2", EVzoom.axis.right)
        .attr("y1", EVzoom.jToY(0) + EVzoom.plotHeight())
        .attr("y2", EVzoom.jToY(0) + EVzoom.plotHeight())
        .attr("stroke", EVzoom.grid.color)
        .attr("stroke-width", EVzoom.grid.lineWidth);
    // Vertical Left & Right
    plot.append("line")
        .attr("x1", EVzoom.iToX(0))
        .attr("x2", EVzoom.iToX(0))
        .attr("y1", EVzoom.axis.top)
        .attr("y2", EVzoom.axis.bottom)
        .attr("stroke", EVzoom.grid.color)
        .attr("stroke-width", EVzoom.grid.lineWidth);
    plot.append("line")
        .attr("x1", EVzoom.iToX(0) + EVzoom.plotWidth())
        .attr("x2", EVzoom.iToX(0) + EVzoom.plotWidth())
        .attr("y1", EVzoom.axis.top)
        .attr("y2", EVzoom.axis.bottom)
        .attr("stroke", EVzoom.grid.color)
        .attr("stroke-width", EVzoom.grid.lineWidth);
    // Draw crosshairs
    plot.append("rect")
        .attr("id","wVert")
        .attr("x", EVzoom.iToX(0))
        .attr("y", EVzoom.jToY(0))
        .attr("width", EVzoom.focusLength(2 * EVzoom.logo.zoom.radius + 1))
        .attr("height", EVzoom.plotHeight())
        .attr("opacity", 0)
        .attr("fill", EVzoom.grid.crosshairs.color)
        .attr("stroke","none");
    plot.append("rect")
        .attr("id","wHoriz")
        .attr("x", EVzoom.iToX(0))
        .attr("y", EVzoom.jToY(0))
        .attr("width",  EVzoom.plotWidth())
        .attr("height", EVzoom.focusLength(2 * EVzoom.logo.zoom.radius + 1))
        .attr("opacity", 0)
        .attr("fill", EVzoom.grid.crosshairs.color)
        .attr("stroke", "none");
    // Text
    var labelX = 0;
    var labelY = 0;
    plot.append("text")
        .attr("id", "vZoomIndex")
        .attr("font-family", EVzoom.grid.crosshairs.label.font)
        .attr("font-size", EVzoom.grid.crosshairs.label.fontSize)
        .attr("opacity", 0)
        .attr("text-anchor", "end")
        .attr("x", labelX)
        .attr("y", labelY)
        .text("0");
    plot.append("text")
        .attr("id", "hZoomIndex")
        .attr("font-family", EVzoom.grid.crosshairs.label.font)
        .attr("font-size", EVzoom.grid.crosshairs.label.fontSize)
        .attr("opacity", 0)
        .attr("text-anchor", "middle")
        .attr("x", labelX)
        .attr("y", labelY)
        .text("0");

    // Draw couplings
    EVzoom.couplings.nodes = {};
    EVzoom.couplings.nodes.circles = [];

    EVzoom.couplings.maxRadius = 3 * Math.sqrt(EVzoom.focusLength(1));

    for (var c = 0; c < couplings.length; c++) {
        var node = plot.append("circle")
            .attr("id", "c" + couplings[c].i + "-" + couplings[c].j)
            .attr("cx", EVzoom.iToX(couplings[c].i - 1))
            .attr("cy", EVzoom.jToY(couplings[c].j - 1))
            .attr("fill", EVzoom.couplings.fill)
            .attr("stroke", EVzoom.couplings.stroke)
            .attr("stroke-width", EVzoom.couplings.strokeWidth)
            .attr("r", 0)
            .on("mouseover", EVzoom.focusIJ());
        EVzoom.couplings.nodes.circles.push(node);
    }

    // Logo Lines
    plot.append("line")
        .attr("id", "hZoomLine")
        .attr("x1", EVzoom.iToX(0))
        .attr("x2", EVzoom.iToX(0))
        .attr("y1", EVzoom.jToY(0))
        .attr("y2", EVzoom.jToY(0))
        .attr("stroke", EVzoom.logo.zoom.underline.color)
        .attr("stroke-width", EVzoom.logo.zoom.underline.width)
        .attr("opacity", 0);
    plot.append("path")
        .attr("id", "hZoomNotch")
        .attr("d", "M0,0L0,0L0,0Z")
        .attr("fill", EVzoom.logo.zoom.underline.color)
        .attr("stroke", EVzoom.logo.zoom.underline.color)
        .attr("stroke-width", EVzoom.logo.zoom.underline.width)
        .attr("opacity", 0);
    plot.append("line")
        .attr("id", "vZoomLine")
        .attr("x1", EVzoom.iToX(0))
        .attr("x2", EVzoom.iToX(0))
        .attr("y1", EVzoom.jToY(0))
        .attr("y2", EVzoom.jToY(0))
        .attr("stroke", EVzoom.logo.zoom.underline.color)
        .attr("stroke-width", EVzoom.logo.zoom.underline.width)
        .attr("opacity", 0);
    plot.append("path")
        .attr("id", "vZoomNotch")
        .attr("d", "M0,0L0,0L0,0Z")
        .attr("fill", EVzoom.logo.zoom.underline.color)
        .attr("stroke", EVzoom.logo.zoom.underline.color)
        .attr("stroke-width", EVzoom.logo.zoom.underline.width)
        .attr("opacity", 0);

    // Horizontal logo axis
    var bitsToHeight = function(bits) {return EVzoom.logo.height * bits / EVzoom.logo.bitScale;}
    plot.append("line")
        .attr("x1", EVzoom.axis.left - EVzoom.logo.axis.pad)
        .attr("x2", EVzoom.axis.left - EVzoom.logo.axis.pad)
        .attr("y1", EVzoom.axis.top - EVzoom.logo.pad)
        .attr("y2", EVzoom.axis.top - EVzoom.logo.pad - bitsToHeight(EVzoom.logo.axis.max))
        .attr("stroke", EVzoom.logo.axis.stroke)
        .attr("stroke-width", EVzoom.logo.axis.strokeWidth);
    for (var i = 0; i < EVzoom.logo.axis.majorTicks.length; i++) {
        var tickY = EVzoom.axis.top - EVzoom.logo.pad - bitsToHeight(EVzoom.logo.axis.majorTicks[i]);
        plot.append("line")
            .attr("x1", EVzoom.axis.left - EVzoom.logo.axis.pad)
            .attr("x2", EVzoom.axis.left - EVzoom.logo.axis.pad - EVzoom.logo.axis.majorLength)
            .attr("y1", tickY)
            .attr("y2", tickY)
            .attr("stroke", EVzoom.logo.axis.stroke)
            .attr("stroke-width", EVzoom.logo.axis.strokeWidth);
    }
    var labelX = EVzoom.axis.left - EVzoom.logo.axis.pad + EVzoom.logo.axis.textX;
    var labelY = EVzoom.axis.top - EVzoom.logo.pad;
    plot.append("text")
        .attr("id", "bitLabel")
        .attr("font-family", EVzoom.legend.font)
        .attr("font-size", EVzoom.legend.fontSize)
        .attr("opacity", 1)
        .attr("transform", "translate(" + labelX +  "," + labelY + ") rotate(-90)")
        .text("Bits");

    // Logo building
    EVzoom.logo.nodes = {};
    // Draw horizontal logo
    EVzoom.logo.nodes.hLetters = [];
    for (var i = 0; i < logo.length; i++) {
        var cumulative = 0;
        EVzoom.logo.nodes.hLetters.push([]);
        for (var j = 0; j < logo[i].length; j++) {
            var xshift = EVzoom.iToX(i);
            var yshift = EVzoom.axis.top - EVzoom.logo.pad - cumulative;
            var scale = logo[i][j].bits / EVzoom.logo.bitScale;
            var blockHeight = (logo[i][j].bits /  EVzoom.logo.bitScale) * EVzoom.logo.height;
            var node = plot.append("text")
                .attr("id", "hL" + logo[i][j].code + i)
                .style("fill", EVzoom.groupColors[EVzoom.aaGroups[logo[i][j].code]])
                .style("font-size", "20px")
                .style("font-family", EVzoom.logo.font)
                .attr("opacity", 0)
                .attr("transform", "translate(" + xshift +  "," + yshift + ") rotate(0) scale(" + EVzoom.logo.fontScale + "," + scale + ")")
                .text(logo[i][j].code);
            cumulative = cumulative + blockHeight;
            EVzoom.logo.nodes.hLetters[i].push(node);
        }
    }

    // Draw horizontal blocks
    EVzoom.logo.nodes.hBlocks = [];
    for (var i = 0; i < logo.length; i++) {
        var cumulative = 0;
        EVzoom.logo.nodes.hBlocks.push([]);
        for (var j = 0; j < logo[i].length; j++) {
            var xshift = EVzoom.iToX(i);
            var yshift = EVzoom.axis.top - EVzoom.logo.pad - cumulative;
            var scale = logo[i][j].bits / EVzoom.logo.bitScale;
            var blockHeight = (logo[i][j].bits / EVzoom.logo.bitScale) * EVzoom.logo.height;
            var node = plot.append("rect")
                .attr("id", "hB" + logo[i][j].code + i)
                .style("stroke", "none")
                .style("fill", EVzoom.groupColors[EVzoom.aaGroups[logo[i][j].code]])
                .attr("opacity", EVzoom.logo.opacity)
                .attr("x", xshift)
                .attr("y", yshift - blockHeight)
                .attr("width", EVzoom.barWidth())
                .attr("height", blockHeight);
            cumulative = cumulative + blockHeight;
            EVzoom.logo.nodes.hBlocks[i].push(node);
        }
    }

    // Draw vertical logo
    EVzoom.logo.nodes.vLetters = [];
    for (var i = 0; i < logo.length; i++) {
        var cumulative = 0;
        EVzoom.logo.nodes.vLetters.push([]);
        for (var j = 0; j < logo[i].length; j++) {
            var yshift = EVzoom.jToY(i);
            var xshift = EVzoom.axis.right + EVzoom.logo.pad + cumulative;
            var scale = logo[i][j].bits / EVzoom.logo.bitScale;
            var blockHeight = (logo[i][j].bits / EVzoom.logo.bitScale) * EVzoom.logo.height;
            var node = plot.append("text")
                .attr("id", "vL" + logo[i][j].code + i)
                .style("fill", EVzoom.groupColors[EVzoom.aaGroups[logo[i][j].code]])
                .style("font-size", "20px")
                .style("font-family", EVzoom.logo.font)
                .attr("opacity", 0)
                .attr("transform", "translate(" + xshift +  "," + yshift + ") rotate(90) scale(" + EVzoom.logo.fontScale + "," + scale + ")")
                .text(logo[i][j].code);
            cumulative = cumulative + blockHeight;
            EVzoom.logo.nodes.vLetters[i].push(node);
        }
    }
    // Draw vertical blocks
    EVzoom.logo.nodes.vBlocks = [];
    for (var i = 0; i < logo.length; i++) {
        var cumulative = 0;
        EVzoom.logo.nodes.vBlocks.push([]);
        for (var j = 0; j < logo[i].length; j++) {
            var yshift = EVzoom.jToY(i);
            var xshift = EVzoom.axis.right + EVzoom.logo.pad + cumulative;
            var scale = logo[i][j].bits / EVzoom.logo.bitScale;
            var blockHeight = (logo[i][j].bits / EVzoom.logo.bitScale) * EVzoom.logo.height;
            var node = plot.append("rect")
                .attr("id", "vB" + logo[i][j].code + i)
                .style("stroke", "none")
                .style("fill", EVzoom.groupColors[EVzoom.aaGroups[logo[i][j].code]])
                .attr("x", xshift)
                .attr("y", yshift)
                .attr("width", blockHeight)
                .attr("height", EVzoom.barWidth());
            cumulative = cumulative + blockHeight;
            EVzoom.logo.nodes.vBlocks[i].push(node);
        }
    }

    // Draw Legend
    plot.append("rect")
        .attr("id", "legend")
        .attr("x", EVzoom.legend.left)
        .attr("y", EVzoom.legend.top)
        .attr("width", EVzoom.legend.right - EVzoom.legend.left)
        .attr("height", EVzoom.legend.bottom - EVzoom.legend.top)
        .attr("rx", EVzoom.legend.rx)
        .attr("ry", EVzoom.legend.ry)
        .style("stroke", EVzoom.legend.stroke)
        .style("fill", EVzoom.legend.fill);

    var gridX = function(idx) {
        return EVzoom.legend.left + EVzoom.legend.padX
            + (EVzoom.legend.right - EVzoom.legend.left - 2 * EVzoom.legend.padX)
            * (idx % EVzoom.legend.columns) / (EVzoom.legend.columns - 1);
    };
    var gridY = function(idx) {
        return EVzoom.legend.top + EVzoom.legend.padY
            + (EVzoom.legend.bottom - EVzoom.legend.top - 2 * EVzoom.legend.padY)
            * Math.floor(idx / EVzoom.legend.columns) / (EVzoom.legend.rows - 1);
    };

    for (var i = 0; i < EVzoom.legend.glyph.content.length; i++) {
        // Glyph
        plot.append("rect")
            .attr("id", "legendBox" + i)
            .style("stroke", "none")
            .style("fill", EVzoom.groupColors[EVzoom.legend.glyph.content[i].group])
            .attr("x", gridX(EVzoom.legend.glyph.content[i].idx) - EVzoom.legend.glyph.width / 2)
            .attr("y", gridY(EVzoom.legend.glyph.content[i].idx) - EVzoom.legend.glyph.height / 2)
            .attr("width", EVzoom.legend.glyph.width)
            .attr("height", EVzoom.legend.glyph.height);
        // Text
        plot.append("text")
            .attr("id", "legendText" + i)
            .attr("x", gridX(EVzoom.legend.glyph.content[i].idx) + EVzoom.legend.glyph.textX)
            .attr("y", gridY(EVzoom.legend.glyph.content[i].idx) + EVzoom.legend.glyph.textY)
            .attr("font-family", EVzoom.legend.font)
            .attr("font-size", EVzoom.legend.fontSize)
            .text(EVzoom.legend.glyph.content[i].label);
    }
    // Couplings magnitude legend
    var magX = gridX(EVzoom.legend.magnitude.idx) + EVzoom.legend.magnitude.shiftX;
    var magY = gridY(EVzoom.legend.magnitude.idx);
    for (var i = 0; i < EVzoom.legend.magnitude.radii.length; i++) {
        plot.append("circle")
            .attr("id", "legendMagnitudeC" + i)
            .attr("cx", magX + EVzoom.legend.magnitude.offsets[i])
            .attr("cy", magY)
            .attr("fill", EVzoom.couplings.fill)
            .attr("stroke", EVzoom.couplings.stroke)
            .attr("r", EVzoom.legend.magnitude.radii[i]);
    }
    plot.append("text")
        .attr("id", "legendMagnitude")
        .attr("x", magX + EVzoom.legend.magnitude.textX)
        .attr("y", magY + EVzoom.legend.magnitude.textY)
        .attr("font-family", EVzoom.legend.font)
        .attr("font-size", EVzoom.legend.fontSize)
        .text("Coupling magnitude");

    // Couplings colormap legend
    var cmapX = gridX(EVzoom.legend.cmap.idx) + EVzoom.legend.cmap.shiftX;
    var cmapY = gridY(EVzoom.legend.cmap.idx);
    for (var i = 0; i < EVzoom.legend.cmap.blocks; i++) {
        var colorIndex = 2 * i / (EVzoom.legend.cmap.blocks - 1) - 1;
        var blockOffset = (i / (EVzoom.legend.cmap.blocks) - 0.5) * EVzoom.legend.cmap.width;
        var blockWidth = EVzoom.legend.cmap.width / EVzoom.legend.cmap.blocks;
        plot.append("rect")
            .attr("id", "legendCmap")
            .style("stroke", "none")
            .style("fill", EVzoom.matrix.cscale(colorIndex))
            .attr("x", cmapX + blockOffset)
            .attr("y", cmapY -  EVzoom.legend.cmap.height / 2)
            .attr("width", blockWidth)
            .attr("height", EVzoom.legend.cmap.height)
            .attr("opacity", 0);
    }
    plot.append("text")
        .attr("id", "legendCmap")
        .attr("x", cmapX + EVzoom.legend.cmap.rightX)
        .attr("y", cmapY + EVzoom.legend.cmap.rightY)
        .attr("font-family", EVzoom.legend.font)
        .attr("font-size", EVzoom.legend.fontSize)
        .attr("opacity", 0)
        .text("Coupling value");

    // Draw Display widget
    EVzoom.matrix.nodes = {};
    plot.append("rect")
        .attr("id", "matrixBG")
        .attr("stroke", EVzoom.matrix.background.stroke)
        .attr("fill", EVzoom.matrix.background.fill)
        .attr("stroke-width", EVzoom.matrix.background.strokeWidth)
        .attr("opacity", 0)
        .attr("x", EVzoom.axis.left)
        .attr("y", EVzoom.axis.top)
        .attr("width", 0)
        .attr("height", 0)
        .attr("filter", "url(#drop-shadow)");
    EVzoom.matrix.nodes.cells = [];
    for (var i = 0; i < 20; i++) {
        EVzoom.matrix.nodes.cells.push([]);
        for (var j = 0; j < 20; j++) {
            var node = plot.append("rect")
                .attr("id", "disp" + i + "-" + j)
                .style("stroke", "none")
                .style("stroke-width", EVzoom.matrix.gridWidth)
                .style("fill", "gray")
                .style("opacity", 0)
                .attr("x", EVzoom.matrix.x + i * EVzoom.matrix.cellSize)
                .attr("y", EVzoom.matrix.y + j * EVzoom.matrix.cellSize)
                .attr("width", EVzoom.matrix.cellSize)
                .attr("height", EVzoom.matrix.cellSize);
            EVzoom.matrix.nodes.cells[i].push(node);
        }
    }
    EVzoom.matrix.nodes.iLabels = [];
    for (var i = 0; i < 20; i++) {
        var xshift = EVzoom.matrix.x + i * EVzoom.matrix.cellSize;
        var yshift = EVzoom.matrix.y;
        var node = plot.append("text")
            .attr("id", "biC" + i)
            .style("stroke", "none")
            .style("fill", "gray")
            .style("opacity", 0)
            .style("font-size", EVzoom.matrix.fontSize)
            .style("font-family", EVzoom.matrix.font)
            .attr("transform", "translate(" + xshift +  "," + yshift + ")")
            .text(" ");
        EVzoom.matrix.nodes.iLabels.push(node);
    }
    EVzoom.matrix.nodes.jLabels = [];
    for (var j = 0; j < 20; j++) {
        var xshift = EVzoom.matrix.x + 20 * EVzoom.matrix.cellSize;
        var yshift = EVzoom.matrix.y + j * EVzoom.matrix.cellSize;
        var node = plot.append("text")
            .attr("id", "bjC" + j)
            .style("stroke", "none")
            .style("fill", "gray")
            .style("opacity", 0)
            .style("font-size", EVzoom.matrix.fontSize)
            .style("font-family", EVzoom.matrix.font)
            .attr("transform", "translate(" + xshift +  "," + yshift + ") rotate(90)")
            .text(" ");
        EVzoom.matrix.nodes.jLabels.push(node);
    }

    // Animate couplings
    for (var c = 0; c < couplings.length; c++) {
        d3.select("#c" + (couplings[c].i) + "-" + (couplings[c].j))
            .transition()
            .attr("r", EVzoom.radiusFun(couplings[c].score))
            .duration(600)
            .delay(400 + 5 * Math.abs(couplings[c].i - couplings[c].j));
    }
};

EVzoom.prepareLogo = function() {
    // Process logo to sort into groups
    var logo = EVzoom.logo.data;

    // Tabulate group sizes
    for (var i = 0; i < logo.length; i++) {
        var groupSet = [];
        var bitsSet = [];
        var indexSet = [];
        for (var j = 0; j < logo[i].length; j++) {
            var code = logo[i][j].code;
            var bits = logo[i][j].bits;
            var group = EVzoom.aaGroups[code];
            if (groupSet.indexOf(group) === -1) {
                groupSet.push(group);
                bitsSet.push(bits);
            } else {
                bitsSet[groupSet.indexOf(group)] += bits;
            }
        }

        // Sort by smallest group to largest, internally by bits
        logo[i].sort(function(a,b) {
            var groupA = EVzoom.aaGroups[a.code];
            var groupB = EVzoom.aaGroups[b.code];
            var bitsA = bitsSet[groupSet.indexOf(groupA)];
            var bitsB = bitsSet[groupSet.indexOf(groupB)];
            if (a.code === b.code) {
                return 0;
            } else if (groupA == groupB) {
                if (a.bits < b.bits) {
                    return -1;
                } else if (a.bits > b.bits) {
                    return 1;
                } else {
                    return 0;
                }
            } else if (bitsA < bitsB) {
                return -1;
            } else if (bitsA > bitsB) {
                return 1;
            } else {
                return 0;
            }
        })
    }
};

EVzoom.prepareCouplings = function() {
    EVzoom.couplings.data.sort(function(a,b) {
        if (a.score > b.score) {
            return -1;
        } else if (a.score < b.score) {
            return 1;
        } else {
            return 0;
        }
    });
    // Identify largest scale
    var maxScale = 0;
    for (var i = 0; i < EVzoom.couplings.data.length; i++) {
        if (EVzoom.couplings.data[i].score > maxScale) {
            maxScale = EVzoom.couplings.data[i].score;
        }
    }
    // Normalize coupling scale
    for (var i = 0; i < EVzoom.couplings.data.length; i++) {
        EVzoom.couplings.data[i].score =
            EVzoom.couplings.data[i].score / maxScale;
    }
    // Identify coupling magnitude
    var maxCoupling = 0;
    for (var i = 0; i < EVzoom.couplings.data.length; i++) {
        for (var ai = 0; ai < EVzoom.couplings.data[i].matrix.length; ai++) {
            for (var aj = 0; aj < EVzoom.couplings.data[i].matrix[ai].length; aj++) {
                if (Math.abs(EVzoom.couplings.data[i].matrix[ai][aj]) > maxCoupling) {
                    maxCoupling = Math.abs(EVzoom.couplings.data[i].matrix[ai][aj]);
                }
            }
        }
    }
    // Normalize coupling magnitude
    for (var i = 0; i < EVzoom.couplings.data.length; i++) {
        for (var ai = 0; ai < EVzoom.couplings.data[i].matrix.length; ai++) {
            for (var aj = 0; aj < EVzoom.couplings.data[i].matrix[ai].length; aj++) {
                EVzoom.couplings.data[i].matrix[ai][aj] =
                    EVzoom.couplings.data[i].matrix[ai][aj] / maxCoupling;
            }
        }
    }
};

EVzoom.prepareData = function(data) {
    EVzoom.couplings.data = data["couplings"];
    EVzoom.logo.data = data["logo"];
    EVzoom.map = data["map"];

    EVzoom.prepareLogo();
    EVzoom.prepareCouplings();
    document.getElementById("evzoom-viewer").innerHTML = '';
    EVzoom.buildSVG();

    // Loading timer
    var LOAD_TIME = 700 + 5 * EVzoom.logo.data.length;
    var loadTimer = d3.timer(function(elapsed) {
        if (elapsed > LOAD_TIME) { EVzoom.state.viewerLoaded = 1; }
    }, 0);

    // Regularly update timer
    setInterval(EVzoom.tick, EVzoom.times.globalTick);
};

// Initializer
EVzoom.initialize = function(data) {
    // Build the frame

    // Load the data and then setup the plot
    var url = "";
    var tags = d3.select("#evzoom-viewer").node().getAttribute("data-couplings");
    var urlParams = new URLSearchParams(window.location.search);
    var dataParam = urlParams.get('data');

    // Option 1) Check if data is defined
    // Option 2) Obtain the data url from a div tag
    // Option 3) Check for a query in the URL

    if(data !== undefined && data !== null){
        url = data;
    } else if (tags !== undefined && tags !== null) {
        url = tags;
    } else if(dataParam !== undefined && dataParam !== null){
        url = dataParam;
    }

    // Load the data
    d3.json(url)
        .on("load", EVzoom.prepareData)
        .on("error", function(error) { console.error("failure!", error); })
        .get();
};