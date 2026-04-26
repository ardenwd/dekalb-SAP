var svg = d3.select("#vis").append("svg").attr("id", "svg");

const margin = { top: 40, right: 40, bottom: 50, left: 40 };
var width =
  document.getElementById("svg").clientWidth - margin.left - margin.right;
var height =
  document.getElementById("svg").clientWidth - margin.top - margin.bottom;

svg.attr("height", height).attr("width", width);

var lastSquare = null;
//scale for lat and long
var lscale;

//scale for capacity %
var capScale;

const capRectScale = d3.scaleLinear().domain([0, 2]).range([6, 92]);
const typeColors = ["#4E7415", "#8CAA3D", "#CCC853", "gray"];
const futureUseColors = ["#ffbbdc", "#c9aeee", "#a4c2f5", "#da5656"];
const fUseOrder = [];
const order = {
  High: 0,
  Middle: 1,
  Elementary: 2,
  Close: 3,
};

const capColors = [
  d3.interpolateRdBu(0.3),
  d3.interpolateRdBu(1),
  d3.interpolateRdBu(1.7),
];
//blue, white, red
var vis = svg.append("g");
const schoolsData = [];

d3.csv("dekalb-schools-new.csv", dataProcess).then(function (data) {
  console.log(data);
  data.sort((a, b) => d3.ascending(a.name, b.name));

  var schoolsByType = data.sort((a, b) =>
    d3.ascending(order[a.type], order[b.type]),
  );
  schoolsByType = d3.group(schoolsByType, (d) => d.type);
  lScale = d3
    .scaleLinear()
    .domain(d3.extent(data, (d) => d.lat))
    .range([0, height]);

  capScale = d3
    .scaleDiverging()
    .domain([0.3, 1.0, 1.7])
    .interpolator(d3.interpolateRdBu);

  var controller = new ScrollMagic.Controller();

  removeAll();
  // schoolsVis(schoolsByType);
  // typeVis(schoolsByType);
  // makeKey();
  initCircles(schoolsByType);
  drawSchoolsOnMap(0);
  colorsByCapacity(0);

  dataTest(data);
  // gradientKey(test);
  var schoolsMapScene = new ScrollMagic.Scene({
    triggerElement: "#vis-wrapper",
    triggerHook: 0,
    // duration: "100%"0,
    // pushFollowers: false,
  })
    .setPin("#vis-wrapper")
    .addTo(controller);

  schoolsMapScene.on("enter", function () {
    console.log("start schools Map");
    colorsByCapacity(600);
    // schoolsNoColor(schoolsByType);
    // schoolsVis(schoolsByType);
  });

  schoolsMapScene.on("leave", function () {
    console.log("leave schools Map ");
    colorsByCapacity(600);
    // removeAll();
  });

  var typeScene = new ScrollMagic.Scene({
    triggerElement: "#typeVis",
    triggerHook: 0.9,
    duration: 200,
  }).addTo(controller);

  typeScene.on("enter", function () {
    console.log("start");

    removeKey();
    schoolsByColor(600);
  });

  typeScene.on("leave", function () {
    console.log("leave type scene");
    // removeAll();
  });
  var repurposeScene = new ScrollMagic.Scene({
    triggerElement: "#repurposeVis",
    triggerHook: 0.9,
    duration: 200,
  }).addTo(controller);

  repurposeScene.on("enter", function () {
    console.log("start");
    removeKey();
    repurposeVis(0);
  });

  repurposeScene.on("leave", function () {
    console.log("leave repurpose scene");
    // removeAll();
  });
});

function dataProcess(d) {
  return {
    name: d.NAME,
    lat: +d.LAT,
    lon: +d.LON,
    type: d.Type,
    en_per: +(d.Enrollment / d.Capacity),
    f_use: d.future_use,
  };
}

//draw map
function drawDeKalbBoundary() {
  d3.json("dekalb-boundary.geojson").then(function (data) {
    const projection = d3.geoMercator().fitSize([width, height], data);

    const path = d3.geoPath().projection(projection);

    svg
      .append("g")
      .selectAll("path")
      .data(data.features)
      .enter()
      .append("path")
      .attr("d", path)
      .attr("fill", "#69b3a2")
      .attr("opacity", 0.6)
      .attr("stroke", "#3e645b")
      .attr("stroke-width", 2);
  });
  return 0;
}

function schoolsNoColor(data) {
  svg.selectAll(".dots").attr("fill", typeColors[0]);
}

function schoolsByColor(tDuration) {
  svg
    .selectAll(".dots")
    .transition()
    .duration(tDuration)
    .attr("opacity", 0.8)
    .attr("fill", (d) => {
      return typeColors[order[d.type]];
    });

  makeKey(0);
}

function drawSchoolsOnMap(tDuration) {
  svg
    .selectAll(".dots")
    .transition()
    .duration(tDuration)
    .attr("cx", (d) => lScale(d.lon + 118.05))
    //118.05 is the avg difference between the lat and lon
    .attr("cy", (d) => -lScale(d.lat) + height)
    .attr("r", 10);
}

function initCircles(data) {
  drawGroup(data.get("High"));
  drawGroup(data.get("Middle"));
  drawGroup(data.get("Elementary"));

  function drawGroup(data) {
    svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`)
      .selectAll(".dots")
      .data(data)
      .join("circle")
      .attr("class", "dots")
      .on("mousemove", (event, d) => {
        tooltip
          .style("left", event.pageX + "px")
          .style("top", event.pageY + "px")
          .classed("hidden", false);
        tooltip.select("#tooltip-school").text(d.name);
      })
      .on("mouseout", () => tooltip.classed("hidden", true));
  }
  const tooltip = d3.select("#tooltip");
}

function colorsByCapacity() {
  svg
    .selectAll(".dots")
    // .transition()
    // .duration(tDuration)
    .attr("opacity", 0.8)
    .attr("fill", (d) => {
      return capScale(d.en_per);
    });
  gradientKey(svg);
}

function schoolsVis(data) {
  //use both lat and lon on same scale to ensure its a 1x1 grid, not stretched

  //make scales

  drawGroup(data.get("High"), typeColors[0]);
  drawGroup(data.get("Middle"), typeColors[1]);
  drawGroup(data.get("Elementary"), typeColors[2]);
  function drawGroup(data, color) {
    svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`)
      .selectAll(".dots")
      .data(data)
      .join("circle")
      .attr("class", "dots")
      .attr("cx", (d) => lScale(d.lon + 118.05))
      //118.05 is the avg difference between the lat and lon
      .attr("cy", (d) => -lScale(d.lat) + height)
      .attr("r", 10)
      .attr("opacity", 0.7)
      .attr("fill", color)
      .on("mousemove", (event, d) => {
        tooltip
          .style("left", event.pageX + "px")
          .style("top", event.pageY + "px")
          .classed("hidden", false);
        tooltip.select("#tooltip-school").text(d.name);
      })
      .on("mouseout", () => tooltip.classed("hidden", true));
  }
  //add tooltip
  const tooltip = d3.select("#tooltip");
  // drawDeKalbBoundary();
}

function changeColour(data) {
  const r = 3;
  const perRow = 9;
  var temp = svg
    .selectAll("circle")
    .transition()
    .duration(600)
    .attr("fill", "pink")
    .attr("cx", (d, i) => (i % perRow) * r * 3)
    .attr("cy", (d, i) => Math.floor(i / perRow) * r * 3)
    .attr("r", r);
}

function typeVis(data) {
  //group by type
  //sort alphabetically
  drawGroup(data.get("High"), 100, 75, 14, 8, typeColors[0]);
  drawGroup(data.get("Middle"), 100, 225, 10, 11, typeColors[1]);
  drawGroup(data.get("Elementary"), 100, 305, 6, 18, typeColors[2]);
  function drawGroup(data, tx, ty, r, perRow, color) {
    svg
      .append("g")
      .attr("transform", `translate(${tx},${ty})`)
      .selectAll("circle")
      .data(data)
      .join("circle")
      .attr("cx", (d, i) => (i % perRow) * r * 3)
      .attr("cy", (d, i) => Math.floor(i / perRow) * r * 3)
      .attr("r", r)
      .attr("fill", color)

      .on("mousemove", (event, d) => {
        tooltip
          .style("left", event.pageX + "px")
          .style("top", event.pageY + "px")
          .classed("hidden", false);

        tooltip.select("#tooltip-school").text(d.name);
      })
      .on("mouseout", () => tooltip.classed("hidden", true));
  }
  const tooltip = d3.select("#tooltip");
}

function repurposeVis(tDuration) {
  svg
    .selectAll(".dots")
    .transition()
    .duration(tDuration)
    .attr("opacity", 0.8)
    .attr("fill", (d) => {
      return typeColors[order[d.f_use]];
    });

  makeKey(1);
}

function removeAll() {
  svg
    .selectAll("circle")
    .attr("opacity", 0)
    .transition()
    .duration(1200)
    .remove();
}

function makeKey(visNum) {
  const itemHeight = 25;
  var labels = [];
  var title = "placeholder title";
  var colors = [];
  switch (visNum) {
    case 0:
      labels = ["High", "Middle", "Elementary"];
      title = "School Types";
      colors = typeColors;
      break;
    case 1:
      labels = ["High", "Middle", "Elementary", "Close"];
      title = "Future Use";
      colors = typeColors;
      break;
  }

  const key = svg
    .append("g")
    .attr("class", "key")
    .attr("transform", `translate(${margin.left + width - 80}, ${margin.top})`);
  key
    .append("text")
    .attr("x", 4)
    .attr("y", -10)
    .text(title)
    .attr("font-size", 15)
    .attr("font-weight", 500);

  // container group for items
  const items = key
    .selectAll("g")
    .data(labels)
    .enter()
    .append("g")
    .attr("transform", (d, i) => `translate(10, ${i * 22 + 10})`);

  // circles
  items
    .append("circle")
    .attr("r", 6)
    .attr("fill", (d, i) => colors[i])
    .attr("opacity", 0.8)
    .attr("stroke", "black")
    .attr("stroke-width", "0.2");

  // text labels
  items
    .append("text")
    .attr("x", 15)
    .attr("y", 4)
    .text((d, i) => labels[i])
    .attr("font-size", 13);

  key
    .insert("rect", ":first-child")
    .attr("x", -10)
    .attr("y", -30)
    .attr("width", 120)
    .attr("height", 120)
    .attr("fill", "white")
    .attr("stroke", "#ccc")
    .attr("rx", 6);
}

function gradientKey(svg) {
  // Add a defs section for the gradient
  const defs = svg.append("defs");

  const linearGradient = defs
    .append("linearGradient")
    .attr("id", "cap-gradient");

  // Sample the color scale across the domain
  const numStops = 10;
  d3.range(numStops + 1).forEach((i) => {
    const t = i / numStops;
    const value = 0.3 + t * (1.7 - 0.3); // map t to your domain
    linearGradient
      .append("stop")
      .attr("offset", `${t * 100}%`)
      .attr("stop-color", capScale(value));
  });
  const key = svg
    .append("g")
    .attr("class", "key")
    .attr("transform", `translate(${margin.left + width - 80}, ${margin.top})`);

  key
    .append("text")
    .attr("x", 10)
    .attr("y", -4)
    .text("Enrollment")
    .attr("font-size", 15)
    .attr("font-weight", 500);
  key
    .append("text")
    .attr("x", 16)
    .attr("y", 12)
    .text("Capacity")
    .attr("font-size", 15)
    .attr("font-weight", 500);

  key
    .append("rect")
    .attr("x", 4)
    .attr("y", 32)
    .attr("width", 90)
    .attr("height", 15)
    .style("fill", "url(#cap-gradient)");

  const xAxis = d3
    .axisBottom(capRectScale)
    .tickValues([0, 1, 2])
    .tickFormat((d) => `${d * 100}%`);
  const axisG = key
    .append("g")
    .attr("transform", "translate(0,50)")
    .call(xAxis);

  // Style the text
  axisG
    .selectAll("text")
    .attr("fill", "gray")
    .attr("font-family", "Work Sans") // match your imported font
    .attr("dy", "1em"); // moves labels below the bar a bit
  axisG.selectAll(".tick line").attr("stroke", "gray");
  // Remove the horizontal axis line
  axisG.select(".domain").remove();

  key
    .insert("rect", ":first-child")
    .attr("x", -10)
    .attr("y", -30)
    .attr("width", 120)
    .attr("height", 120)
    .attr("fill", "white")
    .attr("stroke", "#ccc")
    .attr("rx", 6);
}

function removeKey() {
  d3.select(".key").remove();
}

//----TEST----
var test = d3
  .select("#vis-test")
  .append("svg")
  .attr("id", "vis-test")
  .attr("height", 500)
  .attr("width", 800);

// Create layers in correct order
const bgLayer = test.append("g").attr("class", "bg-layer");
const circleLayer = test.append("g").attr("class", "circle-layer");
const futureUseOverlayLayer = test
  .append("g")
  .attr("class", "future-use-overlay-layer");
const overlayLayer = test.append("g").attr("class", "overlay-layer");

function dataTest(data) {
  const w = 46;
  const rowNum = 12;
  const r = 2;

  // --- BACKGROUND SQUARES ---
  bgLayer
    .attr("transform", `translate(${margin.left},${margin.top})`)
    .selectAll(".squares")
    .data(data)
    .join("rect")
    .attr("class", "squares")
    .attr("width", w)
    .attr("height", w)
    .attr("fill", "#f0f0f000")
    .attr("stroke", "black")
    .attr("stroke-width", 1)
    .attr("x", (d, i) => (i % rowNum) * w)
    .attr("y", (d, i) => Math.floor(i / rowNum) * w);

  // --- CIRCLES (middle layer) ---
  // cheapCollision(data, circleLayer, rowNum, w, r);

  ttOverlay(data, w, rowNum);
  // ---BUTTONS---

  // Map button IDs to their specific functions
  const buttonActions = {
    "elementary-button": (isActive) => filterElementary(isActive),
    "middle-button": (isActive) => filterMiddle(isActive),
    "high-button": (isActive) => filterHigh(isActive),
    "to-close-button": (isActive) => filterToClose(isActive),

    "atoms-button": (isActive) =>
      cheapCollision(data, circleLayer, rowNum, w, r, isActive),
    "color-button": (isActive) => capOverlay(isActive),

    "current-use-button": (isActive) => currentUseOverlay(isActive),
    "future-use-button": (isActive) =>
      futureUseOverlay(w, data, rowNum, isActive),
  };

  // Attach listeners + toggle behavior
  Object.keys(buttonActions).forEach((id) => {
    const btn = document.getElementById(id);

    btn.addEventListener("click", () => {
      btn.classList.toggle("selected");

      const isActive = btn.classList.contains("selected");
      console.log(id, "is now", isActive ? "ON" : "OFF");

      // Call the correct function
      buttonActions[id](isActive);
    });
  });
}

function filterElementary(isActive) {
  if (isActive) {
    //include in the data
  }
}
function filterMiddle(isActive) {}
function filterHigh(isActive) {}
function filterToClose(isActive) {}

function capOverlay(isActive) {
  if (isActive) {
    if (
      document
        .getElementById("current-use-button")
        .classList.contains("selected")
    ) {
      document.getElementById("current-use-button").click();
    }

    d3.selectAll(".squares")
      .attr("opacity", 0.7)
      .attr("fill", (d) => {
        return capScale(d.en_per);
      });
  } else {
    d3.selectAll(".squares").attr("fill", "transparent");
  }
}
function currentUseOverlay(isActive) {
  if (isActive) {
    if (
      document.getElementById("color-button").classList.contains("selected")
    ) {
      document.getElementById("color-button").click();
    }
    d3.selectAll(".squares")
      // .attr("opacity", 0.7)
      .attr("fill", (d) => {
        console.log(order[d.f_use]);
        return futureUseColors[order[d.type]];
      });
  } else {
    d3.selectAll(".squares").attr("fill", "transparent");
  }
}
function ttOverlay(data, w, rowNum) {
  console.log("ADDING TT OVERLAY");
  // --- TOOLTIP OVERLAY RECTANGLES (top layer) ---
  d3.selectAll(".overlay-squares").remove();

  overlayLayer
    .attr("transform", `translate(${margin.left},${margin.top})`)
    .selectAll(".overlay-squares")
    .data(data)
    .join("g")
    .attr("class", "overlay-group")
    .on("mouseenter", (event, d) => {})
    .on("mousemove", (event, d) => {
      console.log(event.srcElement);
      console.log(d, lastSquare);
      if (d == lastSquare) return;
      if (d !== lastSquare) {
        lastSquare = d;

        tooltip.select("#tooltip-school").text(d.name);
        d3.selectAll(".overlay-squares")
          .attr("fill", "#f0f0f000")
          .attr("stroke-width", 0);
        d3.select(event.srcElement)
          .attr("fill", "#ffffff36")
          .attr("stroke", "#000000")
          .attr("stroke-width", 3);
      }
      tooltip
        .style("left", event.pageX + "px")
        .style("top", event.pageY + "px")
        .classed("hidden", false);
    })
    .on("mouseleave", () => {
      lastSquare = null;
      tooltip.classed("hidden", true);
      d3.selectAll(".overlay-squares")
        .attr("fill", "#f0f0f000")
        .attr("stroke-width", 0);
    });

  d3.selectAll(".overlay-group")
    .append("rect")
    .attr("class", "overlay-squares")
    .attr("width", w)
    .attr("height", w)
    .attr("fill", "transparent")
    .attr("x", (d, i) => (i % rowNum) * w)
    .attr("y", (d, i) => Math.floor(i / rowNum) * w);

  const tooltip = d3.select("#tooltip");
}

function futureUseOverlay(w, data, rowNum, isActive) {
  if (isActive) {
    // 1. Define the polygon vertices
    const polygonPoints = [
      [0, w],
      [w, w],
      [w, 0],
    ];

    futureUseOverlayLayer
      .attr("transform", `translate(${margin.left},${margin.top})`)
      .selectAll(".triangles")
      .data(data)
      .join("path")
      .attr("class", "triangles")
      .attr(
        "transform",
        (d, i) =>
          `translate(${(i % rowNum) * w},${Math.floor(i / rowNum) * w})`,
      )

      .attr("fill", (d, i) => futureUseColors[order[d.f_use]])
      .attr("stroke", "black")
      // .attr("stroke", (d) => (d.f_use == d.type ? "none" : "black"))
      .attr("d", d3.line()(polygonPoints) + "Z") // "Z" closes the path
      .attr("stroke-width", 0.3);
  } else {
    d3.selectAll(".triangles").remove();
  }
}

function cheapCollision(data, circleLayer, rowNum, w, r, isActive) {
  console.log(r, data, test, rowNum, w, r, isActive);
  if (isActive) {
    const allNodes = [];

    data.forEach((d, i) => {
      const numNodes = Math.floor(d.en_per * 100);

      const cellX = (i % rowNum) * w;
      const cellY = Math.floor(i / rowNum) * w;

      const centerX = cellX + w / 2;
      const centerY = cellY + w / 2;

      for (let j = 0; j < numNodes; j++) {
        const homeX = centerX + (Math.random() - 0.5) * w * 0.2;
        const homeY = centerY + (Math.random() - 0.5) * w * 0.2;

        allNodes.push({
          x: homeX,
          y: homeY,
          vx: 0,
          vy: 0,
          cellX,
          cellY,
        });
      }
    });
    const circles = circleLayer
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`)
      .selectAll("circle")
      .data(allNodes)
      .join("circle")
      .attr("r", r)
      .attr("fill", "#503f3f")
      .attr("class", "collision-circle");
    const simulation = d3
      .forceSimulation(allNodes)
      // .alphaDecay(0.02)
      .velocityDecay(0.6)
      .force("x", d3.forceX((d) => d.cellX + w / 2).strength(0.01))
      .force("y", d3.forceY((d) => d.cellY + w / 2).strength(0.01))
      .force("collision", d3.forceCollide(r + 0.5))
      .on("tick", ticked);
    function ticked() {
      circles
        .attr("cx", (d) => {
          //  damp velocity EVERY frame
          d.vx *= 0.92;

          if (d.x < d.cellX + r || d.x > d.cellX + w - r) {
            d.vx *= -0.8;
          }
          d.x = Math.max(d.cellX + r, Math.min(d.cellX + w - r, d.x));
          return d.x;
        })
        .attr("cy", (d) => {
          d.vy *= 0.92;

          if (d.y < d.cellY + r || d.y > d.cellY + w - r) {
            d.vy *= -0.8;
          }
          d.y = Math.max(d.cellY + r, Math.min(d.cellY + w - r, d.y));
          return d.y;
        });
      //ok so this is when it STOPS, the lower the alpha, the more "settled"
      // if (simulation.alpha() < 0.5) {
      //   simulation.stop();
      // }
    }
  } else {
    d3.selectAll(".collision-circle").remove();
  }
}
