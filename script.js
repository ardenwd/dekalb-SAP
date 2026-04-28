var svg = d3.select("#map-vis").append("svg").attr("id", "svg");

const margin = { top: 40, right: 40, bottom: 50, left: 40 };
const mapMargin = { top: 80, right: 10, bottom: 10, left: 10 };
var width = document.getElementById("map-vis").clientWidth;
var height = document.getElementById("map-vis").clientHeight - mapMargin.top;

console.log("height", height);
svg.attr("height", height).attr("width", width);
// svg.attr("margin-top", "");

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
//array with each of the filtered types
var typesMap;

const boundaryLayer = svg.append("g").attr("class", "boundary-layer");
const dotsLayer = svg.append("g").attr("class", "dots-layer");

d3.csv("dekalb-schools-new.csv", dataProcess).then(function (data) {
  data.sort((a, b) => d3.ascending(a.name, b.name));

  var schools = data.sort((a, b) => d3.ascending(order[a.type], order[b.type]));
  var schoolsByType = d3.group(schools, (d) => d.type);
  typesMap = {
    Elementary: schoolsByType.get("Elementary"),
    Middle: schoolsByType.get("Middle"),
    High: schoolsByType.get("High"),
    All: data,
  };

  lScale = d3
    .scaleLinear()
    .domain(d3.extent(data, (d) => d.lat))
    .range([0, height - 140]);

  const [min, max] = d3.extent(data, (d) => d.enrollment);
  const mid = (min + max) / 2;

  capScale = d3
    .scaleDiverging()
    .domain([min, mid, max])
    .interpolator(d3.interpolateBlues);

  console.log(
    "Enrollment extent:",
    d3.extent(data, (d) => d.enrollment),
  );

  console.log("Scale domain:", capScale.domain());

  console.log("Test low value:", capScale(capScale.domain()[0]));
  console.log(
    "Test mid value:",
    capScale((capScale.domain()[0] + capScale.domain()[1]) / 2),
  );
  console.log("Test high value:", capScale(capScale.domain()[1]));

  removeAll();
  // schoolsVis(schoolsByType);
  // typeVis(schoolsByType);
  // makeKey();
  drawDeKalbBoundary();
  initCircles(schools);
  drawSchoolsOnMap(0);
  colorsByCapacity(0);

  dataTest(data);
  originalData = data;
});

// const schoolLookup = new Map();
// originalData.forEach((d) => schoolLookup.set(d.name, d));

function dataProcess(d) {
  return {
    name: d.NAME,
    lat: +d.LAT,
    lon: +d.LON,
    type: d.Type,
    en_per: +(d.Enrollment / d.Capacity),
    enrollment: +d.Enrollment,
    f_use: d.future_use,
  };
}

//draw map
function drawDeKalbBoundary() {
  d3.json("dekalb-boundary.geojson").then(function (data) {
    const projection = d3
      .geoMercator()
      .fitSize([width * 0.95, height * 0.95], data);

    const path = d3.geoPath().projection(projection);

    boundaryLayer
      .attr("transform", `translate(0,-30)`)
      .selectAll("path")
      .data(data.features)
      .enter()
      .append("path")
      .attr("d", path)
      .attr("fill", "#ecd1de")
      .attr("opacity", 0.6)
      .attr("stroke", "#8d537b")
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
    .attr("opacity", 1)
    .attr("fill", (d) => {
      return typeColors[order[d.type]];
    });

  // makeKey(0);
}

function drawSchoolsOnMap(tDuration) {
  svg
    .selectAll(".dots")
    .transition()
    .duration(tDuration)
    .attr("cx", (d) => lScale(d.lon + 118.05))
    //118.05 is the avg difference between the lat and lon
    .attr("cy", (d) => -lScale(d.lat) + height)
    .attr("r", 3);
}

function initCircles(data) {
  dotsLayer
    .attr("transform", `translate(-50,-104)`)
    .selectAll(".dots")
    .data(data)
    .join("circle")
    .attr("class", "dots")
    .on("mousemove", (event, d) => {
      const name = d.name;
      tooltip
        .style("left", event.pageX + "px")
        .style("top", event.pageY + "px")
        .classed("hidden", false);
      tooltip.select("#tooltip-school").text(name);

      //if the other name is present then make that square light up
      //check names:
      // d.name ==
      d3.selectAll(".overlay-squares").each(function (d, i) {
        if (d.name == name) {
          var arr = d3.selectAll(".squares");
          console.log(d.name);

          const t = d3.select(this);
          console.log(t);
          t.attr("fill", "#ffffff36")
            .attr("stroke", "#000000")
            .attr("stroke-width", 3);
        }
      });
    })
    .on("mouseout", () => {
      tooltip.classed("hidden", true);
      d3.selectAll(".overlay-squares")
        .attr("fill", "#f0f0f000")
        .attr("stroke-width", 0);
    });

  const tooltip = d3.select("#tooltip");
}

function colorsByCapacity() {
  svg
    .selectAll(".dots")
    // .transition()
    // .duration(tDuration)
    .attr("opacity", 1)
    .attr("fill", (d) => {
      return capScale(d.enrollment);
    });
  // gradientKey(svg);
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

  // ????
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
  .attr("width", 630);

// Create layers in correct order
const bgLayer = test.append("g").attr("class", "bg-layer");

const futureUseOverlayLayer = test
  .append("g")
  .attr("class", "future-use-overlay-layer");
const circleLayer = test.append("g").attr("class", "circle-layer");
const overlayLayer = test.append("g").attr("class", "overlay-layer");
const w = 46;
const rowNum = 12;
const r = 2;
var activeTypes = new Set();
var buttonActions;
var filteredData;

function dataTest(data) {
  // Keep original data safe
  const originalData = data;
  filteredData = data;
  buttons();
  // Draw initial squares
  drawSquares(filteredData);
}

function buttons() {
  // ---BUTTONS---

  // Map button IDs to their specific functions
  buttonActions = {
    "elementary-button": (isActive) => filterElementary(isActive),
    "middle-button": (isActive) => filterMiddle(isActive),
    "high-button": (isActive) => filterHigh(isActive),
    // "to-close-button": (isActive) => filterToClose(isActive),

    "atoms-button": (isActive) =>
      cheapCollision(filteredData, circleLayer, rowNum, w, r, isActive),
    "color-button": (isActive) => capOverlay(isActive),

    "current-use-button": (isActive) =>
      currentUseOverlay(filteredData, isActive),
    "future-use-button": (isActive) =>
      futureUseOverlay(w, filteredData, rowNum, isActive),
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

  // --- DEFAULT ACTIVE BUTTONS ---
  const defaults = [
    "elementary-button",
    "middle-button",
    "high-button",
    "atoms-button",
  ];

  defaults.forEach((id) => {
    const btn = document.getElementById(id);
    btn.classList.add("selected");
    buttonActions[id](true);
  });
}

function applyFilters() {
  console.log("apply filters");
  const selected = [...activeTypes];

  const result =
    selected.length === 0
      ? typesMap.All
      : selected.flatMap((type) => typesMap[type] || []);
  filteredData = result;
  drawSquares(result);
  //apply reload of
}

function drawSquares(data) {
  const squares = bgLayer
    .attr("transform", `translate(${margin.left},${margin.top})`)
    .selectAll(".squares")
    .data(data, (d) => d.id);

  squares.join(
    (enter) =>
      enter
        .append("rect")
        .attr("class", "squares")
        .attr("width", w)
        .attr("height", w)
        .attr("fill", "#f0f0f000")
        .attr("stroke", "black")
        .attr("stroke-width", 1)
        .attr("x", (d, i) => (i % rowNum) * w)
        .attr("y", (d, i) => Math.floor(i / rowNum) * w),

    (update) => update,

    (exit) => exit.remove(),
  );

  //need to fix the overlays!
  ttOverlay(data, w, rowNum);
  // --- resync all active buttons ---
  resyncAllButtons();
}

// Helper: loop through all buttons and re-run their logic
function resyncAllButtons() {
  Object.keys(buttonActions).forEach((id) => {
    const btn = document.getElementById(id);
    const isActive = btn.classList.contains("selected");
    if (isOverlayButton(id)) {
      buttonActions[id](isActive);
    }
  });
}
//Helper: see if its an overlay, not a filter!
function isOverlayButton(id) {
  return (
    id === "atoms-button" ||
    id === "color-button" ||
    id === "current-use-button" ||
    id === "future-use-button"
  );
}

function filterElementary(isActive) {
  if (isActive) {
    activeTypes.add("Elementary");
  } else {
    activeTypes.delete("Elementary");
  }

  applyFilters();
  //include in the data
}

function filterMiddle(isActive) {
  if (isActive) {
    activeTypes.add("Middle");
  } else {
    activeTypes.delete("Middle");
  }

  applyFilters();
  //include in the data
}
function filterHigh(isActive) {
  if (isActive) {
    activeTypes.add("High");
  } else {
    activeTypes.delete("High");
  }

  applyFilters();
  //include in the data
}
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
        return capScale(d.enrollment);
      });
  } else {
    d3.selectAll(".squares").attr("fill", "transparent");
  }
}

function currentUseOverlay(data, isActive) {
  if (isActive) {
    // 1. Define the polygon vertices
    const polygonPoints = [
      [0, w],
      [0, 0],
      [w, 0],
    ];

    futureUseOverlayLayer
      .attr("transform", `translate(${margin.left},${margin.top})`)
      .selectAll(".triangles-current")
      .data(data)
      .join("path")
      .attr("class", "triangles-current")
      .attr(
        "transform",
        (d, i) =>
          `translate(${(i % rowNum) * w},${Math.floor(i / rowNum) * w})`,
      )

      .attr("fill", (d, i) => futureUseColors[order[d.type]])
      .attr("stroke", "black")
      // .attr("stroke", (d) => (d.f_use == d.type ? "none" : "black"))
      .attr("d", d3.line()(polygonPoints) + "Z") // "Z" closes the path
      .attr("stroke-width", 0.3);
  } else {
    d3.selectAll(".triangles-current").remove();
  }
}
function ttOverlay(data, w, rowNum) {
  // --- TOOLTIP OVERLAY RECTANGLES (top layer) ---
  d3.selectAll(".overlay-group").remove();

  overlayLayer
    .attr("transform", `translate(${margin.left},${margin.top})`)
    .selectAll(".overlay-group")
    .data(data)
    .join("g")
    .attr("class", "overlay-group")
    .on("mouseenter", (event, d) => {})
    .on("mousemove", (event, d) => {
      if (d == lastSquare) return;
      if (d !== lastSquare) {
        lastSquare = d;

        tooltip2.select("#tooltip2-school").text(d.name);
        d3.selectAll(".overlay-squares")
          .attr("fill", "#f0f0f000")
          .attr("stroke-width", 0);
        d3.select(event.srcElement)
          .attr("fill", "#ffffff36")
          .attr("stroke", "#000000")
          .attr("stroke-width", 3);
      }
      tooltip2
        .style("left", event.pageX + "px")
        .style("top", event.pageY + "px")
        .classed("hidden", false);
    })
    .on("mouseleave", () => {
      lastSquare = null;
      tooltip2.classed("hidden", true);
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

  const tooltip2 = d3.select("#tooltip2");
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
  d3.selectAll(".collision-circle").remove();
  d3.selectAll(".atoms-group").remove();
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
      .attr("class", "atoms-group")
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
  }
}
