function twitch(){
    let filePath="twitch_gamers/large_twitch_features.csv";
    read(filePath);
}

let read=function(filePath){
    //CODE ADAPTED FROM D3.js GRAPH GALLERY, LABS, AND LECTURE EXERCISES

    d3.csv(filePath).then(function(data){
        // console.log(data)
        
        // node(); //this uses data.json 
        geo(data);    
    });

    d3.csv('game_data/Twitch_game_data.csv',function (d){
      d.month = parseInt(d.Month, 10);
      d.year = parseInt(d.Year);
      d.rank = parseInt(d.Rank);
      d.avg_views = parseInt(d.Avg_viewers)
      d.game = d.Game
      return d;
    }).then(function(data){
      // console.log(data);
      bar(data)
    });
}

let node=function() {

    d3.json("node_data.json").then(function(data) {
        //margins
        const margin = { top: 100, bottom: 50, left: 40, right: 40 };
        const width = 1280 - margin.left - margin.right;
        const height = 720 - margin.top - margin.bottom;
        data['edges'] = []
        for(let i=0; i < data.links.length; i++){
          obj={}
          obj["source"]=data.links[i]["source"]
          obj["target"]=data.links[i]["target"]
          data.edges.push(obj);
      }

      const svg = d3.select("#node_plot")
        .append("svg")
        .attr("width",width-margin.right-margin.left)
        .attr("height",height-margin.top-margin.bottom);
    
      // title
      svg.append("text")
        .attr("x", width / 2)
        .attr("y", margin.top / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-family", "Helvetica")
        .style("font-weight", "bold")
        .text("Streamers and Their Shared Viewers");
    
      const scale = d3.scaleLinear()
        .domain(d3.extent(data.links, d=> d.value))
        .range([1,10]);
    
      const link = svg.selectAll("line")
        .data(data.links)
        .enter()
        .append("line")
        .style("stroke", "#ccc")
        // .style("stroke-width", d=> scale(d.value))
        .style("stroke-width", 0.2);
    
      const color = d3.scaleOrdinal()
        .range(["#6441a5"])
      
      //create nodes using "circle" elements
      let node = svg.append("g")
        .attr("class", "nodes")
        .selectAll("circle")
        .data(data.nodes)
        .enter().append("circle")
        .attr("r", 10)
        .attr("fill", d=> color(d.id));
    
      const label = svg.append("g")
        .attr("class", "labels")
        .selectAll("text")
        .data(data.nodes)
        .join("text")
        .attr("class", "label")
        .text(d => d.name)
        .style("fill","black");
    
      //create force graph adapted from lab
      const force = d3.forceSimulation(data.nodes)
        .force("charge", d3.forceManyBody())
        .force("link", d3.forceLink(data.links).id((d) => d.id).distance(500))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("collide", d3.forceCollide(10));
    
      //force code adapted from lab
      force.on("tick", function () {
        link.attr("x1", function (d) {
            return d.source.x;
        })
            .attr("y1", function (d) {
                return d.source.y;
            })
            .attr("x2", function (d) {
                return d.target.x;
            })
            .attr("y2", function (d) {
                return d.target.y;
            });
        node.attr("cx", function (d) {
            return d.x;
        })
            .attr("cy", function (d) {
                return d.y;
            });
        label.attr("x", function (d) {
            return d.x+3;
        })
            .attr("y", function (d) {
                return d.y+3;
            })
            .style("font-size", "8px");
        });
    
      //zoom from lab
      let zoom = d3.zoom()
        .scaleExtent([0.1, 3])
        .on('zoom', function(event) {
            svg.selectAll("g")
            .attr('transform', event.transform);
            svg.selectAll("line")
            .attr('transform', event.transform);
        });
    
      svg.call(zoom).call(zoom.transform, d3.zoomIdentity.scale(1));
    
      })
}

let geo=function(data){
    let width = 1000;
    let height = 1000;
      
    //data preproccessing
    let viewsByLang = d3.rollup(data, 
      v => d3.sum(v,d => d['views']), 
      d => d['language'])
  
    viewsByLang = new Map(
      Array.from(viewsByLang, ([country, value]) => [country, value])
    );

    console.log(viewsByLang);  

    //map adapted from lecture exercise
    const svg = d3.select("#map_plot")
        .append("svg")
        .attr("width", width)
        .attr("height", height);
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", 200)
        .attr("text-anchor", "middle")  
        .style("font-size", "16px") 
        .style("font-family", "Helvetica")
        .style("font-weight", "bold")
        .style("fill", "white")
        .text("Viewers by Language");

    //map and projection (adapted from d3 graph gallery and lab)
    const projection  = d3.geoNaturalEarth1()
                            .scale(200)
                            .translate([width/2, height/2])

    const pathgeo = d3.geoPath().projection(projection);

    const tooltip = d3.select('#tooltip');

    const minValue = d3.min(Array.from(viewsByLang.values()));
    const maxValue = d3.max(Array.from(viewsByLang.values()));

    const colorScale = d3.scaleLog()
    .domain([minValue,maxValue])
    .range(["#560bad", "#9b59b6"]);

    d3.json("renamed_worldgeo.json").then(map =>{
        // console.log(map);
        
        svg.selectAll('.worldpath')
            .data(map.features)
            .enter()
            .append("path")
            .attr('class', 'worldpath')
            .attr('d', pathgeo)
            .on("mouseover", function (event,d) {
              tooltip.html('Language: ' + d.properties.name + '<br>' + 'Country: ' +d.id + '<br>' + 'Total Views: ' + viewsByLang.get(d.properties.name))
                .style("opacity", 1)
                .style("position", "absolute")
                .style("background-color", "#6441a5")
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 10) + "px");
            })
            .on("mouseout", function() {
              tooltip.style("opacity", 0);
            })
            .attr("fill", function(d){
                const country = d.properties.name;
                const views = viewsByLang.get(country) || 0;
                return colorScale(views);
              })
              .style('stroke','black')
    });

}

let bar=function(data){
  // console.log(data);

  const margin = { top: 100, bottom: 50, left: 40, right: 40 };
  const width = 1000 - margin.left - margin.right;
  const height = 500 - margin.top - margin.bottom;

  const svg = d3
    .select("#bar_plot")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left + 40}, ${margin.top})`);

  // title
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", (margin.top / 2) - 100)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .style("font-family", "Helvetica")
    .style("font-weight", "bold")
    .style("fill", "white")
    .text("Top 5 Twitch Games in a Year");


  render('2016');

  function render(year) {

    svg.select('.x-axis').remove();
    svg.select('.y-axis').remove();
    svg.selectAll('.gbars').remove();
    svg.selectAll('.legend').remove();
    d3.select("#legend").select("svg").remove();

    const filtered = data.filter((d) => d['Year'] === year && d.rank <= 5);
    
    gameByMonth = d3.group(filtered, d => d.month, v => v.game)
    gameByMonth.forEach((value, key, map) => {
      // Access the internal map (value) for each month
      const views = {};
      value.forEach(d => {
        if (views[d[0].game]) {
          views[d[0].game] += parseFloat(d[0].avg_views);
        } else {
          views[d[0].game] = parseFloat(d[0].avg_views);
        }
        });

      const desiredValue = views;
    
      map.set(key, desiredValue);
    });


    const arr = Array.from(gameByMonth, ([key, val]) => ({
      month: key,
      ...val 
    }));
      
    //create stack of subcategory
    var subcategory = Array.from(new Set(filtered.map(function (d) {
      return d.game;
    })));

    const colorScale = d3.scaleOrdinal()
      .domain(subcategory)
      .range(d3.schemeCategory10);  

    const series = d3.stack().keys(subcategory);
    const stacked = series(arr);

    const xScale = d3.scaleBand()
      .domain(arr.map(d => d.month))
      .range([0, width])
      .padding(0.1);



    let maxValue = d3.max(stacked, (d) => d3.max(d, (d) => d[1]));
    console.log(maxValue);

    const yScale = d3.scaleLinear()
      .domain([0, maxValue])
      .range([height, 0]);

    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    // define axes
    const xAxis = d3.axisBottom()
      .scale(xScale)
      .tickFormat((d) => months[d - 1]);
    const yAxis = d3.axisLeft()
      .scale(yScale)

    svg.append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0, ${height})`)
      .call(xAxis)
      .selectAll(".tick text")
      .attr("transform", "translate(-10)rotate(-45)")
      .style("text-anchor", "end");
    
    svg.append("g")
      .attr("class", "y-axis")
      .call(yAxis)
      .selectAll(".tick text")
      .style("font-size", "8px");;

    //x axis label
    svg.append("text")
      .attr("text-anchor", "end")
      .attr("x", width/2)
      .attr("y", height + 50)
      .text("Months")
      .style("fill", "white");

    // y axis label
    svg.append("text")
        .attr("text-anchor", "end")
        .attr("transform", "rotate(-90)")
        .attr("y", -margin.left-10)
        .attr("x", -margin.top)
        .text("Average Viewership")
        .style("fill", "white")

      // create a tooltip
    var tooltip = d3.select("#bar_plot")
      .append("div")
      .style("position", "absolute")
      .style("background-color", "#6441a5")
      .style("border", "solid")
      .style("border-width", "2px")
      .style("border-radius", "5px")
      .style("padding", "5px")
      .style("visibility", "hidden");

    //add groups
    const groups = svg.selectAll(".gbars")
      .data(stacked).enter().append('g')
      .attr('class','gbars')
      .attr('fill', (d) => colorScale(d.key));


    groups.selectAll("rect")
      .data(d => d)
      .enter()
      .append("rect")
      .attr("x", (d) => xScale(d.data.month))
      .attr("y", (d) => yScale(d[1]))
      .attr("height", d => {
        const height = yScale(d[0]) - yScale(d[1]);
        return isNaN(height) ? 0 : height;
      })
      .attr("width", xScale.bandwidth())
      .on("mouseover", function(){return tooltip.style("visibility", "visible");})
      .on("mousemove", function(d){
        var data = d3.select(this).data()[0];
        return tooltip
        .html("Views: " + Math.round(data[1] - data[0]))
        .style("top", (event.pageY-50)+"px")
        .style("left",(event.pageX-50)+"px");})
      .on("mouseout", function(){return tooltip.style("visibility", "hidden");});

    // Define the legend dimensions and positioning
    const lw = 300;
    const lh = subcategory.length * 25;

    const legendsvg = d3.select("#legend")
      .append("svg")
      .attr("width", lw)
      .attr("height", lh);

    // Create legend items
    const items = legendsvg.selectAll(".item")
      .data(subcategory)
      .enter()
      .append("g")
      .attr("class", "legend-item")
      .attr("transform", (d, i) => `translate(0, ${i * 25})`);

    // Add colored rectangles to represent the games
    items.append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", 20)
      .attr("height", 20)
      .attr("fill", (d) => colorScale(d));

    // Add text labels for the games
    items.append("text")
      .attr("x", 30)
      .attr("y", 15)
      .style("font-size", "12px")
      .text((d) => d)
      .style("fill", "white");

  }

  d3.select("#select_year").on("change", function () {
    const selected = d3.select(this).property("value");
    render(selected);
  });
}