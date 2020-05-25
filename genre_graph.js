/**
 * Builds the bar graph that displays the number of titles per genre.
 */
function buildGenreBarGraph(data_init) {

    let svg_genre = d3.select("#bar-plot")
        .append("svg")
        .attr("width", graph_1_width)  
        .attr("height", graph_1_height)   
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`)
        .attr("id", "svg-genre"); 

    // Set up reference to count SVG group
    let countRef = svg_genre.append("g");

    // count number of titles per genre
    num_titles_per_genre = {}
    for (const row of data_init) {
        let row_genres = row.listed_in.split(",").map(s => s.trim())
        // increment count for each genre
        for (const genre of row_genres){
            if (!num_titles_per_genre[genre]){
                num_titles_per_genre[genre] = 1
            } else {
                num_titles_per_genre[genre] = num_titles_per_genre[genre] + 1;
            }
        }
    }
    // convert json of counts to array of {genre: count}
    bar_data = []
    let id = 0;
    for(var key in num_titles_per_genre)
        bar_data.push([key, num_titles_per_genre[key], id++]);
    bar_data = cleanData(bar_data, function(a, b) { return b[1] - a[1] }, NUM_EXAMPLES);
    let genres = bar_data.map(x => x[0])
    
    // add bar graph to DOM!
    let bars = svg_genre.selectAll("rect").data(bar_data);

    // determines x location of bar
    let x_bar = d3.scaleLinear()
    .domain([0, d3.max(bar_data, function(d) { return d[1]; })])
    .range([0, graph_1_width - margin.left - margin.right]);

    // determined y location of bar
    let y_bar = d3.scaleBand()
        .domain(genres)
        .range([0, graph_1_height  - margin.top - margin.bottom])
        .padding(0.2);

    // color scale
    let genre_color = d3.scaleOrdinal()
        .domain(genres)
        .range(d3.quantize(d3.interpolateHcl(light_color, dark_color), NUM_EXAMPLES));

    bars.enter()
        .append("rect")
        .merge(bars)
        .attr("fill", function(d) { return genre_color(d[0]) }) 
        .attr("x", x_bar(0))
        .attr("y", function(d) {return y_bar(d[0])})  
        .attr("width", function(d) { return x_bar(d[1]); })
        .attr("height",  y_bar.bandwidth())
        // Set up mouse interactivity functions
        .on("mouseover", (d) => bar_mouseover(d[2], svg_genre, genre_color(d[0])))
        .on("mouseout", (d) => bar_mouseout(d[2], svg_genre, genre_color(d[0])))
        .attr("id", function(d) { return `${svg_genre.attr("id")}-rect-${d[2]}` });

    // Add y-axis label
    svg_genre.append("g")
        .call(d3.axisLeft(y_bar).tickSize(0).tickPadding(10))

    let counts = countRef.selectAll("text").data(bar_data);

    // add labels that show counts
    label_padding = 8
    counts.enter()
        .append("text")
        .merge(counts)
        .attr("x", function(d) { return (label_padding + x_bar(d[1]))})
        .attr("y", function(d) { return (label_padding + y_bar(d[0]))})
        .style("font-size", 12)        
        .style("text-anchor", "start")
        .text(function(d) { return d[1]})
        .attr("id", function(d) { return `${svg_genre.attr("id")}-count-${d[2]}` });   
                

    // Add x-axis label
    svg_genre.append("text")
        .attr("transform", `translate(${(graph_1_width - margin.left - margin.right) / 2},
                                        ${(graph_1_height - margin.top - margin.bottom) + 15})`)       // HINT: Place this at the bottom middle edge of the graph
        .style("text-anchor", "middle")
        .text("Number of Titles");

    // Add y-axis label
    svg_genre.append("text")
        .attr("transform", `translate(-120, ${(graph_1_height - margin.top - margin.bottom) / 2})`)       // HINT: Place this at the center left edge of the graph
        .style("text-anchor", "middle")
        .text("Genre");

    // Add chart title
    svg_genre.append("text")
        .attr("transform", `translate(${(graph_1_width - margin.left - margin.right) / 2}, ${-10})`)       // HINT: Place this at the top middle edge of the graph
        .style("text-anchor", "middle")
        .style("font-size", 15)
        .text("Number of Titles per Genre");
}

/***** MOUSE INTERACTIONS *****/

// On mouseover, brighten bar and bold the count for that bar
let bar_mouseover = function(elementid, svg, color) {
    svg.select(`#${svg.attr("id")}-rect-${elementid}`).attr("fill", function(d) {
        //return d3.hsl(color).darker(.7);
        return blue;
    });
    svg.select(`#${svg.attr("id")}-count-${elementid}`).attr("fill", function(d) {
        //return d3.hsl(color).darker(.7);
        return blue;
    }).style("font-weight", function(d) {
        return 700;
    }).style("font-size", function(d) {
        return 13;
    })
};

// On mouseout, return bar to normal color and count to normal weight 
let bar_mouseout = function(elementid, svg, color) {
    svg.select(`#${svg.attr("id")}-rect-${elementid}`)
        .attr("fill", function(d) { return color })
    
    svg.select(`#${svg.attr("id")}-count-${elementid}`).attr("fill", function(d) {
        return "black";
    }).style("font-weight", function(d) {
        return 400;
    }).style("font-size", function(d) {
        return 12;
    })
};