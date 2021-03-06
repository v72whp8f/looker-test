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

    setGraphData(getSampleData());

    createVenn(getVennData());

    for (var i=0; i<graphData.length; i++) {
      var chart_data = {
        series: [
          {
            label: "男性",
            values: graphData[i].male
          },
          {
            label: "女性",
            values: graphData[i].female
          }
        ]
      };

      createBarChart("chart_" + (i+1), chart_data);
    }

    done()
  }
});

var labels = [];
var graphData = [];

function setGraphData(data) {
  labels = [];
  graphData = [];

  for (var i=0; i<7; i++) {
    graphData.push({ total: 0, male: [], female: [] });
  }

  data.forEach(function(row) {
    graphData[0].total += row.count_a.value;
    graphData[1].total += row.count_b.value;
    graphData[2].total += row.count_c.value;
    graphData[3].total += row.count_a_b.value;
    graphData[4].total += row.count_a_c.value;
    graphData[5].total += row.count_b_c.value;
    graphData[6].total += row.count_a_b_c.value;

    if (row.nage.value == null) {
      return;
    }

    if ($.inArray(row.nage.value, labels) < 0) {
      labels.push(row.nage.value);
    }

    if (row.sex.value == "男性") {
      graphData[0].male.push(row.count_a.value);
      graphData[1].male.push(row.count_b.value);
      graphData[2].male.push(row.count_c.value);
      graphData[3].male.push(row.count_a_b.value);
      graphData[4].male.push(row.count_a_c.value);
      graphData[5].male.push(row.count_b_c.value);
      graphData[6].male.push(row.count_a_b_c.value);
    } else if (row.sex.value == "女性") {
      graphData[0].female.push(row.count_a.value);
      graphData[1].female.push(row.count_b.value);
      graphData[2].female.push(row.count_c.value);
      graphData[3].female.push(row.count_a_b.value);
      graphData[4].female.push(row.count_a_c.value);
      graphData[5].female.push(row.count_b_c.value);
      graphData[6].female.push(row.count_a_b_c.value);
    }
  });
}

function getVennData() {
  return [
    {sets: ["A"], size: graphData[0].total, relation_chart: "chart_1"},
    {sets: ["B"], size: graphData[1].total, relation_chart: "chart_2"},
    {sets: ["C"], size: graphData[2].total, relation_chart: "chart_3"},
    {sets: ["A","B"], size: graphData[3].total, relation_chart: "chart_4"},
    {sets: ["A","C"], size: graphData[4].total, relation_chart: "chart_5"},
    {sets: ["B","C"], size: graphData[5].total, relation_chart: "chart_6"},
    {sets: ["A","B","C"], size: graphData[6].total, relation_chart: "chart_7"},
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
      $("[id^='chart_'").hide();
      $("#" + d.relation_chart).show();

      parentPost(d.relation_chart);
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
  var color = ["#68a4d9", "#ef857d"];
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

function getRondomNumber(max_value) {
  return Math.floor(Math.random() * (max_value + 1));
}

function getSampleData() {
  var data = [];
  var sample_labels = ["10代", "20代", "30代", "40代", "50代", "60代"];

  sample_labels.forEach(function(label) {
    data.push({
      nage: { value: label },
      sex: { value: "女性" },
      count_a: { value: getRondomNumber(500) },
      count_b: { value: getRondomNumber(500) },
      count_c: { value: getRondomNumber(500) },
      count_a_b: { value: getRondomNumber(200) },
      count_a_c: { value: getRondomNumber(200) },
      count_b_c: { value: getRondomNumber(200) },
      count_a_b_c: { value: getRondomNumber(100) },
    });

    data.push({
      nage: { value: label },
      sex: { value: "男性" },
      count_a: { value: getRondomNumber(500) },
      count_b: { value: getRondomNumber(500) },
      count_c: { value: getRondomNumber(500) },
      count_a_b: { value: getRondomNumber(200) },
      count_a_c: { value: getRondomNumber(200) },
      count_b_c: { value: getRondomNumber(200) },
      count_a_b_c: { value: getRondomNumber(100) },
    });
  });

  data.push({
    nage: { value: null },
    sex: { value: null },
    count_a: { value: getRondomNumber(1000) },
    count_b: { value: getRondomNumber(1000) },
    count_c: { value: getRondomNumber(1000) },
    count_a_b: { value: getRondomNumber(400) },
    count_a_c: { value: getRondomNumber(400) },
    count_b_c: { value: getRondomNumber(400) },
    count_a_b_c: { value: getRondomNumber(100) },
  });

  return data;
}

function parentPost(chart_id) {
  window.parent.parent.postMessage(chart_id , "https://localhost");
}
