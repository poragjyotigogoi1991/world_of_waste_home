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
    // Removed: bars[i].style.backgroundColor = barcolor;
    textValues.push(values[i].innerText.replaceAll(",", ""));
  });

  console.log("textValues", textValues);
  percentages = calculatePercentages(textValues);
  console.log("Percentages", percentages);
  percentages.forEach((percentage, i) => {
    bars[i].style.transition = "width 1s";
    bars[i].style.width = `${textValues[i] === "" ? "0%" : textValues[i]}`;
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
      ],
      datasets: [
        {
          data: values,
          backgroundColor: colors,
          hoverBackgroundColor: colors,
          borderWidth: 0,
        },
      ],
    },
    options: {
      rotation: -90,
      circumference: 180,
      cutout: "70%",
      responsive: true,
      maintainAspectRatio: false,
      aspectRatio: 1,
      layout: {
        padding: 20,
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          enabled: false,
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

function captureScreenshot(name) {
  const element = document.body;

  htmlToImage
    .toPng(element)
    .then(function (dataUrl) {
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
  updateBarGraphs(color1); // Changed from color2 to color1
  updateDonughtChart(values, colors);
  updateBarGraphTitleColors(barGraph1Title, color1);
  updateBarGraphTitleColors(barGraph2Title, color2);
  updateBarGraphTitleColors(barGraph3Title, color3);
};

window.addEventListener("DOMContentLoaded", init);
