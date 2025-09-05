class ProblemExplorer {
    constructor() {
        this.container = document.getElementById('problem-viewer');
        this.filtersBar = document.getElementById('problem-filters');
        this.tasks = [];
        this.currentIndex = 0;
        if (this.container) {
            this.load();
        }
    }

    async load() {
        try {
            this.tasks = await this.fetchLocal();
            if (Array.isArray(this.tasks) && this.tasks.length > 0) {
                this.setupSearch();
                this.renderTask();
            } else {
                this.container.innerHTML = '<p>No tasks available.</p>';
            }
        } catch (err) {
            console.error('Failed to load dataset', err);
            this.container.innerHTML = '<p>Failed to load dataset.</p>';
        }
    }

    async fetchLocal() {
        const response = await fetch('assets/gso-dataset.json');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
    }

    renderTask() {
        const task = this.tasks[this.currentIndex];
        if (!task) return;

        const commitUrl = `https://github.com/${task.repo}/commit/${task.opt_commit}`;
        const diffHtml = this.renderDiff(task.gt_diff);
        const messageHtml = this.escapeHtml(task.gt_commit_message)
            .split('\n')
            .filter(line => line.trim() !== '')
            .join('\n');
        const shortHash = task.opt_commit.slice(0, 7);
        const testsCount = Array.isArray(task.tests) ? task.tests.length : 0;

        this.container.innerHTML = `
            <div class="task-nav">
                <button id="prev-task">Previous</button>
                <span class="task-counter">${this.currentIndex + 1} / ${this.tasks.length}</span>
                <button id="next-task">Next</button>
            </div>
            <div class="task-content">
                <div class="commit-header">
                    <div class="commit-meta">
                        <span class="instance-id">${task.instance_id}</span> ·
                        <a href="https://github.com/${task.repo}" target="_blank" rel="noopener" class="repo-link">${task.repo}</a> ·
                        <span class="commit-hash"><a href="${commitUrl}" target="_blank" rel="noopener">${shortHash}</a></span> ·
                        <span class="tests-count">${testsCount} tests</span>
                    </div>
                    <div class="commit-message">${messageHtml}</div>
                </div>
                <pre class="diff-viewer">${diffHtml}</pre>
            </div>
        `;

        const prevBtn = this.container.querySelector('#prev-task');
        const nextBtn = this.container.querySelector('#next-task');
        prevBtn.disabled = this.currentIndex === 0;
        nextBtn.disabled = this.currentIndex === this.tasks.length - 1;
        prevBtn.addEventListener('click', () => {
            if (this.currentIndex > 0) {
                this.currentIndex--;
                this.renderTask();
            }
        });
        nextBtn.addEventListener('click', () => {
            if (this.currentIndex < this.tasks.length - 1) {
                this.currentIndex++;
                this.renderTask();
            }
        });
    }

    renderDiff(diff) {
        if (!diff) return '';
        return diff.split('\n').map(line => {
            const escaped = this.escapeHtml(line);
            if (line.startsWith('+++') || line.startsWith('---') || line.startsWith('@@')) {
                return `<span class="diff-hunk">${escaped}</span>`;
            }
            if (line.startsWith('+')) {
                return `<span class="diff-add">${escaped}</span>`;
            }
            if (line.startsWith('-')) {
                return `<span class="diff-del">${escaped}</span>`;
            }
            return `<span>${escaped}</span>`;
        }).join('');
    }

    escapeHtml(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    setupSearch() {
        if (!this.filtersBar) return;

        const searchGroup = document.createElement('div');
        searchGroup.className = 'search-group problem-search-group';
        const pill = document.createElement('div');
        pill.className = 'filter-pill';

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'search-input';
        input.placeholder = 'Jump to problem ID...';
        this.searchInput = input;
        pill.appendChild(input);
        searchGroup.appendChild(pill);
        // Keyboard shortcut hint
        const hint = document.createElement('span');
        hint.className = 'shortcut-hint';
        hint.textContent = '/';
        pill.appendChild(hint);

        const suggestions = document.createElement('div');
        suggestions.className = 'search-suggestions';
        searchGroup.appendChild(suggestions);
        this.filtersBar.appendChild(searchGroup);

        const showSuggestions = () => {
            suggestions.style.display = 'block';
            pill.style.borderBottomLeftRadius = '0';
            pill.style.borderBottomRightRadius = '0';
        };
        const hideSuggestions = () => {
            suggestions.style.display = 'none';
            pill.style.borderBottomLeftRadius = '';
            pill.style.borderBottomRightRadius = '';
        };

        input.addEventListener('input', (e) => {
            const value = e.target.value.trim().toLowerCase();
            suggestions.innerHTML = '';
            if (!value) {
                hideSuggestions();
                return;
            }
            const matches = this.tasks
                .filter(t => t.instance_id.toLowerCase().includes(value))
                .slice(0, 10);
            matches.forEach(t => {
                const item = document.createElement('div');
                item.className = 'suggestion-item';
                item.textContent = t.instance_id;
                item.addEventListener('mousedown', () => {
                    input.value = t.instance_id;
                    hideSuggestions();
                    this.jumpToTask(t.instance_id);
                });
                suggestions.appendChild(item);
            });
            if (matches.length) {
                showSuggestions();
            } else {
                hideSuggestions();
            }
        });

        input.addEventListener('focus', () => {
            if (suggestions.childElementCount) showSuggestions();
        });
        input.addEventListener('blur', () => {
            setTimeout(() => hideSuggestions(), 100);
        });
        input.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                this.jumpToTask(input.value.trim());
                hideSuggestions();
            }
        });
    }

    jumpToTask(id) {
        const index = this.tasks.findIndex(t => t.instance_id === id);
        if (index >= 0) {
            this.currentIndex = index;
            this.renderTask();
        }
    }

    sortTasks(by) {
        if (by === 'repo') {
            this.tasks.sort((a, b) => a.repo.localeCompare(b.repo));
        } else if (by === 'date') {
            this.tasks.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        }
        this.currentIndex = 0;
        this.renderTask();
    }
}

// Initialize explorer on DOM ready
window.addEventListener('DOMContentLoaded', () => {
    new ProblemExplorer();
});
