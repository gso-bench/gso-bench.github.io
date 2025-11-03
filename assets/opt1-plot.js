// Opt@1 vs Speedup Threshold Plot Manager using Chart.js
class Opt1ThresholdPlotManager {
    constructor() {
        this.chart = null;
        this.data = null;
        this.colors = [
            '#1f77b4', // Blue
            '#ff7f0e', // Orange
            '#2ca02c', // Green
            '#d62728', // Red
            '#9467bd', // Purple
            '#8c564b', // Brown
            '#e377c2', // Pink
            '#7f7f7f'  // Gray
        ];
        this.init();
    }
    
    async init() {
        try {
            await this.loadData();
            this.createChart();
        } catch (error) {
            console.error('Failed to initialize Opt@1 threshold plot:', error);
        }
    }
    
    async loadData() {
        try {
            const response = await fetch('assets/opt1_thresholded.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.data = await response.json();
        } catch (error) {
            console.error('Error loading data:', error);
            throw error;
        }
    }
    
    createChart() {
        const canvas = document.getElementById('opt1-threshold-plot');
        if (!canvas || !this.data) return;
        
        // Destroy existing chart if it exists
        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }
        
        // Also destroy any Chart.js instances on this canvas
        Chart.helpers.each(Chart.instances, function(chart) {
            if (chart.canvas.id === 'opt1-threshold-plot') {
                chart.destroy();
            }
        });
        
        // Get theme colors from the root per current data-theme
        const rootEl = document.documentElement;
        const textColor = getComputedStyle(rootEl).getPropertyValue('--text-primary').trim();
        const gridColor = getComputedStyle(rootEl).getPropertyValue('--border-color').trim();
        
        // Prepare datasets
        const datasets = Object.entries(this.data).map(([model, points], index) => ({
            label: model,
            data: points.map(point => ({
                x: point.threshold,
                y: point.mean
            })),
            borderColor: this.colors[index % this.colors.length],
            backgroundColor: this.colors[index % this.colors.length],
            borderWidth: 2.5,
            pointRadius: 3,
            pointHoverRadius: 6,
            fill: false,
            tension: 0.1
        }));
        
        // Add custom plugin to add space between legend and chart area
        const legendSpacingPlugin = {
            id: 'legendSpacing',
            beforeInit(chart) {
                const originalFit = chart.legend && chart.legend.fit ? chart.legend.fit : null;
                if (!originalFit) return;
                chart.legend.fit = function fit() {
                    originalFit.call(this);
                    this.height += 24;
                };
            }
        };

        // Chart configuration
        const config = {
            type: 'line',
            data: {
                datasets: datasets
            },
            plugins: [legendSpacingPlugin],
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
                        display: true,
                        position: 'top',
                        labels: {
                            color: textColor,
                            font: {
                                family: 'Inter, sans-serif',
                                size: 12
                            },
                            padding: 15,
                            boxWidth: 12
                        }
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
                                return `Opt@1: ${point.y.toFixed(1)}% at p=${point.x}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'linear',
                        position: 'bottom',
                        title: {
                            display: true,
                            text: 'Speedup Threshold (p)',
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
                            stepSize: 0.1,
                            callback: function(value) {
                                return value.toFixed(1);
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
                        max: 80
                    }
                }
            }
        };
        
        // Create the chart
        this.chart = new Chart(canvas, config);
        
        // Listen for theme changes
        this.setupThemeListener();
    }
    
    setupThemeListener() {
        // Listen for theme changes and update chart colors
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
                    // Add a small delay to ensure CSS has time to update
                    setTimeout(() => {
                        this.updateChartTheme();
                    }, 50);
                }
            });
        });
        
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-theme']
        });
    }
    
    updateChartTheme() {
        if (!this.chart) return;
        
        // Force recreation of chart to ensure proper theme colors
        this.chart.destroy();
        this.chart = null;
        
        // Recreate chart with new theme colors
        setTimeout(() => {
            this.createChart();
        }, 100);
    }
    
    destroy() {
        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }
    }
}
