// Leaderboard Management
class LeaderboardManager {
    constructor() {
        this.loadingElement = document.getElementById('leaderboard-loading');
        this.tableElement = document.getElementById('leaderboard-table');
        this.originalData = [];
        this.filteredData = [];
        this.filters = {
            model: 'all',
            scaffold: 'all',
            setting: 'all'
        };
        this.init();
    }
    
    async init() {
        try {
            await this.loadLeaderboard();
        } catch (error) {
            console.error('Failed to load leaderboard:', error);
            this.showError();
        }
    }
    
    async loadLeaderboard() {
        // Simulate loading delay for better UX
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        try {
            const response = await fetch('assets/leaderboard.json');
            const data = await response.json();
            this.originalData = data.models;
            this.renderLeaderboard(data);
        } catch (error) {
            console.error('Failed to load leaderboard JSON:', error);
            this.showError();
        }
    }
    
    applyFilters() {
        this.filteredData = this.originalData.filter(item => {
            return (this.filters.model === 'all' || item.name === this.filters.model) &&
                   (this.filters.scaffold === 'all' || item.scaffold === this.filters.scaffold) &&
                   (this.filters.setting === 'all' || item.setting === this.filters.setting);
        });
        
        this.updateTable();
    }
    
    updateTable() {
        if (!this.tbody) return;
        
        // Clear existing rows
        this.tbody.innerHTML = '';
        
        // Sort filtered data by score (descending)
        const sortedModels = this.filteredData.sort((a, b) => b.score - a.score);
        
        sortedModels.forEach((model, index) => {
            const row = this.tbody.insertRow();
            
            // Rank
            const rankCell = row.insertCell();
            rankCell.textContent = index + 1;
            rankCell.style.fontWeight = '600';
            
            // Model name
            const nameCell = row.insertCell();
            nameCell.textContent = model.name;
            nameCell.className = 'model-name';
            
            // Scaffold
            const scaffoldCell = row.insertCell();
            scaffoldCell.textContent = model.scaffold;
            
            // Setting
            const settingCell = row.insertCell();
            settingCell.textContent = model.setting;
            settingCell.className = 'score';
            
            // Score
            const scoreCell = row.insertCell();
            scoreCell.textContent = model.score.toFixed(1) + '%';
            scoreCell.className = 'score';
            
            // Date
            const dateCell = row.insertCell();
            dateCell.textContent = new Date(model.date).toLocaleDateString();
        });
    }
    
    renderLeaderboard(data) {
        // Create main container
        const container = document.createElement('div');
        container.style.cssText = 'display: flex; flex-direction: column;';
        
        // Create single table with proper structure
        const table = document.createElement('table');
        table.style.cssText = 'width: 100%; border-collapse: collapse;';
        
        // Create header with filters
        const header = table.createTHead();
        
        // First row: Filter dropdowns in header cells
        const filterRow = header.insertRow();
        const headers = ['Rank', 'Model', 'Scaffold', 'Setting', 'Score', 'Date'];
        const filterKeys = [null, 'model', 'scaffold', 'setting', null, null];
        
        headers.forEach((headerText, index) => {
            const th = document.createElement('th');
            th.style.cssText = 'padding: 0.75rem 1rem; background: linear-gradient(135deg, #6b7280 0%, #9ca3af 100%); color: white; font-weight: 700; font-size: 0.85rem; letter-spacing: 1px; text-transform: uppercase; position: sticky; top: 0; z-index: 10; vertical-align: top;';
            
            // Create header content container
            const headerContent = document.createElement('div');
            headerContent.style.cssText = 'display: flex; flex-direction: column; gap: 0.5rem; align-items: flex-start;';
            
            // Add header text
            const headerLabel = document.createElement('div');
            headerLabel.textContent = headerText;
            headerLabel.style.cssText = 'font-weight: 700; margin-bottom: 0.25rem;';
            headerContent.appendChild(headerLabel);
            
            // Add filter dropdown if applicable
            if (filterKeys[index]) {
                const filterKey = filterKeys[index];
                const uniqueValues = [...new Set(this.originalData.map(item => filterKey === 'model' ? item.name : item[filterKey]))];
                
                const select = document.createElement('select');
                select.style.cssText = 'padding: 0.25rem 0.5rem; border: 1px solid rgba(255,255,255,0.3); border-radius: 4px; background: rgba(255,255,255,0.1); color: white; font-size: 0.75rem; width: 100%; max-width: 120px;';
                
                // Add "All" option
                const allOption = document.createElement('option');
                allOption.value = 'all';
                allOption.textContent = 'All';
                allOption.style.color = 'black';
                select.appendChild(allOption);
                
                // Add unique values
                uniqueValues.sort().forEach(value => {
                    const option = document.createElement('option');
                    option.value = value;
                    option.textContent = value;
                    option.style.color = 'black';
                    select.appendChild(option);
                });
                
                // Add event listener
                select.addEventListener('change', (e) => {
                    this.filters[filterKey] = e.target.value;
                    this.applyFilters();
                });
                
                // Store reference for model filter
                if (filterKey === 'model') {
                    this.modelSelect = select;
                }
                
                headerContent.appendChild(select);
            }
            
            th.appendChild(headerContent);
            filterRow.appendChild(th);
        });
        
        // Create body
        const tbody = table.createTBody();
        this.tbody = tbody;
        
        // Set initial filtered data
        this.filteredData = data.models;
        
        // Sort models by score (descending)
        const sortedModels = this.filteredData.sort((a, b) => b.score - a.score);
        
        sortedModels.forEach((model, index) => {
            const row = tbody.insertRow();
            
            // Rank
            const rankCell = row.insertCell();
            rankCell.textContent = index + 1;
            rankCell.style.fontWeight = '600';
            
            // Model name
            const nameCell = row.insertCell();
            nameCell.textContent = model.name;
            nameCell.className = 'model-name';
            
            // Scaffold
            const scaffoldCell = row.insertCell();
            scaffoldCell.textContent = model.scaffold;
            
            // Setting
            const settingCell = row.insertCell();
            settingCell.textContent = model.setting;
            settingCell.className = 'score';
            
            // Score
            const scoreCell = row.insertCell();
            scoreCell.textContent = model.score.toFixed(1) + '%';
            scoreCell.className = 'score';
            
            // Date
            const dateCell = row.insertCell();
            dateCell.textContent = new Date(model.date).toLocaleDateString();
        });
        
        // Create single table wrapper with scrollable body
        const tableWrapper = document.createElement('div');
        tableWrapper.style.cssText = 'border-radius: 12px; overflow: hidden; border: 1px solid var(--border-color); max-height: 600px; overflow-y: auto;';
        
        // Add the complete table to wrapper
        tableWrapper.appendChild(table);
        container.appendChild(tableWrapper);
        
        // Hide loading and show table
        this.loadingElement.style.display = 'none';
        this.tableElement.style.display = 'block';
        this.tableElement.appendChild(container);
        
        // Add last updated info
        if (data.last_updated) {
            const lastUpdated = document.createElement('div');
            lastUpdated.style.cssText = 'text-align: center; margin-top: 1rem; color: var(--text-tertiary); font-size: 0.875rem;';
            lastUpdated.textContent = `Last updated: ${new Date(data.last_updated).toLocaleDateString()}`;
            this.tableElement.appendChild(lastUpdated);
        }
    }
    
    showError() {
        this.loadingElement.innerHTML = `
            <div style="color: var(--error-color); text-align: center;">
                <span>Failed to load leaderboard data. JSON fetches require serving over HTTP. Please run a local server (e.g., python3 -m http.server) to view the leaderboard.</span>
            </div>
        `;
    }
}

// Tab Management for Examples
class TabManager {
    constructor() {
        this.init();
    }
    
    init() {
        // Add click listeners to all tab buttons
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const tabId = button.getAttribute('data-tab');
                this.switchTab(tabId);
            });
        });
    }
    
    switchTab(tabId) {
        // Remove active class from all buttons and panels
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelectorAll('.tab-panel').forEach(panel => {
            panel.classList.remove('active');
        });
        
        // Add active class to clicked button and corresponding panel
        const activeButton = document.querySelector(`[data-tab="${tabId}"]`);
        const activePanel = document.getElementById(tabId);
        
        if (activeButton && activePanel) {
            activeButton.classList.add('active');
            activePanel.classList.add('active');
        }
    }
}

// Copy to Clipboard Functionality
class ClipboardManager {
    constructor() {
        this.init();
    }
    
    init() {
        // Add click listeners to all copy buttons
        document.querySelectorAll('.copy-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                this.copyToClipboard(button);
            });
            
            // Remove inline onclick
            button.removeAttribute('onclick');
        });
    }
    
    async copyToClipboard(button) {
        try {
            let textToCopy;
            
            // Find the text to copy based on the button's context
            const codeBlock = button.closest('.code-block');
            const citationBlock = button.closest('.citation-block');
            
            if (codeBlock) {
                const code = codeBlock.querySelector('code');
                textToCopy = code.textContent;
            } else if (citationBlock) {
                const code = citationBlock.querySelector('code');
                textToCopy = code.textContent;
            }
            
            if (textToCopy) {
                await navigator.clipboard.writeText(textToCopy);
                this.showCopyFeedback(button, 'Copied!');
            }
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
            this.showCopyFeedback(button, 'Failed to copy');
        }
    }
    
    showCopyFeedback(button, message) {
        const originalText = button.textContent;
        button.textContent = message;
        button.style.backgroundColor = 'var(--success-color)';
        button.style.color = 'white';
        
        setTimeout(() => {
            button.textContent = originalText;
            button.style.backgroundColor = '';
            button.style.color = '';
        }, 2000);
    }
}

// Smooth Scrolling for Navigation Links
class NavigationManager {
    constructor() {
        this.init();
    }
    
    init() {
        // Add smooth scrolling to navigation links
        document.querySelectorAll('a[href^="#"]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                const targetElement = document.getElementById(targetId);
                
                if (targetElement) {
                    const navbarHeight = document.querySelector('.navbar').offsetHeight;
                    const targetPosition = targetElement.offsetTop - navbarHeight - 20;
                    
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            });
        });
        
        // Highlight active navigation item on scroll
        this.highlightActiveNavItem();
    }
    
    highlightActiveNavItem() {
        const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');
        const sections = document.querySelectorAll('section[id]');
        
        window.addEventListener('scroll', () => {
            const scrollPosition = window.scrollY + 100;
            
            sections.forEach(section => {
                const sectionTop = section.offsetTop;
                const sectionHeight = section.offsetHeight;
                const sectionId = section.getAttribute('id');
                
                if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                    navLinks.forEach(link => {
                        link.classList.remove('active');
                        if (link.getAttribute('href') === `#${sectionId}`) {
                            link.classList.add('active');
                        }
                    });
                }
            });
        });
    }
}

// Intersection Observer for Animations
class AnimationManager {
    constructor() {
        this.init();
    }
    
    init() {
        // Create intersection observer for fade-in animations
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);
        
        // Observe elements for animation
        document.querySelectorAll('.feature-card, .stat, .example-item').forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(el);
        });
    }
}

// Performance Monitoring
class PerformanceMonitor {
    constructor() {
        this.init();
    }
    
    init() {
        // Log page load performance
        window.addEventListener('load', () => {
            if ('performance' in window) {
                const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
                console.log(`Page loaded in ${loadTime}ms`);
            }
        });
        
        // Monitor Core Web Vitals if supported
        if ('web-vital' in window) {
            this.monitorWebVitals();
        }
    }
    
    monitorWebVitals() {
        // This would integrate with web-vitals library if included
        // For now, just a placeholder for future implementation
        console.log('Web Vitals monitoring initialized');
    }
}

// Global function for copy functionality
window.copyToClipboard = async function(button) {
    try {
        let textToCopy;
        
        const codeBlock = button.closest('.code-block');
        const citationBlock = button.closest('.citation-block');
        
        if (codeBlock) {
            const code = codeBlock.querySelector('code');
            textToCopy = code.textContent;
        } else if (citationBlock) {
            const code = citationBlock.querySelector('code');
            textToCopy = code.textContent;
        }
        
        if (textToCopy) {
            await navigator.clipboard.writeText(textToCopy);
            const originalText = button.textContent;
            button.textContent = 'Copied!';
            button.style.backgroundColor = 'var(--success-color)';
            button.style.color = 'white';
            
            setTimeout(() => {
                button.textContent = originalText;
                button.style.backgroundColor = '';
                button.style.color = '';
            }, 2000);
        }
    } catch (error) {
        console.error('Failed to copy to clipboard:', error);
        button.textContent = 'Failed to copy';
        setTimeout(() => {
            button.textContent = 'Copy';
        }, 2000);
    }
};

// Theme Toggle Manager for Qualitative Analysis
class ThemeManager {
    constructor() {
        this.init();
    }
    
    init() {
        // Add click listeners to all theme headers
        document.querySelectorAll('.theme-header').forEach(header => {
            header.addEventListener('click', (e) => {
                const themeId = header.getAttribute('data-theme');
                this.toggleTheme(header, themeId);
            });
        });
    }
    
    toggleTheme(header, themeId) {
        const content = document.getElementById(themeId);
        const toggle = header.querySelector('.theme-toggle');
        
        if (!content) return;
        
        const isActive = header.classList.contains('active');
        
        if (isActive) {
            // Close the theme
            header.classList.remove('active');
            content.classList.remove('active');
            toggle.textContent = '+';
        } else {
            // Open the theme
            header.classList.add('active');
            content.classList.add('active');
            toggle.textContent = '−';
        }
    }
}

// Dark mode toggle functionality
function initDarkMode() {
    const toggleButton = document.getElementById('theme-toggle');
    if (!toggleButton) return;

    const icon = toggleButton.querySelector('.theme-icon');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const stored = localStorage.getItem('theme');

    const sunIcon =
        '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
        '<circle cx="12" cy="12" r="5" />' +
        '<line x1="12" y1="1" x2="12" y2="3" />' +
        '<line x1="12" y1="21" x2="12" y2="23" />' +
        '<line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />' +
        '<line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />' +
        '<line x1="1" y1="12" x2="3" y2="12" />' +
        '<line x1="21" y1="12" x2="23" y2="12" />' +
        '<line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />' +
        '<line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />' +
        '</svg>';

    const moonIcon =
        '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" />' +
        '</svg>';

    const apply = (theme) => {
        document.documentElement.setAttribute('data-theme', theme);
        if (icon) icon.innerHTML = theme === 'dark' ? sunIcon : moonIcon;
    };

    apply(stored || (prefersDark ? 'dark' : 'light'));

    toggleButton.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        apply(current);
        localStorage.setItem('theme', current);
    });
}

// Initialize all managers when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize all components
    new LeaderboardManager();
    new TabManager();
    new ClipboardManager();
    new NavigationManager();
    new AnimationManager();
    new PerformanceMonitor();
    new ThemeManager();
    initDarkMode();

    console.log('GSO website initialized successfully');
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        console.log('Page hidden');
    } else {
        console.log('Page visible');
    }
});

// Error handling for uncaught errors
window.addEventListener('error', (event) => {
    console.error('Uncaught error:', event.error);
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    event.preventDefault();
});
