/* Class that builds and updates the network graph representing actor's connections. */

let raw_data = null;
let default_selection = "Steven Spielberg";
let selected_dirs = [default_selection]; // default selection is Spielberg
let svg_flow = null;
let radius = null;
let ttip = null;
let simulation = null;

/**
 * Builds the flow chart where each actor is a node, and a link refers to a movie they both acted in 
 * (just the connection, no need to specify number of movies made together or which movies those are)
 */
function buildFlowChart(data) {

    raw_data = data
    setupDirectorSelector(data);

    // create tooltip ref
    ttip = d3.select("#runtime-graph")    
    .append("div")
    .attr("class", "tooltip")
    .attr("id", "network-tt")
    .style("opacity", 0); // initially invisible
     
    updateFlowChart(data)
}

let getTooltip = function(d) {
    return `<b>Actor:</b> ${d.name}<br/>
            <b>Films:</b> ${d.titles}`
}

let getLinkTooltip = function(d) {
    return `${d.source_name} x ${d.target_name}<br/>
            <b>Films:</b> ${d.titles}`
}

/* updates flow chart according to currently selected directors */
function updateFlowChart(data) {

    // filter data based on the currenlty selected director
    data = data.filter(row => row.type == "Movie" && validDirector(row.director, selected_dirs))

    // create svg for network graph
    svg_flow = d3.select("#flow-chart")
    .append("svg")
    .attr("id", "svg-flow-outer")
    .attr("width", graph_3_width)  
    .attr("height", graph_3_height)  
    .append("g")
    .attr("transform", `translate(0, ${margin.top})`)
    .attr("id", "svg-flow"); 

     // d3 linear scale for the size of nodes according to number of movies the pair of actors starred in
     radius = d3.scaleLinear().range([3,10]);

        // linkMap in form of: {actor_name: {source: actor_name, target: actor2_name, titles:[films]}}
        let actors = {}; linkMap = {}, titles = []
        let count = 0;
    
        for (const row of data) {
            // parse movie actors and add movie to color map
            let film_actors = row.cast.split(",").map(s => s.trim())
            titles.push(row.title)
    
            // add cross-wise pairs of actors as links
            if(film_actors.length > 1) {
                for (let i = 0; i < film_actors.length; i++) {
                    const a1 = film_actors[i];
                    // add actors to id map
                    if (!(a1 in actors)) {
                        actors[a1] = {id: count++, name: a1, count: 1, titles: [row.title]};
                    } else {
                        actors[a1].count++
                        if(!actors[a1].titles.includes(row.title)) {
                            actors[a1].titles.push(row.title);
                        }
                    }

                    // for each pair, 
                    for(let j = i + 1; j < film_actors.length; j++){
                        const a2 = film_actors[j]
                        if(!(a2 in actors)){
                            actors[a2] = {id: count++, name: a2, count: 1, titles: [row.title]};
                        } else {
                            actors[a2].count++;
                            if(!actors[a2].titles.includes(row.title)) {
                                actors[a2].titles.push(row.title);
                            }
                        }
                    
                        let pair = [actors[a1].id, actors[a2].id].sort() // sort so ordering is consistent
                        pair_code = `${pair[0]}x${pair[1]}`
                        if(pair_code in linkMap) {
                            linkMap[pair_code].titles.push(row.title);
                        } else {
                            linkMap[pair_code] = {
                                source: actors[a1].id, 
                                target: actors[a2].id, 
                                source_name: a1, 
                                target_name: a2, 
                                titles: [row.title]}
                        }
                    }
            }
            }
        }
    
        actors = Object.values(actors)
        let links = Object.values(linkMap)

        // display median and top number of connections
        sorted_actors = actors.sort((a, b) => b.count - a.count)
        med_actor = sorted_actors[Math.round(actors.length / 2)]
        document.getElementById("med-connections-count").innerHTML = `<b>${med_actor.count}</b><br/>(${med_actor.name})`
        document.getElementById("top-connections-count").innerHTML = `<b>${sorted_actors[0].count}</b><br/>(${sorted_actors[0].name})`

        let color_film = d3.scaleOrdinal()
        .domain(titles)
        .range(d3.quantize(d3.interpolateHcl(blue, orange), titles.length))

        //creates color for node by blending colors of films they starred in
        let color_node = function(d) {
            blend = null
            for(title of d.titles) {
                blend = blend ? d3.interpolateHcl(blend, color_film(title))(0.5) : color_film(title)
            }
            return blend
        }
    
        // Draw the links
        let link = svg_flow.append("g")
        .attr("id", "svg-flow-link")
        .selectAll("line")
        .data(links)
        .enter()
        .append("line")

        link.style("stroke", "gray")
        .attr("id", function(d) { return "link-" + d.source + "x" + d.target})
        // thickness of link is determined by number of movies the actors share
        .attr("stroke-width", 1.5)
        .attr("opacity", .4)
        .on("mouseover", function(d) {	
            // make the link brighter 
            d3.select("#svg-flow-link").select("#link-" + d.source.id + "x" + d.target.id)
            .attr("stroke-width", 4)
            .attr("opacity", 1)
            .style("stroke", yellow)

            // highlight nodes
            node.select('#node' + d.source.id)
            .style("fill", yellow)
            node.select('#node' + d.target.id)
            .style("fill", yellow)

            // add tooltip
            ttip.html(getLinkTooltip(d))
                .style("left", `${(d3.event.pageX)}px`)
                .style("top", `${(d3.event.pageY) - margin.top - margin.bottom}px`)
                .style("box-shadow", `2px 2px 5px gray`)  
                .transition()
                .duration(200)
                .style("opacity", 0.9)
        })
        .on("mouseout", function(d) {	
            // return the dot to normal styling	
            d3.select("#svg-flow-link").select("#link-" + d.source.id + "x" + d.target.id)
            .attr("opacity", .4)
            .attr("stroke-width", 1.5)
            .style("stroke", "gray");
            

            // unhighlight connected nodes
            node.select('#node' + d.source.id)
            .style("fill", color_node)
            node.select('#node' + d.target.id)
            .style("fill", color_node)

            // hide tooltip
            ttip.transition()
                .duration(200)
                .style("opacity", 0);
        })
    
        // d3 linear scale for the size of nodes according to number of movies the pair of actors starred in
         radius.domain(d3.extent(actors, function(d) { return d.count; }))
    
        // Draw the nodes
        let node = svg_flow.append("g")
        .attr("id", "svg-flow-node")
        .selectAll("g")
        .data(actors)
        .enter()
        .append("g");
    
        node.append("circle")
        .attr("r", function(d) { return radius(d.count)})
        .attr("id", function(d) { return "node" + d.id})
        .style("fill", color_node)
        .on("mouseover", function(d) {	
            // make the dot larger & a brighter color	
            node.select('#node' + d.id)
            .style("fill", yellow)
            .attr("r", function(d) { return radius(d.count) + 3});
            // add tooltip
            ttip.html(getTooltip(d))
                .style("left", `${(d3.event.pageX)}px`)
                .style("top", `${(d3.event.pageY) - margin.top - margin.bottom}px`)
                .style("box-shadow", `2px 2px 5px gray`)  
                .transition()
                .duration(200)
                .style("opacity", 0.9)
        })
        .on("mouseout", function(d) {	
            // return the dot to normal styling	
            node.select('#node' + d.id)
            .style("fill", color_node)
            .attr("r", function(d) { return radius(d.count)});
            // hide tooltip
            ttip.transition()
                .duration(200)
                .style("opacity", 0);
        }).call(d3.drag()
        .on("start", nodeDragStart)
        .on("drag", nodeDragged)
        .on("end", nodeDragEnd));


           // Define forces along X and Y axes with custom center and strength values
        const forceX = d3.forceX(graph_3_width / 2).strength(0.025);
        const forceY = d3.forceY((graph_3_height + margin.top) / 2).strength(0.05);
    
        // Graph title
        let graph_title = svg_flow.append("text")
        .attr("transform", `translate(${(graph_3_width / 2)}, ${-20})`)
            .style("text-anchor", "middle")
            .style("font-size", 15).html(`Connections* between Actors for Films Directed by ${selected_dirs.reduce((prev, cur, i) => prev + (i < selected_dirs.length ? " or " : "") + cur)}`);

        // Graph subtitle
        svg_flow.append("text")
        .attr("transform", `translate(${(graph_3_width / 2)}, ${-0})`)
            .style("text-anchor", "middle")
            .attr("fill", "gray")
            .style("font-size", 11).text(`*Connections are defined as Netflix films that both actors starred in.`);
            
        console.log(actors.length)
        charge = d3.forceManyBody().theta(0.8).distanceMax(150);
        if (actors.length <= 50) {
            charge = charge.strength(-65)
        } else if(actors.length > 50 && actors.length < 80){
            charge = charge.strength(-45)
        } else if(actors.length >= 80){
            charge = charge.strength(-30)
        }

        // Create D3 forceSimulation for graph
        simulation = d3.forceSimulation()
            .force('x', forceX)
            .force('y',  forceY)
            // Use data id field for links
            .force("link", d3.forceLink().id(function(d) { return d.id }))
            .force("charge", charge) // causes elements to repel eachother
            .force("center", d3.forceCenter((graph_3_width) / 2,
                (graph_3_height - margin.top) / 2))
    
        // start node animation and add nodes & link to simulation
        simulation.nodes(actors).on("tick", ticked);
        simulation.force("link").links(links);
    
        /**
         * Function called for each tick of the animation -- determines location of nodes & links.
         */
        function ticked() {
            link.attr("x1", function(d) { return d.source.x; })
                 .attr("y1", function(d) { return d.source.y; })
                 .attr("x2", function(d) { return d.target.x; })
                 .attr("y2", function(d) { return d.target.y; });
     
            // bounding box to contain nodes within dimensions of svg 
            node.attr("transform", function(d) {
                     let r = radius(d.count);
                     d.x = Math.max(r,
                         Math.min(graph_3_width - r, d.x));
                     d.y = Math.max(r,
                         Math.min((graph_3_height - margin.top - margin.bottom) - r, d.y));
                     return "translate(" + d.x + "," + d.y + ")";
                 });  
        }
}

/* Populates director dropdowns with the top 20 most occuring directors */ 
function setupDirectorSelector(data) {
    const top_dirs = findTopDirectors(data, 20);
    const selects = [document.getElementById("director1-select"), document.getElementById("director2-select"), document.getElementById("director3-select")]
    for(select of selects) {
        for(dir of top_dirs){
            let option = document.createElement('option')
            option.value = dir;
            option.text = dir;
            select.add(option)
        }
    }

    // set default selection of first dropdown
    document.getElementById("director1-select").options[0].selected = false;
    document.getElementById("director1-select").options[1].selected = true;
    selected_dirs = [document.getElementById("director1-select").options[1].value]
    
    // add listeners for selectors
    document.getElementById("director1-select").addEventListener("change", (ev) => {onDirectorChange()})
    document.getElementById("director2-select").addEventListener("change", (ev) => {onDirectorChange()})
    document.getElementById("director3-select").addEventListener("change", (ev) => {onDirectorChange()})
}

/* Update flowchart based on newly selected directors */
function onDirectorChange(){
    d3.select("#svg-flow-outer").remove()
    selected_dirs = [];
    const selects = [document.getElementById("director1-select"), document.getElementById("director2-select"), document.getElementById("director3-select")]
    for(select of selects) {
        let val = select.options[select.selectedIndex].value;
        if (val != "" && !selected_dirs.includes(val)){
            selected_dirs.push(val);
        }
    }
    updateFlowChart(raw_data)
}

/** Returns true if the given director value is one of the currently selected directors */
function validDirector(dirName, activeDirectors) {
    for(dir of activeDirectors){
        if(dirName.includes(dir)) {
            return true;
        }
    }
    return false
}

/* Finds top n directors in database */
function findTopDirectors(data, n) {
    // get all directors and clean data
    dirs = data.flatMap(row => {
        act_list = row.cast.split(",").map(s => s.trim());
        if(act_list.length > 1){
            return row.director;
        } 
    })
    counts = {}
    for(dir of dirs) {
        if(dir !== "" && dir != undefined){
            counts[dir] = counts[dir] ? counts[dir] + 1 : 1;
        }
    }
    // get top n directors
    top_n = Object.keys(counts).sort((a, b) => (counts[b] - counts[a])).slice(0,n)
    return top_n
}

/** 
 * Standard drag functoins for interactivity, based on the d3 example: https://bl.ocks.org/Restuta/e4533c4e8c8bbb43fa361a1e1525a3c2 
 * */

/**
 * Called when user starts to drag node.
 */
function nodeDragStart(d) {
    if (!d3.event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
}

/**
 * Moves node when user drags it.
 */
function nodeDragged(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
}

/**
 * Ends node movement when user releases node.
 */
function nodeDragEnd(d) {
    if (!d3.event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
}