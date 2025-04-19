import { loadProjects } from './projects.js';

async function updateProjectPages() {
    const projects = await loadProjects();
    const projectDirs = [
        'work-wellbeing-series',
        'the-end-of-the-road',
        'work-sounds-by-indeed',
        'rising-voices-tribeca',
        'shooot',
        'metitate-art',
        'mobil-1-motorsports',
        'lowes-fix-in-six',
        'indeed-job-market',
        'indeed-on-youtube',
        'ibm-smarter-planet-series',
        'ibm-watson',
        'hp-the-power-of-touch',
        'ibm-smarter-planet',
        'how-to-business-by-indeed',
        'godmode-records',
        'careers-in-care-off-the-clock'
    ];

    for (const dir of projectDirs) {
        const project = projects.find(p => p.slug === dir);
        if (!project) continue;

        const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${project.title}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Lora:ital,wght@0,400..700;1,400..700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
    <link rel="stylesheet" href="../../../css/styles.css">
</head>
<body>
    <div class="container">
        <div class="header-container"></div>
        <section class="project-section">
            <div class="project-header">
                <h1>${project.title}</h1>
                <p class="subhead">${project.tagline}</p>
                <div class="project-meta">
                    <span class="role">${project.role}</span>
                    <span class="client">${project.client}</span>
                    <span class="year">${project.year}</span>
                </div>
            </div>
            <div class="project-content">
                <p>${project.summary}</p>
                
                <div class="project-media">
                    <!-- Add video players if needed -->
                </div>

                <div class="project-gallery">
                    <!-- Add images if needed -->
                </div>
            </div>
        </section>
    </div>

    <script type="module">
        import { renderProjects } from '../../../js/projects.js';

        // Load the header when the page loads
        async function loadHeader() {
            try {
                const response = await fetch('../../../components/header.html');
                const html = await response.text();
                
                // Create a temporary container to parse the HTML
                const temp = document.createElement('div');
                temp.innerHTML = html;
                
                // Extract and append the header HTML
                const header = temp.querySelector('.header');
                document.querySelector('.header-container').appendChild(header);
                
                // Extract and append the styles
                const styles = temp.querySelector('style');
                if (styles) {
                    document.head.appendChild(styles);
                }
                
                // Extract and execute the scripts
                const scripts = temp.querySelectorAll('script');
                scripts.forEach(script => {
                    const newScript = document.createElement('script');
                    newScript.textContent = script.textContent;
                    document.body.appendChild(newScript);
                });
            } catch (error) {
                console.error('Error loading header:', error);
            }
        }

        // Initialize everything when the page loads
        window.addEventListener('load', async () => {
            await loadHeader();
        });
    </script>
    <script src="../../../components/video-player.js"></script>
</body>
</html>
`;

        // Write the HTML to the project's index.html file
        const response = await fetch(`../work/projects/${dir}/index.html`, {
            method: 'PUT',
            body: html,
            headers: {
                'Content-Type': 'text/html'
            }
        });

        if (!response.ok) {
            console.error(`Failed to update ${dir}/index.html`);
        }
    }
}

updateProjectPages(); 