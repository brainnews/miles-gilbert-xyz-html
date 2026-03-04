# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is Miles Gilbert's portfolio website - a static HTML/CSS/JS site showcasing creative technology work, software projects, design work, and writing. The site is hosted on Cloudflare Pages with media assets stored in Cloudflare R2.

## Architecture

**Tech Stack:**
- Pure HTML/CSS/JavaScript with no build process or framework
- Vanilla web components (Custom Elements API)
- Reusable JavaScript modules loaded via `<script>` tags
- All media (images/videos) hosted on Cloudflare R2 CDN
- Site deployed via Cloudflare Pages with Git integration

**Key Architectural Patterns:**
- **Component-based**: Reusable components in `/components/` directory
- **Self-contained modules**: Each component includes its own styles via `<style>` tag injection
- **Auto-initialization**: Components initialize themselves via DOMContentLoaded listeners
- **Shadow DOM for isolation**: Video player uses Shadow DOM to avoid style conflicts

## Site Structure

**Section Organization:**
- `/` - Homepage with overview and links to all sections
- `/creative-technology/` - Case studies of AI/tech implementations at Indeed
- `/software/` - Personal software projects
- `/design/` - Creative direction and design work
- `/thinking/` - Essays and writing
- `/blog/` - Dynamic blog powered by Are.na API
- `/playground/` - Experimental interactive projects
- `/resume/` - Resume/CV page

**Common HTML Pattern:**
Each project detail page follows this structure:
- Breadcrumb navigation at top
- Content wrapper (`.container` or `.design-wrapper`)
- Mix of text, images, and video
- Images use lightbox component automatically
- Videos use custom video player web component

## Reusable Components

**Located in `/components/` directory:**

1. **custom-video-player** (`video-player.js`)
   - Web component (Custom Element) with Shadow DOM
   - Usage: `<custom-video-player src="URL" poster="URL" [autoplay] [show-progress] [loop] [no-pip] [hide-timecode]>`
   - Custom controls with play/pause, mute, timecode, progress bar
   - Auto-pauses when scrolled out of view
   - Must include: `<script src="/components/video-player.js"></script>`

2. **Lightbox** (`lightbox.js`)
   - Auto-initializes for all images on page
   - Click any image to view fullscreen
   - Exclude images with `.no-lightbox` class or images inside `<a>` tags
   - ESC key to close
   - Must include: `<script src="/components/lightbox.js"></script>`

3. **ImageCarousel** (`carousel.js`)
   - Usage: Wrap images with `.image-carousel` container and `.carousel-track`
   - Each image needs `.carousel-image` class
   - Arrow key navigation, prev/next buttons
   - Must include: `<script src="/components/carousel.js"></script>`

4. **MouseTrail** (`mouse-trail.js`)
   - Creates pixelated particle trail that follows cursor with gravity physics
   - Auto-initializes on homepage
   - Particles fall and pile up at bottom of viewport

## Media Hosting

**All media is hosted on Cloudflare R2:**
- Base URL: `https://media.milesgilbert.xyz/`
- Bucket name: `portfolio-videos`
- Local media files are NOT committed to git (see `.gitignore`)

**Media URL Pattern:**
- Project images: `https://media.milesgilbert.xyz/{section}/{project-name}/images/{filename}`
- Project videos: `https://media.milesgilbert.xyz/{section}/{project-name}/videos/{filename}`
- Thumbnails: `https://media.milesgilbert.xyz/{section}/thumbs/{filename}`
- Root favicons: `https://media.milesgilbert.xyz/{filename}`

**Sections:** `creative-technology`, `design`, `software`, `thinking`

## Development Workflow

**Local Development:**
```bash
python3 -m http.server 8000
```
Then visit `http://localhost:8000`

**Testing Video/Lightbox:**
- Videos require actual HTTP server (not file:// protocol)
- Use Python http.server or similar

## Deployment

**Hosting:** Cloudflare Pages
- Connected to GitHub repository
- Auto-deploys on push to `main` branch
- No build command needed (static site)
- Live at: https://milesgilbert.xyz and https://www.milesgilbert.xyz

**Media Management:**
- Use Wrangler CLI to upload media: `wrangler r2 object put portfolio-videos/path/to/file.jpg --file=local/path.jpg --remote`
- Always use `--remote` flag to upload to actual R2 bucket (not local storage)
- Must be authenticated: `wrangler login`

## Styling

**Global Styles:** `/css/styles.css`
- CSS custom properties for theming (`--bg-color`, `--text-color`, `--link-underline`)
- Base font: Atkinson Hyperlegible (Google Fonts)
- Mono font: Atkinson Hyperlegible Mono
- Color scheme: Warm off-white background (`#e8e6e1`) with dark text
- Max content width: 600px centered
- Responsive breakpoints defined in component styles

**Component Styles:**
- Each component injects its own styles via JavaScript
- Avoids global CSS conflicts
- Components are self-contained and portable

## Blog Section

**Located in `/blog/`:**
- Fetches content from Are.na API channel: `creative-technology-now`
- Uses `https://api.are.na/v2/` endpoints (HTTPS required to avoid mixed content errors)
- Two view modes: Cloud view (scattered nodes) and List view (grid)
- Filters out TikTok embeds (often unavailable)
- Custom lightbox for viewing content
- Pagination with "Load More" button

**Important:** Always use HTTPS for Are.na API calls when site is served over HTTPS.

## Git Workflow

**What's Committed:**
- All HTML, CSS, JS files
- No media files (images/videos)
- No temporary/backup files
- No scripts (`.sh` files)

**What's Ignored:** (see `.gitignore`)
- `creative-technology/*/images/`
- `creative-technology/*/videos/`
- `design/*/images/`
- `software/*/images/`
- `thinking/thumbs/`
- `temp/`, `backup-*/`, `.wrangler/`, `node_modules/`, `*.sh`

## Common Patterns

**Adding a New Project:**
1. Create project directory: `/{section}/{project-slug}/`
2. Create `index.html` using existing project as template
3. Upload media to R2: `wrangler r2 object put portfolio-videos/{section}/{project-slug}/images/file.jpg --file=local/path.jpg --remote`
4. Use media URLs: `https://media.milesgilbert.xyz/{section}/{project-slug}/images/file.jpg`
5. Add thumbnail to section index (if applicable)
6. Update section index page with link to new project

**Adding Images to a Page:**
- Include lightbox component: `<script src="/components/lightbox.js"></script>`
- Add images directly: `<img src="https://media.milesgilbert.xyz/..." alt="...">`
- Images auto-activate lightbox on click

**Adding Video to a Page:**
- Include video player component: `<script src="/components/video-player.js"></script>`
- Use custom element: `<custom-video-player src="https://media.milesgilbert.xyz/..." poster="..."></custom-video-player>`
- Common attributes: `autoplay`, `loop`, `show-progress`, `hide-timecode`

**Adding Carousel:**
- Include carousel component: `<script src="/components/carousel.js"></script>`
- Wrap images in structure:
```html
<div class="image-carousel">
    <div class="carousel-track">
        <img class="carousel-image" src="..." alt="...">
        <img class="carousel-image" src="..." alt="...">
    </div>
</div>
```
