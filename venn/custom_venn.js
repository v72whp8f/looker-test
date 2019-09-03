looker.plugins.visualizations.add({
  id: "sample_venn",
  label: "Sample_venn",
  options: {
  },

  create: function(element, config) {
    element.innerHTML = `
      <style>
        .venntooltip {
          position: absolute;
          text-align: center;
          width: 128px;
          height: 16px;
          background: #333;
          color: #ddd;
          padding: 2px;
          border: 0px;
          border-radius: 8px;
          opacity: 0;
        }

        .chart {
          display: none;
        }

        .chart .legend {
          fill: black;
          font: 14px sans-serif;
          text-anchor: start;
          font-size: 12px;
        }

        .chart text {
          fill: black;
          font: 10px sans-serif;
          text-anchor: end;
        }

        .chart .label {
          fill: black;
          font: 14px sans-serif;
          text-anchor: end;
        }

        .bar:hover {
          fill: brown;
        }

        .axis path,
        .axis line {
          fill: none;
          stroke: #000;
          shape-rendering: crispEdges;
        }
      </style>
    `;

    var venn_area = element.appendChild(document.createElement("div"));
    venn_area.id = "venn";

    var tooltip = element.appendChild(document.createElement("div"));
    tooltip.className = "venntooltip";

    for (var i=1; i<=7; i++) {
      var chart_area = element.appendChild(document.createElement("div"));
      chart_area.id = "chart_" + i;
      chart_area.className = "chart";
    }
  },

  updateAsync: function(data, element, config, queryResponse, details, done) {
    this.clearErrors();

    createVenn(getVennData());

    for (var i=1; i<=7; i++) {
      var data = {
        series: [
          {
            label: "男性",
            values: getRondomValues()
          },
          {
            label: "女性",
            values: getRondomValues()
          }
        ]
      };

      createBarChart("chart_" + i, data);
    }

    done()
  }
});

function getVennData() {
  return [
    {sets: ["A"], size: 200, relation_chart: "chart_1"},
    {sets: ["B"], size: 250, relation_chart: "chart_2"},
    {sets: ["C"], size: 300, relation_chart: "chart_3"},
    {sets: ["A","B"], size: 80, relation_chart: "chart_4"},
    {sets: ["A","C"], size: 70, relation_chart: "chart_5"},
    {sets: ["B","C"], size: 75, relation_chart: "chart_6"},
    {sets: ["A","B","C"], size: 20, relation_chart: "chart_7"},
  ];
}

function createVenn(sets) {
  // create diagram
  var div = d3.select("#venn")
  div.datum(sets).call(venn.VennDiagram());

  // add a tooltip
  var tooltip = d3.select("body").append("div")
    .attr("class", "venntooltip");

  div.selectAll("path")
    .style("stroke-opacity", 0)
    .style("stroke", "#fff")
    .style("stroke-width", 3);

  // add listeners to all the groups to display tooltip on mouseover
  div.selectAll("g")
    .on("click", function(d, i) {
      $("[id^='chart_").hide();
      $("#" + d.relation_chart).show();
    })

    .on("mouseover", function(d, i) {
      // sort all the areas relative to the current item
      venn.sortAreas(div, d);

      // Display a tooltip with the current size
      tooltip.transition().duration(400).style("opacity", .9);
      tooltip.text(d.size + " users");

      // highlight the current path
      var selection = d3.select(this).transition("tooltip").duration(400);
      selection.select("path")
        .style("stroke-width", 3)
        .style("fill-opacity", d.sets.length == 1 ? .4 : .1)
        .style("stroke-opacity", 1);
    })

    .on("mousemove", function() {
      tooltip.style("left", (d3.event.pageX) + "px")
        .style("top", (d3.event.pageY - 28) + "px");
    })

    .on("mouseout", function(d, i) {
        tooltip.transition().duration(400).style("opacity", 0);
        var selection = d3.select(this).transition("tooltip").duration(400);
        selection.select("path")
          .style("stroke-width", 0)
          .style("fill-opacity", d.sets.length == 1 ? .25 : .0)
          .style("stroke-opacity", 0);
    });
}

function createBarChart(id, data) {
  var labels = ["10代", "20代", "30代", "40代", "50代", "60代"];

  var chartWidth       = 300,
      barHeight        = 15,
      groupHeight      = barHeight * data.series.length,
      gapBetweenGroups = 10,
      spaceForLabels   = 150,
      spaceForLegend   = 150;

  // Zip the series data together (first values, second values, etc.)
  var zippedData = [];
  for (var i=0; i<labels.length; i++) {
    for (var j=0; j<data.series.length; j++) {
      zippedData.push(data.series[j].values[i]);
    }
  }

  // Color scale
  var color = ["#68A4D9", "#ef857d"];
  var chartHeight = barHeight * zippedData.length + gapBetweenGroups * labels.length;

  var x = d3.scaleLinear()
      .domain([0, d3.max(zippedData)])
      .range([0, chartWidth]);

  var y = d3.scaleLinear()
      .range([chartHeight + gapBetweenGroups, 0]);

  var yAxis = d3.axisLeft(y)
      .tickFormat("")
      .tickSizeInner(0);

  // Specify the chart area and dimensions
  d3.select("#" + id).append("svg");
  var chart = d3.select("#" + id + " svg")
      .attr("width", spaceForLabels + chartWidth + spaceForLegend)
      .attr("height", chartHeight);

  // Create bars
  var bar = chart.selectAll("g")
      .data(zippedData)
      .enter().append("g")
      .attr("transform", function(d, i) {
        return "translate(" + spaceForLabels + "," + (i * barHeight + gapBetweenGroups * (0.5 + Math.floor(i/data.series.length))) + ")";
      });

  // Create rectangles of the correct width
  bar.append("rect")
      .attr("fill", function(d,i) { return color[i % data.series.length]; })
      .attr("class", "bar")
      .attr("width", x)
      .attr("height", barHeight - 1);

  // Add text label in bar
  bar.append("text")
      .attr("x", function(d) { return x(d) - 3; })
      .attr("y", barHeight / 2)
      .attr("fill", "red")
      .attr("dy", ".35em")
      .text(function(d) { return d; });

  // Draw labels
  bar.append("text")
      .attr("class", "label")
      .attr("x", function(d) { return - 10; })
      .attr("y", groupHeight / 2)
      .attr("dy", ".35em")
      .text(function(d,i) {
        if (i % data.series.length === 0)
          return labels[Math.floor(i/data.series.length)];
        else
          return ""});

  chart.append("g")
        .attr("class", "y axis")
        .attr("transform", "translate(" + spaceForLabels + ", " + -gapBetweenGroups/2 + ")")
        .call(yAxis);

  // Draw legend
  var legendRectSize = 18,
      legendSpacing  = 4;

  var legend = chart.selectAll(".legend")
      .data(data.series)
      .enter()
      .append("g")
      .attr("transform", function (d, i) {
          var height = legendRectSize + legendSpacing;
          var offset = -gapBetweenGroups/2;
          var horz = spaceForLabels + chartWidth + 40 - legendRectSize;
          var vert = i * height - offset;
          return "translate(" + horz + "," + vert + ")";
      });

  legend.append("rect")
      .attr("width", legendRectSize)
      .attr("height", legendRectSize)
      .style("fill", function (d, i) { return color[i]; })
      .style("stroke", function (d, i) { return color[i]; });

  legend.append("text")
      .attr("class", "legend")
      .attr("x", legendRectSize + legendSpacing)
      .attr("y", legendRectSize - legendSpacing)
      .text(function (d) { return d.label; });
}

function getRondomNumber() {
  return Math.floor(Math.random() * 101);
}

function getRondomValues() {
  var values = [];
  for (var i=0; i<6; i++) {
    values.push(getRondomNumber());
  }
  return values;
}
