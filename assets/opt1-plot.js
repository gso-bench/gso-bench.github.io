// Opt@1 vs Speedup Threshold Plot Manager using Chart.js
class Opt1ThresholdPlotManager {
    constructor() {
        this.charts = [];
        this.hiddenModels = new Map();
        this.themeObserver = null;
        this.data = null;
        this.colors = [
            '#1f77b4', // Blue
            '#ff7f0e', // Orange
            '#2ca02c', // Green
            '#d62728', // Red
            '#9467bd', // Purple
            '#8c564b', // Brown
            '#e377c2', // Pink
            '#17becf', // Cyan
            '#bcbd22', // Yellow-green
            '#ff1493', // Deep Pink
            '#00838f', // Teal
            '#c62828', // Dark Red
            '#4169e1', // Royal Blue
            '#ff8c00', // Dark Orange
            '#2e7d32', // Dark Green
            '#6a1b9a', // Deep Purple
            '#00bfff', // Deep Sky Blue
        ];
        this.init();
    }
    
    async init() {
        try {
            await this.loadData();
            this.createCharts();
            this.setupThemeListener();
        } catch (error) {
            console.error('Failed to initialize Opt@1 threshold plot:', error);
        }
    }
    
    async loadData() {
        try {
            const response = await fetch('assets/opt1_thresholded.json?v=thresholds-powers');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.data = await response.json();
        } catch (error) {
            console.error('Error loading data:', error);
            throw error;
        }
    }
    
    createCharts() {
        this.charts.forEach(chart => chart.destroy());
        this.charts = [];
        for (const range of [
            {canvasId: 'opt1-threshold-detail-plot', minThreshold: 0, maxThreshold: 1, tickStep: 0.1},
            {canvasId: 'opt1-threshold-plot', minThreshold: 1, maxThreshold: 16, tickStep: 1, scaleType: 'logarithmic', tickValues: [1, 2, 4, 8, 16]}
        ]) {
            const chart = this.createChart(range);
            if (chart) this.charts.push(chart);
        }
    }

    createChart({canvasId, minThreshold, maxThreshold, tickStep, scaleType = 'linear', tickValues}) {
        const canvas = document.getElementById(canvasId);
        if (!canvas || !this.data) return null;
        Chart.getChart(canvas)?.destroy();
        const manager = this;

        // Get theme colors from the root per current data-theme
        const rootEl = document.documentElement;
        const textColor = getComputedStyle(rootEl).getPropertyValue('--text-primary').trim();
        const gridColor = getComputedStyle(rootEl).getPropertyValue('--border-color').trim();
        
        // Prepare datasets, sorted by score at p=0.95 (descending)
        const entries = Object.entries(this.data);
        entries.sort((a, b) => {
            const scoreA = (a[1].find(p => p.threshold === 0.95) || {}).mean || 0;
            const scoreB = (b[1].find(p => p.threshold === 0.95) || {}).mean || 0;
            return scoreB - scoreA;
        });
        // Show top N by p=0.95 score by default; older/lower models are
        // hidden but still toggleable via the legend.
        const DEFAULT_VISIBLE = 10;
        const datasets = entries.map(([model, points], index) => ({
            label: model,
            data: points.filter(point => point.threshold >= minThreshold && point.threshold <= maxThreshold).map(point => ({
                x: point.threshold,
                y: point.mean
            })),
            borderColor: this.colors[index % this.colors.length],
            backgroundColor: this.colors[index % this.colors.length],
            borderWidth: 2.5,
            pointRadius: 3,
            pointHoverRadius: 6,
            fill: false,
            tension: 0,
            hidden: this.hiddenModels.get(model) ?? (index >= DEFAULT_VISIBLE)
        }));
        
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
                    li.style.setProperty('--swatch-color', item.fillStyle);
                    li.onclick = () => {
                        const visible = !chart.isDatasetVisible(item.datasetIndex);
                        manager.hiddenModels.set(item.text, !visible);
                        manager.charts.forEach(panel => panel.setDatasetVisibility(item.datasetIndex, visible));
                        manager.charts.forEach(panel => panel.update());
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
        
        // Mark the leaderboard cutoff and the human reference boundary.
        const referencePlugin = {
            id: 'referenceThresholds',
            beforeDraw(chart) {
                const {ctx, scales: {x, y}} = chart;
                if (x.max <= 1) return;
                const boundary = x.getPixelForValue(1);
                ctx.save();
                ctx.fillStyle = 'rgba(59, 130, 246, 0.06)';
                ctx.fillRect(boundary, y.top, x.right - boundary, y.bottom - y.top);
                ctx.restore();
            },
            afterDraw(chart) {
                const {ctx, scales: {x, y}} = chart;
                ctx.save();
                for (const [value, dash] of [[0.95, [3, 4]], [1, []]]) {
                    if (value < x.min || value > x.max) continue;
                    const pixel = x.getPixelForValue(value);
                    ctx.strokeStyle = value === 1 ? textColor : gridColor;
                    ctx.lineWidth = value === 1 ? 1.5 : 1;
                    ctx.setLineDash(dash);
                    ctx.beginPath();
                    ctx.moveTo(pixel, y.top);
                    ctx.lineTo(pixel, y.bottom);
                    ctx.stroke();
                }
                const boundary = x.getPixelForValue(1);
                ctx.fillStyle = textColor;
                ctx.font = '12px Inter, sans-serif';
                ctx.textAlign = 'left';
                if (x.right - boundary > 160) {
                    ctx.fillText('1× human reference', boundary + 8, y.top + 17);
                }
                ctx.restore();
            }
        };

        // Chart configuration
        const config = {
            type: 'line',
            data: {
                datasets: datasets
            },
            plugins: [htmlLegendPlugin, referencePlugin],
            options: {
                responsive: true,
                maintainAspectRatio: false,
                aspectRatio: 1.6,
                interaction: {
                    intersect: false,
                    mode: 'point'
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    htmlLegend: {
                        containerID: 'opt1-threshold-legend'
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.9)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: gridColor,
                        borderWidth: 1,
                        cornerRadius: 6,
                        displayColors: true,
                        titleFont: {
                            size: 14,
                            weight: 'bold'
                        },
                        bodyFont: {
                            size: 13
                        },
                        callbacks: {
                            title: function(context) {
                                return context[0].dataset.label;
                            },
                            label: function(context) {
                                const point = context.parsed;
                                return `Opt@1: ${point.y.toFixed(1)}% at ${point.x}× reference`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        type: scaleType,
                        position: 'bottom',
                        min: minThreshold,
                        max: maxThreshold,
                        afterBuildTicks: function(scale) {
                            if (tickValues) scale.ticks = tickValues.map(value => ({value, major: true}));
                        },
                        title: {
                            display: true,
                            text: scaleType === 'logarithmic' ? 'Speed relative to reference (p, log scale)' : 'Speed relative to reference (p)',
                            color: textColor,
                            font: {
                                family: 'Inter, sans-serif',
                                size: 16,
                                weight: 'bold'
                            }
                        },
                        ticks: {
                            color: textColor,
                            font: {
                                family: 'Inter, sans-serif',
                                size: 14
                            },
                            stepSize: tickStep,
                            callback: function(value) {
                                return tickStep < 1 ? value.toFixed(1) : value;
                            }
                        },
                        grid: {
                            color: gridColor,
                            lineWidth: 1
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Opt\u209A@1',
                            color: textColor,
                            font: {
                                family: 'Inter, sans-serif',
                                size: 16,
                                weight: 'bold'
                            }
                        },
                        ticks: {
                            color: textColor,
                            font: {
                                family: 'Inter, sans-serif',
                                size: 14
                            },
                            stepSize: 10,
                            callback: function(value) {
                                return value + '%';
                            }
                        },
                        grid: {
                            color: gridColor,
                            lineWidth: 1
                        },
                        min: 0,
                        max: 100
                    }
                }
            }
        };
        
        // Create the chart
        return new Chart(canvas, config);
        
    }
    
    setupThemeListener() {
        // Listen for theme changes and update chart colors
        this.themeObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
                    // Add a small delay to ensure CSS has time to update
                    setTimeout(() => {
                        this.updateChartTheme();
                    }, 50);
                }
            });
        });
        
        this.themeObserver.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-theme']
        });
    }
    
    updateChartTheme() {
        if (this.charts.length) this.createCharts();
    }

    destroy() {
        this.charts.forEach(chart => chart.destroy());
        this.charts = [];
        this.themeObserver?.disconnect();
    }
}
