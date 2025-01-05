class ProjectHero extends HTMLElement {
    constructor() {
        super();
        this.project = null;
    }

    async connectedCallback() {
        const jsonPath = this.getAttribute('data-json') || '/projects.json';
        await this.loadProject(jsonPath);
        this.render();
    }

    async loadProject(jsonPath) {
        try {
            // Get the current URL slug
            const urlSlug = window.location.pathname.split('/', 4).pop();
            
            // Fetch and parse the JSON file
            const response = await fetch(jsonPath);
            const projects = await response.json();
            
            // Find the matching project
            this.project = projects.find(project => project.slug === urlSlug);
            
            if (!this.project) {
                console.error('Project not found for slug:', urlSlug);
            }
        } catch (error) {
            console.error('Error loading project:', error);
        }
    }

    formatTags(tags) {
        if (!tags || !Array.isArray(tags) || tags.length === 0) return '';
        
        return `
            <p>Tags<br/>
                <div class="tags">
                    ${tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
            </p>
        `;
    }

    render() {
        if (!this.project) {
            this.innerHTML = '<p>Project not found</p>';
            return;
        }

        this.innerHTML = `
            <div class="intro-content">
                <div class="intro-text">
                    <h3 class="headline">${this.project.title}</h3>
                    <p>${this.project.summary}</p>
                </div>
                <div class="project-notes">
                    <h3 class="headline">Notes</h1>
                    <p>Client<br/><strong>${this.project.client}</strong></p>
                    <p>My role<br/><strong>${this.project.role}</strong></p>
                    ${this.project.agency ? `<p>Agency<br/><strong>${this.project.agency}</strong></p>` : ''}
                    <p>Year<br/><strong>${this.project.year}</strong></p>
                </div>
            </div>
        `;
    }
}

// Inser after Year to add tags: ${this.formatTags(this.project.tags)}

// Register the custom element
customElements.define('project-hero', ProjectHero);