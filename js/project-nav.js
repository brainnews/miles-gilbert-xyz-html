class ProjectNav extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  static get observedAttributes() {
    return ['data-src'];
  }

  async connectedCallback() {
    await this.render();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'data-src' && oldValue !== newValue) {
      this.render();
    }
  }

  get styles() {
    return `
      a {
        font-weight: bold;
        text-decoration: none;
      }
      .project-nav {
        margin: 0 auto;
        max-width: 900px;
      }

      .related-projects {
        margin-bottom: 30px;
      }

      .related-projects h2 {
        margin: 0 0 15px 0;
      }

      .related-projects-list {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 20px;
      }

      .work-image {
        position: relative;
        width: 100%;
        padding-top: 56.25%; /* 16:9 Aspect Ratio (9 / 16 = 0.5625) */
        border-radius: 20px;
        overflow: hidden;
      }
      .work-image img {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        filter: saturate(150%);
        transition: all 0.3s ease;
      }
      .work-image img:hover {
        transform: scale(1.025);
      }
      .work-image .work-info {
        position: absolute;
        bottom: 10px;
        left: 10px;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 10px;
        transition: all 0.3s ease;
        text-align: center;
        font-size: 0.8em;
        padding: 4px 8px;
        color: blanchedalmond;
      }

      .all-projects {
        padding-top: 20px;
      }

      .all-projects h2 {
        margin: 0 0 15px 0;
      }

      .projects-list {
        display: flex;
        flex-wrap: wrap;
        gap: 0px;
      }

      .project-link {
        text-decoration: none;
        color: blanchedalmond;
        opacity: 0.6;
        transition: all 0.2s;
        margin-right: 10px;
      }

      .project-link:hover {
        opacity: 1;
      }

      .project-link.active {
        background-color: transparent;
        opacity: 1;
      }

      .no-related {
        color: blanchedalmond;
        opacity: 0.8;
      }

      .loading {
        text-align: center;
        color: blanchedalmond;
        opacity: 0.8;
        padding: 20px;
      }

      .error {
        color: #dc2626;
        padding: 15px;
        background: #fee2e2;
        border-radius: 4px;
        margin: 10px 0;
      }
    `;
  }

  get template() {
    return `
      <div class="project-nav">
        <div class="related-projects">
          <h2>Related Projects</h2>
          <div class="related-projects-list" id="relatedProjects">
            <span class="loading">Loading projects...</span>
          </div>
        </div>

        <div class="all-projects">
          <h2>All Projects</h2>
          <div class="projects-list" id="projectsList">
            <span class="loading">Loading projects...</span>
          </div>
        </div>
      </div>
    `;
  }

  slugify(str) {
    return str
      .toLowerCase()
      .replace(/\./g, '-')
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  getCurrentProject(projects) {
    const path = window.location.pathname;
    const projectSlug = path.split('/projects/')[1]?.replace(/\/$/, '');
    return projects.find(p => this.slugify(p.title) === projectSlug);
  }

  getRelatedProjects(currentProject, allProjects) {
    if (!currentProject) return [];
    
    return allProjects
      .filter(project => {
        if (project.visible) {
          if (project.title === currentProject.title) return false;
            const commonTags = project.tags.filter(tag => 
              currentProject.tags.includes(tag)
            );
          return commonTags.length > 0;
        }
      })
      .sort((a, b) => {
        const aCommonTags = a.tags.filter(tag => 
          currentProject.tags.includes(tag)
        ).length;
        const bCommonTags = b.tags.filter(tag => 
          currentProject.tags.includes(tag)
        ).length;
        return bCommonTags - aCommonTags;
      })
      .slice(0, 2); // Limit to 2 related projects
  }

  createProjectCard(project, currentProject) {
    const wrapper = document.createElement('a');
    wrapper.href = `./../${this.slugify(project.title)}/`;

    const workImage = document.createElement('div');
    workImage.className = 'work-image';

    const img = document.createElement('img');
    img.src = `https://files.milesgilbert.xyz/images/thumbs/${project.slug}.jpg`;
    img.alt = project.title;

    const workInfo = document.createElement('div');
    workInfo.className = 'work-info';
    workInfo.textContent = project.title;

    workImage.appendChild(img);
    workImage.appendChild(workInfo);
    wrapper.appendChild(workImage);

    return wrapper;
  }

  createProjectLink(project, isActive = false) {
    const link = document.createElement('a');
    link.href = `./../${this.slugify(project.title)}/`;
    link.className = `project-link${isActive ? ' active' : ''}`;
    link.textContent = project.title;
    return link;
  }

  showError(message) {
    const error = document.createElement('div');
    error.className = 'error';
    error.textContent = message;
    this.shadowRoot.querySelector('.project-nav').prepend(error);
  }

  async render() {
    this.shadowRoot.innerHTML = `
      <style>${this.styles}</style>
      ${this.template}
    `;

    const projectsList = this.shadowRoot.getElementById('projectsList');
    const relatedProjects = this.shadowRoot.getElementById('relatedProjects');
    const dataSource = this.getAttribute('data-src');

    if (!dataSource) {
      this.showError('No data source specified. Use data-src attribute to specify JSON file path.');
      return;
    }

    try {
      const response = await fetch(dataSource);
      if (!response.ok) {
        throw new Error('Failed to load projects data');
      }
      
      const projects = await response.json();
      const currentProject = this.getCurrentProject(projects);

      // Clear loading states
      projectsList.innerHTML = '';
      relatedProjects.innerHTML = '';

      // Populate related projects
      if (currentProject) {
        const related = this.getRelatedProjects(currentProject, projects);
        if (related.length > 0) {
          related.forEach(project => {
            relatedProjects.appendChild(
              this.createProjectCard(project, currentProject)
            );
          });
        } else {
          console.log("related")
          relatedProjects.innerHTML = '<span class="no-related">No related projects found</span>';
        }
      }

      // Populate all projects
      projects.forEach(project => {
        if (project.visible) {
          const isActive = currentProject && project.title === currentProject.title;
          projectsList.appendChild(this.createProjectLink(project, isActive));
        }
      });

    } catch (error) {
      console.error('Error loading projects:', error);
      this.showError('Failed to load projects. Please try again later.');
    }
  }
}

// Register the custom element
customElements.define('project-nav', ProjectNav);