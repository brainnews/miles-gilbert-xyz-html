let cachedProjects = null;

export async function loadProjects() {
  if (cachedProjects) {
    return cachedProjects;
  }

  try {
    let pathToJson;
    if (window.location.host === '127.0.0.1:5500' || window.location.host === 'localhost:5500') {
      pathToJson = '../js/projects.json';
    } else {
      pathToJson = 'https://files.milesgilbert.xyz/js/projects.json';
    }
    const response = await fetch(pathToJson);
    if (!response.ok) {
      throw new Error('Failed to load projects');
    }
    cachedProjects = await response.json();
    return cachedProjects;
  } catch (error) {
    console.error('Error loading projects:', error);
    return [];
  }
}

export function createProjectElement(project) {
  const wrapper = document.createElement('a');
  wrapper.href = `./${project.slug}/`;

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

export async function renderProjects() {
  const container = document.getElementById('everything-container');
  if (!container) return; // Don't render if container doesn't exist
  
  const projects = await loadProjects();
  
  projects
    .filter(project => project.visible === true)
    .forEach(project => {
      const projectElement = createProjectElement(project);
      container.appendChild(projectElement);
  });
}
  
export async function getRelatedProjects(currentSlug, maxProjects = 3) {
  const projects = await loadProjects();
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
}