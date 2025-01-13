class Resume extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    // Specify the attributes to observe
    static get observedAttributes() {
        return ['data-source'];
    }

    // Called when the element is connected to the DOM
    connectedCallback() {
        this.loadResume();
    }

    // Called when an observed attribute changes
    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'data-source' && oldValue !== newValue) {
            this.loadResume();
        }
    }

    async loadResume() {
        const source = this.getAttribute('data-source') || 'resume.json';
        
        try {
            const response = await fetch(source);
            const data = await response.json();
            this.render(data);
        } catch (error) {
            console.error('Error loading resume:', error);
            this.shadowRoot.innerHTML = `Error loading resume data from ${source}`;
        }
    }

    render(data) {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    font-family: 'Instrument Sans', sans-serif;
                    max-width: 700px;
                    line-height: 1.6;
                    font-size: 0.9em;
                }

                header {
                    margin-bottom: 40px;
                }

                h1, h2 {
                    margin: 0;
                    font-weight: bold;
                    font-size: 22px;
                }
                h2 {
                    font-weight: normal;
                }
                .summary {
                    margin-bottom: 20px;
                }

                .contact a {
                    opacity: 0.75;
                    color: inherit;
                }
                .contact a:hover {
                    opacity: 1;
                }

                .section-title {
                    font-weight: bold;
                    margin: 32px 0 16px 0;
                }

                .experience-item {
                    margin-bottom: 40px;
                }

                .job-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: baseline;
                    margin-bottom: 8px;
                }

                .company {
                    
                }

                .job-title {
                    font-weight: 600;
                    margin: 4px 0;
                }

                .period {
                    opacity: 0.75;
                }

                ul {
                    margin: 0;
                    padding-left: 14px;
                }

                li {
                    margin-bottom: 8px;
                }

                .education {
                    margin-bottom: 24px;
                }

                .school {
                    font-weight: 600;
                    margin-bottom: 4px;
                }

                .skills {
                    line-height: 1.8;
                }

                @media (max-width: 600px) {
                    :host {
                        padding: 20px;
                    }

                    .job-header {
                        flex-direction: column;
                    }

                    .period {
                        margin-top: 4px;
                    }
                }
            </style>

            <header>
                <h1>${data.name}</h1>
                <h2>${data.title}</h2>
                <p class="summary">${data.summary}</p>
                <p class="contact">
                    <a href="mailto:${data.contact.email}">${data.contact.email}</a>
                </p>
            </header>

            <section>
                <h2 class="section-title">Experience</h3>
                ${data.experience.map(job => `
                    <div class="experience-item">
                        <div class="job-header">
                            <div>
                                <div class="company">${job.company}</div>
                                <div class="job-title">${job.title}</div>
                            </div>
                            <div class="period">${job.period}</div>
                        </div>
                        <ul>
                            ${job.achievements.map(achievement => `
                                <li>${achievement}</li>
                            `).join('')}
                        </ul>
                    </div>
                `).join('')}
            </section>

            <section class="education">
                <h2 class="section-title">Education</h3>
                <div class="school">${data.education.school}</div>
                <div>${data.education.degree}</div>
            </section>

            <section>
                <h2 class="section-title">Key Skills</h3>
                <div class="skills">
                    ${data.skills.join(', ')}
                </div>
            </section>
        `;
    }
}

// Register the custom element
customElements.define('resume-view', Resume);