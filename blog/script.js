const CHANNEL_SLUG = 'creative-technology-now';
const BLOCKS_PER_PAGE = 12;

let allBlocks = [];
let currentPage = 0;
let channelContent;
let loadMoreButton;
let currentView = 'cloud'; // Default to cloud view
let nodeCloudInstance = null;

document.addEventListener('DOMContentLoaded', () => {
    channelContent = document.getElementById('channel-content');
    loadMoreButton = document.getElementById('load-more');

    fetch(`https://api.are.na/v2/channels/${CHANNEL_SLUG}`)
        .then(response => response.json())
        .then(data => {
            // Set browser tab title only
            document.title = data.title;

            console.log(`Channel has ${data.length} total blocks`);
        })
        .catch(error => {
            console.error('Error fetching channel data:', error);
        });

    fetchAllBlocks()
        .then(blocks => {
            console.log(`Raw blocks fetched: ${blocks.length}`);
            
            const filteredBlocks = blocks.filter(block => {
                const hasContent = block.title || block.content || block.embed || block.image;
                if (!hasContent) {
                    console.log('Excluding block:', block.id, block.class, 'No displayable content');
                    return false;
                }

                // Filter out TikTok embeds (often show "Video currently unavailable")
                const isTikTok = block.embed && block.embed.provider_name === 'TikTok';
                if (isTikTok) {
                    console.log('Excluding block:', block.id, 'TikTok embed');
                    return false;
                }

                return true;
            });
            
            console.log(`After filtering: ${filteredBlocks.length} blocks`);
            
            allBlocks = filteredBlocks.sort((a, b) => {
                const dateA = new Date(a.created_at || a.updated_at);
                const dateB = new Date(b.created_at || b.updated_at);
                return dateB - dateA;
            });
            
            console.log(`Final sorted blocks: ${allBlocks.length}`);
            loadBlocks();
            updateLoadMoreButton();

            // Show cloud view by default
            showCloudView();
        })
        .catch(error => {
            console.error('Error fetching data:', error);
            channelContent.textContent = 'Error loading content.';
        });

    loadMoreButton.addEventListener('click', () => {
        currentPage++;
        loadBlocks();
        updateLoadMoreButton();
    });

    // Initialize view toggle
    initViewToggle();
});

async function fetchAllBlocks() {
    // First get the channel info to know total block count
    const channelResponse = await fetch(`https://api.are.na/v2/channels/${CHANNEL_SLUG}`);
    const channelData = await channelResponse.json();
    const totalBlocks = channelData.length;
    const blocksPerPage = 100;
    const totalPages = Math.ceil(totalBlocks / blocksPerPage);
    
    console.log(`Channel has ${totalBlocks} blocks, will need ${totalPages} pages at ${blocksPerPage} per page`);

    let allBlocks = [];
    let currentPage = 1;

    console.log('Starting to fetch all blocks...');

    do {
        try {
            console.log(`Fetching page ${currentPage}/${totalPages}...`);
            const response = await fetch(`https://api.are.na/v2/channels/${CHANNEL_SLUG}/contents?page=${currentPage}&per=${blocksPerPage}`);
            const data = await response.json();
            
            console.log(`Page ${currentPage}: ${data.contents.length} blocks received`);
            
            allBlocks = allBlocks.concat(data.contents);
            currentPage++;
        } catch (error) {
            console.error(`Error fetching page ${currentPage}:`, error);
            break;
        }
    } while (currentPage <= totalPages);

    console.log(`Finished fetching. Total blocks retrieved: ${allBlocks.length}`);
    return allBlocks;
}

function loadBlocks() {
    const startIndex = currentPage * BLOCKS_PER_PAGE;
    const endIndex = startIndex + BLOCKS_PER_PAGE;
    const blocksToShow = allBlocks.slice(startIndex, endIndex);

    console.log(`Loading blocks ${startIndex} to ${endIndex-1} (${blocksToShow.length} blocks)`);

    blocksToShow.forEach((block) => {
        try {
            const blockElement = createBlockElement(block);
            channelContent.appendChild(blockElement);
        } catch (error) {
            console.error(`Error rendering block ${block.id} (${block.class}):`, error, block);
            // Create a fallback block
            const fallbackBlock = document.createElement('div');
            fallbackBlock.classList.add('block', 'block-error');
            fallbackBlock.innerHTML = `<h3>Error loading block</h3><p>Block ID: ${block.id}, Type: ${block.class}</p>`;
            channelContent.appendChild(fallbackBlock);
        }
    });
}

function createBlockElement(block) {
    const container = document.createElement('div');
    container.classList.add('block', `block-${block.class.toLowerCase()}`);

    switch(block.class) {
        case 'Image':
            return createImageBlock(block, container);
        case 'Text':
            return createTextBlock(block, container);
        case 'Link':
            return createLinkBlock(block, container);
        case 'Media':
            return createMediaBlock(block, container);
        case 'Attachment':
            return createAttachmentBlock(block, container);
        default:
            return createDefaultBlock(block, container);
    }
}

function createImageBlock(block, container) {
    const contentDiv = document.createElement('div');
    contentDiv.classList.add('block-content');
    
    if (block.source && block.source.url) {
        const link = document.createElement('a');
        link.href = block.source.url;
        link.target = '_blank';
        link.appendChild(container);
        
        if (block.image && block.image.display && block.image.display.url) {
            const img = document.createElement('img');
            img.src = block.image.display.url;
            img.alt = block.title || 'Image';
            container.appendChild(img);
        }
        
        if (block.title) {
            const title = document.createElement('h3');
            title.textContent = block.title;
            contentDiv.appendChild(title);
        }
        
        container.appendChild(contentDiv);
        return link;
    } else {
        if (block.image && block.image.display && block.image.display.url) {
            const img = document.createElement('img');
            img.src = block.image.display.url;
            img.alt = block.title || 'Image';
            container.appendChild(img);
        }
        
        if (block.title) {
            const title = document.createElement('h3');
            title.textContent = block.title;
            contentDiv.appendChild(title);
        }
        
        container.appendChild(contentDiv);
        return container;
    }
}

function createTextBlock(block, container) {
    const contentDiv = document.createElement('div');
    contentDiv.classList.add('block-content');
    
    if (block.title) {
        const title = document.createElement('h3');
        title.textContent = block.title;
        contentDiv.appendChild(title);
    }
    
    if (block.content_html) {
        const content = document.createElement('div');
        content.classList.add('text-content');
        content.innerHTML = block.content_html;
        contentDiv.appendChild(content);
    } else if (block.content) {
        const content = document.createElement('div');
        content.classList.add('text-content');
        content.textContent = block.content;
        contentDiv.appendChild(content);
    }
    
    container.appendChild(contentDiv);
    return container;
}

function createLinkBlock(block, container) {
    const link = document.createElement('a');
    link.href = block.source.url;
    link.target = '_blank';
    link.appendChild(container);
    
    const contentDiv = document.createElement('div');
    contentDiv.classList.add('block-content');
    
    if (block.image && block.image.display && block.image.display.url) {
        const img = document.createElement('img');
        img.src = block.image.display.url;
        img.alt = block.title || 'Link preview';
        container.appendChild(img);
    }
    
    if (block.title) {
        const title = document.createElement('h3');
        title.textContent = block.title;
        contentDiv.appendChild(title);
    }
    
    if (block.description) {
        const description = document.createElement('p');
        description.classList.add('description');
        description.textContent = block.description;
        contentDiv.appendChild(description);
    }
    
    if (block.source && block.source.provider && block.source.provider.name) {
        const provider = document.createElement('span');
        provider.classList.add('provider');
        provider.textContent = block.source.provider.name;
        contentDiv.appendChild(provider);
    }
    
    container.appendChild(contentDiv);
    return link;
}

function createMediaBlock(block, container) {
    const contentDiv = document.createElement('div');
    contentDiv.classList.add('block-content');
    
    if (block.title) {
        const title = document.createElement('h3');
        title.textContent = block.title;
        contentDiv.appendChild(title);
    }
    
    if (block.embed && block.embed.html) {
        try {
            const embedContainer = document.createElement('div');
            embedContainer.classList.add('embed-container');
            // Sanitize the embed HTML to prevent script execution issues
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = block.embed.html;
            // Copy only iframe elements to be safe
            const iframes = tempDiv.querySelectorAll('iframe');
            iframes.forEach(iframe => {
                const newIframe = document.createElement('iframe');
                // Copy safe attributes
                ['src', 'width', 'height', 'frameborder', 'allowfullscreen'].forEach(attr => {
                    if (iframe.hasAttribute(attr)) {
                        newIframe.setAttribute(attr, iframe.getAttribute(attr));
                    }
                });
                newIframe.setAttribute('loading', 'lazy');
                embedContainer.appendChild(newIframe);
            });
            container.appendChild(embedContainer);
        } catch (error) {
            console.error('Error creating embed:', error);
            // Fallback to image if embed fails
            if (block.image && block.image.display && block.image.display.url) {
                const img = document.createElement('img');
                img.src = block.image.display.url;
                img.alt = block.title || 'Media thumbnail';
                container.appendChild(img);
            }
        }
    } else if (block.image && block.image.display && block.image.display.url) {
        const img = document.createElement('img');
        img.src = block.image.display.url;
        img.alt = block.title || 'Media thumbnail';
        container.appendChild(img);
        
        if (block.source && block.source.url) {
            const link = document.createElement('a');
            link.href = block.source.url;
            link.target = '_blank';
            link.textContent = 'View Original';
            link.classList.add('view-original');
            contentDiv.appendChild(link);
        }
    }
    
    if (block.embed && block.embed.provider_name) {
        const provider = document.createElement('span');
        provider.classList.add('provider');
        provider.textContent = block.embed.provider_name;
        contentDiv.appendChild(provider);
    }
    
    container.appendChild(contentDiv);
    return container;
}

function createAttachmentBlock(block, container) {
    const link = document.createElement('a');
    link.href = block.attachment.url;
    link.target = '_blank';
    link.appendChild(container);
    
    if (block.image && block.image.thumb && block.image.thumb.url) {
        const img = document.createElement('img');
        img.src = block.image.thumb.url;
        img.alt = 'File thumbnail';
        container.appendChild(img);
    }
    
    if (block.title) {
        const title = document.createElement('h3');
        title.textContent = block.title;
        container.appendChild(title);
    }
    
    if (block.attachment && block.attachment.file_size_display) {
        const fileSize = document.createElement('span');
        fileSize.classList.add('file-size');
        fileSize.textContent = block.attachment.file_size_display;
        container.appendChild(fileSize);
    }
    
    return link;
}

function createDefaultBlock(block, container) {
    if (block.title) {
        const title = document.createElement('h3');
        title.textContent = block.title;
        container.appendChild(title);
    }
    
    if (block.description) {
        const description = document.createElement('p');
        description.textContent = block.description;
        container.appendChild(description);
    }
    
    return container;
}

function updateLoadMoreButton() {
    const totalShown = (currentPage + 1) * BLOCKS_PER_PAGE;
    if (totalShown >= allBlocks.length) {
        loadMoreButton.style.display = 'none';
    } else {
        loadMoreButton.style.display = 'block';
        const remaining = allBlocks.length - totalShown;
        loadMoreButton.textContent = `Load More (${remaining} remaining)`;
    }
}

// View Toggle Functions
function initViewToggle() {
    const toggleButtons = document.querySelectorAll('.view-toggle button');
    toggleButtons.forEach(button => {
        button.addEventListener('click', () => {
            const view = button.dataset.view;
            switchView(view);
        });
    });
}

function switchView(view) {
    if (currentView === view) return;

    currentView = view;

    // Update button states
    document.querySelectorAll('.view-toggle button').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === view);
    });

    if (view === 'cloud') {
        showCloudView();
    } else {
        showListView();
    }
}

function showCloudView() {
    // Hide list view elements
    channelContent.style.display = 'none';
    loadMoreButton.style.display = 'none';

    // Show cloud view
    const cloudContainer = document.getElementById('cloud-view');
    cloudContainer.style.display = 'block';

    // Create cloud instance if not exists
    if (!nodeCloudInstance) {
        nodeCloudInstance = new NodeCloud(allBlocks, cloudContainer);
    } else {
        nodeCloudInstance.start();
    }
}

function showListView() {
    // Show list view elements
    channelContent.style.display = 'flex';
    updateLoadMoreButton();

    // Hide cloud view
    const cloudContainer = document.getElementById('cloud-view');
    cloudContainer.style.display = 'none';

    // Pause cloud instance
    if (nodeCloudInstance) {
        nodeCloudInstance.pause();
    }
}

// NodeCloud Class
class NodeCloud {
    constructor(blocks, container) {
        this.blocks = blocks;
        this.container = container;
        this.nodes = [];

        this.init();
    }

    init() {
        this.createNodes();
    }

    createNodes() {
        const padding = 100;
        const width = window.innerWidth - padding * 2;
        const height = window.innerHeight - padding * 2;

        this.blocks.forEach((block, index) => {
            const element = document.createElement('div');
            element.className = 'cloud-node';

            // Random position
            const baseX = padding + Math.random() * width;
            const baseY = padding + Math.random() * height;

            // Add image if available
            if (block.image && block.image.display && block.image.display.url) {
                const img = document.createElement('img');
                img.src = block.image.thumb?.url || block.image.display.url;
                img.alt = block.title || '';
                element.appendChild(img);
            } else if (block.class === 'Text') {
                // For text blocks, create a colored background
                element.classList.add('cloud-node-text');
                const textPreview = document.createElement('div');
                textPreview.className = 'cloud-node-text-preview';
                textPreview.textContent = block.title || (block.content ? block.content.substring(0, 100) : '');
                element.appendChild(textPreview);
            }

            // Add title overlay
            if (block.title) {
                const title = document.createElement('div');
                title.className = 'cloud-node-title';
                title.textContent = block.title;
                element.appendChild(title);
            }

            // Add click handler to open lightbox
            element.addEventListener('click', (e) => {
                e.stopPropagation();
                openNodeLightbox(block);
            });
            element.style.cursor = 'pointer';

            this.container.appendChild(element);

            // Position element at random location (no physics, just static placement)
            element.style.transform = `translate(${baseX}px, ${baseY}px)`;

            const node = {
                element,
                block
            };

            this.nodes.push(node);
        });
    }

    start() {
        // No animation needed - nodes are static
    }

    pause() {
        // No animation to pause
    }

    destroy() {
        this.container.innerHTML = '';
        this.nodes = [];
    }
}

// Node Lightbox Functions
function openNodeLightbox(block) {
    const lightbox = document.getElementById('node-lightbox');
    const lightboxBody = document.getElementById('node-lightbox-body');

    // Clear previous content
    lightboxBody.innerHTML = '';

    // Check if this is an Image block (pure photo)
    const isImageBlock = block.class === 'Image';
    const hasImage = block.image && block.image.display && block.image.display.url;
    const hasEmbed = block.embed && block.embed.html;

    // For video/embed content: show embed first (no thumbnail)
    // For other content: show image first
    if (hasEmbed) {
        // Video content: embed goes first
        const embedContainer = document.createElement('div');
        embedContainer.className = 'embed-container';
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = block.embed.html;
        const iframes = tempDiv.querySelectorAll('iframe');
        iframes.forEach(iframe => {
            const newIframe = document.createElement('iframe');
            ['src', 'width', 'height', 'frameborder', 'allowfullscreen'].forEach(attr => {
                if (iframe.hasAttribute(attr)) {
                    newIframe.setAttribute(attr, iframe.getAttribute(attr));
                }
            });
            embedContainer.appendChild(newIframe);
        });
        lightboxBody.appendChild(embedContainer);
    } else if (hasImage) {
        // Non-video content with image: show image first
        const img = document.createElement('img');
        img.src = block.image.display.url;
        img.alt = isImageBlock ? '' : (block.title || '');
        lightboxBody.appendChild(img);
    }

    // Only show text content if it's NOT an Image block
    if (!isImageBlock) {
        if (block.title) {
            const title = document.createElement('h2');
            title.textContent = block.title;
            lightboxBody.appendChild(title);
        }

        if (block.description) {
            const description = document.createElement('div');
            description.className = 'lightbox-description';
            description.textContent = block.description;
            lightboxBody.appendChild(description);
        }

        if (block.content_html) {
            const content = document.createElement('div');
            content.className = 'lightbox-content';
            content.innerHTML = block.content_html;
            lightboxBody.appendChild(content);
        } else if (block.content) {
            const content = document.createElement('div');
            content.className = 'lightbox-content';
            content.textContent = block.content;
            lightboxBody.appendChild(content);
        }

        // Add provider badge if available
        if (block.source && block.source.provider && block.source.provider.name) {
            const provider = document.createElement('div');
            provider.className = 'lightbox-provider';
            provider.textContent = 'via ' + block.source.provider.name;
            lightboxBody.appendChild(provider);
        }

        // Add link to source if available
        if (block.source && block.source.url) {
            const link = document.createElement('a');
            link.href = block.source.url;
            link.target = '_blank';
            link.className = 'lightbox-link';
            link.textContent = 'View Original';
            lightboxBody.appendChild(link);
        }
    }

    // Show lightbox
    lightbox.style.display = 'flex';
    setTimeout(() => {
        lightbox.classList.add('active');
    }, 10);

    // Prevent body scroll
    document.body.style.overflow = 'hidden';
}

function closeNodeLightbox() {
    const lightbox = document.getElementById('node-lightbox');
    lightbox.classList.remove('active');

    setTimeout(() => {
        lightbox.style.display = 'none';
    }, 300);

    // Restore body scroll
    document.body.style.overflow = '';
}

// Initialize lightbox close handlers
document.addEventListener('DOMContentLoaded', () => {
    const lightbox = document.getElementById('node-lightbox');
    const closeButton = document.querySelector('.node-lightbox-close');

    // Close on button click
    closeButton.addEventListener('click', closeNodeLightbox);

    // Close on background click
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            closeNodeLightbox();
        }
    });

    // Close on ESC key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && lightbox.classList.contains('active')) {
            closeNodeLightbox();
        }
    });
});

