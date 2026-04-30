import { fetchJSON, renderProjects } from "../global.js";
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

const projects = await fetchJSON("../lib/projects.json");

const projectsContainer = document.querySelector(".projects");

renderProjects(projects, projectsContainer, "h2");

const projectsTitle = document.querySelector(".projects-title");
if (projectsTitle) {
  projectsTitle.textContent = `${projects.length} Projects`;
}

let query = "";
let selectedYear = null;

const arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
const colors = d3.scaleOrdinal(d3.schemeTableau10);

function getSearchFiltered(projectList) {
  if (!query) return projectList;
  return projectList.filter((project) => {
    const values = Object.values(project).join("\n").toLowerCase();
    return values.includes(query.toLowerCase());
  });
}

function getDisplayedProjects() {
  let filtered = getSearchFiltered(projects);
  if (selectedYear !== null) {
    filtered = filtered.filter((p) => String(p.year) === String(selectedYear));
  }
  return filtered;
}

function renderPieChart(projectsGiven) {
  const rolledData = d3.rollups(
    projectsGiven,
    (v) => v.length,
    (d) => d.year
  );
  const data = rolledData.map(([year, count]) => ({
    label: String(year),
    value: count,
  }));

  const sliceGenerator = d3.pie().value((d) => d.value);
  const arcData = sliceGenerator(data);
  const arcs = arcData.map((d) => arcGenerator(d));

  const svg = d3.select("svg");
  svg.selectAll("path").remove();

  const legend = d3.select(".legend");
  legend.selectAll("li").remove();

  const selectedIndex = data.findIndex((d) => d.label === selectedYear);

  arcs.forEach((arc, i) => {
    svg
      .append("path")
      .attr("d", arc)
      .attr("fill", colors(i))
      .attr("class", i === selectedIndex ? "selected" : "")
      .on("click", () => {
        selectedYear = selectedYear === data[i].label ? null : data[i].label;
        const newSelectedIndex = data.findIndex(
          (d) => d.label === selectedYear
        );

        svg
          .selectAll("path")
          .attr("class", (_, idx) =>
            idx === newSelectedIndex ? "selected" : ""
          );
        legend
          .selectAll("li")
          .attr(
            "class",
            (_, idx) =>
              `legend-item${idx === newSelectedIndex ? " selected" : ""}`
          );

        renderProjects(getDisplayedProjects(), projectsContainer, "h2");
      });
  });

  data.forEach((d, idx) => {
    legend
      .append("li")
      .attr("style", `--color:${colors(idx)}`)
      .attr("class", `legend-item${idx === selectedIndex ? " selected" : ""}`)
      .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`);
  });
}

renderPieChart(projects);

const searchInput = document.querySelector(".searchBar");
searchInput.addEventListener("input", (event) => {
  query = event.target.value;
  renderPieChart(getSearchFiltered(projects));
  renderProjects(getDisplayedProjects(), projectsContainer, "h2");
});
