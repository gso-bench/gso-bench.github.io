class ProblemExplorer {
    constructor() {
        this.container = document.getElementById('problems-container');
        if (this.container) {
            this.load();
        }
    }

    async load() {
        try {
            const url = 'https://datasets-server.huggingface.co/rows?dataset=gso-bench%2Fgso&config=default&split=train&limit=100';
            const response = await fetch(url);
            const data = await response.json();
            const tasks = data.rows.map(r => r.row);
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
