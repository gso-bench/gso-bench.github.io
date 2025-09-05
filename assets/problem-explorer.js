class ProblemExplorer {
    constructor() {
        this.container = document.getElementById('problems-container');
        if (this.container) {
            this.load();
        }
    }

    async load() {
        try {
            const params = new URLSearchParams({
                dataset: 'gso-bench/gso',
                config: 'default',
                split: 'train',
                offset: '0',
                length: '100'
            });
            const response = await fetch(`https://datasets-server.huggingface.co/rows?${params.toString()}`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            const rows = Array.isArray(data?.rows) ? data.rows : [];
            const tasks = rows.map(r => r.row);
            this.render(tasks);
        } catch (err) {
            console.error('Failed to load dataset', err);
            this.container.innerHTML = '<p>Failed to load dataset.</p>';
        }
    }

    render(tasks) {
        if (!Array.isArray(tasks)) return;
        const fragment = document.createDocumentFragment();
        tasks.forEach(task => {
            const card = document.createElement('div');
            card.className = 'problem-card';
            card.innerHTML = `
                <h3>${task.instance_id}</h3>
                <p><strong>Repo:</strong> ${task.repo}</p>
                <p><strong>API:</strong> ${task.api || 'N/A'}</p>
                <p><strong>Created:</strong> ${task.created_at}</p>
            `;
            const details = document.createElement('details');
            details.innerHTML = `<summary>Details</summary><pre>${JSON.stringify(task, null, 2)}</pre>`;
            card.appendChild(details);
            fragment.appendChild(card);
        });
        this.container.appendChild(fragment);
    }
}

// Initialize explorer on DOM ready
window.addEventListener('DOMContentLoaded', () => {
    new ProblemExplorer();
});
