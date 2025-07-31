//console.log = () => {};
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
//const popupEle = getElement(selectors.popup);
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
  allPopups.forEach((popup) => {
    const countryName = popup.getAttribute("country-name");
    const waste = popup.querySelector(".dialog_number").innerText;
    //console.log("Country + waste>>>", { countryName, waste });
    // var countryValue = value;
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
    } /* else {
      countryWiseTotalWaste[countryName] =
        parseInt(countryWiseTotalWaste[countryName]) + parseInt(waste);
    } */
  });

  console.log("Country wise waste :::", countryWiseTotalWaste);
  // highlightAllStates(allCountries);
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
  const allPopups = document.querySelectorAll("[country-name]");
  allPopups.forEach((ev) => {
    const value = ev.getAttribute("country-name");
    var countryValue = value;
    if (
      value === countryName ||
      (countryName.includes("United States of America") && value === "USA") ||
      (countryName.includes("United Kingdom") && value === "UK")
    ) {
      // console.log("<<< MATCHED >>>", { value, countryName });
      popupEle = ev;
    }
  });

  //attach addEventListener
  popupEle
    .querySelector('[popup="close-btn"]')
    .addEventListener("click", () => {
      // console.log("POPUP CROSSED", { countryName });
      popupEle.style.display = "none";
      stateLayer.revertStyle();
    });

  return popupEle;
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
  //mainContainer.style.transform = "translateX(-50%)";
  mainContainer.style.display = "flex"; // Align buttons horizontally
  // mainContainer.style.flexDirection = "column";
  mainContainer.style.gap = "10rem";
  //to let click pass through
  mainContainer.style.pointerEvents = "none";

  const buttonInfoWrapper = document.createElement("div");
  buttonInfoWrapper.style.display = "flex";
  buttonInfoWrapper.style.gap = "0.5rem";
  buttonInfoWrapper.style.alignItem = "center";
  buttonInfoWrapper.style.flexDirection = "column";

  // Create a container for the buttons
  buttonContainer = document.createElement("div");
  buttonContainer.style.display = "flex"; // Align buttons horizontally
  buttonContainer.style.gap = "10px"; // Add spacing between buttons

  // Apply rounded, outlined style to each button
  function styleButton(button) {
    button.style.margin = "0"; // Reset margin for a clean layout
    button.style.padding = "10px 20px"; // Add padding for spacing
    button.style.fontSize = "16px"; // Set font size
    button.style.cursor = "pointer"; // Pointer cursor on hover
    button.style.borderRadius = "33px"; // Apply full-rounded corners
    button.style.backgroundColor = "#E4E4E4"; // Light background color
    button.style.color = "#000"; // Black text color
    button.style.pointerEvents = "auto";
  }

  function styleLinkButton(button) {
    button.style.fontFamily = "IBM Plex Mono";
    button.style.alignSelf = "center";
    button.style.fontWeight = 600;
    button.style.fontSize = "16px"; // Set font size
    button.style.cursor = "pointer"; // Pointer cursor on hover
    button.style.color = "#000"; // Black text color
    button.style.pointerEvents = "auto";
  }

  // Create the buttons and append them to the container
  postConsumerBtn = document.createElement("button");
  postConsumerBtn.innerText = "Post-Consumer";
  buttonContainer.appendChild(postConsumerBtn);
  postConsumerBtn.addEventListener("mouseover", (event) => {
     // postConsumerBtn.style.boxShadow = "4px 4px 4px rgba(0,0,0,0.25)";
    postConsumerBtn.style.border = "2px solid #000000";
  })
   postConsumerBtn.addEventListener("mouseout", (event) => {
     // postConsumerBtn.style.boxShadow = "none";
      postConsumerBtn.style.border = "2px solid rgba(0,0,0,0)";
  })

  postIndustrialBtn = document.createElement("button");
  postIndustrialBtn.innerText = "Post-Industrial";
  buttonContainer.appendChild(postIndustrialBtn);
   postIndustrialBtn.addEventListener("mouseover", (event) => {
     // postIndustrialBtn.style.boxShadow = "4px 4px 4px rgba(0,0,0,0.25)";
     postIndustrialBtn.style.border = "2px solid #000000";
  })
   postIndustrialBtn.addEventListener("mouseout", (event) => {
     // postIndustrialBtn.style.boxShadow = "none";
      postIndustrialBtn.style.border = "2px solid rgba(0,0,0,0)";
  })

  highestDataBtn = document.createElement("a");
  highestDataBtn.innerText = "Reset";

  buttonContainer.appendChild(highestDataBtn);
  // Apply the styles to each button
  styleButton(postConsumerBtn);
  styleButton(postIndustrialBtn);
  styleLinkButton(highestDataBtn);

  infoText = document.createElement("p");
  infoText.innerText = text;
  infoText.style.padding = "0 10px";
  infoText.style.fontSize = "16px";
  infoText.style.width = "24rem";
  infoText.style.marginTop = "0.25rem";
  //buttonContainer.append(infoText);

  filterText = document.createElement("p");
  filterText.innerText = filtertext;
  filterText.style.padding = "0 10px";
  filterText.style.fontSize = "19px";
  filterText.style.fontWeight = "600";
  filterText.style.width = "24rem";
  filterText.style.textAlign = "justify";

  scaleEle = document.createElement("img");
  scaleEle.src = mapScaleSvgUrl;
  //scaleEle.style.height = "20px";
  scaleEle.style.width = "50%";
  scaleEle.style.alignSelf = "flex-end";
  buttonInfoWrapper.append(filterText);
  buttonInfoWrapper.append(buttonContainer);
  buttonInfoWrapper.append(infoText);
  

  mainContainer.appendChild(buttonInfoWrapper);
  mainContainer.appendChild(scaleEle);
  // Append the button container to the map container
  mapWrapper.appendChild(mainContainer);
}

function LoadControls() {
 worldMapButton = document.createElement("button");
 // worldMapButton.insertAdjacentHTML("beforeend", worldIconSvgUrl); // Unicode character for world map

  // Create the second button with a plus sign
  plusButton = document.createElement("button");
  plusButton.insertAdjacentHTML("beforeend", zoomInSvgUrl);

  // Create the third button with a minus sign
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

 // styleControls(worldMapButton);
  styleControls(plusButton);
  styleControls(minusButton);

  const controlsContainer = document.createElement("div");
  controlsContainer.style.position = "absolute";
  controlsContainer.style.bottom = "5%";
  controlsContainer.style.right = "3%";
  //mainContainer.style.transform = "translateX(-50%)";
  controlsContainer.style.display = "flex"; // Align buttons horizontally
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

  //infoText.style.width = "25rem";
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
  // button.style.border = "2px solid #000000";
  button.style.boxShadow = "4px 4px 4px rgba(0,0,0,0.25)";
}

// Function to deactivate the button (reset its style)
function deactivateButton(button) {
   // button.style.border = "2px solid #000000";
}

function applyResponsiveStyles() {
  const screenWidth = window.innerWidth;

  if (screenWidth <= 768) {
    // Mobile view
    buttonContainer.style.flexDirection = "column"; // Align buttons vertically
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

    //hide info text
    infoText.style.display = "none";
    worldMapButton.style.display = "none";
    plusButton.style.display = "none";
    minusButton.style.display = "none";
  } else {
    // Desktop and larger view
    buttonContainer.style.flexDirection = "row"; // Align buttons horizontally
    buttonContainer.style.width = "auto";
    //buttonContainer.style.left = "15%";
    // buttonContainer.style.transform = "translateX(-50%)";

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

function handlePopup(show = true, title, value, coords, popupEle) {
  // console.log("called", { show, title, value, coords, popupEle });

  if (show) {
    popupEle.style.display = "block";
    popupEle.style.position = "absolute";
    popupEle.style.zIndex = 100;
    if (window.innerWidth <= 768) {
      popupEle.style.bottom = "12rem";
    } else {
      popupEle.style.left = `${coords?.x ?? 0 + 4}px`;
      popupEle.style.top = `${coords?.y ?? 0 - 20}px`;
    }
    popupEle.classList.add("show");
  } else {
    popupEle.style.display = "none";
    popupEle.classList.remove("show");
    return;
  }

  //popupTitle.innerText = title;
  //popupValue.innerText = value;
}

// Call the responsive style function on window resize
window.addEventListener("resize", applyResponsiveStyles);

//TODO : figure out intial styles if loaded on phone
// Initial call to set styles on page load
//applyResponsiveStyles();

function initMap() {  
  map = new google.maps.Map(document.getElementById("custom-map"), {
    center: { lat: -34.397, lng: 150.644 }, // Centered on Africa
    zoom: 2.7, // Zoom level for viewing most of the world
    minZoom: 2.7, // Minimum zoom level (restrict too much zooming out)
    maxZoom: 4.5, // Maximum zoom level (restrict too much zooming in)
    restriction: {
      latLngBounds: {
        north: 85, // Close to North Pole
        south: -60, // Exclude Antarctica
        west: -179.9999, // Near international date line (west)
        east: 179.9999, // Near international date line (east)
      },
      //strictBounds: true, // Prevent dragging outside the restricted area
    },
    disableDefaultUI: true,
    /* mapTypeControl: false,
    scaleControl: false,
    streetViewControl: false, */
    styles: [
      {
        elementType: "geometry",
        stylers: [{ color: "#D1D1D1" }], // Grey color for land
      },
      {
        elementType: "labels",
        stylers: [{ visibility: "off" }], // Remove all labels
      },
      {
        featureType: "water",
        elementType: "geometry",
        stylers: [{ color: "#ffffff" }], // White water color
      },
      {
        featureType: "administrative",
        elementType: "geometry",
        stylers: [{ visibility: "off" }], // Remove borders
      },
      {
        featureType: "landscape",
        elementType: "geometry",
        stylers: [{ color: "#D1D1D1" }], // Grey color for landscape
      },
      {
        featureType: "road",
        elementType: "geometry",
        stylers: [{ visibility: "off" }], // Remove roads
      },
      {
        featureType: "poi",
        elementType: "geometry",
        stylers: [{ visibility: "off" }], // Remove points of interest
      },
      {
        featureType: "transit",
        elementType: "geometry",
        stylers: [{ visibility: "off" }], // Remove transit lines
      },
    ],
  });
  
  const worldBounds = {
    north: 85, // Maximum north latitude (close to the North Pole)
    south: -60, // Minimum south latitude (excludes Antarctica)
    east: 180, // Maximum east longitude
    west: -180, // Minimum west longitude
  };

  const bounds = new google.maps.LatLngBounds(
    new google.maps.LatLng(worldBounds.south, worldBounds.west),
    new google.maps.LatLng(worldBounds.north, worldBounds.east)
  );

  // Fit the map to the defined bounds, excluding Antarctica
  map.fitBounds(bounds);

  //load buttons
  loadButtons();
  activateButton(postIndustrialBtn);
  activateButton(postConsumerBtn);
  LoadControls();
  applyResponsiveStyles();

  const labels = [];
  // Load state polygons (simplified example, normally you'd use GeoJSON or another method)
  // loadStatePolygons();
  stateLayer = new google.maps.Data();
  stateLayer.loadGeoJson(
    "https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json",
    null,
    (features) => {
      features.forEach((feature) => {
        const stateName = feature.getProperty("name");
        // console.log("Countries", stateName);
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

          // Adjust the center based on the country size
          const countryName = feature.getProperty("name"); // Assuming the country name is stored in 'name'
          if (countryName === "United States of America") {
            // Adjust the center by moving it slightly towards the south or east based on the country's shape
            center = new google.maps.LatLng(
              (southWest.lat() + northEast.lat()) / 2.3, // Adjust factor here for better centering
              (southWest.lng() + northEast.lng()) / 2.3 // Adjust factor here for better centering
            );
          }

          if (countryName === "India") {
            center = new google.maps.LatLng(
              (southWest.lat() + northEast.lat()) / 2, // Adjust factor here for better centering
              (southWest.lng() + northEast.lng()) / 2.1 // Adjust factor here for better centering
            );
          }

          const label = new google.maps.Marker({
            position: center,
            map: map,
            label: {
              text: stateName,
              color: "#000000",
              fontSize: "12px",
              //fontWeight: "200",
              opacity: 0.8,
            },
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 0,
              labelOrigin: stateName.toLowerCase() === "canada" ? 
                    new google.maps.Point(-10, 0) 
                      : new google.maps.Point(0, 0),
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

  const southAfricaTip = { lat: -3.8588, lng: 2.0111 };

  // Center the map on the tip of South Africa
  /* setTimeout(() => {
    map.setCenter(southAfricaTip);
  }, 1000); */

  map.addListener("zoom_changed", () => {
    const zoom = map.getZoom();
    labels.forEach((label) => {
      label.setVisible(zoom > 2.7);
    });
  });

  getTotalWasteCountryWise();
  console.log("upcomingCountries",upcomingCountries);
  
  let masked = false;
  let dottedOverlay;

  function getValue(country) {
    // if (["India", "USA", "Bangladesh", "China"].includes(country)) {
    //   return "9,990,000";
    // }
    return "7,793,000";
  }
  // Highlight on hover
  stateLayer.addListener("mouseover", function (event) {
    map.data.revertStyle(); // Revert previous highlight

    //remove from here
    //const { Fg } = event.feature; // something messed up in Geo.json Fg is undefined
    //if (["ATA", "RUS"].includes(Fg)) return;
    // createOverlay(event);
    //to here

    //replacing instead
    const name = event.feature.getProperty("name");
    if (["Antarctica", "Russia"].includes(name)) return;
    //till here
    
    //TODO:Define color scheme based on countries
    stateLayer.overrideStyle(event.feature, {
      // fillColor: getCountryHighlightColor(name), // Highlight fill color
      strokeColor: "#4CACB6", // Highlight border color
      strokeWeight: 1,
    });
  });

  // Remove highlight when the mouse leaves
  stateLayer.addListener("mouseout", function (event) {
    // stateLayer.revertStyle();
    stateLayer.overrideStyle(event.feature, {
      // fillColor: "#FFFFFF",
      strokeColor: "#000000",
      strokeWeight: 0,
    });
  });

  let activePopups;
  var selecteedStates = {};

  // Add click event to toggle highlight
  stateLayer.addListener("click", function (event) {
    // const isSelected = event.feature.getProperty("isSelected");
    stateLayer.revertStyle();
    const { Fg } = event.feature; //Fg was internal variable and now removed
    const name = event.feature.getProperty("name");
    const code = Fg;
    
    const { clientX: x, clientY: y } = event.domEvent;
    if (
      [
        "ATA",
        //"RUS"
      ].includes(Fg)
    )
      return;

    function handleSignupCta(e) {
      e.preventDefault();
      window.open(`https://www.worldofwaste.co/sign-up`, "_blank");
    }
    
    //removed but need to be added here later
    const supportedCountries = [
      "India",
      "United States of America",
      "United Kingdom",
      "Tunisia",
      "Spain",
      "Poland",
      "Netherlands",
      "Morocco",
      "Egypt",
      "Belgium",
      "Germany",
      "Bangladesh",
      "Pakistan",
      "Sri Lanka",
      "Vietnam",
      "Indonesia",
      "Canada",
      "Cambodia"
    ];
    

    const allPopups = document.querySelectorAll("[popup=default]")
    console.log("allpopup",allPopups)
    const matchingPopup = Array.from(allPopups).find(popup => {
      let countryname
      if(popup){
      const countryElement = popup.querySelector("[popup=country]");
      console.log("text title", countryElement.innerText);
      if(countryElement.innerText === "USA"){
      countryname = "United States of America";
      }else if (countryElement.innerText === "UK"){
      countryname = "United Kingdom";
      }else if(countryElement.innerText === "BANGLADESH"){
      countryname = "Bangladesh";
      }else{ countryname = countryElement.innerText}  
      return countryElement && countryname.toUpperCase() === name.toUpperCase();
      }
    });
    
    const defaultPopup = document.querySelectorAll("[popup=default]")[1];
    const defaultPopupEle = defaultPopup.cloneNode(true);
    matchingPopup.querySelector("[popup=country]").innerText = name;
    // matchingPopup.querySelector("[popup=country]").innerText =
    //   name.toUpperCase();
    // defaultPopup.querySelector("[popup=country]").innerText =
    //   name.toUpperCase();

    let finalText = "No data yet. Sign up for updates.";
    let ctaText = "Sign up";
    //if (Fg === "PAK" || Fg === "KHM") {
    //    if ( Fg === "KHM") {
    //   finalText = `Upcoming: 2025`;
    //   ctaText = "Read more";
    //   if (Fg === "KHM") {
    //     defaultPopup
    //       .querySelector("[popup=cta]")
    //       .addEventListener("click", (rv) => {
    //         rv.preventDefault();
    //         window.location.href = `https://www.worldofwaste.co/projects/cambodia`;
    //       });
    //   }
    //   //defaultPopup.querySelector("[popup=cta]").removeEventListener("click", handleSignupCta);
    // } else {
    //   finalText = "No data yet. Sign up for updates.";
    //   ctaText = "Sign up";
    //   defaultPopup
    //     .querySelector("[popup=cta]")
    //     .addEventListener("click", handleSignupCta);
    // }
    
    // defaultPopup
    //     .querySelector("[popup=cta]")
    //     .addEventListener("click", handleSignupCta);
    // defaultPopup.querySelector("[popup=cta]").innerText = ctaText;
    // defaultPopup.querySelector("[popup=title]").innerText = finalText;

    console.log("xx",name)
    console.log("matchingPopup",matchingPopup)

    //Signup button not needed anymore
    // if(!upcomingCountries.includes(name)){
    //   console.log("not in list", name)
    //   matchingPopup
    //     .querySelector("[popup=cta]")
    //     .addEventListener("click", handleSignupCta);
    //   matchingPopup.querySelector("[popup=cta]").innerText = ctaText;
    //   matchingPopup.querySelector("[popup=title]").innerText = finalText; 
    // }
    
    // defaultPopup
    //   .querySelector("[popup=close-btn]")
    //   .addEventListener("click", () => {
    //     handlePopup(false, name, "", { x, y }, defaultPopup.parentElement);
    //   });
    matchingPopup
      .querySelector("[popup=close-btn]")
      .addEventListener("click", () => {
        handlePopup(false, name, "", { x, y }, matchingPopup.parentElement);
      });

    // Toggle the 'isSelected' property

    if (!supportedCountries.includes(name)) {
      return;
    }
    
    //need to check for upcoming countries popup
    // if (!["IND","USA","GBR","TUN","ESP","POL","NLD",
    //       "MAR","EGY","BEL","DEU","BGD",
    //       "PAK","LKA","VNM","IDN","CAN"].includes(Fg)) {
    //     //hide popop
    //     handlePopup(true, name, "", { x, y }, defaultPopup.parentElement);
    //     if (activePopups)
    //     handlePopup(false, name, getValue(name), { x, y }, activePopups);
    //     return;
    //   } else {
    //     handlePopup(false, name, "", { x, y }, defaultPopup.parentElement);
    //   }

    
    // if (isSelected) popupEle?.classList.remove("show");
    event.feature.setProperty("isSelected", !!selecteedStates[name]);

    if (!selecteedStates[name]) {
      selecteedStates[name] = true;
    } /* else {
      selecteedStates[name] = false;
    } */
    const isSelected = selecteedStates[name];
    // console.log("Clided >>>", { currentCountry, isSelected });

    if (interactionType === "click") {
      // console.log("currentCountry",currentCountry);
      // console.log("name",name);
      if (currentCountry && currentCountry !== name) {
        // console.log("country chcek", { currentCountry, c: name });
        handlePopup(false, name, getValue(name), { x, y }, activePopups);
      }

      const popupElerEF = getPopupElement(name);
      /*  if (activePopups && activePopups !== popupElerEF) {
        console.log("REF check", { activePopups, popupElerEF });
        handlePopup(false, name, getValue(name), { x, y }, activePopups);
        return;
      } */
      activePopups = popupElerEF;
      currentCountry = name;
      handlePopup(true, name, getValue(name), { x, y }, popupElerEF);
    }

    // Set style based on 'isSelected' property
    stateLayer.overrideStyle(event.feature, {
      fillColor: !isSelected
        ? "#FFFFFF"
        : getCountryHighlightColor(name) || "#00BCD4", // Toggle fill color
      strokeColor: !isSelected ? "#000000" : "#888888", // Toggle stroke color
      strokeWeight: 0, // Toggle stroke weight
    });

    /* stateLayer.setStyle(function (feature) {
      return {
        fillColor: isSelected
          ? getCountryHighlightColor(feature.getProperty("name"))
          : "#ffffff",
        strokeWeight: 0,
      };
    }); */
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
  ]; // Add real country names
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

  //highlight array of states on the map similar to toggle highlight
  function highlightCountries(initialData, btn, activeKey) {
    stateLayer.revertStyle();
    let countries = [
      ...initialData,
      ...upcomingCountries,
      "United Kingdom",
      "Cambodia",
    ];

    // Toggle the active state
    if (activeKey && btn) {
      activeStates[activeKey] = !activeStates[activeKey];

      if (activeStates[activeKey]) {
        activateButton(btn);
      } else {
        deactivateButton(btn);
      }

      // If both buttons are inactive, reset to highlight all
      /*  if (!activeStates.lowData && !activeStates.upcomingData) {
        activeStates.lowData = activeStates.upcomingData = true;
        activateButton(postConsumerBtn); // assuming buttons are accessible
        activateButton(postIndustrialBtn);
      } */
    } else {
      activeStates = {
        lowData: true,
        upcomingData: true,
      };
    }
    // console.log("Active states >>>", activeStates);

    if (!activeStates.lowData && !activeStates.upcomingData) {
      countries = [...upcomingCountries, "United Kingdom", "Cambodia"];
    }

    // Style the countries based on active states
    stateLayer.setStyle(function (feature) {
      const countryName = feature.getProperty("name");

      // Set default fill color
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
          // fillOpacity: 1,
          fillOpacity: fillColor === "#FFFFFF" ? 0.4 : 0.9,
        };
      }

      // Highlight lowData or upcomingData countries
      if (activeStates.lowData && countries.includes(countryName)) {
        fillColor = getCountryHighlightColor(countryName); // Color for lowData countries
      }
      if (
        countryName !== "United Kingdom" &&
        activeStates.upcomingData &&
        countries.includes(countryName)
      ) {
        fillColor = getCountryHighlightColor(countryName); // Color for upcomingData countries
      }

      // Return the style with appropriate color
      return {
        fillColor: fillColor,
        strokeWeight: 0,
        // fillOpacity: 1,
        fillOpacity: fillColor === "#FFFFFF" ? 0.4 : 0.9,
      };
    });
  }

  // Define your sets of countries

  //const highestDataCountries = ["Brazil", "Russia"];
  /* setTimeout(() => {
    highlightCountries(allCountries, highestDataBtn);
  }, 1500); */
  // Add event listeners for the buttons
  /* postConsumerBtn.addEventListener("click", () => {
    // toggleHighlight(postConsumerBtn, postConsumptionCountries, lowData, "lowData");
    highlightCountries2(
      postConsumptionCountries,
      postConsumerBtn,
      "upcomingData",
      postIndustrialBtn,
      "lowData"
    );
    toggleCountryLabels(postIndustrialCountries, activeStates.upcomingData);
  });

  postIndustrialBtn.addEventListener("click", () => {
    highlightCountries2(
      postIndustrialCountries,
      postIndustrialBtn,
      "lowData",
      postConsumerBtn,
      "upcomingData"
    );

    toggleCountryLabels(postConsumptionCountries, activeStates.lowData);
  }); 

  //reset button
  highestDataBtn.addEventListener("click", () => {
    highlightCountries(allCountries, highestDataBtn);
    toggleCountryLabels(allCountries, activeStates.highestData);
  });

  */

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
   button.style.outline = "2px solid #000";
    button.style.boxShadow = "none";
    button.style.backgroundColor = "#F5F5F5";
  }

  function deactivateFilter(button) {
    button.style.outline = "2px solid rgba(0,0,0,0)";
     button.style.boxShadow = "4px 4px 4px rgba(0,0,0,0.25)";
    button.style.backgroundColor = "#E4E4E4";
  }

  function handlePostConsumerBtn() {
    //deactivate other active button
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
      //toggleCountryLabels(postConsumptionCountries, false);
    }
    // console.log("active countries", activeCountries);

    stateLayer.revertStyle();
    let countries = [
      ...postConsumptionCountries,
      ...upcomingCountries,
      "United Kingdom",
      "Cambodia",
    ];

    // Style the countries based on active states
    stateLayer.setStyle(function (feature) {
      const countryName = feature.getProperty("name");

      // Set default fill color
      let fillColor = "#FFFFFF";

      // Highlight lowData or upcomingData countries
      if (activeCountries.postConsumer && countries.includes(countryName)) {
        fillColor = getCountryHighlightColor(countryName); // Color for lowData countries
      }

      if (
        !activeCountries.postConsumer &&
        !activeCountries.postIndustrial &&
        allCountries.includes(countryName)
      ) {
        fillColor = getCountryHighlightColor(countryName);
        toggleCountryLabels(allCountries, activeStates.highestData);
      }

      // Return the style with appropriate color
      return {
        fillColor: fillColor,
        strokeWeight: 0,
        // fillOpacity: 1,
        fillOpacity: fillColor === "#FFFFFF" ? 0.4 : 0.9,
      };
    });
  }

  function handlePostIndustrialBtn() {
    //deactivate other active button
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
    // console.log("active countries", activeCountries);

    let countries = [
      ...postIndustrialCountries,
      ...upcomingCountries,
      "United Kingdom",
      "Cambodia",
    ];

    // Style the countries based on active states
    stateLayer.setStyle(function (feature) {
      const countryName = feature.getProperty("name");

      // Set default fill color
      let fillColor = "#FFFFFF";

      // Highlight lowData or upcomingData countries

      if (
        countryName !== "United Kingdom" &&
        activeCountries.postIndustrial &&
        countries.includes(countryName)
      ) {
        fillColor = getCountryHighlightColor(countryName); // Color for upcomingData countries
      }

      if (
        !activeCountries.postConsumer &&
        !activeCountries.postIndustrial &&
        allCountries.includes(countryName)
      ) {
        fillColor = getCountryHighlightColor(countryName);
        toggleCountryLabels(allCountries, activeStates.highestData);
      }

      // Return the style with appropriate color
      return {
        fillColor: fillColor,
        strokeWeight: 0,
        // fillOpacity: 1,
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

      // Set default fill color
      let fillColor = "#FFFFFF";

      // Highlight lowData or upcomingData countries

      if (
        !activeCountries.postConsumer &&
        !activeCountries.postIndustrial &&
        allCountries.includes(countryName)
      ) {
        fillColor = getCountryHighlightColor(countryName);
      }

      // Return the style with appropriate color
      return {
        fillColor: fillColor,
        strokeWeight: 0,
        // fillOpacity: 1,
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
