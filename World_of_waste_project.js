//console.log = () => {};
console.log("fetch...2");

//selectors
const selectors = {};
//helpers

function calculatePercentages(values) {
  // Convert strings to numbers and find the maximum value
  const numericValues = values.map((value) => parseFloat(value) || 0);
  const maxValue = Math.max(...numericValues);

  // Calculate percentages
  const percentages = numericValues.map((value) =>
    maxValue !== 0 ? (value / maxValue) * 100 : 0
  );

  // Round to two decimal places
  return percentages.map((percentage) => Number(percentage));
}

const updateBargraph = (id = "pc", barcolor) => {
  let textValues = [];
  let percentages = [];
  const titles = document.querySelectorAll(`[${id}=item-title]`);
  const values = document.querySelectorAll(`[${id}=item-value]`);
  const bars = document.querySelectorAll(`[${id}=item-bar]`);
  titles.forEach((title, i) => {
    console.log("item", {
      title: title.innerText,
      value: values[i].innerText,
      bar: bars[i],
    });
    bars[i].style.backgroundColor = barcolor;
    textValues.push(values[i].innerText.replaceAll(",", ""));
    // bars[i].style.transition = "width 1s";
    // bars[i].style.width = `${Math.random() * 50}%`;
  });

  console.log("textValues",textValues)
  percentages = calculatePercentages(textValues);
  console.log("Percentages", percentages);
  percentages.forEach((percentage, i) => {
    bars[i].style.transition = "width 1s";
    bars[i].style.width = `${percentage}%`;
  });
};

const updateBarGraphs = (barcolor) => {
  updateBargraph("pc", barcolor);
  updateBargraph("pi", barcolor);
  updateBargraph("ip", barcolor);
};

const updateDonughtChart = (
  values = [30, 40],
  colors = ["#9f7aea", "#805ad5"]
) => {
  const ctx = document.getElementById("semiDoughnutChart").getContext("2d");

  const semiDoughnutChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: [
        "Post consumer waste",
        "Post Industrial waste",
        "Imported waste",
      ], // Labels for your segments
      datasets: [
        {
          data: values, // Values for each segment
          backgroundColor: colors, // Colors for each segment
          hoverBackgroundColor: colors,
          borderWidth: 0, // No border
        },
      ],
    },
    options: {
      rotation: -90, // Start angle (90 degrees to the left)
      circumference: 180, // End angle (180 degrees)
      cutout: "70%", // Makes the chart hollow
      responsive: true,
      maintainAspectRatio: false,
      aspectRatio: 1,
      layout: {
        padding: 20,
      },
      plugins: {
        legend: {
          display: false, // Hide legend
        },
        tooltip: {
          enabled: false, // Hide tooltip
        },
      },
    },
  });
};

function getTextColor(element) {
  const computedStyle = window.getComputedStyle(element);
  return computedStyle.color;
}

function updateBarGraphTitleColors(element, color) {
  if (element) {
    element.style.color = color;
  }
}

// First, include the required libraries in your HTML
// <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
// <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>

function captureScreenshot(name) {
  const element = document.body; // Or any specific element like document.getElementById('myElement')

  htmlToImage
    .toPng(element)
    .then(function (dataUrl) {
      // Create a link element, set the download attribute and click it
      const link = document.createElement("a");
      link.download = `${name}.png`;
      link.href = dataUrl;
      link.click();
    })
    .catch(function (error) {
      console.error("Error capturing screenshot:", error);
    });
}

function handleDownloadBtn() {
  const downloadBtn = $("[download-btn]");
  downloadBtn.click((ev) => {
    console.log("Generate a screenshot");
    const projectName = document.querySelector("[project-name]").innerText;
    /* setTimeout(() => {
      captureAndDownloadScreenshot(projectName);
    }, 100); */
    captureScreenshot(projectName);
  });
}

//init
const init = () => {
  const totalPostConsumervalue = document.querySelector("[tpc=value]");
  const totalPostIndustrialvalue = document.querySelector("[tpi=value]");
  const totalImportedWasteValue = document.querySelector("[timp=value]");

  const barGraph1Title = document.querySelector("[tpc=item-title]");
  const barGraph2Title = document.querySelector("[tpi=item-title]");
  const barGraph3Title = document.querySelector("[timp=item-title]");

  console.log("Elements", { totalPostConsumervalue, totalPostIndustrialvalue });
  const color1 = getTextColor(totalPostConsumervalue);
  const color2 = getTextColor(totalPostIndustrialvalue);
  const color3 = getTextColor(totalImportedWasteValue);

  console.log("Colors", { color1, color2 });
  const values = [];
  if (totalPostConsumervalue && totalPostConsumervalue.innerText !== "") {
    values.push(
      parseFloat(totalPostConsumervalue.innerText.replaceAll(",", ""))
    );
  }
  if (totalPostIndustrialvalue && totalPostIndustrialvalue.innerText !== "") {
    values.push(
      parseFloat(totalPostIndustrialvalue.innerText.replaceAll(",", ""))
    );
  }
  if (totalImportedWasteValue && totalImportedWasteValue.innerText !== "") {
    values.push(
      parseFloat(totalImportedWasteValue.innerText.replaceAll(",", ""))
    );
  }

  const colors = [color1, color2, color3];
  updateDonughtChart(values, colors);
  updateBarGraphTitleColors(barGraph1Title, color1);
  updateBarGraphTitleColors(barGraph2Title, color2);
  updateBarGraphTitleColors(barGraph3Title, color3);
  updateBarGraphs(color2);
  // handleDownloadBtn();
};

window.addEventListener("DOMContentLoaded", init);
