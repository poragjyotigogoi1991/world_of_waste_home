//console.log = () => {}; // Uncomment this line to disable console logs
window.V = "2.0-";
console.log("Loadded...", V);
let map;
let stateLayer;
const statePolygons = {}; // Store state polygons
const highlightedStates = {};
const lowData = "#4CACB6";
const upcomingData = "#9E9E9E";
const highestData = "#015F6B";

let postConsumerBtn = null;
let postIndustrialBtn = null;
let highestDataBtn = null;
let buttonContainer = null;
let mainContainer = null;
let worldMapButton;
let plusButton;
let minusButton;
let interactionType = "click";
let infoText = null;
let lastUpdatedText = null;
let scaleEle = null;


const style = document.createElement("style");
style.innerHTML = `
.consumer-action-wrapper {
position: relative;
display: inline-block;
}

.consumer-action-btn {
position: relative;
z-index: 1;
padding: 12px 24px;
background: white;
color: black;
font-size: 16px;
border: none; /* remove border */
border-radius: 30px;
cursor: pointer;
overflow: hidden;
box-shadow: 4px 4px 4px 0.25px black; /* simulate base 1px border */
}

.svg-border {
position: absolute;
top: 0; left: 0;
width: 100%; height: 100%;
pointer-events: none;
z-index: 2;
}

.svg-border rect {
fill: none;
stroke: black;
stroke-width: 2;
transition: stroke-dashoffset 0.8s ease;
}
`;
document.head.appendChild(style);

const selectors = {
  popup: `[popup=type-p]`,
  popupTitle: `[popup=country]`,
  popupValue: `[popup=number]`,
  popupWrapper: `[popup=wrapper]`,
  popupCountryName: `[country-name]`,
};

const getElement = (selector) => document.querySelector(selector);
let popupEle;
let currentCountry;
let countryWiseTotalWaste = {};
let allCountries = []; // Populated from HTML dialogs
let upcomingCountries = [];
let postConsumptionCountries = []; // Populated from filter logic
let postIndustrialCountries = []; // Populated from filter logic

// Dummy data for example purposes. In a real application, you'd get this from an API or a structured JSON.
// Ensure these country names match your GeoJSON 'name' property and are consistent.
// ISO A3 codes are preferred for robust matching with GeoJSON data if available.
const countryData = {
    "United States of America": { waste: 2000000, type: "Post-Consumer", iso_a3: "USA" },
    "India": { waste: 1200000, type: "Both", iso_a3: "IND" }, // Example: both consumer and industrial
    "United Kingdom": { waste: 350000, type: "Post-Consumer", iso_a3: "GBR" },
    "Bangladesh": { waste: 250000, type: "Post-Industrial", iso_a3: "BGD" },
    "Pakistan": { waste: 180000, type: "Post-Consumer", iso_a3: "PAK" },
    "Canada": { waste: 400000, type: "Post-Consumer", iso_a3: "CAN" },
    "Egypt": { waste: 90000, type: "Post-Industrial", iso_a3: "EGY" },
    "Morocco": { waste: 70000, type: "Post-Industrial", iso_a3: "MAR" },
    "Tunisia": { waste: 50000, type: "Post-Industrial", iso_a3: "TUN" },
    "Spain": { waste: 100000, type: "Post-Consumer", iso_a3: "ESP" },
    "Poland": { waste: 130000, type: "Post-Consumer", iso_a3: "POL" },
    "Netherlands": { waste: 160000, type: "Post-Consumer", iso_a3: "NLD" },
    "Germany": { waste: 200000, type: "Post-Consumer", iso_a3: "DEU" },
    "Belgium": { waste: 80000, type: "Post-Consumer", iso_a3: "BEL" },
    "Sri Lanka": { waste: 60000, type: "Post-Industrial", iso_a3: "LKA" },
    "Vietnam": { waste: 110000, type: "Post-Industrial", iso_a3: "VNM" },
    "Indonesia": { waste: 140000, type: "Post-Industrial", iso_a3: "IDN" },
    "Cambodia": { type: "Upcoming", iso_a3: "KHM" }, // No waste data, just upcoming
    // Add other countries as needed
};

// List of ISO A3 codes for which a specific data popup should appear
// This is the source of truth for which countries have "data" vs "no data yet"
const countriesWithDataPopups = [
  "IND", "USA", "GBR", "TUN", "ESP", "POL", "NLD", "MAR", "EGY",
  "BEL", "DEU", "BGD", "PAK", "LKA", "VNM", "IDN", "CAN",
];


function getTotalWasteCountryWise() {
  // This function can now use the `countryData` object directly,
  // rather than parsing from hidden HTML elements.
  // We'll populate `allCountries` and other lists based on `countryData`.

  for (const countryName in countryData) {
    const data = countryData[countryName];
    allCountries.push(countryName); // Add all known countries to the list

    // Populate countryWiseTotalWaste for highlighting
    if (data.waste) {
      countryWiseTotalWaste[countryName] = data.waste;
    }

    // Populate filter lists
    if (data.type === "Post-Consumer" || data.type === "Both") {
      postConsumptionCountries.push(countryName);
    }
    if (data.type === "Post-Industrial" || data.type === "Both") {
      postIndustrialCountries.push(countryName);
    }
    if (data.type === "Upcoming") {
      upcomingCountries.push(countryName);
    }
  }

  console.log("Country wise waste :::", countryWiseTotalWaste);
  console.log("All Countries:", allCountries);
  console.log("Post-Consumer Countries:", postConsumptionCountries);
  console.log("Post-Industrial Countries:", postIndustrialCountries);
  console.log("Upcoming Countries:", upcomingCountries);
}

function getCountryHighlightColor(countryName) {
  const totalWaste = countryWiseTotalWaste[countryName];
  if (!totalWaste) {
    // If no waste data, check if it's an "upcoming" country, otherwise use "no data" color
    if (upcomingCountries.includes(countryName)) {
        return upcomingData; // Grey for upcoming
    }
    return "#B1B1B1"; // Default for no data
  }
  if (totalWaste < 100000) {
    return lowData; // Light Teal
  }
  if (totalWaste >= 100000 && totalWaste < 1000000) {
    return "#017C8B"; // Medium Teal
  }
  if (totalWaste >= 1000000) {
    return highestData; // Dark Teal
  }
}

// Store references to popup elements for quicker access
const popupElements = {};

function getPopupElement(countryName) {
  if (popupElements[countryName]) {
    return popupElements[countryName];
  }

  // Find the specific popup wrapper by its country attribute
  const specificPopup = document.querySelector(`[country-name="${countryName}"]`);
  if (!specificPopup) {
    console.warn(`No specific popup found for country: ${countryName}`);
    return null; // Return null if not found
  }

  const popupWrapper = specificPopup.closest(selectors.popupWrapper);
  if (!popupWrapper) {
      console.warn(`No popup wrapper found for country: ${countryName}`);
      return null;
  }

  // Attach event listener only once
  const closeBtn = popupWrapper.querySelector('[popup="close-btn"]');
  if (closeBtn && !closeBtn.dataset.listenerAttached) {
    closeBtn.addEventListener("click", () => {
      console.log("POPUP CROSSED", { countryName });
      popupWrapper.style.display = "none";
      stateLayer.revertStyle(); // Revert any specific highlighting
    });
    closeBtn.dataset.listenerAttached = true; // Mark as attached
  }

  popupElements[countryName] = popupWrapper; // Store for future use
  return popupWrapper;
}


function highlightAllStates(states, colorFunc = getCountryHighlightColor) {
  stateLayer.revertStyle(); // Reset all styles first
  states.forEach((stateName) => {
    const feature = statePolygons[stateName];
    if (feature) {
      stateLayer.overrideStyle(feature, {
        fillColor: colorFunc(stateName),
        strokeWeight: 0,
      });
    }
  });
}

const text = `This map displays countries and cities with available textile waste data. Click on a region for an overview or to check more details.`;
const filtertext = `Filter by waste type:`;

const mapTitleSvgUrl =
  "https://cdn.prod.website-files.com/66bc6dcc9423ad2cdca2ec11/66ec466ad330a727573b788d_map-title.svg";
const hamburgerMenu =
  "https://cdn.prod.website-files.com/66bc6dcc9423ad2cdca2ec11/66ec466ad330a727573b7889_burger-menu.svg";
const mapScaleSvgUrl = `https://cdn.prod.website-files.com/66bc6dcc9423ad2cdca2ec11/66ec466a0a06b5e7278d5144_new_scale.svg`;
const worldIconSvgUrl = `<img src="https://cdn.prod.website-files.com/66bc6dcc9423ad2cdca2ec11/66d181562cf3a7036cc8bf9f_Vectorworldcontrol.svg"/>`;
const zoomInSvgUrl = `<img src="https://cdn.prod.website-files.com/66bc6dcc9423ad2cdca2ec11/66d181e9204370bb5746f8a2_zoom-in.svg" width="70%" height="70%"/>`;
const zoomOutSvgUrl = `<img src="https://cdn.prod.website-files.com/66bc6dcc9423ad2cdca2ec11/66d181e8e1e78ef8bd95ffcb_zoom-out.svg" width="70%" height="70%"/>`;

const mapContainer = document.getElementById("custom-map");
const mapWrapper = document.querySelector("[map-wrapper]");
function loadButtons() {
  mainContainer = document.createElement("div");
  mainContainer.style.position = "absolute";
  mainContainer.style.bottom = "5%";
  mainContainer.style.left = "3%";
  mainContainer.style.display = "flex";
  mainContainer.style.gap = "10rem";
  mainContainer.style.pointerEvents = "none";

  const buttonInfoWrapper = document.createElement("div");
  buttonInfoWrapper.style.display = "flex";
  buttonInfoWrapper.style.gap = "0.5rem";
  buttonInfoWrapper.style.alignItem = "center";
  buttonInfoWrapper.style.flexDirection = "column";

  buttonContainer = document.createElement("div");
  buttonContainer.style.display = "flex";
  buttonContainer.style.gap = "10px";

  function styleButton(button) {
    button.style.margin = "0";
    button.style.padding = "10px 20px";
    button.style.fontSize = "16px";
    button.style.cursor = "pointer";
    button.style.border = "1px solid #000";
    button.style.borderRadius = "30px";
    button.style.backgroundColor = "#E4E4E4";
    button.style.color = "#000";
    button.style.pointerEvents = "auto";
  }

  function styleLinkButton(button) {
    button.style.fontFamily = "IBM Plex Mono";
    button.style.alignSelf = "center";
    button.style.fontWeight = 600;
    button.style.fontSize = "16px";
    button.style.cursor = "pointer";
    button.style.color = "#000";
    button.style.pointerEvents = "auto";
  }

const postConsumerWrapper = document.createElement("div");
postConsumerWrapper.className = "consumer-action-wrapper";
postConsumerBtn = document.createElement("button");
postConsumerBtn.className = "consumer-action-btn";
postConsumerBtn.innerText = "Post-Consumer";
postConsumerWrapper.appendChild(postConsumerBtn);
buttonContainer.appendChild(postConsumerWrapper);

requestAnimationFrame(() => {
  const { offsetWidth: w, offsetHeight: h } = postConsumerBtn;
  const radius = h / 2;
  const strokeWidth = 4;

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", "svg-border");
  svg.setAttribute("width", w.toString());
  svg.setAttribute("height", h.toString());
  svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
  svg.style.position = "absolute";
  svg.style.top = "0";
  svg.style.left = "0";
  svg.setAttribute("preserveAspectRatio", "none");

  const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  const inset = strokeWidth / 2;
  rect.setAttribute("x", inset.toString());
  rect.setAttribute("y", inset.toString());
  rect.setAttribute("width", (w - strokeWidth).toString());
  rect.setAttribute("height", (h - strokeWidth).toString());
  rect.setAttribute("rx", radius.toString());
  rect.setAttribute("ry", radius.toString());
  rect.setAttribute("stroke-width", strokeWidth.toString());
  rect.setAttribute("vector-effect", "non-scaling-stroke");

  const perimeter = 2 * (w - 2 * radius) + 2 * (h - 2 * radius) + 2 * Math.PI * radius;
  rect.setAttribute("stroke-dasharray", perimeter.toString());
  rect.setAttribute("stroke-dashoffset", perimeter.toString());

  svg.appendChild(rect);
  postConsumerWrapper.appendChild(svg);

  postConsumerWrapper.style.position = "relative";

  postConsumerWrapper.addEventListener("mouseenter", () => {
    rect.style.strokeDashoffset = "0";
  });

  postConsumerWrapper.addEventListener("mouseleave", () => {
    rect.style.strokeDashoffset = perimeter.toString();
  });
});

  const postIndustrialWrapper = document.createElement("div");
  postIndustrialWrapper.className = "consumer-action-wrapper";
  postIndustrialBtn = document.createElement("button");
  postIndustrialBtn.className = "consumer-action-btn";
  postIndustrialBtn.innerText = "Post-Industrial";
  postIndustrialWrapper.appendChild(postIndustrialBtn);
  buttonContainer.appendChild(postIndustrialWrapper);

requestAnimationFrame(() => {
  const { offsetWidth: w, offsetHeight: h } = postIndustrialBtn;
  const radius = h / 2;
  const strokeWidth = 4;

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", "svg-border");
  svg.setAttribute("width", w.toString());
  svg.setAttribute("height", h.toString());
  svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
  svg.style.position = "absolute";
  svg.style.top = "0";
  svg.style.left = "0";
  svg.setAttribute("preserveAspectRatio", "none");

  const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  const inset = strokeWidth / 2;
  rect.setAttribute("x", inset.toString());
  rect.setAttribute("y", inset.toString());
  rect.setAttribute("width", (w - strokeWidth).toString());
  rect.setAttribute("height", (h - strokeWidth).toString());
  rect.setAttribute("rx", radius.toString());
  rect.setAttribute("ry", radius.toString());
  rect.setAttribute("stroke-width", strokeWidth.toString());
  rect.setAttribute("vector-effect", "non-scaling-stroke");

  const perimeter = 2 * (w - 2 * radius) + 2 * (h - 2 * radius) + 2 * Math.PI * radius;
  rect.setAttribute("stroke-dasharray", perimeter.toString());
  rect.setAttribute("stroke-dashoffset", perimeter.toString());

  svg.appendChild(rect);
  postIndustrialWrapper.appendChild(svg);

  postIndustrialWrapper.style.position = "relative";

  postIndustrialWrapper.addEventListener("mouseenter", () => {
    rect.style.strokeDashoffset = "0";
  });

  postIndustrialWrapper.addEventListener("mouseleave", () => {
    rect.style.strokeDashoffset = perimeter.toString();
  });
});

  highestDataBtn = document.createElement("a");
  highestDataBtn.innerText = "Reset";

  buttonContainer.appendChild(highestDataBtn);
  styleButton(postConsumerBtn);
  styleButton(postIndustrialBtn);
  styleLinkButton(highestDataBtn);

  infoText = document.createElement("p");
  infoText.innerText = text;
  infoText.style.padding = "0 10px";
  infoText.style.fontSize = "16px";
  infoText.style.width = "24rem";
  infoText.style.marginTop = "0.25rem";

  filterText = document.createElement("p");
  filterText.innerText = filtertext;
  filterText.style.padding = "0 10px";
  filterText.style.fontSize = "19px";
  filterText.style.fontWeight = "600";
  filterText.style.width = "24rem";
  filterText.style.textAlign = "justify";

  scaleEle = document.createElement("img");
  scaleEle.src = mapScaleSvgUrl;
  scaleEle.style.width = "50%";
  scaleEle.style.alignSelf = "flex-end";
  buttonInfoWrapper.append(filterText);
  buttonInfoWrapper.append(buttonContainer);
  buttonInfoWrapper.append(infoText);

  mainContainer.appendChild(buttonInfoWrapper);
  mainContainer.appendChild(scaleEle);
  mapWrapper.appendChild(mainContainer);
}

function LoadControls() {
  worldMapButton = document.createElement("button");
  // worldMapButton.insertAdjacentHTML("beforeend", worldIconSvgUrl); // Unicode character for world map

  plusButton = document.createElement("button");
  plusButton.insertAdjacentHTML("beforeend", zoomInSvgUrl);

  minusButton = document.createElement("button");
  minusButton.insertAdjacentHTML("beforeend", zoomOutSvgUrl);

  function styleControls(button) {
    button.style.backgroundColor = "#f0f0f0";
    button.style.border = "none";
    button.style.borderRadius = "50%";
    button.style.color = "#017C8B";
    button.style.cursor = "pointer";
    button.style.fontSize = "2.5rem";
    button.style.padding = "0";
    button.style.textAlign = "center";
    button.style.width = "2.5rem";
    button.style.height = "2.5rem";
    button.style.display = "flex";
    button.style.alignItems = "center";
    button.style.justifyContent = "center";
    button.style.padding = "0.5rem";
    button.style.pointerEvents = "auto";
  }

  // styleControls(worldMapButton); // World map button is commented out
  styleControls(plusButton);
  styleControls(minusButton);

  const controlsContainer = document.createElement("div");
  controlsContainer.style.position = "absolute";
  controlsContainer.style.bottom = "5%";
  controlsContainer.style.right = "3%";
  controlsContainer.style.display = "flex";
  controlsContainer.style.flexDirection = "column";
  controlsContainer.style.gap = "1rem";
  controlsContainer.style.alignItems = "flex-end";
  controlsContainer.style.zIndex = 10;
  controlsContainer.style.pointerEvents = "none";

  lastUpdatedText = document.createElement("p");
  lastUpdatedText.innerText = `Last updated on ${formatDate(
    new Date(2024, 9, 6) // Month is 0-indexed, so 9 is October
  )}`;
  lastUpdatedText.style.padding = "10px";
  lastUpdatedText.style.fontSize = "16px";
  lastUpdatedText.style.fontWeight = "600";
  lastUpdatedText.style.alignText = "right";
  lastUpdatedText.style.color = "#017C8B";

  controlsContainer.appendChild(worldMapButton);
  controlsContainer.appendChild(plusButton);
  controlsContainer.appendChild(minusButton);
  controlsContainer.appendChild(lastUpdatedText);

  mapWrapper.appendChild(controlsContainer);
}

function formatDate(date) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const parts = formatter.formatToParts(date);
  const formattedDate = ` ${parts[2].value.toLowerCase()} ${parts[0].value} ${
    parts[4].value
  }`;
  console.log(formattedDate);
  return formattedDate;
}

function activateButton(button) {
  button.style.border = "1px solid #000000";
  button.style.boxShadow = "4px 4px 4px rgba(0,0,0,0.25)";
}

function deactivateButton(button) {
  button.style.border = "1px solid #000000"; // Revert to default
  button.style.boxShadow = "none"; // Remove shadow
}

function applyResponsiveStyles() {
  const screenWidth = window.innerWidth;

  if (screenWidth <= 768) {
    // Mobile view
    buttonContainer.style.flexDirection = "column";
    buttonContainer.style.width = "55%";
    buttonContainer.style.left = "0%";
    buttonContainer.style.transform = "translateX(0%)";
    buttonContainer.style.backgroundColor = "#fffff";
    buttonContainer.style.padding = "15px";

    mainContainer.style.flexDirection = "column";
    mainContainer.style.background = "white";
    mainContainer.style.left = "0";
    mainContainer.style.bottom = "0";
    mainContainer.style.gap = "1rem";
    mainContainer.style.padding = "0.5rem";
    lastUpdatedText.style.width = "10rem";
    lastUpdatedText.style.position = "absolute";
    lastUpdatedText.style.bottom = "2rem";
    scaleEle.style.width = "100%";

    infoText.style.display = "none";
    worldMapButton.style.display = "none";
    plusButton.style.display = "none";
    minusButton.style.display = "none";
  } else {
    // Desktop and larger view
    buttonContainer.style.flexDirection = "row";
    buttonContainer.style.width = "auto";

    mainContainer.style.flexDirection = "row";
    mainContainer.style.gap = "10rem";
    mainContainer.style.background = "none";
    mainContainer.style.left = "3%";
    mainContainer.style.bottom = "5%";
    mainContainer.style.gap = "10rem";
    mainContainer.style.padding = "1rem";
    lastUpdatedText.style.maxWidth = "unset";
    lastUpdatedText.style.position = "relative";
    lastUpdatedText.style.bottom = "unset";
    scaleEle.style.margin = "0";

    infoText.style.display = "block";
    worldMapButton.style.display = "flex";
    plusButton.style.display = "flex";
    minusButton.style.display = "flex";
  }
}

let activePopupsRef = null; // To keep track of the currently active specific data popup

function handlePopup(show = true, title, value, coords, popupElement) {
  if (!popupElement) {
      console.warn("Popup element is null or undefined, cannot handle popup.");
      return;
  }

  // Hide any previously active data popup if a new one is being shown
  if (show && activePopupsRef && activePopupsRef !== popupElement) {
      activePopupsRef.style.display = "none";
  }

  if (show) {
    popupElement.style.display = "block";
    popupElement.style.position = "absolute";
    popupElement.style.zIndex = 100;

    // Set popup content (if applicable and these elements exist in the popup template)
    const popupTitleElement = popupElement.querySelector('[popup="country"]');
    const popupValueElement = popupElement.querySelector('[popup="number"]');
    if (popupTitleElement) popupTitleElement.innerText = title;
    if (popupValueElement) popupValueElement.innerText = value;

    if (window.innerWidth <= 768) {
      popupElement.style.bottom = "12rem";
      popupElement.style.left = "50%";
      popupElement.style.transform = "translateX(-50%)"; // Center horizontally
    } else {
      popupElement.style.left = `${coords?.x ?? 0 + 4}px`;
      popupElement.style.top = `${coords?.y ?? 0 - 20}px`;
      popupElement.style.transform = "none"; // Remove transform if it was set for mobile
    }
    popupElement.classList.add("show");
    activePopupsRef = popupElement; // Update the reference to the active popup
  } else {
    popupElement.style.display = "none";
    popupElement.classList.remove("show");
    if (activePopupsRef === popupElement) {
        activePopupsRef = null; // Clear reference if the current active popup is being hidden
    }
  }
}

// Call the responsive style function on window resize
window.addEventListener("resize", applyResponsiveStyles);

function initMap() {
  map = new google.maps.Map(document.getElementById("custom-map"), {
    center: { lat: -34.397, lng: 150.644 }, // Centered on Africa (initial placeholder)
    zoom: 2.7, // Zoom level for viewing most of the world
    minZoom: 2.7, // Minimum zoom level (restrict too much zooming out)
    maxZoom: 4.5, // Maximum zoom level (restrict too much zooming in)
    restriction: {
      latLngBounds: {
        north: 85,
        south: -60,
        west: -179.9999,
        east: 179.9999,
      },
      //strictBounds: true, // Uncomment if you want strict bounds
    },
    disableDefaultUI: true,
    styles: [
      { elementType: "geometry", stylers: [{ color: "#D1D1D1" }] },
      { elementType: "labels", stylers: [{ visibility: "off" }] },
      { featureType: "water", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
      { featureType: "administrative", elementType: "geometry", stylers: [{ visibility: "off" }] },
      { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#D1D1D1" }] },
      { featureType: "road", elementType: "geometry", stylers: [{ visibility: "off" }] },
      { featureType: "poi", elementType: "geometry", stylers: [{ visibility: "off" }] },
      { featureType: "transit", elementType: "geometry", stylers: [{ visibility: "off" }] },
    ],
  });

  // Fit the map to the defined bounds
  const worldBounds = {
    north: 85,
    south: -60,
    east: 180,
    west: -180,
  };
  const bounds = new google.maps.LatLngBounds(
    new google.maps.LatLng(worldBounds.south, worldBounds.west),
    new google.maps.LatLng(worldBounds.north, worldBounds.east)
  );
  map.fitBounds(bounds);

  // Load UI elements
  loadButtons();
  activateButton(postIndustrialBtn); // Initial active state for filter buttons
  activateButton(postConsumerBtn);
  LoadControls();
  applyResponsiveStyles(); // Apply initial responsive styles

  const labels = [];
  stateLayer = new google.maps.Data();
  stateLayer.loadGeoJson(
    "https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json",
    null,
    (features) => {
      features.forEach((feature) => {
        const stateName = feature.getProperty("name");
        // Use ISO_A3 for consistent country code, assuming your GeoJSON has it
        const stateCode = feature.getProperty("iso_a3"); // Check your GeoJSON for the correct property name (e.g., 'adm0_a3', 'iso_a3')
        if (stateName === "Antarctica") return;

        // Store feature reference for direct access
        statePolygons[stateName] = feature;
        if (stateCode) { // Store by code if available
            statePolygons[stateCode] = feature;
        }

        // Apply initial default style
        stateLayer.overrideStyle(feature, {
          fillColor: "#FFFFFF",
          strokeWeight: 0,
        });

        // Add labels for countries that have data or are upcoming
        if (allCountries.includes(stateName)) {
            const bounds = new google.maps.LatLngBounds();
            feature.getGeometry().forEachLatLng((latlng) => {
              bounds.extend(latlng);
            });

            let center = bounds.getCenter();
            // Custom adjustments for label placement if needed
            if (stateName === "United States of America") {
              center = new google.maps.LatLng(center.lat() * 0.9, center.lng() * 0.9);
            } else if (stateName === "India") {
              center = new google.maps.LatLng(center.lat(), center.lng() * 1.05);
            }

            const label = new google.maps.Marker({
              position: center,
              map: map,
              label: {
                text: stateName,
                color: "#000000",
                fontSize: "12px",
                opacity: 0.8,
              },
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 0,
              },
              visible: true,
            });

            // Hide labels for small or clustered countries
            if (
              [
                "Netherlands", "Belgium", "Germany", "Poland", "United Kingdom"
              ].includes(stateName)
            ) {
              label.setVisible(false);
            }
            labels.push(label);
        }
      });
      stateLayer.setMap(map);
      // After loading GeoJSON and populating data, set initial map colors
      highlightAllStates(allCountries); // Highlights all countries in `allCountries` with their respective data colors
    }
  );

  map.addListener("zoom_changed", () => {
    const zoom = map.getZoom();
    labels.forEach((label) => {
      label.setVisible(zoom > 2.7); // Show labels only when zoomed in
    });
  });

  getTotalWasteCountryWise(); // Populate data lists

  // Helper to get formatted waste value
  function getFormattedWasteValue(countryName) {
    const data = countryData[countryName];
    if (data && data.waste) {
        return data.waste.toLocaleString(); // Formats with commas
    }
    return "N/A"; // Or any other default text
  }

  function handleSignupCta(e) {
    e.preventDefault();
    window.open(`https://www.worldofwaste.co/sign-up`, "_blank");
  }

  // Highlight on hover
  stateLayer.addListener("mouseover", function (event) {
    const name = event.feature.getProperty("name");
    const code = event.feature.getProperty("iso_a3"); // Use proper code property
    if (["ATA", "RUS"].includes(code)) return; // Exclude Antarctica, Russia from hover effect

    // Revert only features that were previously highlighted by hover
    // This is a more robust way to manage hover than a global revertStyle()
    // if you have active click highlights. For simplicity, we can still use revertStyle
    // as click events override it.
    stateLayer.revertStyle(); // Revert all styles
    stateLayer.overrideStyle(event.feature, {
      fillColor: getCountryHighlightColor(name), // Apply actual data color on hover
      strokeColor: "#4CACB6", // Highlight border color
      strokeWeight: 1,
    });
  });

  // Remove highlight when the mouse leaves
  stateLayer.addListener("mouseout", function (event) {
    const name = event.feature.getProperty("name");
    const code = event.feature.getProperty("iso_a3"); // Use proper code property
    if (["ATA", "RUS"].includes(code)) return;

    // Only revert if this feature is not currently "selected" by a click popup
    // (This part needs careful logic if you want persistent highlights on click vs hover)
    // For now, it will simply revert to the default white if no click highlight is active
    if (!activePopupsRef || activePopupsRef.closest(`[country-name="${name}"]`) === null) {
        stateLayer.overrideStyle(event.feature, {
          fillColor: "#FFFFFF", // Revert to default fill
          strokeColor: "#000000",
          strokeWeight: 0,
        });
    }
  });

  // Add click event to toggle highlight and show popup
  stateLayer.addListener("click", function (event) {
    const name = event.feature.getProperty("name");
    const code = event.feature.getProperty("iso_a3"); // Use the correct ISO A3 property from your GeoJSON

    // Immediately return for excluded countries (Antarctica, Russia etc.)
    if (["ATA", "RUS"].includes(code)) {
      return;
    }

    const { clientX: x, clientY: y } = event.domEvent;

    // Reset styles for all countries first
    stateLayer.revertStyle();

    // Re-apply default colors to all countries initially, then override for the clicked one
    highlightAllStates(allCountries);


    // Get the generic "no data" popup template
    const defaultPopupTemplate = document.querySelectorAll("[popup=default]")[1];
    const defaultPopupWrapper = defaultPopupTemplate.parentElement; // Get the actual wrapper

    // First, hide any currently active popup (either specific data or generic)
    if (activePopupsRef) {
        handlePopup(false, "", "", null, activePopupsRef);
    }
    currentCountry = null; // Clear currently tracked country

    // Check if the clicked country has specific data (based on countriesWithDataPopups list)
    if (countriesWithDataPopups.includes(code)) {
      // This country has specific data, show its dedicated popup
      const countryInfo = countryData[name] || {};
      const wasteValue = getFormattedWasteValue(name);

      const specificPopupEle = getPopupElement(name); // Get the existing specific popup element
      if (specificPopupEle) {
        // Update popup content (these are just examples, adjust to your actual popup structure)
        specificPopupEle.querySelector('[popup="country"]').innerText = name.toUpperCase();
        specificPopupEle.querySelector('[popup="number"]').innerText = wasteValue;

        // Ensure CTA listener for specific popup, if any, is correctly set (not shown in current template)
        // If your specific popups also have CTAs, you'd manage their listeners here.

        handlePopup(true, name, wasteValue, { x, y }, specificPopupEle);
        currentCountry = name; // Set current country to the one with an active data popup

        // Highlight the clicked country with its data color
        stateLayer.overrideStyle(event.feature, {
          fillColor: getCountryHighlightColor(name),
          strokeColor: "#888888",
          strokeWeight: 0,
        });
      } else {
          // Fallback to "no data" popup if a specific one wasn't found for a country *supposed* to have data
          console.warn(`Specific popup element not found for ${name}. Showing generic popup.`);
          showGenericNoDataPopup(name, code, x, y, defaultPopupTemplate, defaultPopupWrapper);
      }

    } else {
      // This country does NOT have specific data or is "upcoming", show the generic popup
      showGenericNoDataPopup(name, code, x, y, defaultPopupTemplate, defaultPopupWrapper);
    }
  });

  // Function to encapsulate generic "no data" popup logic
  function showGenericNoDataPopup(name, code, x, y, defaultPopupTemplate, defaultPopupWrapper) {
    defaultPopupTemplate.querySelector("[popup=country]").innerText = name.toUpperCase();

    let finalText = "No data yet. Sign up for updates.";
    let ctaText = "Sign up";
    let ctaUrl = "https://www.worldofwaste.co/sign-up";

    if (code === "KHM") { // Cambodia example
      finalText = `Upcoming: 2025`;
      ctaText = "Read more";
      ctaUrl = `https://www.worldofwaste.co/projects/cambodia`;
    }

    defaultPopupTemplate.querySelector("[popup=cta]").innerText = ctaText;
    defaultPopupTemplate.querySelector("[popup=title]").innerText = finalText;

    // Attach click listener for the CTA button in the generic popup
    const ctaButton = defaultPopupTemplate.querySelector("[popup=cta]");
    // Remove previous listener to prevent duplicates
    const oldCtaListener = ctaButton.onclick;
    if (oldCtaListener) {
        ctaButton.removeEventListener('click', oldCtaListener);
    }
    const newCtaListener = (e) => {
        e.preventDefault();
        window.open(ctaUrl, "_blank");
    };
    ctaButton.addEventListener('click', newCtaListener);
    ctaButton.onclick = newCtaListener; // For older browsers or simpler assignment

    // Attach click listener for the close button in the generic popup
    const closeButton = defaultPopupTemplate.querySelector('[popup="close-btn"]');
    const oldCloseListener = closeButton.onclick;
    if(oldCloseListener) {
        closeButton.removeEventListener('click', oldCloseListener);
    }
    const newCloseListener = () => {
        handlePopup(false, name, "", { x, y }, defaultPopupWrapper);
    };
    closeButton.addEventListener('click', newCloseListener);
    closeButton.onclick = newCloseListener; // For older browsers or simpler assignment

    handlePopup(true, name, "", { x, y }, defaultPopupWrapper);

    // Apply "no data" style to the clicked country
    stateLayer.overrideStyle(statePolygons[name], {
        fillColor: "#FFFFFF", // Or a specific "no data" color
        strokeColor: "#000000",
        strokeWeight: 0,
    });
  }

  let activeStates = {
    postConsumer: true,
    postIndustrial: true,
  };

  function applyFilterHighlight() {
    stateLayer.revertStyle(); // Reset all styles first

    const filteredCountries = [];

    // Combine countries based on active filters
    if (activeStates.postConsumer) {
      postConsumptionCountries.forEach(country => {
        if (!filteredCountries.includes(country)) filteredCountries.push(country);
      });
    }
    if (activeStates.postIndustrial) {
      postIndustrialCountries.forEach(country => {
        if (!filteredCountries.includes(country)) filteredCountries.push(country);
      });
    }

    // Always include upcoming countries, regardless of filter, but with upcomingData color
    upcomingCountries.forEach(country => {
        if (!filteredCountries.includes(country)) filteredCountries.push(country);
    });

    // Apply highlighting based on the combined list
    allCountries.forEach(countryName => {
        const feature = statePolygons[countryName];
        if (feature) {
            if (filteredCountries.includes(countryName)) {
                // If the country is in our filtered list (or upcoming), apply its data color
                stateLayer.overrideStyle(feature, {
                    fillColor: getCountryHighlightColor(countryName),
                    strokeWeight: 0,
                });
            } else {
                // If not in the filtered list, color it as "no data" (white or grey)
                stateLayer.overrideStyle(feature, {
                    fillColor: "#FFFFFF", // Default color for non-filtered/non-data countries
                    strokeWeight: 0,
                });
            }
        }
    });
  }


  // Filter button event listeners
  postConsumerBtn.addEventListener("click", () => {
    activeStates.postConsumer = !activeStates.postConsumer;
    if (activeStates.postConsumer) {
      activateButton(postConsumerBtn);
    } else {
      deactivateButton(postConsumerBtn);
    }
    applyFilterHighlight();
  });

  postIndustrialBtn.addEventListener("click", () => {
    activeStates.postIndustrial = !activeStates.postIndustrial;
    if (activeStates.postIndustrial) {
      activateButton(postIndustrialBtn);
    } else {
      deactivateButton(postIndustrialBtn);
    }
    applyFilterHighlight();
  });

  highestDataBtn.addEventListener("click", () => {
    activeStates.postConsumer = true;
    activeStates.postIndustrial = true;
    activateButton(postConsumerBtn);
    activateButton(postIndustrialBtn);
    applyFilterHighlight();
    // Also ensure any open popup is closed on reset
    if (activePopupsRef) {
        handlePopup(false, "", "", null, activePopupsRef);
    }
    currentCountry = null;
    stateLayer.revertStyle(); // Revert all styles to initial state
    highlightAllStates(allCountries); // Reapply initial state colors
  });

  // Zoom controls
  plusButton.addEventListener("click", () => {
    map.setZoom(Math.min(map.getZoom() + 1, map.maxZoom));
  });

  minusButton.addEventListener("click", () => {
    map.setZoom(Math.max(map.getZoom() - 1, map.minZoom));
  });
}
