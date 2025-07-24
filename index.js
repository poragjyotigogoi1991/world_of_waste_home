/* console.log = () => {};
window.V = "2.0-";
console.log("Loadded...", V); */
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
const popupTitle = getElement(selectors.popupTitle);
const popupValue = getElement(selectors.popupValue);

let popupEle;
let currentCountry;
let countryWiseTotalWaste = {};
let allCountries = [];
let upcomingCountries = [];
let postConsumptionCountries = [];
let postIndustrialCountries = [];

function getTotalWasteCountryWise() {
  const allPopups = document.querySelectorAll("[country-name]");
  console.log("All popups found:", allPopups.length, allPopups);

  allPopups.forEach((popup) => {
    const countryName = popup.getAttribute("country-name");
    const waste = popup.querySelector(".dialog_number")?.innerText;
    console.log("Processing popup:", { countryName, waste });
    allCountries.push(countryName);
    if (isNaN(waste)) {
      upcomingCountries.push(countryName);
    }
    if (countryName === "USA") {
      countryWiseTotalWaste["United States of America"] = parseInt(
        waste?.replaceAll(",", "").replace("K", "000")
      );
      allCountries.push("United States of America");
    }
    if (countryName === "UK") {
      countryWiseTotalWaste["United Kingdom"] = parseInt(
        waste?.replaceAll(",", "").replace("K", "000")
      );
      allCountries.push("United Kingdom");
    }

    if (countryWiseTotalWaste[countryName] === undefined) {
      countryWiseTotalWaste[countryName] = parseInt(
        waste?.replaceAll(",", "").replace("K", "000")
      );
    }
  });

  console.log("Country wise waste:", countryWiseTotalWaste);
}

function getCountryHighlightColor(countryName) {
  const totalWaste = countryWiseTotalWaste[countryName];
  if (!totalWaste) {
    return "#B1B1B1";
  }
  if (totalWaste < 100000) {
    return "#4CACB6";
  }
  if (totalWaste >= 100000 && totalWaste < 1000000) {
    return "#017C8B";
  }
  if (totalWaste >= 1000000) {
    return "#015F6B";
  }
}

function getPopupElement(countryName) {
  console.log("Looking for popup for country:", countryName);
  const allPopups = document.querySelectorAll("[country-name]");
  let foundPopup = null;

  allPopups.forEach((ev) => {
    const value = ev.getAttribute("country-name");
    console.log("Checking popup with country-name:", value);
    if (
      value === countryName ||
      (countryName.includes("United States of America") && value === "USA") ||
      (countryName.includes("United Kingdom") && value === "UK")
    ) {
      foundPopup = ev;
    }
  });

  if (foundPopup) {
    console.log("Popup found for:", countryName);
    foundPopup
      .querySelector('[popup="close-btn"]')
      ?.addEventListener("click", () => {
        console.log("POPUP CROSSED", { countryName });
        foundPopup.style.display = "none";
        stateLayer.revertStyle();
      });
  } else {
    console.warn("No popup found for:", countryName);
  }

  return foundPopup;
}

function highlightAllStates(states) {
  stateLayer.revertStyle();
  states.forEach((state) => {
    stateLayer.setStyle(function (feature) {
      return {
        fillColor: getCountryHighlightColor(feature.getProperty("name")),
        strokeWeight: 0,
      };
    });
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
  buttonInfoWrapper.style.alignItems = "center";
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
    new Date(2024, 10, 06)
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
  button.style.border = "1px solid #000000";
}

function applyResponsiveStyles() {
  const screenWidth = window.innerWidth;

  if (screenWidth <= 768) {
    buttonContainer.style.flexDirection = "column";
    buttonContainer.style.width = "55%";
    buttonContainer.style.left = "0%";
    buttonContainer.style.transform = "translateX(0%)";
    buttonContainer.style.backgroundColor = "#ffffff";
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
    buttonContainer.style.flexDirection = "row";
    buttonContainer.style.width = "auto";
    mainContainer.style.flexDirection = "row";
    mainContainer.style.gap = "10rem";
    mainContainer.style.background = "none";
    mainContainer.style.left = "3%";
    mainContainer.style.bottom = "5%";
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

function handlePopup(show = true, title, value, coords, popupEle) {
  if (!popupEle) {
    console.warn("No popup element provided for:", title);
    return;
  }
  console.log("Handling popup:", { show, title, value, coords });
  if (show) {
    popupEle.style.display = "block";
    popupEle.style.position = "absolute";
    popupEle.style.zIndex = 100;
    if (window.innerWidth <= 768) {
      popupEle.style.bottom = "12rem";
      popupEle.style.left = "50%";
      popupEle.style.transform = "translateX(-50%)";
    } else {
      popupEle.style.left = `${coords?.x ?? 0 + 4}px`;
      popupEle.style.top = `${coords?.y ?? 0 - 20}px`;
      popupEle.style.transform = "none";
    }
    popupEle.classList.add("show");
  } else {
    popupEle.style.display = "none";
    popupEle.classList.remove("show");
  }
}

window.addEventListener("resize", applyResponsiveStyles);

function initMap() {
  map = new google.maps.Map(document.getElementById("custom-map"), {
    center: { lat: -34.397, lng: 150.644 },
    zoom: 2.7,
    minZoom: 2.7,
    maxZoom: 4.5,
    restriction: {
      latLngBounds: {
        north: 85,
        south: -60,
        west: -179.9999,
        east: 179.9999,
      },
    },
    disableDefaultUI: true,
    styles: [
      {
        elementType: "geometry",
        stylers: [{ color: "#D1D1D1" }],
      },
      {
        elementType: "labels",
        stylers: [{ visibility: "off" }],
      },
      {
        featureType: "water",
        elementType: "geometry",
        stylers: [{ color: "#ffffff" }],
      },
      {
        featureType: "administrative",
        elementType: "geometry",
        stylers: [{ visibility: "off" }],
      },
      {
        featureType: "landscape",
        elementType: "geometry",
        stylers: [{ color: "#D1D1D1" }],
      },
      {
        featureType: "road",
        elementType: "geometry",
        stylers: [{ visibility: "off" }],
      },
      {
        featureType: "poi",
        elementType: "geometry",
        stylers: [{ visibility: "off" }],
      },
      {
        featureType: "transit",
        elementType: "geometry",
        stylers: [{ visibility: "off" }],
      },
    ],
  });

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

  loadButtons();
  activateButton(postIndustrialBtn);
  activateButton(postConsumerBtn);
  LoadControls();
  applyResponsiveStyles();

  const labels = [];
  stateLayer = new google.maps.Data();
  stateLayer.loadGeoJson(
    "https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json",
    null,
    (features) => {
      features.forEach((feature) => {
        const stateName = feature.getProperty("name");
        console.log("Countries", stateName);
        if (stateName === "Antarctica") return;
        statePolygons[stateName] = feature;
        stateLayer.setStyle({
          fillColor: "#FFFFFF",
          strokeWeight: 0,
        });

        if (allCountries.includes(stateName)) {
          const bounds = new google.maps.LatLngBounds();
          feature.getGeometry().forEachLatLng((latlng) => {
            bounds.extend(latlng);
          });

          let center = bounds.getCenter();
          const southWest = bounds.getSouthWest();
          const northEast = bounds.getNorthEast();

          if (stateName === "United States of America") {
            center = new google.maps.LatLng(
              (southWest.lat() + northEast.lat()) / 2.3,
              (southWest.lng() + northEast.lng()) / 2.3
            );
          }

          if (stateName === "India") {
            center = new google.maps.LatLng(
              (southWest.lat() + northEast.lat()) / 2,
              (southWest.lng() + northEast.lng()) / 2.1
            );
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

          if (
            [
              "Netherlands",
              "Belgium",
              "Germany",
              "Poland",
              "United Kingdom",
            ].includes(stateName)
          ) {
            label.setVisible(false);
          }

          labels.push(label);
        }
      });
      stateLayer.setMap(map);
    }
  );

  map.addListener("zoom_changed", () => {
    const zoom = map.getZoom();
    labels.forEach((label) => {
      label.setVisible(zoom > 2.7);
    });
  });

  getTotalWasteCountryWise();

  let masked = false;
  let dottedOverlay;

  function getValue(country) {
    if (["India", "USA", "Bangladesh", "China"].includes(country)) {
      return "9,990,000";
    }
    return "7,793,000";
  }

  stateLayer.addListener("mouseover", function (event) {
    map.data.revertStyle();
    const name = event.feature.getProperty("name");
    const code = event.feature.getProperty("id");
    if (["Antarctica"].includes(name)) return;

    stateLayer.overrideStyle(event.feature, {
      strokeColor: "#4CACB6",
      strokeWeight: 1,
    });
  });

  stateLayer.addListener("mouseout", function (event) {
    stateLayer.overrideStyle(event.feature, {
      strokeColor: "#000000",
      strokeWeight: 0,
    });
  });

  let activePopups;
  var selecteedStates = {};

  stateLayer.addListener("click", function (event) {
    stateLayer.revertStyle();
    const name = event.feature.getProperty("name");
    const code = event.feature.getProperty("id");
    const { clientX: x, clientY: y } = event.domEvent;
    console.log("Map clicked:", { name, code, x, y });

    if (["Antarctica"].includes(name)) return;

    // Check if country code exists in the list of valid codes
    const validCountryCodes = [
      "IND",
      "USA",
      "GBR",
      "TUN",
      "ESP",
      "POL",
      "NLD",
      "MAR",
      "EGY",
      "BEL",
      "DEU",
      "BGD",
      "PAK",
      "LKA",
      "VNM",
      "IDN",
      "CAN",
    ];

    // If country code is not valid and not KHM, do not show any popup
    if (!validCountryCodes.includes(code) && code !== "KHM") {
      console.log("Invalid country code, no popup shown:", code);
      if (activePopups) {
        handlePopup(false, name, getValue(name), { x, y }, activePopups);
      }
      return;
    }

    function handleSignupCta(e) {
      e.preventDefault();
      window.open(`https://www.worldofwaste.co/sign-up`, "_blank");
    }

    // Handle Cambodia (KHM) default popup
    if (code === "KHM") {
      console.log("Showing default popup for Cambodia");
      const defaultPopup = document.querySelectorAll("[popup=default]")[1];
      if (!defaultPopup) {
        console.warn("Default popup not found for Cambodia");
        return;
      }
      const defaultPopupEle = defaultPopup.cloneNode(true);
      defaultPopup.querySelector("[popup=country]").innerText =
        name.toUpperCase();

      let finalText = `Upcoming: 2025`;
      let ctaText = "Read more";
      defaultPopup
        .querySelector("[popup=cta]")
        .addEventListener("click", (rv) => {
          rv.preventDefault();
          window.location.href = `https://www.worldofwaste.co/projects/cambodia`;
        });

      defaultPopup.querySelector("[popup=cta]").innerText = ctaText;
      defaultPopup.querySelector("[popup=title]").innerText = finalText;

      defaultPopup
        .querySelector("[popup=close-btn]")
        .addEventListener("click", () => {
          console.log("Closing default popup for:", name);
          handlePopup(false, name, "", { x, y }, defaultPopup.parentElement);
        });

      handlePopup(true, name, "", { x, y }, defaultPopup.parentElement);
      if (activePopups) {
        handlePopup(false, name, getValue(name), { x, y }, activePopups);
      }
      return;
    }

    // Handle valid country codes
    if (!selecteedStates[name]) {
      selecteedStates[name] = true;
    }

    const isSelected = selecteedStates[name];
    console.log("Clicked country:", { currentCountry, isSelected });

    if (interactionType === "click") {
      if (currentCountry && currentCountry !== name && activePopups) {
        console.log("Hiding previous popup for:", currentCountry);
        handlePopup(false, currentCountry, getValue(currentCountry), { x, y }, activePopups);
      }

      const popupElerEF = getPopupElement(name);
      if (!popupElerEF) {
        console.warn("No popup element found for valid country:", name);
        return;
      }

      console.log("Showing popup for:", name);
      activePopups = popupElerEF;
      currentCountry = name;
      handlePopup(true, name, getValue(name), { x, y }, popupElerEF);
    }

    stateLayer.overrideStyle(event.feature, {
      fillColor: !isSelected
        ? "#FFFFFF"
        : getCountryHighlightColor(name) || "#00BCD4",
      strokeColor: !isSelected ? "#000000" : "#888888",
      strokeWeight: 0,
    });
  });

  const postConsumptionCountries = [
    "India",
    "Belgium",
    "United States of America",
    "Spain",
    "Poland",
    "Netherlands",
    "Germany",
    "United Kingdom",
    "Canada",
    "Pakistan",
  ];
  const postIndustrialCountries = [
    "Egypt",
    "Morocco",
    "Bangladesh",
    "Tunisia",
    "India",
  ];

  let activeStates = {
    lowData: true,
    upcomingData: true,
  };

  function highlightCountries(initialData, btn, activeKey) {
    stateLayer.revertStyle();
    let countries = [
      ...initialData,
      ...upcomingCountries,
      "United Kingdom",
      "Cambodia",
    ];

    if (activeKey && btn) {
      activeStates[activeKey] = !activeStates[activeKey];

      if (activeStates[activeKey]) {
        activateButton(btn);
      } else {
        deactivateButton(btn);
      }
    } else {
      activeStates = {
        lowData: true,
        upcomingData: true,
      };
    }
    console.log("Active states:", activeStates);

    if (!activeStates.lowData && !activeStates.upcomingData) {
      countries = [...upcomingCountries, "United Kingdom", "Cambodia"];
    }

    stateLayer.setStyle(function (feature) {
      const countryName = feature.getProperty("name");

      let fillColor = "#FFFFFF";

      if (
        activeStates.lowData &&
        activeStates.upcomingData &&
        [...allCountries, "United Kingdom"].includes(countryName)
      ) {
        fillColor = getCountryHighlightColor(countryName);
        activateButton(postConsumerBtn);
        activateButton(postIndustrialBtn);
        return {
          fillColor: fillColor,
          strokeWeight: 0,
          fillOpacity: fillColor === "#FFFFFF" ? 0.4 : 0.9,
        };
      }

      if (activeStates.lowData && countries.includes(countryName)) {
        fillColor = getCountryHighlightColor(countryName);
      }
      if (
        countryName !== "United Kingdom" &&
        activeStates.upcomingData &&
        countries.includes(countryName)
      ) {
        fillColor = getCountryHighlightColor(countryName);
      }

      return {
        fillColor: fillColor,
        strokeWeight: 0,
        fillOpacity: fillColor === "#FFFFFF" ? 0.4 : 0.9,
      };
    });
  }

  const upcomingCountries = [
    "India",
    "USA",
    "Sri Lanka",
    "Vietnam",
    "Indonesia",
  ];

  worldMapButton.addEventListener("click", () => {
    map.setZoom(3);
  });

  plusButton.addEventListener("click", () => {
    map.setZoom(map.getZoom() + 1);
  });

  minusButton.addEventListener("click", () => {
    map.setZoom(map.getZoom() - 1);
  });

  function toggleCountryLabels(countriesArray, visible) {
    for (let country of countriesArray) {
      if (country === "India") {
        continue;
      }
      const label = labels.find(({ label }) => label.text === country);
      if (label) {
        label.setVisible(visible);
      }
    }
  }

  const activeCountries = {
    postConsumer: false,
    postIndustrial: false,
  };

  function activateFilter(button) {
    button.style.border = "1px solid #000";
    button.style.boxShadow = "none";
    button.style.backgroundColor = "#F5F5F5";
  }

  function deactivateFilter(button) {
    button.style.border = "1px solid rgba(0,0,0,0)";
    button.style.boxShadow = "4px 4px 4px rgba(0,0,0,0.25)";
    button.style.backgroundColor = "#E4E4E4";
  }

  function handlePostConsumerBtn() {
    if (activeCountries.postIndustrial) {
      activeCountries.postIndustrial = false;
      deactivateFilter(postIndustrialBtn);
    }

    activeCountries.postConsumer = !activeCountries.postConsumer;
    if (activeCountries.postConsumer) {
      activateFilter(postConsumerBtn);
      toggleCountryLabels(postConsumptionCountries, true);
      toggleCountryLabels(postIndustrialCountries, false);
    } else {
      deactivateFilter(postConsumerBtn);
      toggleCountryLabels(postConsumptionCountries, false);
    }
    console.log("Active countries:", activeCountries);

    stateLayer.revertStyle();
    let countries = [
      ...postConsumptionCountries,
      ...upcomingCountries,
      "United Kingdom",
      "Cambodia",
    ];

    stateLayer.setStyle(function (feature) {
      const countryName = feature.getProperty("name");

      let fillColor = "#FFFFFF";

      if (activeCountries.postConsumer && countries.includes(countryName)) {
        fillColor = getCountryHighlightColor(countryName);
      }

      if (
        !activeCountries.postConsumer &&
        !activeCountries.postIndustrial &&
        allCountries.includes(countryName)
      ) {
        fillColor = getCountryHighlightColor(countryName);
        toggleCountryLabels(allCountries, activeStates.highestData);
      }

      return {
        fillColor: fillColor,
        strokeWeight: 0,
        fillOpacity: fillColor === "#FFFFFF" ? 0.4 : 0.9,
      };
    });
  }

  function handlePostIndustrialBtn() {
    if (activeCountries.postConsumer) {
      activeCountries.postConsumer = false;
      deactivateFilter(postConsumerBtn);
    }

    activeCountries.postIndustrial = !activeCountries.postIndustrial;
    if (activeCountries.postIndustrial) {
      activateFilter(postIndustrialBtn);
      toggleCountryLabels(postIndustrialCountries, true);
      toggleCountryLabels(postConsumptionCountries, false);
    } else {
      deactivateFilter(postIndustrialBtn);
      toggleCountryLabels(postIndustrialCountries, false);
    }
    console.log("Active countries:", activeCountries);

    let countries = [
      ...postIndustrialCountries,
      ...upcomingCountries,
      "United Kingdom",
      "Cambodia",
    ];

    stateLayer.setStyle(function (feature) {
      const countryName = feature.getProperty("name");

      let fillColor = "#FFFFFF";

      if (
        countryName !== "United Kingdom" &&
        activeCountries.postIndustrial &&
        countries.includes(countryName)
      ) {
        fillColor = getCountryHighlightColor(countryName);
      }

      if (
        !activeCountries.postConsumer &&
        !activeCountries.postIndustrial &&
        allCountries.includes(countryName)
      ) {
        fillColor = getCountryHighlightColor(countryName);
        toggleCountryLabels(allCountries, activeStates.highestData);
      }

      return {
        fillColor: fillColor,
        strokeWeight: 0,
        fillOpacity: fillColor === "#FFFFFF" ? 0.4 : 0.9,
      };
    });
  }

  const handleResetButton = () => {
    activeCountries.postConsumer = false;
    activeCountries.postIndustrial = false;
    deactivateFilter(postConsumerBtn);
    deactivateFilter(postIndustrialBtn);
    stateLayer.setStyle(function (feature) {
      const countryName = feature.getProperty("name");

      let fillColor = "#FFFFFF";

      if (
        !activeCountries.postConsumer &&
        !activeCountries.postIndustrial &&
        allCountries.includes(countryName)
      ) {
        fillColor = getCountryHighlightColor(countryName);
      }

      return {
        fillColor: fillColor,
        strokeWeight: 0,
        fillOpacity: fillColor === "#FFFFFF" ? 0.4 : 0.9,
      };
    });
    toggleCountryLabels(allCountries, activeStates.highestData);
  };

  postConsumerBtn.onclick = handlePostConsumerBtn;
  postIndustrialBtn.onclick = handlePostIndustrialBtn;
  highestDataBtn.onclick = handleResetButton;
  setTimeout(() => {
    handleResetButton();
  }, 1500);
}

window.initMap = initMap;
