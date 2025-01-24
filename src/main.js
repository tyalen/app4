import Plotly from 'plotly.js-dist-min';

document.addEventListener("DOMContentLoaded", () => {
  const chartType = document.getElementById("chart-type");
  const fileInput = document.getElementById("file-input");
  const plotBtn = document.getElementById("plot-btn");
  const exportBtn = document.getElementById("export-btn");
  const graphContainer = document.getElementById("graph-container");

  plotBtn.addEventListener("click", async () => {
    const selectedChart = chartType.value;
    const file = fileInput.files[0];

    if (file) {
      try {
        const data = await readFile(file);

        if (selectedChart === "surface") {
          plotSurfaceGraph(data);
        } else if (selectedChart === "heatmap") {
          plot3DHeatmap(data);
        } else if (selectedChart === "bar") {
          plot3DBarGraph(data);
        } else {
          showAlert("The selected chart type is not supported.");
        }
      } catch (error) {
        showAlert("Error processing the file: " + error.message);
      }
    } else {
      showAlert("Please select a file.");
    }
  });

  exportBtn.addEventListener("click", () => {
    exportGraphAsImage();
  });

  async function readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const text = reader.result;
        if (file.type === 'application/json') {
          try {
            resolve(JSON.parse(text));
          } catch (error) {
            reject(new Error("Error parsing JSON."));
          }
        } else if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
          const rows = text.split('\n').filter(row => row.trim().length > 0);
          const data = rows.slice(1).map(row =>
              row.split(',').map(value => parseFloat(value.trim()))
          ).filter(row => row.every(value => !isNaN(value)));
          resolve(data);
        } else {
          reject(new Error("Unsupported file format."));
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  }

  function plotSurfaceGraph(z) {
    const x = Array.from({ length: z[0].length }, (_, i) => i + 1);
    const y = Array.from({ length: z.length }, (_, i) => i + 1);

    graphContainer.innerHTML = '';

    const trace = {
      type: 'surface',
      x: x,
      y: y,
      z: z,
    };

    Plotly.purge(graphContainer);
    graphContainer.innerHTML = '';
    Plotly.newPlot(graphContainer, [trace], {}, { displayModeBar: false })
        .catch(error => console.error('Error rendering surface plot:', error));
  }

  function plot3DHeatmap(z) {
    const x = Array.from({ length: z[0].length }, (_, i) => i + 1);
    const y = Array.from({ length: z.length }, (_, i) => i + 1);

    Plotly.purge(graphContainer);
    graphContainer.innerHTML = '';

    let scatterData = [];
    for (let i = 0; i < z.length; i++) {
      for (let j = 0; j < z[i].length; j++) {
        scatterData.push({
          x: x[j],
          y: y[i],
          z: z[i][j],
        });
      }
    }

    const trace = {
      type: 'scatter3d',
      mode: 'markers',
      x: scatterData.map(point => point.x),
      y: scatterData.map(point => point.y),
      z: scatterData.map(point => point.z),
      marker: {
        size: 5,
        color: scatterData.map(point => point.z),
        colorscale: 'Viridis',
        showscale: true,
        opacity: 0.8,
      },
    };

    Plotly.newPlot(graphContainer, [trace], {}, { displayModeBar: false })
        .catch(error => console.error('Error rendering surface plot:', error));
  }

  function plot3DBarGraph(data) {
    if (!Array.isArray(data) || data.length === 0) {
      showAlert("Invalid data format for 3D bar chart.");
      return;
    }

    graphContainer.innerHTML = '';

    const x = data.map(row => row[0]);
    const y = data.map(row => row[1]);
    const heights = data.map(row => row[3]); // Высота столбца в последнем столбце данных

    Plotly.purge(graphContainer);

    let bars = [];
    for (let i = 0; i < data.length; i++) {
      bars.push({
        type: 'scatter3d',  // Используем scatter3d для отображения столбцов как линии
        mode: 'lines',
        x: [x[i], x[i]],  // Точки линии по оси X
        y: [y[i], y[i]],  // Точки линии по оси Y
        z: [0, heights[i]],  // Линия от z = 0 до высоты столбца
        line: {
          width: 10,  // Ширина линии, имитирующая столбец
          color: heights[i],  // Цвет в зависимости от высоты
          colorscale: 'Viridis',  // Цветовая палитра
        }
      });
    }

    Plotly.newPlot(graphContainer, bars, {}, { displayModeBar: false })
        .catch(error => console.error('Error rendering bar graph:', error));
  }

  function exportGraphAsImage() {
    Plotly.toImage(graphContainer, { format: 'png', width: 800, height: 600 })
        .then(function (url) {
          const link = document.createElement('a');
          link.href = url;
          link.download = 'graph.png';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        })
        .catch(function (error) {
          showAlert("Error exporting image: " + error.message);
        });
  }

  function showAlert(message) {
    const alertBox = document.createElement("div");
    alertBox.classList.add("custom-alert");
    alertBox.textContent = message;
    document.body.appendChild(alertBox);
    setTimeout(() => alertBox.remove(), 3000);
  }
});
