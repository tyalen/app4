import Plotly from 'plotly.js-dist-min';

document.addEventListener("DOMContentLoaded", () => {
    const chartType = document.getElementById("chart-type");
    const fileInput = document.getElementById("file-input");
    const functionInput = document.getElementById("function-input");
    const plotBtn = document.getElementById("plot-btn");
    const functionPlotBtn = document.getElementById("function-plot-btn");
    const exportBtn = document.getElementById("export-btn");
    const graphContainer = document.getElementById("graph-container");

    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', (ev) => {
            if (ev.currentTarget.getAttribute('data-tab') === 'tab-function') {
                const colorSchemeLabel = document.getElementById('color-scheme-label')
                const legendCheckboxLabel = document.getElementById('legend-checkbox-label')
                colorSchemeLabel.style.display = 'block'
                legendCheckboxLabel.style.display = 'none'
            } else {
                const chartType = document.getElementById('chart-type')
                if (chartType.value === 'bar') {
                    const legendCheckboxLabel = document.getElementById('legend-checkbox-label')
                    const colorSchemeLabel = document.getElementById('color-scheme-label')
                    legendCheckboxLabel.style.display = 'block'
                    colorSchemeLabel.style.display = 'none'
                }
            }

            tabButtons.forEach((btn) => {
                btn.classList.remove('active');
            });
            tabContents.forEach(tab => tab.classList.add('hidden'));

            button.classList.add('active');
            const targetId = button.getAttribute('data-tab');
            document.getElementById(targetId).classList.remove('hidden');
        });
    });


    // Раскрытие настроек графика
    const settingsLabel = document.getElementById('settings-label');
    const settingsContent = document.getElementById('settings-content');
    const graphTitle = document.getElementById("graph-title").value || "";


    settingsLabel.addEventListener('click', () => {
        settingsContent.classList.toggle('hidden');
        settingsLabel.classList.toggle('active');
    });

    // Логика отображения настроек легенды
    const legendToggle = document.getElementById('legend-toggle');
    const legendSettings = document.getElementById('legend-settings');

    legendToggle.addEventListener('change', () => {
        if (legendToggle.checked) {
            legendSettings.classList.remove('hidden');
        } else {
            legendSettings.classList.add('hidden');
        }
    });

    function getGraphLayout() {
        const xLabel = document.getElementById("x-label").value || "X";
        const yLabel = document.getElementById("y-label").value || "Y";
        const zLabel = document.getElementById("z-label").value || "Z";
        const graphTitle = document.getElementById("graph-title").value || "";
        const xMin = parseFloat(document.getElementById("xMin").value);
        const xMax = parseFloat(document.getElementById("xMax").value);
        const yMin = parseFloat(document.getElementById("yMin").value);
        const yMax = parseFloat(document.getElementById("yMax").value);
        const zMin = parseFloat(document.getElementById("zMin").value);
        const zMax = parseFloat(document.getElementById("zMax").value);

        return {
            title: graphTitle,
            scene: {
                xaxis: {range: [xMin, xMax], title: xLabel},
                yaxis: {range: [yMin, yMax], title: yLabel},
                zaxis: {range: [zMin, zMax], title: zLabel}
            }
        };
    }

    function getActiveTabColorscale() {
        const select = document.querySelector('.colorscale-select');
        return select ? select.value : 'Viridis';
    }

    const chartTypeSelect = document.getElementById('chart-type');

    chartTypeSelect.onchange = (e) => {
        const legendCheckboxLabel = document.getElementById('legend-checkbox-label')
        const checkboxInput = legendCheckboxLabel.getElementsByTagName('input')[0]
        const colorSchemeLabel = document.getElementById('color-scheme-label')
        if (e.currentTarget.value === 'bar') {
            legendCheckboxLabel.style.display = 'block'
            colorSchemeLabel.style.display = 'none'
            checkboxInput.checked = undefined
            return
        }
        colorSchemeLabel.style.display = 'block'
        legendCheckboxLabel.style.display = 'none'
    }

    function generateLegendInputs(columnCount) {
        const container = document.getElementById("legend-names-container");
        container.innerHTML = ""; // очистить старые поля

        for (let i = 0; i < columnCount; i++) {
            const label = document.createElement("label");
            label.textContent = `Название серии ${i + 1}:`;

            const input = document.createElement("input");
            input.type = "text";
            input.className = "legend-input";
            input.dataset.seriesIndex = i;
            input.placeholder = `например: Серия ${i + 1}`;

            container.appendChild(label);
            container.appendChild(input);
        }

        container.classList.remove("hidden");
    }

    plotBtn.addEventListener("click", async () => {
        const selectedChart = chartType.value;
        const file = fileInput.files[0];
        const colorscale = getActiveTabColorscale();

        if (file) {
            try {
                const data = await readFile(file);

                if (selectedChart === "surface") {
                    plotSurfaceGraph(data, null, null, colorscale);
                } else if (selectedChart === "heatmap") {
                    plot3DHeatmap(data, null, null, colorscale);
                } else if (selectedChart === "bar") {
                    plot3DBarGraph(data, colorscale);
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

    functionPlotBtn.addEventListener("click", () => {
        const funcStr = functionInput.value.trim();
        const selectedChart = chartType.value;
        const colorscale = getActiveTabColorscale();
        const layout = getGraphLayout();

        if (!funcStr) {
            showAlert("Please enter a function, e.g., sin(sqrt(x^2 + y^2)) / (sqrt(x^2 + y^2) + 0.0001)");
            return;
        }

        try {
            // Получаем границы с fallback на -10 и 10
            const xMin = parseFloat(document.getElementById("xMin").value);
            const xMax = parseFloat(document.getElementById("xMax").value);
            const yMin = parseFloat(document.getElementById("yMin").value);
            const yMax = parseFloat(document.getElementById("yMax").value);
            const zMin = parseFloat(document.getElementById("zMin").value);
            const zMax = parseFloat(document.getElementById("zMax").value);

            const xStart = !isNaN(xMin) ? xMin : -10;
            const xEnd = !isNaN(xMax) ? xMax : 10;
            const yStart = !isNaN(yMin) ? yMin : -10;
            const yEnd = !isNaN(yMax) ? yMax : 10;
            // zMin и zMax можно использовать позже в layout или масштабировании

            const pointsCount = 50; // число точек по осям x и y

            // Создаём массивы x и y с равномерным шагом
            const x = Array.from({length: pointsCount}, (_, i) => xStart + i * (xEnd - xStart) / (pointsCount - 1));
            const y = Array.from({length: pointsCount}, (_, i) => yStart + i * (yEnd - yStart) / (pointsCount - 1));

            // Компилируем функцию для быстрого вычисления
            const compiled = math.compile(funcStr);
            const z = [];
            let hasInvalidValues = false;

            for (let i = 0; i < y.length; i++) {
                z[i] = [];
                for (let j = 0; j < x.length; j++) {
                    try {
                        const value = compiled.evaluate({x: x[j], y: y[i]});
                        if (!isFinite(value) || isNaN(value)) {
                            z[i][j] = 0;
                            hasInvalidValues = true;
                        } else {
                            z[i][j] = value;
                        }
                    } catch {
                        z[i][j] = 0;
                        hasInvalidValues = true;
                    }
                }
            }

            if (hasInvalidValues) {
                showAlert("Some function values were invalid and replaced with 0.");
            }

            if (selectedChart === "surface") {
                plotSurfaceGraph(z, x, y, colorscale, layout);
            } else if (selectedChart === "heatmap") {
                plot3DHeatmap(z, x, y, colorscale, layout);
            } else if (selectedChart === "bar") {
                showAlert("Bar chart is not supported for function input.");
            } else {
                showAlert("The selected chart type is not supported.");
            }
        } catch (error) {
            showAlert("Error evaluating function: " + error.message);
        }
    });

    async function readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const text = reader.result;
                if (file.type === 'application/json') {
                    try {
                        resolve(JSON.parse(text));
                    } catch {
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


    function plotSurfaceGraph(z, x = null, y = null, colorscale = 'Viridis') {
        const xValues = x || Array.from({length: z[0].length}, (_, i) => i + 1);
        const yValues = y || Array.from({length: z.length}, (_, i) => i + 1);

        graphContainer.innerHTML = '';

        const flatZ = z.flat();
        const trace = {
            type: 'surface',
            x: xValues,
            y: yValues,
            z: z,
            colorscale,
            cmin: Math.min(...flatZ),
            cmax: Math.max(...flatZ),
        };

        Plotly.newPlot(graphContainer, [trace], getGraphLayout(), {displayModeBar: false})
            .catch(error => console.error('Error rendering surface plot:', error));
    }

    function plot3DHeatmap(z, x = null, y = null, colorscale = 'Viridis') {
        const xValues = x || Array.from({length: z[0].length}, (_, i) => i + 1);
        const yValues = y || Array.from({length: z.length}, (_, i) => i + 1);

        let scatterData = [];
        for (let i = 0; i < z.length; i++) {
            for (let j = 0; j < z[i].length; j++) {
                scatterData.push({
                    x: xValues[j],
                    y: yValues[i],
                    z: z[i][j],
                });
            }
        }

        const values = scatterData.map(p => p.z);

        const trace = {
            type: 'scatter3d',
            mode: 'markers',
            x: scatterData.map(p => p.x),
            y: scatterData.map(p => p.y),
            z: values,
            marker: {
                size: 5,
                color: values,
                colorscale,
                cmin: Math.min(...values),
                cmax: Math.max(...values),
                showscale: true,
                opacity: 0.8,
            },
        };

        graphContainer.innerHTML = '';

        Plotly.newPlot(graphContainer, [trace], getGraphLayout(), {displayModeBar: false})
            .catch(error => console.error('Error rendering heatmap:', error));
    }

    function plot3DBarGraph(data, colorscale = 'Viridis') {
        if (!Array.isArray(data) || data.length === 0) {
            showAlert("Invalid data format for 3D bar chart.");
            return;
        }

        const showLegend = document.getElementById('legend-toggle').checked;

        const x = data.map(row => row[0]);
        const y = data.map(row => row[1]);
        const categoryNames = data.map(row => row[2]); // например, категория/название
        const heights = data.map(row => row[3]);

        const minHeight = Math.min(...heights);
        const maxHeight = Math.max(...heights);

        let bars = [];
        for (let i = 0; i < data.length; i++) {
            bars.push({
                type: 'scatter3d',
                mode: 'lines',
                x: [x[i], x[i]],
                y: [y[i], y[i]],
                z: [0, heights[i]],
                line: {
                    width: 10,
                    color: heights[i],
                    colorscale,
                    cmin: minHeight,
                    cmax: maxHeight,
                },
                name: showLegend ? (categoryNames[i] || `Категория ${i + 1}`) : undefined,
                showlegend: showLegend
            });
        }

        graphContainer.innerHTML = '';

        Plotly.newPlot(graphContainer, bars, getGraphLayout(), {displayModeBar: false})
            .catch(error => console.error('Error rendering 3D bar graph:', error));
    }

    exportBtn.addEventListener("click", () => {
        exportGraphAsImage();
    });

    function exportGraphAsImage() {
        Plotly.toImage(graphContainer, {format: 'png', width: 800, height: 600})
            .then(url => {
                const link = document.createElement('a');
                link.href = url;
                link.download = 'graph.png';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            })
            .catch(error => {
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
