async function loadProjects() {
  try {
    const response = await fetch('https://files.milesgilbert.xyz/js/projects.json');
    if (!response.ok) {
      throw new Error('Failed to load projects');
    }
    const projects = await response.json();
    return projects;
  } catch (error) {
    console.error('Error loading projects:', error);
    return [];
  }
}

function createProjectElement(project) {
  const wrapper = document.createElement('a');
  wrapper.href = `./projects/${project.slug}/`;

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

async function renderProjects() {
  const container = document.getElementById('everything-container');
  const projects = await loadProjects();
  
  projects
    .filter(project => project.visible !== false)  // Only render visible projects
    .forEach(project => {
      const projectElement = createProjectElement(project);
      container.appendChild(projectElement);
  });
}

// Initialize the portfolio when the DOM is loaded
document.addEventListener('DOMContentLoaded', renderProjects);
  
export const getRelatedProjects = (currentSlug, maxProjects = 3) => {
  const currentProject = projects.find(p => p.slug === currentSlug);
  if (!currentProject) return [];
  
  const scoredProjects = projects
    .filter(p => p.slug !== currentSlug)
    .map(project => {
      const sharedTags = project.tags.filter(tag => 
        currentProject.tags.includes(tag)
      );
      return {
        ...project,
        score: sharedTags.length,
        sharedTags
      };
    })
    .filter(p => p.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return parseInt(b.year) - parseInt(a.year);
    })
    .slice(0, maxProjects);

  return scoredProjects;
};