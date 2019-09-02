looker.plugins.visualizations.add({
  id: "venn",
  label: "Venn",
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
      </style>

      <div id="venn"></div>
      <div class="venntooltip"></div>
    `;

    var container = element.appendChild(document.createElement("div"));
    container.id = "venn";

    var tooltip = element.appendChild(document.createElement("div"));
    tooltip.className = "venntooltip";
  },

  updateAsync: function(data, element, config, queryResponse, details, done) {
    this.clearErrors();

    if (queryResponse.fields.dimensions.length == 0) {
      this.addError({title: "No Dimensions", message: "This chart requires dimensions."});
      return;
    }

    element.innerHTML = `
      <script>
      //ベン図データセット
      var sets = [
          {sets: ['A'], size: 200},
          {sets: ['B'], size: 250},
          {sets: ['C'], size: 300},
          {sets: ['A','B'], size: 80},
          {sets: ['A','C'], size: 70},
          {sets: ['B','C'], size: 75},
          {sets: ['A','B','C'], size: 20},
      ];

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
            window.open('https://www.google.co.jp/search?q=' + d.sets.join('+'));
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
      </script>
    `;

    done()
  }
});
