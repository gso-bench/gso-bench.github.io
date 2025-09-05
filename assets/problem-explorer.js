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
        searchGroup.className = 'search-group';
        const pill = document.createElement('div');
        pill.className = 'filter-pill';
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'search-input';
        input.placeholder = 'Jump to problem ID...';
        input.setAttribute('list', 'task-list');
        input.addEventListener('change', (e) => {
            this.jumpToTask(e.target.value.trim());
        });
        pill.appendChild(input);
        searchGroup.appendChild(pill);
        this.filtersBar.appendChild(searchGroup);

        const datalist = document.createElement('datalist');
        datalist.id = 'task-list';
        this.tasks.forEach(t => {
            const option = document.createElement('option');
            option.value = t.instance_id;
            datalist.appendChild(option);
        });
        this.filtersBar.appendChild(datalist);
    }

    jumpToTask(id) {
        const index = this.tasks.findIndex(t => t.instance_id === id);
        if (index >= 0) {
            this.currentIndex = index;
            this.renderTask();
        }
    }
}

// Initialize explorer on DOM ready
window.addEventListener('DOMContentLoaded', () => {
    new ProblemExplorer();
});
