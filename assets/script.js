// Leaderboard Management
class LeaderboardManager {
    constructor() {
        this.loadingElement = document.getElementById('leaderboard-loading');
        this.tableElement = document.getElementById('leaderboard-table');
        this.filtersBar = document.getElementById('leaderboard-filters');
        this.originalData = [];
        this.filteredData = [];
        this.filters = {
            model: 'all',
            scaffold: 'all',
            setting: 'Opt@1' // default to Opt@1
        };
        this.selectedRowKeys = new Set();
        this.lastClickedRowKey = null;
        this.modelSearch = '';
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
        try {
            const response = await fetch('assets/leaderboard.json');
            const data = await response.json();
            this.originalData = data.models;
            this.renderFilters();
            this.renderLeaderboard(data);
        } catch (error) {
            console.error('Failed to load leaderboard JSON:', error);
            this.showError();
        }
    }
    
    renderFilters() {
        if (!this.filtersBar) return;
        this.filtersBar.innerHTML = '';
        // SVG icons
        // const funnelSVG = `<svg class="filter-icon-inside" width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 5a1 1 0 0 1 1-1h12a1 1 0 0 1 .8 1.6l-4.6 6.6V16a1 1 0 0 1-1.447.894l-2-1A1 1 0 0 1 8 15v-2.8L3.2 6.6A1 1 0 0 1 3 5Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
        // const searchSVG = `<svg class="filter-icon-inside" width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="9" cy="9" r="6" stroke="currentColor" stroke-width="1.5"/><path d="M15 15l-2.5-2.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`;
        // Filters group
        const filtersGroup = document.createElement('div');
        filtersGroup.className = 'filters-group';
        const filterKeys = [
            { key: 'setting', label: 'Setting' }
        ];
        filterKeys.forEach(({ key, label }) => {
            const uniqueValues = [...new Set(this.originalData.map(item => key === 'model' ? item.name : item[key]))];
            const pill = document.createElement('div');
            pill.className = 'filter-pill';
            
            // Add gear icon for setting filter
            if (key === 'setting') {
                const gearIcon = document.createElement('span');
                gearIcon.className = 'filter-icon-inside';
                gearIcon.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`;
                pill.appendChild(gearIcon);
            }
            
            const select = document.createElement('select');
            select.id = `filter-${key}`;
            select.innerHTML = '';
            // Placeholder option
            const placeholderOption = document.createElement('option');
            placeholderOption.value = 'all';
            placeholderOption.textContent = key === 'setting' ? 'All' : label;
            placeholderOption.disabled = false;
            placeholderOption.hidden = false;
            select.appendChild(placeholderOption);
            uniqueValues.sort().forEach(value => {
                const option = document.createElement('option');
                option.value = value;
                option.textContent = value;
                select.appendChild(option);
            });
            select.value = this.filters[key];
            select.addEventListener('change', (e) => {
                this.filters[key] = e.target.value;
                this.applyFilters();
            });
            pill.appendChild(select);
            filtersGroup.appendChild(pill);
        });
        this.filtersBar.appendChild(filtersGroup);
        
        // Search group
        const searchGroup = document.createElement('div');
        searchGroup.className = 'search-group';
        const searchPill = document.createElement('div');
        searchPill.className = 'filter-pill';
        // searchPill.innerHTML = searchSVG;
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.className = 'search-input';
        searchInput.placeholder = 'Search models and scaffolds...';
        searchInput.value = this.modelSearch || '';
        searchInput.addEventListener('input', (e) => {
            this.modelSearch = e.target.value;
            this.applyFilters();
        });
        searchPill.appendChild(searchInput);
        // Keyboard shortcut hint
        const shortcut = document.createElement('span');
        shortcut.className = 'search-shortcut';
        shortcut.textContent = '/';
        searchPill.appendChild(shortcut);
        searchGroup.appendChild(searchPill);
        this.filtersBar.appendChild(searchGroup);
    }
    
    applyFilters() {
        // Instead of hiding rows, we keep all rows and dull non-matching ones
        this.filteredData = this.originalData.filter(item => {
            const matchesSetting = (this.filters.setting === 'all' || item.setting === this.filters.setting);
            const matchesSearch = !this.modelSearch || 
                item.name.toLowerCase().includes(this.modelSearch.toLowerCase()) ||
                item.scaffold.toLowerCase().includes(this.modelSearch.toLowerCase());
            return matchesSetting && matchesSearch;
        });
        this.updateScoreHeaders();
        this.updateTable();
    }
    
    updateScoreHeaders() {
        if (!this.scoreHeaderCell) return;
        const setting = this.filters.setting;
        if (setting === 'all') {
            this.scoreHeaderCell.textContent = 'Score';
        } else {
            this.scoreHeaderCell.textContent = `${setting} Score`;
        }
    }
    
    // Provider info for icon/link next to model name.
    // Prefer explicit model.model_org if provided; otherwise fall back to name heuristic.
    getProviderInfo(model) {
        const orgRaw = (model && model.model_org) ? String(model.model_org).toLowerCase() : '';
        const byOrg = (o) => {
            switch (o) {
                case 'openai':
                    return { providerName: 'OpenAI', providerUrl: 'https://openai.com', iconUrl: 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/openai.svg' };
                case 'anthropic':
                    return { providerName: 'Anthropic', providerUrl: 'https://www.anthropic.com/', iconUrl: 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/anthropic.svg' };
                case 'google':
                    return { providerName: 'Google', providerUrl: 'https://ai.google', iconUrl: 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/google.svg' };
                case 'meta':
                    return { providerName: 'Meta', providerUrl: 'https://ai.meta.com', iconUrl: 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/meta.svg' };
                case 'z.ai':
                    return { providerName: 'Z.ai', providerUrl: 'https://z.ai', iconUrl: '/assets/logos/zai.svg' };
                case 'qwen':
                    return { providerName: 'Qwen', providerUrl: 'https://qwen.ai', iconUrl: '/assets/logos/qwen.svg' };
                case 'moonshotai':
                    return { providerName: 'Moonshot AI', providerUrl: 'https://moonshot.ai', iconUrl: '/assets/logos/moonshot.svg' };
                default:
                    return null;
            }
        };
        let mapped = byOrg(orgRaw);
        if (mapped) return mapped;
        // Fallback heuristic by model name
        const n = (model && model.name ? model.name : '').toLowerCase();
        if (n.includes('claude')) {
            return { providerName: 'Anthropic', providerUrl: 'https://www.anthropic.com/', iconUrl: 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/anthropic.svg' };
        }
        if (n.includes('gpt') || n.startsWith('o3') || n.startsWith('o4')) {
            return { providerName: 'OpenAI', providerUrl: 'https://openai.com', iconUrl: 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/openai.svg' };
        }
        return { providerName: null, providerUrl: null, iconUrl: null };
    }
    
    // Build Org cell content. If logo is missing/empty, fall back to org name text.
    buildOrgCellHTML(model) {
        const url = model.submission_org_url || model.org_url || '';
        const name = model.submission_org_name || model.org_name || 'Org';
        const logo = model.submission_org_logo || model.org_logo || '';
        const hasLogo = !!(logo && String(logo).trim());
        const content = hasLogo
            ? `<span class="org-logo-wrap"><img src="${logo}" alt="${name} logo" class="org-logo" width="20" height="20"></span>`
            : `<span class="org-name-text">${name}</span>`;
        const arrow = url ? `<span class="org-arrow" aria-label="External link">↗</span>` : '';
        const linkClass = hasLogo ? 'org-link' : 'org-link org-text-link';
        if (url) {
            return `<a href="${url}" target="_blank" rel="noopener" class="${linkClass}">${content}${arrow}</a>`;
        }
        return `<span class="${linkClass}">${content}</span>`;
    }
    
    setSort(key) {
        if (this.sortKey === key) {
            this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortKey = key;
            // Default direction for setting: desc (Opt@1 > Opt@10), for score: desc, for others: asc
            if (key === 'setting' || key === 'score' || key === 'rank') {
                this.sortDir = 'desc';
            } else {
                this.sortDir = 'asc';
            }
        }
        this.updateTable();
        this.updateSortIndicators();
    }
    
    updateSortIndicators() {
        if (!this.headerCells) return;
        const arrows = { asc: '▲', desc: '▼' };
        this.headerCells.forEach((th, i) => {
            th.querySelector('.sort-arrow')?.remove();
            const colKeys = ['rank', 'model', 'setting', 'score', 'hack_score', 'date'];
            if (colKeys[i] === this.sortKey) {
                const arrow = document.createElement('span');
                arrow.className = 'sort-arrow';
                arrow.style.marginLeft = '0.4em';
                arrow.style.fontSize = '0.9em';
                arrow.textContent = arrows[this.sortDir];
                th.appendChild(arrow);
            }
        });
    }
    
    updateTable() {
        if (!this.tbody) return;
        this.tbody.innerHTML = '';
        // Track selected rows
        const selectedKeys = this.selectedRowKeys;
        // Separate filtered-in and filtered-out rows
        const filteredIn = this.originalData.filter(model => this.filteredData.includes(model)).sort((a, b) => {
            return b.score - a.score;
        });
        const filteredOut = this.originalData.filter(model => !this.filteredData.includes(model)).sort((a, b) => {
            return b.score - a.score;
        });
        let rank = 1;
        let rowIndex = 0;
        // Render filtered-in rows first
        // Determine medal cutoffs based on unique scores
        const uniqueScores = [...new Set(filteredIn.map(m => m.score))].sort((a, b) => b - a);
        const goldScore = uniqueScores[0];
        const silverScore = uniqueScores[1];
        const bronzeScore = uniqueScores[2];
        
        filteredIn.forEach((model, idx) => {
            const row = this.tbody.insertRow();
            row.dataset.rowKey = model.name + '|' + model.setting + '|' + model.scaffold;
            if (selectedKeys.has(row.dataset.rowKey)) {
                row.classList.add('selected-row');
            }
            row.addEventListener('click', (e) => this.handleRowSelect(row.dataset.rowKey, e));
            // Rank - handle ties by assigning same rank to models with same score
            const rankCell = row.insertCell();
            const currentScore = model.score;
            const prevScore = idx > 0 ? filteredIn[idx - 1].score : null;
            if (idx === 0 || currentScore !== prevScore) {
                rank = idx + 1;
            }
            if (currentScore === goldScore && goldScore !== undefined) {
                rankCell.innerHTML = '<span class="rank-text medal-gold">' + rank + '</span>';
            } else if (currentScore === silverScore && silverScore !== undefined && silverScore !== goldScore) {
                rankCell.innerHTML = '<span class="rank-text medal-silver">' + rank + '</span>';
            } else if (currentScore === bronzeScore && bronzeScore !== undefined && bronzeScore !== goldScore && bronzeScore !== silverScore) {
                rankCell.innerHTML = '<span class="rank-text medal-bronze">' + rank + '</span>';
            } else {
                rankCell.textContent = rank;
            }
            rankCell.style.fontWeight = '600';
            rankCell.style.textAlign = 'center';
            // Model name with provider icon and scaffold
            const nameCell = row.insertCell();
            const pinfo = this.getProviderInfo(model);
            nameCell.innerHTML = `<span class="model-cell">${pinfo.iconUrl ? `<a href="${pinfo.providerUrl}" target="_blank" rel="noopener" class="provider-icon-wrap"><img src="${pinfo.iconUrl}" alt="${pinfo.providerName} logo" class="provider-icon" width="18" height="18"></a>` : ''}<span class="model-title">${model.name}</span> <span class="scaffold-tag">+ ${model.scaffold}</span></span>`;
            nameCell.className = 'model-name';
            // Score
            const scoreCell = row.insertCell();
            scoreCell.textContent = model.score.toFixed(1) + '%';
            scoreCell.className = 'score';
            // Hack Detected Score
            const hackScoreCell = row.insertCell();
            hackScoreCell.textContent = model.score_hack_control.toFixed(1) + '%';
            hackScoreCell.className = 'score';
            // Date
            const dateCell = row.insertCell();
            // Parse date as local date to avoid timezone conversion issues
            const dateParts = model.date.split('-');
            const localDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
            dateCell.textContent = localDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
            rowIndex++;
        });
        // Render filtered-out (dulled) rows below
        filteredOut.forEach((model, idx) => {
            const row = this.tbody.insertRow();
            row.classList.add('dull-row');
            row.dataset.rowKey = model.name + '|' + model.setting + '|' + model.scaffold;
            if (selectedKeys.has(row.dataset.rowKey)) {
                row.classList.add('selected-row');
            }
            row.addEventListener('click', (e) => this.handleRowSelect(row.dataset.rowKey, e));
            // Rank (always plain number for dulled rows)
            const rankCell = row.insertCell();
            rankCell.textContent = idx + 1;
            rankCell.style.fontWeight = '600';
            rankCell.style.textAlign = 'center';
            // Model name with provider icon and scaffold
            const nameCell = row.insertCell();
            const pinfo = this.getProviderInfo(model);
            nameCell.innerHTML = `<span class="model-cell">${pinfo.iconUrl ? `<a href="${pinfo.providerUrl}" target="_blank" rel="noopener" class="provider-icon-wrap"><img src="${pinfo.iconUrl}" alt="${pinfo.providerName} logo" class="provider-icon" width="18" height="18"></a>` : ''}<span class="model-title">${model.name}</span> <span class="scaffold-tag">+ ${model.scaffold}</span></span>`;
            nameCell.className = 'model-name';
            // Score
            const scoreCell = row.insertCell();
            scoreCell.textContent = model.score.toFixed(1) + '%';
            scoreCell.className = 'score';
            // Hack Detected Score
            const hackScoreCell = row.insertCell();
            hackScoreCell.textContent = model.score_hack_control.toFixed(1) + '%';
            hackScoreCell.className = 'score';
            // Date
            const dateCell = row.insertCell();
            // Parse date as local date to avoid timezone conversion issues
            const dateParts = model.date.split('-');
            const localDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
            dateCell.textContent = localDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
            rowIndex++;
        });
    }
    
    handleRowSelect(rowKey, event) {
        if (event && event.shiftKey && this.lastClickedRowKey) {
            // Shift+click: select range between last clicked and current
            const allRows = Array.from(this.tbody.rows);
            const rowKeys = allRows.map(r => r.dataset.rowKey);
            const lastIndex = rowKeys.indexOf(this.lastClickedRowKey);
            const currentIndex = rowKeys.indexOf(rowKey);
            
            if (lastIndex !== -1 && currentIndex !== -1) {
                const start = Math.min(lastIndex, currentIndex);
                const end = Math.max(lastIndex, currentIndex);
                for (let i = start; i <= end; i++) {
                    this.selectedRowKeys.add(rowKeys[i]);
                }
            }
        } else {
            // Regular click: toggle selection
            if (this.selectedRowKeys.has(rowKey)) {
                this.selectedRowKeys.delete(rowKey);
            } else {
                this.selectedRowKeys.add(rowKey);
            }
        }
        this.lastClickedRowKey = rowKey;
        this.updateTable();
    }
    
    renderLeaderboard(data) {
        // Create main container
        const container = document.createElement('div');
        container.style.cssText = 'display: flex; flex-direction: column;';
        // Create single table with proper structure
        const table = document.createElement('table');
        table.style.cssText = 'width: 100%; border-collapse: collapse;';
        // Create header (no filter dropdowns)
        const header = table.createTHead();
        const headerRow = header.insertRow();
        const headers = ['Rank', 'Model', 'Score', 'Hack-Adjusted', 'Date'];
        const headerKeys = ['rank', 'model', 'score', 'hack_score', 'date'];
        headers.forEach((headerText, i) => {
            const th = document.createElement('th');
            th.style.cssText = 'padding: 0.75rem 1rem; background: #6b7280; color: white; font-weight: 700; font-size: 0.85rem; letter-spacing: 1px; text-transform: uppercase; position: sticky; top: 0; z-index: 10; white-space: nowrap;';
            th.textContent = headerText;
            th.dataset.key = headerKeys[i];
            headerRow.appendChild(th);
        });
        this.headerCells = Array.from(headerRow.cells);
        this.scoreHeaderCell = this.headerCells[2];
        this.updateScoreHeaders();
        this.updateSortIndicators();
        // Create body
        const tbody = table.createTBody();
        this.tbody = tbody;
        // Set initial filtered data
        this.filteredData = this.originalData.filter(item => this.filters.setting === 'all' || item.setting === this.filters.setting);
        // Initial sort
        this.updateTable();
        // Create single table wrapper with scrollable body
        const tableWrapper = document.createElement('div');
        tableWrapper.style.cssText = 'border-radius: 5px; overflow: hidden; border: 1px solid var(--border-color); max-height: 600px; overflow-y: auto;';
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
            lastUpdated.style.cssText = 'text-align: center; margin-top: 0.5rem; color: var(--text-tertiary); font-size: 0.875rem;';
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
                const loadTime = Math.round(performance.now());
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
    if (document.getElementById('leaderboard-table')) {
        new LeaderboardManager();
    }
    if (document.getElementById('opt1-threshold-plot')) {
        new Opt1ThresholdPlotManager();
    }
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
