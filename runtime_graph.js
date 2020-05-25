/**
 * Builds the line graph that displays the average runtime per year.
 */
function buildRuntimeGraph(data) {

    svg_runtime = d3.select("#runtime-graph")
        .append("svg")
        .attr("width", graph_2_width)  
        .attr("height", graph_2_height)   
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`)
        .attr("id", "svg-runtime"); 

    // Set up reference to count SVG group
    let countRef = svg_runtime.append("g");

    // create tooltip ref
    let tooltip = d3.select("#runtime-graph")    
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0); // initially invisible

    let getTooltip = function(d) {
        return `<b>Year:</b> ${d.key}<br/>
                <b>Avg Runtime:</b> ${d.value} min<br/>`
    }
    
    // filter data to only include movies
    data = data.filter(row => row.type == "Movie")

    // group data by year and find average runtime per year
    data = d3.nest()
        .key(function(d) { return d.release_year;})
        .rollup(function(d) { 
            return d3.mean(d, function(r) { return cleanDuration(r)} ).toFixed(1); 
        }).entries(data);

    // make data into list, order and clean
    data = data.sort(function(a, b) { return a.key - b.key})
    //let years = data.map(x => x.key)

    // determines y location of point
    let y = d3.scaleLinear()
      .domain([0, d3.max(data, function(d) { return parseInt(d.value); })])
      .range([graph_2_height - margin.top - margin.bottom, 0]);
    // y axis label
    svg_runtime.append("g")
      .call(d3.axisLeft(y));

    // determines x location of point
     let x = d3.scaleTime()
        .domain([Date.parse(d3.min(data, function(d) {return d.key})), Date.parse("2020")])
        .range([0, graph_2_width  - margin.left - margin.right])
    // x axis label
    svg_runtime.append("g")
        .attr("transform", "translate(0," + (graph_2_height - margin.top - margin.bottom) + ")")
        .call(d3.axisBottom(x))

    // add area under the curve
    var area = d3.area()
    .x(function(d) { return x(Date.parse(d.key)); })
    .y0(graph_2_height - margin.top - margin.bottom)
    .y1(function(d) { return y(d.value); });
    svg_runtime.append("path")
       .data([data])
       .attr("class", "area")
       .attr("d", area)
       .attr("fill", light_color)
       .attr("opacity", 0.8);

    // add dots
    svg_runtime.selectAll("dot")	
        .data(data)
        .enter().append("circle")								
        .attr("r", 3)		
        .attr("cx", function(d) { return x(Date.parse(d.key))})		 
        .attr("cy", function(d) { return y(d.value); })
        .attr("id", function(d) {return 'runtime-dot-' + d.key})
        .attr("fill", dark_color)		
        .on("mouseover", function(d) {	
            // make the dot larger & a brighter color	
            svg_runtime.select('#runtime-dot-' + d.key)
            .attr("fill", function(d) {
                return blue;
            }).attr("r", 6);
            // add tooltip
            tooltip.html(getTooltip(d, "runtime"))
                .style("left", `${(d3.event.pageX) + 5}px`)
                .style("top", `${(d3.event.pageY) - margin.top - margin.bottom - 12}px`)
                .style("box-shadow", `2px 2px 5px gray`)  
                .transition()
                .duration(200)
                .style("opacity", 0.95)
        })		
        .on("mouseout", function(d) {	
            // return the dot to normal styling	
            svg_runtime.select('#runtime-dot-' + d.key)
            .attr("fill", function(d) {
                return dark_color;
            }).attr("r", 3);
            // hide tooltip
            tooltip.transition()
                .duration(200)
                .style("opacity", 0);
        });
        

    let counts = countRef.selectAll("text").data(data);

    // add labels that show counts
    label_padding = 8
    counts.enter()
        .append("text")
        .merge(counts)
        .attr("x", function(d) { return (label_padding + x(d.value))})
        .attr("y", function(d) { return (label_padding + y(d.key))})
        .style("font-size", 12)      
        .style("text-anchor", "start")
        .text(function(d) { return d.value})
        .attr("id", function(d) { return `${svg_runtime.attr("id")}-count-${d.key}` });           

    // Add x-axis label
    svg_runtime.append("text")
        .attr("transform", `translate(${(graph_1_width - margin.left - margin.right) / 2},
                                        ${(graph_1_height - margin.top - margin.bottom) + 35})`)       
        .style("text-anchor", "middle")
        .text("Release Year");

    // Add y-axis label
    svg_runtime.append("text")
        .attr("transform", `translate(-100, ${(graph_1_height - margin.top - margin.bottom) / 2})`)       
        .style("text-anchor", "middle")
        .text("Avg Runtime (min)");

    // Add chart title
    svg_runtime.append("text")
        .attr("transform", `translate(${(graph_1_width - margin.left - margin.right) / 2}, ${-10})`)       
        .style("text-anchor", "middle")
        .style("font-size", 15)
        .text("Average Runtime of Netflix Movies per Release Year"); 


}