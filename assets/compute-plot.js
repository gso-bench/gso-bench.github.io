// Compute Metrics Scatter Plot Manager using Chart.js
class ComputeMetricsPlotManager {
    constructor() {
        this.chart = null;
        this.data = null;
        this.mode = 'time'; // 'time' or 'turns'
        this.hiddenModels = new Set(); // track hidden datasets across mode switches
        this.colors = [
            '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
            '#8c564b', '#e377c2', '#17becf', '#bcbd22', '#ff1493',
            '#00838f', '#c62828', '#4169e1', '#ff8c00', '#2e7d32',
            '#6a1b9a', '#00bfff',
        ];
        this.init();
    }

    async init() {
        try {
            await this.loadData();
            this.setupControls();
            this.createChart();
        } catch (error) {
            console.error('Failed to initialize compute metrics plot:', error);
        }
    }

    async loadData() {
        const response = await fetch('assets/compute_metrics.json');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        this.data = await response.json();
    }

    setupControls() {
        const container = document.getElementById('compute-plot-controls');
        if (!container) return;

        const buttons = [
            { label: 'Time per Task', value: 'time' },
            { label: 'Turns per Task', value: 'turns' },
        ];

        buttons.forEach(btn => {
            const el = document.createElement('button');
            el.textContent = btn.label;
            el.className = 'compute-toggle-btn' + (btn.value === this.mode ? ' active' : '');
            el.addEventListener('click', () => {
                container.querySelectorAll('.compute-toggle-btn').forEach(b => b.classList.remove('active'));
                el.classList.add('active');
                this.mode = btn.value;
                this.createChart();
            });
            container.appendChild(el);
        });
    }

    saveHiddenState() {
        if (!this.chart) return;
        this.hiddenModels.clear();
        this.chart.data.datasets.forEach((ds, i) => {
            if (!this.chart.isDatasetVisible(i)) {
                this.hiddenModels.add(ds.label);
            }
        });
    }

    createChart() {
        const canvas = document.getElementById('compute-metrics-plot');
        if (!canvas || !this.data) return;

        // Save hidden state before destroying
        this.saveHiddenState();

        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }

        const rootEl = document.documentElement;
        const textColor = getComputedStyle(rootEl).getPropertyValue('--text-primary').trim();
        const gridColor = getComputedStyle(rootEl).getPropertyValue('--border-color').trim();

        // Sort by score for consistent color assignment
        const sorted = Object.entries(this.data)
            .sort((a, b) => b[1].score - a[1].score);

        const isTime = this.mode === 'time';
        const xLabel = isTime ? 'Median Time per Task (min)' : 'Median Turns per Task';

        // Build one dataset per model (for individual colors + legend)
        let xMax = 0;
        const datasets = sorted.map(([name, d], i) => {
            const xVal = isTime ? d.median_time_min : d.median_turns;
            const xLo = isTime ? d.time_ci_lo : d.turns_ci_lo;
            const xHi = isTime ? d.time_ci_hi : d.turns_ci_hi;
            const color = this.colors[i % this.colors.length];
            xMax = Math.max(xMax, xHi);

            return {
                label: name,
                data: [{ x: xVal, y: d.score }],
                backgroundColor: color,
                borderColor: color,
                pointRadius: 6,
                pointHoverRadius: 9,
                pointStyle: 'circle',
                hidden: this.hiddenModels.has(name),
                // Store CI data for the error bar plugin
                xErrorLo: xVal - xLo,
                xErrorHi: xHi - xVal,
            };
        });
        // Add padding so CI bars aren't clipped at the right edge
        xMax = Math.ceil(xMax * 1.05);

        // Custom plugin to draw horizontal error bars
        const errorBarPlugin = {
            id: 'horizontalErrorBars',
            afterDatasetsDraw(chart) {
                const ctx = chart.ctx;
                chart.data.datasets.forEach((ds, dsIndex) => {
                    const meta = chart.getDatasetMeta(dsIndex);
                    if (!meta.visible) return;
                    const xLo = ds.xErrorLo || 0;
                    const xHi = ds.xErrorHi || 0;
                    if (xLo === 0 && xHi === 0) return;

                    meta.data.forEach((point, pIndex) => {
                        const xScale = chart.scales.x;
                        const rawData = ds.data[pIndex];
                        if (!rawData) return;
                        const xCenter = point.x;
                        const yCenter = point.y;
                        const xPixelLo = xScale.getPixelForValue(rawData.x - xLo);
                        const xPixelHi = xScale.getPixelForValue(rawData.x + xHi);

                        ctx.save();
                        ctx.strokeStyle = ds.borderColor;
                        ctx.lineWidth = 1.5;
                        ctx.globalAlpha = 0.6;

                        // Horizontal line
                        ctx.beginPath();
                        ctx.moveTo(xPixelLo, yCenter);
                        ctx.lineTo(xPixelHi, yCenter);
                        ctx.stroke();

                        // Caps
                        const capSize = 4;
                        ctx.beginPath();
                        ctx.moveTo(xPixelLo, yCenter - capSize);
                        ctx.lineTo(xPixelLo, yCenter + capSize);
                        ctx.stroke();
                        ctx.beginPath();
                        ctx.moveTo(xPixelHi, yCenter - capSize);
                        ctx.lineTo(xPixelHi, yCenter + capSize);
                        ctx.stroke();

                        ctx.restore();
                    });
                });
            }
        };

        // Custom HTML legend plugin — flex-wrap centered, click to toggle
        const htmlLegendPlugin = {
            id: 'htmlLegend',
            afterUpdate(chart, _args, options) {
                const container = document.getElementById(options.containerID);
                if (!container) return;
                container.innerHTML = '';
                const items = chart.options.plugins.legend.labels.generateLabels(chart);
                items.forEach((item) => {
                    const li = document.createElement('span');
                    li.className = 'plot-legend-item' + (item.hidden ? ' is-hidden' : '');
                    li.onclick = () => {
                        const meta = chart.getDatasetMeta(item.datasetIndex);
                        meta.hidden = meta.hidden === null ? !chart.data.datasets[item.datasetIndex].hidden : null;
                        chart.update();
                    };
                    const swatch = document.createElement('span');
                    swatch.className = 'plot-legend-swatch';
                    swatch.style.background = item.fillStyle;
                    const label = document.createElement('span');
                    label.className = 'plot-legend-label';
                    label.textContent = item.text;
                    li.appendChild(swatch);
                    li.appendChild(label);
                    container.appendChild(li);
                });
            }
        };

        const config = {
            type: 'scatter',
            data: { datasets },
            plugins: [errorBarPlugin, htmlLegendPlugin],
            options: {
                responsive: true,
                maintainAspectRatio: false,
                aspectRatio: 1.6,
                interaction: {
                    intersect: false,
                    mode: 'point',
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    htmlLegend: {
                        containerID: 'compute-plot-legend'
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.9)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: gridColor,
                        borderWidth: 1,
                        cornerRadius: 6,
                        titleFont: { size: 14, weight: 'bold' },
                        bodyFont: { size: 13 },
                        callbacks: {
                            title: (ctx) => ctx[0].dataset.label,
                            label: (ctx) => {
                                const metric = isTime ? 'Time' : 'Turns';
                                return [
                                    `Opt@1: ${ctx.parsed.y.toFixed(1)}%`,
                                    `${metric}: ${ctx.parsed.x.toFixed(1)}`,
                                ];
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: xLabel,
                            color: textColor,
                            font: { family: 'Inter, sans-serif', size: 16, weight: 'bold' }
                        },
                        ticks: {
                            color: textColor,
                            font: { family: 'Inter, sans-serif', size: 14 },
                        },
                        grid: { color: gridColor, lineWidth: 1 },
                        min: isTime ? 0 : 20,
                        max: xMax,
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Opt@1 (%)',
                            color: textColor,
                            font: { family: 'Inter, sans-serif', size: 16, weight: 'bold' }
                        },
                        ticks: {
                            color: textColor,
                            font: { family: 'Inter, sans-serif', size: 14 },
                            callback: v => v + '%',
                        },
                        grid: { color: gridColor, lineWidth: 1 },
                        min: 0,
                    }
                }
            }
        };

        this.chart = new Chart(canvas, config);
        this.setupThemeListener();
    }

    setupThemeListener() {
        if (this._observer) return;
        this._observer = new MutationObserver(() => {
            setTimeout(() => {
                if (this.chart) {
                    this.chart.destroy();
                    this.chart = null;
                }
                this.createChart();
            }, 50);
        });
        this._observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-theme']
        });
    }
}
