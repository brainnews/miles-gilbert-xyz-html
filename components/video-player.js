class CustomVideoPlayer extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        // Bind methods to maintain correct 'this' context
        this.startPlayback = this.startPlayback.bind(this);
        this.pausePlayback = this.pausePlayback.bind(this);
        this.togglePlayPause = this.togglePlayPause.bind(this);
        this.toggleMute = this.toggleMute.bind(this);
        this.updateTimeDisplay = this.updateTimeDisplay.bind(this);
    }

    startPlayback() {
        const video = this.shadowRoot.querySelector('video');
        const bigPlayBtn = this.shadowRoot.querySelector('.big-play-button');
        const playPauseBtn = this.shadowRoot.querySelector('.play-pause-btn');
        const playbackControls = this.shadowRoot.querySelector('.playback-controls');
        video.play();
        bigPlayBtn.style.display = 'none';
        playbackControls.classList.add('playing');
        playPauseBtn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>';
    }

    pausePlayback() {
        const video = this.shadowRoot.querySelector('video');
        const bigPlayBtn = this.shadowRoot.querySelector('.big-play-button');
        const playPauseBtn = this.shadowRoot.querySelector('.play-pause-btn');
        const playbackControls = this.shadowRoot.querySelector('.playback-controls');

        video.pause();
        bigPlayBtn.style.display = 'flex';
        playbackControls.classList.remove('playing');
        playPauseBtn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>';
    }

    togglePlayPause() {
        const video = this.shadowRoot.querySelector('video');
        if (video.paused) {
            this.startPlayback();
        } else {
            this.pausePlayback();
        }
    }

    toggleMute() {
        const video = this.shadowRoot.querySelector('video');
        const volumeBtn = this.shadowRoot.querySelector('.volume-btn');
        video.muted = !video.muted;
        volumeBtn.innerHTML = video.muted ?
            '<svg viewBox="0 0 24 24"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>' :
            '<svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>';
    }

    updateTimeDisplay() {
        const video = this.shadowRoot.querySelector('video');
        const timeDisplay = this.shadowRoot.querySelector('.timecode');
        const progressBar = this.shadowRoot.querySelector('.progress-bar');
        const showProgress = this.hasAttribute('show-progress');

        const formatTime = (seconds) => {
            const minutes = Math.floor(seconds / 60);
            seconds = Math.floor(seconds % 60);
            return `${minutes}:${seconds.toString().padStart(2, '0')}`;
        };

        const current = formatTime(video.currentTime);
        const total = formatTime(video.duration);
        timeDisplay.textContent = `${current} / ${total}`;
        
        // Update progress bar
        if (showProgress && video.duration) {
            const progress = (video.currentTime / video.duration) * 100;
            progressBar.style.width = `${progress}%`;
        }
    }

    static get observedAttributes() {
        return ['src', 'poster', 'autoplay', 'show-progress', 'loop', 'no-pip', 'hide-timecode'];
    }

    connectedCallback() {
        this.render();
        const initialSrc = this.getAttribute('src');
        const initialPoster = this.getAttribute('poster');
        const autoplay = this.hasAttribute('autoplay');
        const showProgress = this.hasAttribute('show-progress');
        const loop = this.hasAttribute('loop');
        const noPip = this.hasAttribute('no-pip');
        const hideTimecode = this.hasAttribute('hide-timecode');
        this.initializePlayer(initialSrc, initialPoster, autoplay, showProgress, loop, noPip, hideTimecode);
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                }
                
                .video-container {
                    position: relative;
                    width: 100%;
                    transition: all 0.3s ease;
                    border-radius: 10px;
                    overflow: hidden;
                }

                .video-container.pip {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    width: 300px;
                    margin: 0;
                    z-index: 1000;
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
                    border-radius: 8px;
                    overflow: hidden;
                }

                .video-container.pip .playback-controls {
                    transform: translate(-50%, -50%);
                    background: rgb(0 0 0 / 60%);
                    padding: 5px 10px;
                    opacity: 0;
                    transition: opacity 0.2s;
                    width: unset;
                }

                .video-container.pip:hover .playback-controls {
                    opacity: 1;
                }

                .video-container.pip .big-play-button {
                    width: 60px;
                    height: 40px;
                }

                .video-container.pip .big-play-button svg {
                    width: 24px;
                    height: 24px;
                }

                video {
                    width: 100%;
                    display: block;
                }

                .big-play-button {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 130px;
                    height: 80px;
                    background: rgb(0 0 0 / 60%);
                    border: none;
                    border-radius: 20px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: blanchedalmond;
                    transition: background-color 0.2s;
                    backdrop-filter: blur(10px);
                }

                .big-play-button:hover {
                    background: rgb(255 235 205 / 60%);
                }

                .video-container.pip .playback-controls {
                    padding: 5px 10px;
                }

                .video-container.pip .progress-container,
                .video-container.pip .timecode {
                    display: none;
                }

                .timecode.hide {
                    display: none;
                }

                .playback-controls {
                    position: absolute;
                    bottom: 10px;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    border-radius: 20px;
                    background: rgb(0 0 0 / 60%);
                    padding: 10px 20px;
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    opacity: 0;
                    transition: opacity 0.2s;
                    pointer-events: none;
                    max-width: 600px; /* Added maximum width */
                }

                .video-container:hover .playback-controls.playing {
                    opacity: 1;
                    pointer-events: all;
                }

                .video-container.pip .big-play-button {
                    display: none !important;
                }

                .close-pip-button {
                    position: absolute;
                    top: 8px;
                    right: 8px;
                    background: rgb(0 0 0 / 60%);
                    border: none;
                    border-radius: 50%;
                    width: 24px;
                    height: 24px;
                    cursor: pointer;
                    display: none;
                    align-items: center;
                    justify-content: center;
                    color: blanchedalmond;
                    z-index: 2;
                }

                .video-container.pip .close-pip-button {
                    display: flex;
                }

                .control-btn {
                    background: none;
                    border: none;
                    color: blanchedalmond;
                    cursor: pointer;
                    padding: 5px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .timecode {
                    color: blanchedalmond;
                    font-family: monospace, sans-serif;
                    font-size: 0.8em;
                    white-space: nowrap;
                }

                .progress-container {
                    width: 100%;
                    min-width: 150px; /* Added minimum width */
                    height: 4px;
                    background: rgba(255, 235, 205, 0.2);
                    cursor: pointer;
                    position: relative;
                    margin: 0 10px;
                    display: none;
                    flex: 1; /* Added to allow container to grow */
                }

                .progress-container.show {
                    display: block;
                }

                .progress-bar {
                    height: 100%;
                    background: blanchedalmond;
                    width: 0;
                    transition: width 0.1s linear;
                }

                video::-webkit-media-controls {
                    display: none;
                }

                .control-btn svg,
                .close-pip-button svg {
                    width: 24px;
                    height: 24px;
                    fill: currentColor;
                }
            </style>
            <div class="video-container">
                <video>
                    <source type="video/mp4">
                </video>
                
                <button class="big-play-button">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                        <path d="M8 5v14l11-7z"/>
                    </svg>
                </button>

                <div class="playback-controls">
                    <button class="control-btn play-pause-btn">
                        <svg viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                    </button>
                    <button class="control-btn volume-btn">
                        <svg viewBox="0 0 24 24"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>
                    </button>
                    <span class="timecode">0:00 / 0:00</span>
                    <div class="progress-container">
                        <div class="progress-bar"></div>
                    </div>
                </div>
                <button class="close-pip-button">
                    <svg viewBox="0 0 24 24" style="width: 18px; height: 18px;"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                </button>
            </div>
        `;
    }

    initializePlayer(initialSrc, initialPoster, autoplay, showProgress, loop, noPip, hideTimecode) {
        const video = this.shadowRoot.querySelector('video');
        const source = this.shadowRoot.querySelector('source');
        const bigPlayBtn = this.shadowRoot.querySelector('.big-play-button');
        const playPauseBtn = this.shadowRoot.querySelector('.play-pause-btn');
        const volumeBtn = this.shadowRoot.querySelector('.volume-btn');
        const timeDisplay = this.shadowRoot.querySelector('.timecode');
        const playbackControls = this.shadowRoot.querySelector('.playback-controls');
        const container = this.shadowRoot.querySelector('.video-container');
        const progressContainer = this.shadowRoot.querySelector('.progress-container');
        const progressBar = this.shadowRoot.querySelector('.progress-bar');
        const closePipBtn = this.shadowRoot.querySelector('.close-pip-button');

        if (initialSrc) source.src = initialSrc;
        if (initialPoster) video.poster = initialPoster;
        if (showProgress) progressContainer.classList.add('show');
        if (hideTimecode) timeDisplay.classList.add('hide');

        // Set initial muted state for autoplay
        video.muted = autoplay;
        // Set loop state
        video.loop = loop;
        if (autoplay) {
            volumeBtn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>';
        } else {
            volumeBtn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>';
        }

        video.load();

        const startPlayback = () => {
            video.play();
            bigPlayBtn.style.display = 'none';
            playbackControls.classList.add('playing');
            playPauseBtn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>';
        };

        const pausePlayback = () => {
            video.pause();
            bigPlayBtn.style.display = 'flex';
            playbackControls.classList.remove('playing');
            playPauseBtn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>';
        };

        const togglePlayPause = () => {
            if (video.paused) {
                startPlayback();
            } else {
                pausePlayback();
            }
        };

        const toggleMute = () => {
            video.muted = !video.muted;
            volumeBtn.innerHTML = video.muted ?
                '<svg viewBox="0 0 24 24"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>' :
                '<svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>';
        };

        const formatTime = (seconds) => {
            const minutes = Math.floor(seconds / 60);
            seconds = Math.floor(seconds % 60);
            return `${minutes}:${seconds.toString().padStart(2, '0')}`;
        };

        const updateTimeDisplay = () => {
            const current = formatTime(video.currentTime);
            const total = formatTime(video.duration);
            timeDisplay.textContent = `${current} / ${total}`;
            
            // Update progress bar
            if (showProgress && video.duration) {
                const progress = (video.currentTime / video.duration) * 100;
                progressBar.style.width = `${progress}%`;
            }
        };

        const handleProgressClick = (e) => {
            const rect = progressContainer.getBoundingClientRect();
            const pos = (e.clientX - rect.left) / rect.width;
            video.currentTime = pos * video.duration;
        };

        // Picture-in-Picture functionality
        const checkScroll = () => {
            const rect = this.getBoundingClientRect();
            const isOutOfView = rect.bottom < 80;
            if (isOutOfView && !video.paused) {
                this.pausePlayback();
            }
            // if (!noPip) {
            //     if (isOutOfView && !video.paused) {
            //         container.classList.add('pip');
            //     } else {
            //         container.classList.remove('pip');
            //     }
            // } else {
            //     if (isOutOfView) {
            //         this.pausePlayback();
            //     } else {
            //         this.startPlayback();
            //     }
            // }
        };

        // Handle autoplay
        if (autoplay) {
            video.addEventListener('loadedmetadata', () => {
                startPlayback();
            });
        }

        bigPlayBtn.addEventListener('click', startPlayback);
        playPauseBtn.addEventListener('click', togglePlayPause);
        video.addEventListener('click', togglePlayPause);
        volumeBtn.addEventListener('click', toggleMute);
        video.addEventListener('timeupdate', updateTimeDisplay);
        video.addEventListener('loadedmetadata', updateTimeDisplay);
        window.addEventListener('scroll', checkScroll);
        progressContainer.addEventListener('click', handleProgressClick);

        // Handle closing PiP
        closePipBtn.addEventListener('click', () => {
            container.classList.remove('pip');
            pausePlayback();
            // Scroll video into view
            //this.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });

        video.addEventListener('ended', () => {
            pausePlayback();
            video.currentTime = 0;
        });
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (!this.shadowRoot) return;

        const video = this.shadowRoot.querySelector('video');
        const source = this.shadowRoot.querySelector('source');
        const progressContainer = this.shadowRoot.querySelector('.progress-container');
        
        if (!video || !source) return;
            
        switch(name) {
            case 'src':
                source.src = newValue;
                video.load();
                break;
            case 'poster':
                video.poster = newValue;
                break;
            case 'autoplay':
                video.muted = this.hasAttribute('autoplay');
                break;
            case 'show-progress':
                if (this.hasAttribute('show-progress')) {
                    progressContainer.classList.add('show');
                } else {
                    progressContainer.classList.remove('show');
                }
                break;
            case 'loop':
                video.loop = this.hasAttribute('loop');
                break;
            case 'no-pip':
                // Force removal of pip if disabled
                if (this.hasAttribute('no-pip')) {
                    this.shadowRoot.querySelector('.video-container').classList.remove('pip');
                }
                break;
            case 'hide-timecode':
                const timecodeEl = this.shadowRoot.querySelector('.timecode');
                if (this.hasAttribute('hide-timecode')) {
                    timecodeEl.classList.add('hide');
                } else {
                    timecodeEl.classList.remove('hide');
                }
                break;
        }
    }
}

customElements.define('custom-video-player', CustomVideoPlayer);