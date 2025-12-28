// ===========================
// TACTICAL COMMAND CONSOLE
// Audio Stream Management System
// ===========================

(function() {
'use strict';

const CONFIG = {
    audio: { preload: 'none' },
    layout: { defaultX: 40, defaultY: 40, offsetIncrement: 25 },
    playerWidth: 180,
    iframe: { 
        defaultWidth: 400, 
        defaultHeight: 300, 
        minWidth: 200, 
        minHeight: 150 
    },
    workspace: {
        padding: 50
    }
};

const AppState = {
    sidebar: null,
    canvas: null,
    canvasInner: null,
    importFile: null,
    deployedPlayers: [],
    deployedIframes: [],
    nextPlayerId: 1,
    nextIframeId: 1,
    layoutOffset: { x: 0, y: 0 }
};

const ICONS = {
    grip: `<svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="5" r="1.5"/><circle cx="15" cy="5" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="19" r="1.5"/><circle cx="15" cy="19" r="1.5"/></svg>`,
    refresh: `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>`,
    x: `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
    server: `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>`,
    alert: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
    check: `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>`,
    play: `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>`,
    pause: `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`,
    volumeHigh: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>`,
    volumeLow: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>`,
    volumeMute: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>`,
    live: `<svg width="7" height="7" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="6"/></svg>`,
    iframe: `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/></svg>`,
    resize: `<svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M22 22H20V20H22V22ZM22 18H20V16H22V18ZM18 22H16V20H18V22ZM22 14H20V12H22V14ZM18 18H16V16H18V18ZM14 22H12V20H14V22ZM22 10H20V8H22V10ZM18 14H16V12H18V14ZM14 18H12V16H14V18ZM10 22H8V20H10V22Z"/></svg>`,
    externalLink: `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`
};

// ═══════════════════════════════════════════════════════════════
// SCROLL LOCK - Prevents auto-scroll when media plays
// ═══════════════════════════════════════════════════════════════
const ScrollLock = {
    savedPosition: null,
    lockCount: 0,
    scrollHandler: null,
    
    // Save current scroll position
    save() {
        if (this.lockCount === 0) {
            this.savedPosition = {
                x: window.scrollX || window.pageXOffset || document.documentElement.scrollLeft,
                y: window.scrollY || window.pageYOffset || document.documentElement.scrollTop
            };
        }
        this.lockCount++;
    },
    
    // Restore saved scroll position
    restore() {
        this.lockCount--;
        if (this.lockCount <= 0 && this.savedPosition) {
            this.lockCount = 0;
            const pos = this.savedPosition;
            // Use multiple methods to ensure scroll restoration
            window.scrollTo(pos.x, pos.y);
            document.documentElement.scrollTop = pos.y;
            document.documentElement.scrollLeft = pos.x;
            if (document.body) {
                document.body.scrollTop = pos.y;
                document.body.scrollLeft = pos.x;
            }
            this.savedPosition = null;
        }
    },
    
    // Wrap an async operation to preserve scroll
    async wrapAsync(asyncFn) {
        this.save();
        try {
            const result = await asyncFn();
            // Delay restoration to catch async scroll attempts
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    this.restore();
                });
            });
            return result;
        } catch (e) {
            this.restore();
            throw e;
        }
    },
    
    // Wrap a sync operation to preserve scroll
    wrapSync(fn) {
        this.save();
        try {
            const result = fn();
            // Immediate + delayed restoration
            this.restore();
            requestAnimationFrame(() => {
                if (this.savedPosition) {
                    window.scrollTo(this.savedPosition.x, this.savedPosition.y);
                }
            });
            return result;
        } catch (e) {
            this.restore();
            throw e;
        }
    },
    
    // Temporarily block all scrolling
    blockScrollTemporarily(duration = 100) {
        const scrollX = window.scrollX || window.pageXOffset;
        const scrollY = window.scrollY || window.pageYOffset;
        
        const preventScroll = (e) => {
            window.scrollTo(scrollX, scrollY);
        };
        
        window.addEventListener('scroll', preventScroll);
        
        setTimeout(() => {
            window.removeEventListener('scroll', preventScroll);
        }, duration);
    }
};

// ═══════════════════════════════════════════════════════════════
// INJECT ANTI-SCROLL CSS
// ═══════════════════════════════════════════════════════════════
function injectAntiScrollCSS() {
    const styleId = 'tactical-anti-scroll-css';
    if (document.getElementById(styleId)) return;
    
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
        /* Prevent scroll anchoring which can cause auto-scroll */
        * {
            overflow-anchor: none !important;
        }
        
        /* Prevent focus-induced scrolling on media elements */
        audio, video, iframe {
            overflow-anchor: none !important;
        }
        
        /* Ensure workspace doesn't trigger scroll anchoring */
        #canvas, .workspace-inner, .player-card, .iframe-card {
            overflow-anchor: none !important;
        }
        
        /* Prevent iframe focus scrolling */
        .iframe-card iframe {
            overflow-anchor: none !important;
        }
    `;
    document.head.appendChild(style);
}

// ═══════════════════════════════════════════════════════════════
// WORKSPACE MANAGER - Vertical scroll only
// ═══════════════════════════════════════════════════════════════
const WorkspaceManager = {
    updateSize() {
        if (!AppState.canvasInner) return;
        
        const elements = [...AppState.deployedPlayers, ...AppState.deployedIframes];
        let maxBottom = window.innerHeight;
        
        elements.forEach(el => {
            if (el.element) {
                const height = el.size ? el.size.height : el.element.offsetHeight;
                const bottom = el.position.y + height + CONFIG.workspace.padding;
                maxBottom = Math.max(maxBottom, bottom);
            }
        });
        
        // Only update height for vertical scrolling
        AppState.canvasInner.style.height = `${maxBottom}px`;
    },
    
    init() {
        if (AppState.canvas && !AppState.canvasInner) {
            const existingInner = AppState.canvas.querySelector('.workspace-inner');
            if (existingInner) {
                AppState.canvasInner = existingInner;
            } else {
                AppState.canvasInner = document.createElement('div');
                AppState.canvasInner.className = 'workspace-inner';
                
                const grid = AppState.canvas.querySelector('.workspace-grid');
                if (grid) {
                    AppState.canvasInner.appendChild(grid);
                }
                
                AppState.canvas.appendChild(AppState.canvasInner);
            }
        }
        
        this.updateSize();
        window.addEventListener('resize', () => this.updateSize());
    }
};

// ═══════════════════════════════════════════════════════════════
// LIVEATC PARSER
// ═══════════════════════════════════════════════════════════════
class LiveATCParser {
    constructor() {
        this.servers = [
            'https://s1-fmt2.liveatc.net',
            'https://s2-fmt2.liveatc.net',
            'https://s1-bos.liveatc.net',
            'https://s2-bos.liveatc.net',
            'https://s1-lax.liveatc.net',
            'https://s1-ord.liveatc.net',
            'https://s1-atl.liveatc.net',
            'https://s1-dfw.liveatc.net',
            'http://d.liveatc.net'
        ];

        this.facilities = {
            'tower': 'twr', 'twr': 'twr',
            'ground': 'gnd', 'gnd': 'gnd',
            'approach': 'app', 'app': 'app',
            'departure': 'dep', 'dep': 'dep',
            'center': 'ctr', 'ctr': 'ctr',
            'clearance': 'del', 'delivery': 'del', 'del': 'del',
            'atis': 'atis'
        };
    }

    parse(input) {
        input = input.trim();
        if (!input) throw new Error('Please enter a stream source');

        if (input.includes('liveatc.net') && input.includes('mount=')) {
            const match = input.match(/mount=([^&\s]+)/i);
            if (match) return this.buildUrls(match[1].toLowerCase());
            throw new Error('Could not extract mount from URL');
        }

        if (/^https?:\/\//i.test(input)) {
            if (input.includes('liveatc.net')) {
                const pathMatch = input.match(/liveatc\.net\/([^?\s]+)/i);
                if (pathMatch) return this.buildUrls(pathMatch[1].toLowerCase());
            }
            return { urls: [input], mount: 'external', type: 'external' };
        }

        if (input.includes('_')) {
            return this.buildUrls(input.toLowerCase().replace(/[^a-z0-9_]/g, ''));
        }

        const words = input.toLowerCase().split(/\s+/).filter(w => w);
        
        if (words.length >= 2) {
            let icao = words[0].replace(/[^a-z0-9]/g, '');
            if (icao.length === 3) icao = 'k' + icao;
            const facility = this.facilities[words[1]];
            if (facility) return this.buildUrls(`${icao}_${facility}`);
        }

        let icao = words[0].replace(/[^a-z0-9]/g, '');
        if (icao.length === 3) icao = 'k' + icao;
        if (icao.length === 4) return this.buildVariations(icao);

        throw new Error('Invalid input format');
    }

    buildUrls(mount) {
        const urls = this.servers.map(s => `${s}/${mount}`);
        return { urls, mount, type: 'mount', info: mount };
    }

    buildVariations(icao) {
        const feeds = ['twr', 'gnd', 'app', 'del', 'atis'];
        const urls = [];
        feeds.forEach(f => urls.push(`${this.servers[0]}/${icao}_${f}`));
        this.servers.slice(1, 4).forEach(s => urls.push(`${s}/${icao}_twr`));
        return { urls, mount: icao, type: 'variations', info: `${icao.toUpperCase()}` };
    }
}

// ═══════════════════════════════════════════════════════════════
// BROADCASTIFY PARSER
// ═══════════════════════════════════════════════════════════════
class BroadcastifyParser {
    constructor() {
        this.servers = [
            'https://broadcastify.cdnstream1.com',
            'http://broadcastify.cdnstream1.com',
            'https://audio2.broadcastify.com',
            'https://audio3.broadcastify.com',
            'https://audio4.broadcastify.com'
        ];
    }

    parse(input) {
        input = input.trim();
        if (!input) throw new Error('Enter a feed ID or URL');

        if (input.includes('broadcastify.com')) {
            const match = input.match(/(\d{4,})/);
            if (match) return this.buildUrls(match[1]);
            throw new Error('No feed ID found');
        }

        if (/^https?:\/\//i.test(input)) {
            return { urls: [input], feedId: 'external', type: 'external' };
        }

        const feedId = input.replace(/\D/g, '');
        if (feedId.length < 4) throw new Error('Feed ID must be 4+ digits');
        return this.buildUrls(feedId);
    }

    buildUrls(feedId) {
        const urls = this.servers.map(s => `${s}/${feedId}`);
        return { urls, feedId, type: 'feed', info: feedId };
    }
}

// ═══════════════════════════════════════════════════════════════
// IFRAME CARD - Resizable Iframe Container
// ═══════════════════════════════════════════════════════════════
class IframeCard {
    constructor(config) {
        this.id = `iframe-${AppState.nextIframeId++}`;
        this.title = config.title;
        this.url = config.url;
        this.position = config.position || this.getDefaultPosition();
        this.size = config.size || { 
            width: CONFIG.iframe.defaultWidth, 
            height: CONFIG.iframe.defaultHeight 
        };
        
        this.element = null;
        this.iframe = null;
        this.overlay = null;

        this.render();
    }

    getDefaultPosition() {
        const pos = {
            x: CONFIG.layout.defaultX + AppState.layoutOffset.x + 200,
            y: CONFIG.layout.defaultY + AppState.layoutOffset.y
        };
        AppState.layoutOffset.x += CONFIG.layout.offsetIncrement;
        if (AppState.layoutOffset.x > 150) {
            AppState.layoutOffset.x = 0;
            AppState.layoutOffset.y += CONFIG.layout.offsetIncrement;
        }
        if (AppState.layoutOffset.y > 150) AppState.layoutOffset.y = 0;
        return pos;
    }

    normalizeUrl(url) {
        url = url.trim();
        if (!/^https?:\/\//i.test(url)) {
            url = 'https://' + url;
        }
        return url;
    }

    render() {
        const card = document.createElement('div');
        card.id = this.id;
        card.className = 'iframe-card';
        card.style.left = `${this.position.x}px`;
        card.style.top = `${this.position.y}px`;
        card.style.width = `${this.size.width}px`;
        card.style.height = `${this.size.height}px`;

        card.innerHTML = `
            <div class="iframe-header">
                <div class="iframe-drag">${ICONS.grip}</div>
                <span class="iframe-title" title="${this.title}">${this.title}</span>
                <div class="iframe-header-btns">
                    <button class="iframe-btn iframe-btn-link" title="Open in New Tab">${ICONS.externalLink}</button>
                    <button class="iframe-btn iframe-btn-ref" title="Refresh">${ICONS.refresh}</button>
                    <button class="iframe-btn iframe-btn-cls" title="Remove">${ICONS.x}</button>
                </div>
            </div>
            <div class="iframe-container">
                <iframe src="about:blank" 
                        frameborder="0" 
                        allowfullscreen
                        loading="lazy"
                        referrerpolicy="no-referrer"
                        tabindex="-1"
                        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation">
                </iframe>
                <div class="iframe-loading">
                    <span class="iframe-loading-text">Loading...</span>
                </div>
            </div>
            <div class="iframe-resize-handle"></div>
        `;

        this.element = card;
        this.iframe = card.querySelector('iframe');
        
        this.dom = {
            title: card.querySelector('.iframe-title'),
            container: card.querySelector('.iframe-container'),
            loading: card.querySelector('.iframe-loading'),
            resizeHandle: card.querySelector('.iframe-resize-handle')
        };

        this.setupEvents();
        this.setupDrag();
        this.setupResize();

        const target = AppState.canvasInner || AppState.canvas;
        target.appendChild(card);
        AppState.deployedIframes.push(this);
        
        // Load iframe with scroll lock to prevent auto-scroll
        this.loadIframeSafe(this.normalizeUrl(this.url));
        
        WorkspaceManager.updateSize();
    }

    // Safe iframe loading that prevents scroll
    loadIframeSafe(url) {
        ScrollLock.save();
        ScrollLock.blockScrollTemporarily(500);
        
        this.iframe.src = url;
        
        // Restore scroll after a delay
        setTimeout(() => {
            ScrollLock.restore();
        }, 100);
    }

    setupEvents() {
        this.element.querySelector('.iframe-btn-link').onclick = () => {
            window.open(this.normalizeUrl(this.url), '_blank');
        };
        
        this.element.querySelector('.iframe-btn-ref').onclick = () => this.refresh();
        this.element.querySelector('.iframe-btn-cls').onclick = () => this.showConfirm();

        this.iframe.onload = () => {
            this.dom.loading.style.display = 'none';
            // Prevent any post-load scroll
            ScrollLock.blockScrollTemporarily(100);
        };

        this.iframe.onerror = () => {
            this.dom.loading.innerHTML = '<span class="iframe-loading-text" style="color: var(--status-error);">Failed to load</span>';
        };
        
        // Prevent iframe from stealing focus and causing scroll
        this.iframe.onfocus = (e) => {
            ScrollLock.blockScrollTemporarily(50);
        };
    }

    refresh() {
        this.dom.loading.style.display = 'flex';
        this.dom.loading.innerHTML = '<span class="iframe-loading-text">Loading...</span>';
        const url = this.normalizeUrl(this.url);
        
        // Use scroll-safe loading
        this.loadIframeSafe(url + (url.includes('?') ? '&' : '?') + '_t=' + Date.now());
    }

    showConfirm() {
        if (this.overlay) return;

        this.overlay = document.createElement('div');
        this.overlay.className = 'iframe-overlay';
        this.overlay.innerHTML = `
            <div class="overlay-icon">${ICONS.alert}</div>
            <p class="overlay-text">Remove?</p>
            <div class="overlay-btns">
                <button class="overlay-btn overlay-btn-yes">${ICONS.check}</button>
                <button class="overlay-btn overlay-btn-no">${ICONS.x}</button>
            </div>
        `;
        
        this.overlay.querySelector('.overlay-btn-yes').onclick = () => this.remove();
        this.overlay.querySelector('.overlay-btn-no').onclick = () => this.hideConfirm();
        this.overlay.onclick = (e) => { if (e.target === this.overlay) this.hideConfirm(); };
        
        this.element.appendChild(this.overlay);
    }

    hideConfirm() {
        if (this.overlay) {
            this.overlay.remove();
            this.overlay = null;
        }
    }

    remove() {
        this.iframe.src = 'about:blank';
        this.element.remove();
        const i = AppState.deployedIframes.indexOf(this);
        if (i > -1) AppState.deployedIframes.splice(i, 1);
        WorkspaceManager.updateSize();
    }

    setupDrag() {
        const handle = this.element.querySelector('.iframe-drag');
        let dragging = false, startX, startY, origX, origY;

        handle.onmousedown = (e) => {
            e.preventDefault();
            dragging = true;
            startX = e.clientX; 
            startY = e.clientY;
            origX = this.element.offsetLeft; 
            origY = this.element.offsetTop;
            this.element.classList.add('dragging');
            this.dom.container.style.pointerEvents = 'none';

            const move = (ev) => {
                if (!dragging) return;
                
                // Constrain X within viewport, unlimited Y
                const maxX = AppState.canvas.clientWidth - this.size.width;
                const x = Math.max(0, Math.min(maxX, origX + ev.clientX - startX));
                const y = Math.max(0, origY + ev.clientY - startY);
                
                this.element.style.left = `${x}px`;
                this.element.style.top = `${y}px`;
                this.position = { x, y };
                WorkspaceManager.updateSize();
            };

            const up = () => {
                dragging = false;
                this.element.classList.remove('dragging');
                this.dom.container.style.pointerEvents = '';
                WorkspaceManager.updateSize();
                document.removeEventListener('mousemove', move);
                document.removeEventListener('mouseup', up);
            };

            document.addEventListener('mousemove', move);
            document.addEventListener('mouseup', up);
        };
    }

    setupResize() {
        const handle = this.dom.resizeHandle;
        let resizing = false, startX, startY, origWidth, origHeight;
        let sizeIndicator = null;

        const createSizeIndicator = () => {
            sizeIndicator = document.createElement('div');
            sizeIndicator.className = 'iframe-size-indicator';
            this.element.appendChild(sizeIndicator);
        };

        const updateSizeIndicator = (width, height) => {
            if (sizeIndicator) {
                sizeIndicator.textContent = `${Math.round(width)} × ${Math.round(height)}`;
            }
        };

        const removeSizeIndicator = () => {
            if (sizeIndicator) {
                sizeIndicator.remove();
                sizeIndicator = null;
            }
        };

        handle.onmousedown = (e) => {
            e.preventDefault();
            e.stopPropagation();
            resizing = true;
            startX = e.clientX;
            startY = e.clientY;
            origWidth = this.element.offsetWidth;
            origHeight = this.element.offsetHeight;
            this.element.classList.add('resizing');
            this.dom.container.style.pointerEvents = 'none';
            
            createSizeIndicator();
            updateSizeIndicator(origWidth, origHeight);

            const move = (ev) => {
                if (!resizing) return;
                
                const deltaX = ev.clientX - startX;
                const deltaY = ev.clientY - startY;
                
                // Constrain width to viewport, unlimited height
                const maxWidth = AppState.canvas.clientWidth - this.element.offsetLeft - 10;
                const newWidth = Math.max(CONFIG.iframe.minWidth, Math.min(maxWidth, origWidth + deltaX));
                const newHeight = Math.max(CONFIG.iframe.minHeight, origHeight + deltaY);
                
                this.element.style.width = `${newWidth}px`;
                this.element.style.height = `${newHeight}px`;
                this.size = { width: newWidth, height: newHeight };
                
                updateSizeIndicator(newWidth, newHeight);
                WorkspaceManager.updateSize();
            };

            const up = () => {
                resizing = false;
                this.element.classList.remove('resizing');
                this.dom.container.style.pointerEvents = '';
                removeSizeIndicator();
                WorkspaceManager.updateSize();
                document.removeEventListener('mousemove', move);
                document.removeEventListener('mouseup', up);
            };

            document.addEventListener('mousemove', move);
            document.addEventListener('mouseup', up);
        };
    }

    toJSON() {
        return { 
            type: 'iframe',
            title: this.title, 
            url: this.url, 
            x: this.position.x, 
            y: this.position.y,
            width: this.size.width,
            height: this.size.height
        };
    }
}

// ═══════════════════════════════════════════════════════════════
// COMPACT AUDIO PLAYER (Title at Bottom)
// ═══════════════════════════════════════════════════════════════
class PlayerCard {
    constructor(config) {
        this.id = `player-${AppState.nextPlayerId++}`;
        this.title = config.title;
        this.type = config.type;
        this.position = config.position || this.getDefaultPosition();
        this.rawInput = config.rawInput;
        this.parseResult = config.parseResult;
        
        this.urls = [...config.parseResult.urls];
        this.urlIndex = 0;
        this.failedUrls = new Set();
        
        this.element = null;
        this.audio = null;
        this.overlay = null;
        this.isPlaying = false;
        this.isIntentionallyStopped = false;
        this.volume = 0.7;
        this.isMuted = false;
        this.previousVolume = 0.7;

        this.render();
    }

    getDefaultPosition() {
        const pos = {
            x: CONFIG.layout.defaultX + AppState.layoutOffset.x,
            y: CONFIG.layout.defaultY + AppState.layoutOffset.y
        };
        AppState.layoutOffset.x += CONFIG.layout.offsetIncrement;
        if (AppState.layoutOffset.x > 150) {
            AppState.layoutOffset.x = 0;
            AppState.layoutOffset.y += CONFIG.layout.offsetIncrement;
        }
        if (AppState.layoutOffset.y > 150) AppState.layoutOffset.y = 0;
        return pos;
    }

    render() {
        const card = document.createElement('div');
        card.id = this.id;
        card.className = 'player-card';
        card.style.left = `${this.position.x}px`;
        card.style.top = `${this.position.y}px`;

        card.innerHTML = `
            <div class="player-header">
                <div class="player-drag">${ICONS.grip}</div>
                <span class="player-server-num">${this.urlIndex + 1}/${this.urls.length}</span>
                <div class="player-header-btns">
                    <button class="player-btn player-btn-srv" title="Next Server">${ICONS.server}</button>
                    <button class="player-btn player-btn-ref" title="Refresh">${ICONS.refresh}</button>
                    <button class="player-btn player-btn-cls" title="Remove">${ICONS.x}</button>
                </div>
            </div>

            <div class="player-controls">
                <button class="player-play-btn">${ICONS.play}</button>
                <div class="player-status">
                    <span class="player-status-dot status-standby"></span>
                    <span class="player-status-text status-standby">STANDBY</span>
                </div>
                <div class="player-volume-wrap">
                    <button class="player-volume-btn">${ICONS.volumeHigh}</button>
                    <div class="player-volume-slider">
                        <div class="player-volume-track">
                            <div class="player-volume-bar"></div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="player-title-bar">
                <span class="player-title" title="${this.title}">${this.title}</span>
            </div>

            <audio preload="${CONFIG.audio.preload}" tabindex="-1"></audio>
        `;

        this.element = card;
        this.audio = card.querySelector('audio');
        
        // Prevent audio element from receiving focus
        this.audio.setAttribute('tabindex', '-1');
        
        this.dom = {
            statusDot: card.querySelector('.player-status-dot'),
            statusText: card.querySelector('.player-status-text'),
            serverNum: card.querySelector('.player-server-num'),
            playBtn: card.querySelector('.player-play-btn'),
            volumeWrap: card.querySelector('.player-volume-wrap'),
            volumeBtn: card.querySelector('.player-volume-btn'),
            volumeSlider: card.querySelector('.player-volume-slider'),
            volumeTrack: card.querySelector('.player-volume-track'),
            volumeBar: card.querySelector('.player-volume-bar')
        };

        this.dom.serverNum.textContent = `${this.urlIndex + 1}/${this.urls.length}`;
        this.setupEvents();
        this.setupAudioControls();
        this.setupDrag();

        const target = AppState.canvasInner || AppState.canvas;
        target.appendChild(card);
        AppState.deployedPlayers.push(this);
        
        WorkspaceManager.updateSize();
    }

    generateFreshUrl(baseUrl) {
        const cleanUrl = baseUrl.split('?')[0];
        const cacheBuster = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        return `${cleanUrl}?nocache=${cacheBuster}`;
    }

    setSource(url) {
        const freshUrl = this.generateFreshUrl(url);
        ScrollLock.save();
        this.audio.src = freshUrl;
        ScrollLock.restore();
        this.dom.serverNum.textContent = `${this.urlIndex + 1}/${this.urls.length}`;
    }

    setStatus(status, text) {
        const states = {
            standby: 'standby',
            connecting: 'connecting',
            buffering: 'buffering',
            playing: 'playing',
            paused: 'paused',
            error: 'error',
            offline: 'offline'
        };
        
        const stateTexts = {
            standby: 'STANDBY',
            connecting: 'CONNECTING',
            buffering: 'BUFFERING',
            playing: 'LIVE',
            paused: 'PAUSED',
            error: 'ERROR',
            offline: 'OFFLINE'
        };
        
        const cls = states[status] || 'standby';
        this.dom.statusDot.className = `player-status-dot status-${cls}`;
        this.dom.statusText.className = `player-status-text status-${cls}`;
        this.dom.statusText.textContent = text || stateTexts[status] || 'STANDBY';
    }

    setupEvents() {
        this.element.querySelector('.player-btn-srv').onclick = () => this.nextServer();
        this.element.querySelector('.player-btn-ref').onclick = () => this.refresh();
        this.element.querySelector('.player-btn-cls').onclick = () => this.showConfirm();
    }

    setupAudioControls() {
        this.audio.onloadstart = () => {
            if (this.audio.src && !this.isIntentionallyStopped) {
                this.setStatus('connecting');
            }
        };

        this.audio.oncanplay = () => {
            if (!this.isPlaying && this.audio.src && !this.isIntentionallyStopped) {
                this.setStatus('standby', 'READY');
            }
        };

        this.audio.onplaying = () => {
            this.isPlaying = true;
            this.isIntentionallyStopped = false;
            this.setStatus('playing');
            this.dom.playBtn.innerHTML = ICONS.pause;
            this.dom.playBtn.classList.add('playing');
            
            // Prevent scroll when audio starts playing
            ScrollLock.blockScrollTemporarily(100);
        };

        this.audio.onpause = () => {
            if (!this.isIntentionallyStopped && this.audio.src && !this.audio.ended) {
                this.isPlaying = false;
                this.setStatus('paused');
                this.dom.playBtn.innerHTML = ICONS.play;
                this.dom.playBtn.classList.remove('playing');
            }
        };

        this.audio.onwaiting = () => {
            if (this.audio.src && !this.isIntentionallyStopped) {
                this.setStatus('buffering');
            }
        };

        this.audio.onerror = () => this.onError();
        
        // Prevent audio focus from causing scroll
        this.audio.onfocus = (e) => {
            e.preventDefault();
            ScrollLock.blockScrollTemporarily(50);
        };

        this.dom.playBtn.onclick = () => this.togglePlay();
        this.dom.volumeBtn.onclick = () => this.toggleMute();
        this.setupVolumeSlider();
        this.audio.volume = this.volume;
    }

    togglePlay() {
        // Save scroll position before any audio operations
        ScrollLock.save();
        ScrollLock.blockScrollTemporarily(300);
        
        if (this.isPlaying) {
            this.isIntentionallyStopped = true;
            
            this.audio.pause();
            this.audio.removeAttribute('src');
            this.audio.load();
            
            this.isPlaying = false;
            this.setStatus('standby', 'STOPPED');
            this.dom.playBtn.innerHTML = ICONS.play;
            this.dom.playBtn.classList.remove('playing');
            
            ScrollLock.restore();
            
        } else {
            this.isIntentionallyStopped = false;
            this.setStatus('connecting', 'CONNECTING');
            
            const baseUrl = this.urls[this.urlIndex];
            const freshUrl = this.generateFreshUrl(baseUrl);
            
            this.audio.src = freshUrl;
            this.audio.load();
            
            this.audio.play()
                .then(() => {
                    // Restore scroll after successful play
                    requestAnimationFrame(() => {
                        ScrollLock.restore();
                    });
                })
                .catch(err => {
                    console.error("Playback failed:", err);
                    this.isPlaying = false;
                    this.isIntentionallyStopped = false;
                    this.setStatus('error', 'PLAY ERROR');
                    this.dom.playBtn.innerHTML = ICONS.play;
                    this.dom.playBtn.classList.remove('playing');
                    ScrollLock.restore();
                });
        }
    }

    setupVolumeSlider() {
        let isDragging = false;

        const updateVolume = (e) => {
            const rect = this.dom.volumeTrack.getBoundingClientRect();
            let percent = (e.clientX - rect.left) / rect.width;
            percent = Math.max(0, Math.min(1, percent));
            
            this.volume = percent;
            this.audio.volume = percent;
            this.isMuted = percent === 0;
            
            this.dom.volumeBar.style.width = `${percent * 100}%`;
            this.updateVolumeIcon();
        };

        this.dom.volumeTrack.onmousedown = (e) => {
            isDragging = true;
            updateVolume(e);
        };

        document.addEventListener('mousemove', (e) => {
            if (isDragging) updateVolume(e);
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
        });
    }

    toggleMute() {
        if (this.isMuted) {
            this.isMuted = false;
            this.volume = this.previousVolume || 0.7;
        } else {
            this.previousVolume = this.volume;
            this.isMuted = true;
            this.volume = 0;
        }
        
        this.audio.volume = this.volume;
        this.dom.volumeBar.style.width = `${this.volume * 100}%`;
        this.updateVolumeIcon();
    }

    updateVolumeIcon() {
        if (this.isMuted || this.volume === 0) {
            this.dom.volumeBtn.innerHTML = ICONS.volumeMute;
            this.dom.volumeBtn.classList.add('muted');
            this.dom.volumeBar.classList.add('muted');
        } else {
            this.dom.volumeBtn.innerHTML = this.volume < 0.5 ? ICONS.volumeLow : ICONS.volumeHigh;
            this.dom.volumeBtn.classList.remove('muted');
            this.dom.volumeBar.classList.remove('muted');
        }
    }

    onError() {
        const currentSrc = this.audio.src;
        
        if (!currentSrc || 
            currentSrc === '' || 
            currentSrc === window.location.href ||
            this.isIntentionallyStopped) {
            return;
        }

        const code = this.audio.error?.code;
        const msgs = { 1: 'ABORTED', 2: 'NETWORK', 3: 'DECODE', 4: 'NOT FOUND' };
        this.setStatus('error', msgs[code] || 'ERROR');
        this.failedUrls.add(this.urls[this.urlIndex]);
        this.dom.playBtn.innerHTML = ICONS.play;
        this.dom.playBtn.classList.remove('playing');
        this.isPlaying = false;

        if (this.urlIndex < this.urls.length - 1) {
            setTimeout(() => this.nextServer(), 600);
        } else {
            this.setStatus('offline', 'NO FEEDS');
        }
    }

    nextServer() {
        if (this.urls.length <= 1) return;

        const wasPlaying = this.isPlaying;
        
        // Save scroll position
        ScrollLock.save();
        ScrollLock.blockScrollTemporarily(300);
        
        this.isIntentionallyStopped = true;
        this.audio.pause();
        this.audio.removeAttribute('src');
        this.audio.load();
        
        this.urlIndex = (this.urlIndex + 1) % this.urls.length;
        this.dom.serverNum.textContent = `${this.urlIndex + 1}/${this.urls.length}`;
        
        this.setStatus('connecting', `SRV ${this.urlIndex + 1}`);
        
        setTimeout(() => {
            this.isIntentionallyStopped = false;
            const freshUrl = this.generateFreshUrl(this.urls[this.urlIndex]);
            this.audio.src = freshUrl;
            this.audio.load();
            
            if (wasPlaying) {
                this.audio.play()
                    .then(() => ScrollLock.restore())
                    .catch(() => ScrollLock.restore());
            } else {
                ScrollLock.restore();
            }
        }, 100);
    }

    refresh() {
        const wasPlaying = this.isPlaying;
        
        // Save scroll position
        ScrollLock.save();
        ScrollLock.blockScrollTemporarily(300);
        
        this.isIntentionallyStopped = true;
        this.audio.pause();
        this.audio.removeAttribute('src');
        this.audio.load();
        
        this.urlIndex = 0;
        this.failedUrls.clear();
        this.setStatus('connecting', 'REFRESH');

        try {
            const parser = this.type === 'atc' ? new LiveATCParser() : new BroadcastifyParser();
            const result = parser.parse(this.rawInput);
            this.urls = [...result.urls];
            this.dom.serverNum.textContent = `${this.urlIndex + 1}/${this.urls.length}`;
            
            setTimeout(() => {
                this.isIntentionallyStopped = false;
                const freshUrl = this.generateFreshUrl(this.urls[0]);
                this.audio.src = freshUrl;
                this.audio.load();
                
                if (wasPlaying) {
                    this.audio.play()
                        .then(() => ScrollLock.restore())
                        .catch(() => ScrollLock.restore());
                } else {
                    this.setStatus('standby', 'READY');
                    ScrollLock.restore();
                }
            }, 100);
        } catch (e) {
            this.setStatus('error', 'FAILED');
            ScrollLock.restore();
        }
    }

    showConfirm() {
        if (this.overlay) return;

        this.overlay = document.createElement('div');
        this.overlay.className = 'player-overlay';
        this.overlay.innerHTML = `
            <div class="overlay-icon">${ICONS.alert}</div>
            <p class="overlay-text">Remove?</p>
            <div class="overlay-btns">
                <button class="overlay-btn overlay-btn-yes">${ICONS.check}</button>
                <button class="overlay-btn overlay-btn-no">${ICONS.x}</button>
            </div>
        `;
        
        this.overlay.querySelector('.overlay-btn-yes').onclick = () => this.remove();
        this.overlay.querySelector('.overlay-btn-no').onclick = () => this.hideConfirm();
        this.overlay.onclick = (e) => { if (e.target === this.overlay) this.hideConfirm(); };
        
        this.element.appendChild(this.overlay);
    }

    hideConfirm() {
        if (this.overlay) {
            this.overlay.remove();
            this.overlay = null;
        }
    }

    remove() {
        this.isIntentionallyStopped = true;
        this.audio.pause();
        this.audio.removeAttribute('src');
        this.audio.load();
        this.element.remove();
        const i = AppState.deployedPlayers.indexOf(this);
        if (i > -1) AppState.deployedPlayers.splice(i, 1);
        WorkspaceManager.updateSize();
    }

    setupDrag() {
        const handle = this.element.querySelector('.player-drag');
        let dragging = false, startX, startY, origX, origY;

        handle.onmousedown = (e) => {
            e.preventDefault();
            dragging = true;
            startX = e.clientX; 
            startY = e.clientY;
            origX = this.element.offsetLeft; 
            origY = this.element.offsetTop;
            this.element.classList.add('dragging');

            const move = (ev) => {
                if (!dragging) return;
                
                // Constrain X within viewport, unlimited Y
                const maxX = AppState.canvas.clientWidth - CONFIG.playerWidth;
                const x = Math.max(0, Math.min(maxX, origX + ev.clientX - startX));
                const y = Math.max(0, origY + ev.clientY - startY);
                
                this.element.style.left = `${x}px`;
                this.element.style.top = `${y}px`;
                this.position = { x, y };
                WorkspaceManager.updateSize();
            };

            const up = () => {
                dragging = false;
                this.element.classList.remove('dragging');
                WorkspaceManager.updateSize();
                document.removeEventListener('mousemove', move);
                document.removeEventListener('mouseup', up);
            };

            document.addEventListener('mousemove', move);
            document.addEventListener('mouseup', up);
        };
    }

    toJSON() {
        return { 
            type: this.type, 
            title: this.title, 
            rawInput: this.rawInput, 
            x: this.position.x, 
            y: this.position.y 
        };
    }
}

// ═══════════════════════════════════════════════════════════════
// DEPLOYMENT MANAGER
// ═══════════════════════════════════════════════════════════════
const DeploymentManager = {
    deploy(type, title, input) {
        if (!title || !title.trim() || !input || !input.trim()) {
            alert('Please fill in both fields');
            return false;
        }
        try {
            const parser = type === 'atc' ? new LiveATCParser() : new BroadcastifyParser();
            const result = parser.parse(input.trim());
            if (!result.urls || !result.urls.length) throw new Error('No URLs generated');
            new PlayerCard({ title: title.trim(), type, rawInput: input.trim(), parseResult: result });
            
            const fields = ['atcTitle', 'atcID', 'bcastTitle', 'bcastID'];
            fields.forEach(id => {
                const el = document.getElementById(id);
                if (el) el.value = '';
            });
            return true;
        } catch (e) {
            alert('Error: ' + e.message);
            return false;
        }
    },

    deployIframe(title, url) {
        if (!title || !title.trim() || !url || !url.trim()) {
            alert('Please fill in both fields');
            return false;
        }
        try {
            new IframeCard({ title: title.trim(), url: url.trim() });
            
            const titleEl = document.getElementById('iframeTitle');
            const urlEl = document.getElementById('iframeURL');
            if (titleEl) titleEl.value = '';
            if (urlEl) urlEl.value = '';
            return true;
        } catch (e) {
            alert('Error: ' + e.message);
            return false;
        }
    }
};

// ═══════════════════════════════════════════════════════════════
// LAYOUT MANAGER
// ═══════════════════════════════════════════════════════════════
const LayoutManager = {
    export() {
        const players = AppState.deployedPlayers.map(p => p.toJSON());
        const iframes = AppState.deployedIframes.map(i => i.toJSON());
        const data = [...players, ...iframes];
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `layout-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(a.href);
        return true;
    },
    
    import(file) {
        if (!file) return false;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (!Array.isArray(data)) throw new Error('Invalid layout file');
                this.clearAll();
                data.forEach(item => {
                    if (item.type === 'iframe') {
                        new IframeCard({ 
                            title: item.title,
                            url: item.url,
                            position: { x: item.x, y: item.y },
                            size: { width: item.width || CONFIG.iframe.defaultWidth, height: item.height || CONFIG.iframe.defaultHeight }
                        });
                    } else {
                        const parser = item.type === 'atc' ? new LiveATCParser() : new BroadcastifyParser();
                        new PlayerCard({ 
                            title: item.title,
                            type: item.type,
                            rawInput: item.rawInput,
                            parseResult: parser.parse(item.rawInput), 
                            position: { x: item.x, y: item.y } 
                        });
                    }
                });
                SidebarController.close();
            } catch (e) { 
                alert('Error: ' + e.message); 
            }
        };
        reader.readAsText(file);
        return true;
    },
    
    clearAll() {
        const players = [...AppState.deployedPlayers];
        players.forEach(p => p.remove());
        const iframes = [...AppState.deployedIframes];
        iframes.forEach(i => i.remove());
        AppState.layoutOffset = { x: 0, y: 0 };
        WorkspaceManager.updateSize();
    }
};

// ═══════════════════════════════════════════════════════════════
// SIDEBAR CONTROLLER
// ═══════════════════════════════════════════════════════════════
const SidebarController = {
    sidebar: null,
    menuToggle: null,
    closeBtn: null,
    overlay: null,
    isOpen: false,
    
    init() {
        this.sidebar = document.getElementById('sidebar');
        this.menuToggle = document.getElementById('menu-toggle');
        this.closeBtn = document.getElementById('sidebar-close');
        this.overlay = document.getElementById('sidebar-overlay');
        
        if (!this.sidebar || !this.menuToggle) {
            console.warn('Sidebar elements not found');
            return;
        }
        
        this.bindEvents();
    },
    
    bindEvents() {
        this.menuToggle.onclick = (e) => {
            e.stopPropagation();
            this.open();
        };
        
        if (this.closeBtn) {
            this.closeBtn.onclick = (e) => {
                e.stopPropagation();
                this.close();
            };
        }
        
        if (this.overlay) {
            this.overlay.onclick = () => this.close();
        }

        document.onkeydown = (e) => { 
            if (e.key === 'Escape' && this.isOpen) { 
                this.close();
            } 
        };
    },
    
    open() {
        this.isOpen = true;
        this.sidebar.classList.add('open');
        this.menuToggle.classList.add('hidden');
        if (this.overlay) this.overlay.classList.add('active');
    },
    
    close() {
        this.isOpen = false;
        this.sidebar.classList.remove('open');
        this.menuToggle.classList.remove('hidden');
        if (this.overlay) this.overlay.classList.remove('active');
    }
};

// ═══════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════
function init() {
    // Inject anti-scroll CSS first
    injectAntiScrollCSS();
    
    AppState.sidebar = document.getElementById('sidebar');
    AppState.canvas = document.getElementById('canvas');
    AppState.importFile = document.getElementById('importFile');

    WorkspaceManager.init();
    SidebarController.init();

    const deployATC = document.getElementById('deployATC');
    if (deployATC) {
        deployATC.onclick = () => {
            const title = document.getElementById('atcTitle');
            const id = document.getElementById('atcID');
            const success = DeploymentManager.deploy('atc', title ? title.value : '', id ? id.value : '');
            if (success) SidebarController.close();
        };
    }
    
    const deployBcast = document.getElementById('deployBcast');
    if (deployBcast) {
        deployBcast.onclick = () => {
            const title = document.getElementById('bcastTitle');
            const id = document.getElementById('bcastID');
            const success = DeploymentManager.deploy('bcast', title ? title.value : '', id ? id.value : '');
            if (success) SidebarController.close();
        };
    }

    const deployIframe = document.getElementById('deployIframe');
    if (deployIframe) {
        deployIframe.onclick = () => {
            const title = document.getElementById('iframeTitle');
            const url = document.getElementById('iframeURL');
            const success = DeploymentManager.deployIframe(title ? title.value : '', url ? url.value : '');
            if (success) SidebarController.close();
        };
    }

    const atcTitle = document.getElementById('atcTitle');
    const atcID = document.getElementById('atcID');
    if (atcTitle) {
        atcTitle.onkeypress = (e) => { 
            if (e.key === 'Enter' && deployATC) deployATC.click(); 
        };
    }
    if (atcID) {
        atcID.onkeypress = (e) => { 
            if (e.key === 'Enter' && deployATC) deployATC.click(); 
        };
    }
    
    const bcastTitle = document.getElementById('bcastTitle');
    const bcastID = document.getElementById('bcastID');
    if (bcastTitle) {
        bcastTitle.onkeypress = (e) => { 
            if (e.key === 'Enter' && deployBcast) deployBcast.click(); 
        };
    }
    if (bcastID) {
        bcastID.onkeypress = (e) => { 
            if (e.key === 'Enter' && deployBcast) deployBcast.click(); 
        };
    }

    const iframeTitle = document.getElementById('iframeTitle');
    const iframeURL = document.getElementById('iframeURL');
    if (iframeTitle) {
        iframeTitle.onkeypress = (e) => { 
            if (e.key === 'Enter' && deployIframe) deployIframe.click(); 
        };
    }
    if (iframeURL) {
        iframeURL.onkeypress = (e) => { 
            if (e.key === 'Enter' && deployIframe) deployIframe.click(); 
        };
    }

    if (AppState.importFile) {
        AppState.importFile.onchange = (e) => { 
            if (e.target.files && e.target.files[0]) {
                LayoutManager.import(e.target.files[0]); 
            }
            e.target.value = ''; 
        };
    }

    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.onclick = () => {
            LayoutManager.export();
            SidebarController.close();
        };
    }

    const importBtn = document.getElementById('importBtn');
    if (importBtn) {
        importBtn.onclick = () => {
            document.getElementById('importFile').click();
        };
    }

    const clearBtn = document.getElementById('clearBtn');
    if (clearBtn) {
        clearBtn.onclick = () => {
            if (confirm('Remove all feeds and iframes?')) {
                LayoutManager.clearAll();
                SidebarController.close();
            }
        };
    }

    window.exportLayout = () => {
        LayoutManager.export();
        SidebarController.close();
    };
    window.clearAllFeeds = () => { 
        if (confirm('Remove all feeds and iframes?')) {
            LayoutManager.clearAll();
            SidebarController.close();
        }
    };

    console.log('%c✈️ TACTICAL COMMAND CONSOLE', 'font-size:14px;font-weight:bold;color:#b30000');
    console.log('%cScroll Lock Enabled - No Auto-Scroll', 'color:#00aa00');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

})();