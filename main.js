// Add your JavaScript code here
const MAX_WIDTH = Math.max(1080, window.innerWidth);
const MAX_HEIGHT = 720;
const margin = {top: 40, right: 100, bottom: 40, left: 175};
const NUM_EXAMPLES = 20;
const light_color = "#ff636e"
const orange = "#ff7b61"
const med_color = "#d6202c"
const dark_color = "#bd2f38"
const yellow = "#ffd563"
const blue = "#7a8cff"

// Assumes the same graph width, height dimensions as the example dashboard. Feel free to change these if you'd like
let graph_1_width = (MAX_WIDTH / 2) - 10, graph_1_height = 350;
let graph_2_width = (MAX_WIDTH / 2) - 10, graph_2_height = 350;
let graph_3_width = MAX_WIDTH / 2 - 10, graph_3_height = 425;

let svg_runtime = null;
let svg_genres = null;

// Load the movie data from the provided netflix.csv 
d3.csv("netflix.csv").then(function(d) {
    buildGenreBarGraph(d);
    buildRuntimeGraph(d);
    buildFlowChart(d);
});

// given a row (movie) of the netflix.csv, returns the runtime in minutes as an int
function cleanDuration(row) {
    let split = row.duration.split(' ')
    if(split[1] == "min") {
        return parseInt(split[0]);
    } else {
        return null;
    }  
}

/**
 * Cleans the provided data using the given comparator then strips to first numExamples
 * instances
 */
function cleanData(data_init, comparator, numExamples) {
    return data_init.sort(comparator).slice(0, numExamples);
}