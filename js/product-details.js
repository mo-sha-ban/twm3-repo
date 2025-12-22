(function() {
    'use strict';

    let currentProduct = null;
    let currentImageIndex = 0;
    let productMedia = []; // {type, url, thumb}
    let quantity = 1;

    // Simplified DOM elements object
    const elements = {};

    function cacheDOMElements() {
        const ids = [
            'loading-state', 'error-state', 'product-content', 'main-image',
            'main-image-wrapper', 'main-media-content',
            'product-gallery',
            'thumbnail-gallery', 'product-title', 'product-category', 'product-category-breadcrumb', 'product-badge', 'product-availability', 'product-share', 'product-rating',
                'product-price', 'product-description', 'decrease-qty', 'increase-qty', 'product-share-image',
                'slide-prev', 'slide-next', 'thumb-prev', 'thumb-next', 'toggle-fullscreen',
            'quantity', 'add-to-cart-btn', 'add-to-cart-btn-mobile', 'buy-now-btn', 'buy-now-btn-mobile', 'product-old-price', 'full-description',
            'reviews-list', 'comments-list', 'product-additional-info', 'product-video-container'
        ];

        const toCamel = (str) => str.replace(/-([a-z])/g, (_, c) => c.toUpperCase());

        ids.forEach(id => {
            const el = document.getElementById(id);
            elements[id] = el;
            elements[toCamel(id)] = el;
        });

        // Elements that might not exist on all versions; cascade safely
        elements.starsContainer = (elements.productRating || elements['product-rating']) ? (elements.productRating || elements['product-rating']).querySelector('.stars') : null;
        elements.ratingText = (elements.productRating || elements['product-rating']) ? (elements.productRating || elements['product-rating']).querySelector('.rating-text') : null;
        elements.currentPrice = (elements.productPrice || elements['product-price']) ? (elements.productPrice || elements['product-price']).querySelector('.current-price') : null;
    }


    function init() {
        console.log('Initializing product details page (v2)...');
        cacheDOMElements();

        const productId = getQueryParam('id');
        if (!productId) {
            showError('معرف المنتج غير موجود في الرابط');
            return;
        }

        loadProduct(productId);
        setupEventListeners();
    }

    function getQueryParam(param) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(param);
    }

    async function loadProduct(productId) {
        showLoading(true);
        try {
            // Try API endpoint first (supports Mongo _id or string IDs)
            let res = await fetch(`/api/products/${productId}`);
            if (res.ok) {
                currentProduct = await res.json();
                console.log('Product loaded from API:', currentProduct);
                displayProduct();
                return;
            }

            // Fallback: load from local products.json
            const localRes = await fetch('/products.json');
            if (!localRes.ok) throw new Error('فشل في تحميل بيانات المنتج');
            const products = await localRes.json();
            currentProduct = products.find(p => p.id == productId || p._id == productId);
            if (!currentProduct) throw new Error('لم يتم العثور على المنتج');

            console.log('Product loaded from local JSON:', currentProduct);
            displayProduct();

        } catch (error) {
            console.error('Error loading product:', error);
            showError(error.message);
        } finally {
            showLoading(false);
        }
    }

    /**
     * Extract video and image media from the long_description HTML content
     * This allows media embedded in Quill editor to appear in the thumbnail gallery
     */
    function extractMediaFromDescription(htmlContent) {
        if (!htmlContent) return [];
        
        const media = [];
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;
        
        // Extract video tags
        tempDiv.querySelectorAll('video').forEach(video => {
            let videoSrc = video.getAttribute('src');
            if (!videoSrc) {
                const sourceTag = video.querySelector('source');
                if (sourceTag) videoSrc = sourceTag.getAttribute('src');
            }
            if (videoSrc) {
                media.push({ type: 'video', url: videoSrc, isFromDescription: true });
                console.log('📽️ Extracted video from description:', videoSrc);
            }
        });
        
        // Extract YouTube iframes
        tempDiv.querySelectorAll('iframe').forEach(iframe => {
            const src = iframe.getAttribute('src') || '';
            if (src.includes('youtube.com') || src.includes('youtu.be')) {
                media.push({ type: 'youtube', url: src, isFromDescription: true });
                console.log('🎬 Extracted YouTube from description:', src);
            }
        });
        
        // Extract images
        tempDiv.querySelectorAll('img').forEach(img => {
            const src = img.getAttribute('src');
            if (src && !src.includes('data:image/svg') && !src.includes('/icon')) {
                media.push({ type: 'image', url: src, isFromDescription: true });
                console.log('🖼️ Extracted image from description:', src);
            }
        });
        
        return media;
    }

    function displayProduct() {
        if (!currentProduct) return;


        // Build productMedia array (images, videos, youtube) in display order
        productMedia = [];
        const seen = new Set();
        const addMedia = (m) => {
            if (!m || !m.url) return;
            const key = m.url;
            if (seen.has(key)) return;
            seen.add(key);
            productMedia.push(m);
        };

        // legacy: main image
        if (currentProduct.image) addMedia({ type: 'image', url: currentProduct.image });

        // images object (img1..img6) in order
        if (currentProduct.images) {
            Object.values(currentProduct.images).forEach(url => addMedia({ type: 'image', url }));
        }

        // video legacy
        if (currentProduct.video) {
            const url = currentProduct.video;
            let type = 'video';
            if (url.includes('youtube.com') || url.includes('youtu.be')) type = 'youtube';
            addMedia({ type, url });
        }

        // media array (new format)
        if (Array.isArray(currentProduct.media)) {
            currentProduct.media.forEach(item => {
                // Determine type based on stored type or URL pattern
                let type = item.type || 'file';
                const url = item.url || '';
                
                // If type is 'video' but URL is YouTube, correct it
                if (type === 'video' && (url.includes('youtube.com') || url.includes('youtu.be'))) {
                    type = 'youtube';
                }
                // If type isn't recognized, infer from URL
                if (!['image', 'video', 'youtube', 'link'].includes(type)) {
                    if (url.includes('youtube.com') || url.includes('youtu.be')) type = 'youtube';
                    else if (url.match(/\.(mp4|webm|ogg|mov|avi)$/i)) type = 'video';
                    else if (url.match(/\.(jpg|jpeg|png|gif|webp|avif)$/i)) type = 'image';
                    else type = 'link';
                }
                
                addMedia({ type, url });
            });
        }

        // Extract media from long_description (Quill editor content)
        if (currentProduct.long_description) {
            const descriptionMedia = extractMediaFromDescription(currentProduct.long_description);
            descriptionMedia.forEach(m => addMedia(m));
        }

        document.title = `${currentProduct.name} - تفاصيل المنتج`;
        if (elements.productTitle) elements.productTitle.textContent = currentProduct.name;
        if (elements.productCategory) elements.productCategory.textContent = getCategoryName(currentProduct.category);
        if (elements.productCategoryBreadcrumb) elements.productCategoryBreadcrumb.textContent = getCategoryName(currentProduct.category);
        if (elements.productBadge) elements.productBadge.textContent = currentProduct.badge || '';
        if (elements.productAvailability) elements.productAvailability.textContent = currentProduct.available ? 'متوفر' : 'غير متوفر';
        if (elements.currentPrice) elements.currentPrice.textContent = `${currentProduct.price || 0} ج.م`;
        if (elements.productDescription) elements.productDescription.textContent = currentProduct.description || '';
        if (elements.productOldPrice) {
            if (currentProduct.old_price || currentProduct.oldPrice) {
                elements.productOldPrice.style.display = 'inline';
                elements.productOldPrice.textContent = (currentProduct.old_price || currentProduct.oldPrice);
            } else {
                elements.productOldPrice.style.display = 'none';
            }
        }
        if(elements.fullDescription) {
            elements.fullDescription.innerHTML = currentProduct.long_description || 'لا توجد تفاصيل إضافية';

            // Process any videos or iframes from Quill and make them Plyr-compatible
            setTimeout(() => {
                initializeMediaPlayers();
            }, 500);
        }


        updateRatingDisplay(currentProduct.rating || 0);
        setupImageGallery();

        // Load and display initial counts
        updateTabCounts();
        loadReviews(); // Load reviews on page load
        loadComments(); // Load comments on page load
        
        if (currentProduct.video) {
            setupProductMedia();
        }

        if (elements.productContent) elements.productContent.style.display = 'grid';
        if (elements.productAdditionalInfo) elements.productAdditionalInfo.style.display = 'block';
    }

    async function loadTabCounts() {
        const productId = currentProduct._id || currentProduct.id;

        // Load reviews count
        try {
            const response = await fetch(`/api/products/${productId}/reviews`);
            if (response.ok) {
                const reviews = await response.json();
                const tab = document.querySelector('.tab-link[data-tab="reviews"]');
                if (tab) tab.textContent = `التقييمات (${reviews.length})`;
                // Cache the data
                window.cachedReviews = reviews;
            }
        } catch (err) {
            console.warn('Failed to load review count', err);
        }

        // Load comments count
        try {
            const response = await fetch(`/api/products/${productId}/comments`);
            if (response.ok) {
                const comments = await response.json();
                const tab = document.querySelector('.tab-link[data-tab="comments"]');
                if (tab) tab.textContent = `التعليقات (${comments.length})`;
                // Cache the data
                window.cachedComments = comments;
            }
        } catch (err) {
            console.warn('Failed to load comment count', err);
        }
    }

    function setupImageGallery() {
        if (!Array.isArray(productMedia) || productMedia.length === 0) return;
    
        // Ensure the elements exist before manipulating them
        // Render first media item into main media content
        if (elements.mainMediaContent) {
            renderMainMedia(productMedia[0]);
        } else if (elements.mainImage) {
            elements.mainImage.src = productMedia[0].url;
            elements.mainImage.alt = currentProduct.name || 'صورة المنتج الرئيسية';
        }
    
        if (elements.thumbnailGallery) {
            // Create a temporary container for generating video thumbnails
            const tempContainer = document.createElement('div');
            tempContainer.style.display = 'none';
            document.body.appendChild(tempContainer);
            
            elements.thumbnailGallery.innerHTML = productMedia.map((m, index) => {
                let thumbSrc = m.thumb || m.url;
                let videoThumbGenId = '';
                
                if (m.type === 'youtube') {
                    thumbSrc = getYouTubeThumb(m.url);
                } else if (m.type === 'video') {
                    // For video files, generate a thumbnail from the first frame
                    if (m.thumb) {
                        thumbSrc = m.thumb;
                    } else {
                        // Use a placeholder for video initially, will be replaced with actual frame
                        videoThumbGenId = `video-thumb-${index}-${Math.random().toString(36).substr(2, 9)}`;
                        thumbSrc = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjMDAwIi8+CjxwYXRoIGQ9Ik0zNy41IDMwTDUwIDQwTDYyLjUgMzBaIiBmaWxsPSIjZmZmIi8+Cjwvc3ZnPgo=';
                    }
                }
                
                return `
                <div class="thumbnail ${index === 0 ? 'active' : ''} ${m.type}" data-index="${index}" data-type="${m.type}" data-url="${m.url}" tabindex="0" role="button" aria-label="ميديا المنتج ${index + 1}">
                    <img id="${videoThumbGenId}" loading="lazy" src="${thumbSrc}" alt="صور المنتج ${index + 1}" onerror="this.src='${currentProduct.image || '/img/loogo.png'}'">
                </div>
            `}).join('');
            
            // Generate thumbnails for videos
            productMedia.forEach((m, index) => {
                if (m.type === 'video' && m.url) {
                    generateVideoThumbnail(m.url, index, tempContainer);
                }
            });
            
            // Clean up temp container later
            setTimeout(() => {
                if (tempContainer && tempContainer.parentNode) {
                    tempContainer.parentNode.removeChild(tempContainer);
                }
            }, 2000);
    
            // Add event listeners to new thumbnails
            elements.thumbnailGallery.querySelectorAll('.thumbnail').forEach(thumb => {
                thumb.addEventListener('click', (e) => {
                    const index = parseInt(e.currentTarget.dataset.index);
                    showImage(index);
                });
            });
        }
    
        currentImageIndex = 0;
        
        // Initial check for scroll buttons
        setTimeout(() => {
            updateThumbScrollButtons();
        }, 100);
        
        // Update on window resize
        window.addEventListener('resize', updateThumbScrollButtons);
        
        // Update on gallery scroll
        if (elements.thumbnailGallery) {
            elements.thumbnailGallery.addEventListener('scroll', updateThumbScrollButtons);
        }

        // Make gallery sticky on larger screens for a modern layout
        try {
            const galleryEl = elements.productGallery || elements['product-gallery'];
            if (galleryEl) {
                if (window.innerWidth >= 992) galleryEl.classList.add('sticky');
                else galleryEl.classList.remove('sticky');
            }
        } catch (ex) { /* ignore */ }
    }


    function showImage(index) {
        if (index < 0 || index >= productMedia.length) return;

        currentImageIndex = index;
        renderMainMedia(productMedia[index]);

        document.querySelectorAll('.thumbnail').forEach((thumb, i) => {
            thumb.classList.toggle('active', i === index);
        });
        // ensure thumbnail strip scrolls so active thumb is visible
        try {
            const gallery = elements.thumbnailGallery || elements['thumbnail-gallery'];
            if (gallery) {
                const active = gallery.querySelector(`.thumbnail[data-index="${index}"]`);
                if (active) {
                    const rect = active.getBoundingClientRect();
                    const parentRect = gallery.getBoundingClientRect();
                    if (rect.left < parentRect.left || rect.right > parentRect.right) {
                        const offset = rect.left - parentRect.left - (parentRect.width/3);
                        gallery.scrollBy({ left: offset, behavior: 'smooth' });
                    }
                }
            }
        } catch (ex) {}
        updateThumbScrollButtons();
    }

    function slidePrev(){
        if (!productMedia || productMedia.length === 0) return;
        const newIndex = (currentImageIndex - 1 + productMedia.length) % productMedia.length;
        showImage(newIndex);
    }
    function slideNext(){
        if (!productMedia || productMedia.length === 0) return;
        const newIndex = (currentImageIndex + 1) % productMedia.length;
        showImage(newIndex);
    }

    function scrollThumbs(dir){
        const gallery = elements.thumbnailGallery || elements['thumbnail-gallery'];
        if (!gallery) return;
        const thumbs = gallery.querySelectorAll('.thumbnail');
        if (thumbs.length === 0) return;
        const thumbWidth = thumbs[0].offsetWidth + 10; // include gap
        const amount = thumbWidth;
        if (dir === 'prev') gallery.scrollBy({ left: -amount, behavior: 'smooth' });
        else gallery.scrollBy({ left: amount, behavior: 'smooth' });
        // Update buttons after scroll
        setTimeout(() => updateThumbScrollButtons(), 300);
    }

    function updateThumbScrollButtons(){
        const gallery = elements.thumbnailGallery || elements['thumbnail-gallery'];
        const prev = elements.thumbPrev || elements['thumb-prev'];
        const next = elements.thumbNext || elements['thumb-next'];
        if (!gallery) return;
        
        // Show/hide buttons based on whether content overflows
        const hasOverflow = gallery.scrollWidth > gallery.clientWidth;
        if (prev) {
            prev.style.display = hasOverflow ? 'flex' : 'none';
            prev.disabled = gallery.scrollLeft <= 0;
        }
        if (next) {
            next.style.display = hasOverflow ? 'flex' : 'none';
            next.disabled = (gallery.scrollLeft + gallery.clientWidth) >= gallery.scrollWidth - 1;
        }
    }

    // Fullscreen handlers
    async function toggleFullscreen(){
        const gallery = elements.productGallery || elements['product-gallery'];
        if (!gallery) return;
        if (!document.fullscreenElement) {
            try{ await gallery.requestFullscreen(); gallery.classList.add('is-fullscreen'); }catch(ex){ console.warn('fs error',ex)}
        } else {
            try{ await document.exitFullscreen(); gallery.classList.remove('is-fullscreen'); }catch(ex){ console.warn('fs exit',ex)}
        }
    }
    function exitFullscreen(){
        const gallery = elements.productGallery || elements['product-gallery'];
        if (gallery) gallery.classList.remove('is-fullscreen');
        if (document.fullscreenElement) document.exitFullscreen().catch(()=>{});
    }

    // Initialize media players for videos and iframes in the description
    function initializeMediaPlayers() {
        if (!elements.fullDescription) {
            console.warn('fullDescription element not found');
            return;
        }

        // --- 1. Process IFRAMEs (YouTube, etc.) ---
        const iframes = Array.from(elements.fullDescription.querySelectorAll('iframe.ql-video, iframe[src*="youtube.com"], iframe[src*="youtu.be"]'));
        console.log(`🔍 Found ${iframes.length} video iframes in description`);

        iframes.forEach((iframe, idx) => {
            // If already processed, skip
            if (iframe.closest('.plyr')) return;

            const src = iframe.getAttribute('src') || '';
            if (!src) return;

            const videoId = extractYouTubeId(src);
            if (videoId) {
                console.log(`🎬 Converting YouTube iframe #${idx} to Plyr format`);
                const wrapper = document.createElement('div');
                wrapper.className = 'quill-video-embed';
                
                // Improved YouTube URL construction with better CSP compliance
                let youtubeSrc = `https://www.youtube.com/embed/${videoId}?iv_load_policy=3&modestbranding=1&playsinline=1&showinfo=0&rel=0`;
                
                // Only add enablejsapi and origin for non-local environments
                if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
                    youtubeSrc += '&enablejsapi=1';
                    youtubeSrc += `&origin=${encodeURIComponent(window.location.origin)}`;
                }
                
                // Create iframe with improved attributes for CSP
                const iframeElement = document.createElement('iframe');
                iframeElement.src = youtubeSrc;
                iframeElement.allowFullscreen = true;
                iframeElement.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
                iframeElement.frameBorder = '0';
                iframeElement.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-presentation');
                
                // Create Plyr container
                const plyrContainer = document.createElement('div');
                plyrContainer.className = 'plyr__video-embed';
                plyrContainer.id = `plyr-youtube-${idx}`;
                plyrContainer.appendChild(iframeElement);
                wrapper.appendChild(plyrContainer);
                
                iframe.parentNode.replaceChild(wrapper, iframe);

                setTimeout(() => {
                    try {
                        new Plyr(`#plyr-youtube-${idx}`);
                        console.log(`✅ Plyr initialized for YouTube iframe #${idx}`);
                    } catch (e) {
                        console.error(`❌ Error initializing Plyr for YouTube iframe #${idx}:`, e);
                    }
                }, 300);
            }
        });

        // --- 2. Process VIDEO tags (local uploads) ---
        const videos = Array.from(elements.fullDescription.querySelectorAll('video'));
        console.log(`📹 Found ${videos.length} <video> tags in description`);

        videos.forEach((video, idx) => {
            // If already processed or inside a Plyr container, skip
            if (video.classList.contains('plyr--setup') || video.closest('.plyr')) {
                console.log(`⏭️  Video #${idx} already has Plyr, skipping`);
                return;
            }
            
            console.log(`🔧 Processing local video #${idx}`);
            
            // Get the video source URL from either src attribute or source tag
            let videoSrc = video.getAttribute('src');
            if (!videoSrc) {
                const sourceTag = video.querySelector('source');
                if (sourceTag) {
                    videoSrc = sourceTag.getAttribute('src');
                    console.log(`📍 Got src from <source> tag: ${videoSrc}`);
                }
            }
            
            if (!videoSrc) {
                console.warn(`⚠️  Video #${idx} has no src attribute or source tag`);
                return;
            }
            
            console.log(`📺 Video src: ${videoSrc}`);
            
            // Ensure necessary attributes for Plyr
            video.setAttribute('playsinline', '');
            video.setAttribute('controls', '');
            video.setAttribute('preload', 'metadata');
            
            // Remove any existing src attribute and add a proper source tag
            if (video.getAttribute('src')) {
                const src = video.getAttribute('src');
                video.removeAttribute('src');
                
                // Create source tag if not exists
                let sourceTag = video.querySelector('source');
                if (!sourceTag) {
                    sourceTag = document.createElement('source');
                    video.appendChild(sourceTag);
                }
                
                // Determine video type from src
                let videoType = 'video/mp4';
                if (src.endsWith('.webm')) videoType = 'video/webm';
                else if (src.endsWith('.mov')) videoType = 'video/quicktime';
                else if (src.endsWith('.avi')) videoType = 'video/x-msvideo';
                else if (src.endsWith('.mkv')) videoType = 'video/x-matroska';
                
                sourceTag.setAttribute('src', src);
                sourceTag.setAttribute('type', videoType);
                
                console.log(`✏️  Set source tag: ${src} (${videoType})`);
                videoSrc = src;
            }
            
            // Wrap the video to maintain aspect ratio and styling
            const wrapper = document.createElement('div');
            wrapper.className = 'quill-video-embed'; // Use the same class for consistent styling
            wrapper.style.cssText = 'margin: 20px 0; width: 100%; max-width: 600px; aspect-ratio: 16/9; background: #000; border-radius: 8px; overflow: hidden; display: block;';
            
            // Insert wrapper before the video and move the video inside it
            video.parentNode.insertBefore(wrapper, video);
            wrapper.appendChild(video);

            setTimeout(() => {
                try {
                    const videoInstance = new Plyr(video, {
                        controls: ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'captions', 'settings', 'pip', 'airplay', 'fullscreen'],
                        tooltips: { controls: true, seek: true }
                    });
                    console.log(`✅ Plyr initialized for local video tag #${idx}`);
                } catch (e) {
                    console.error(`❌ Error initializing Plyr for local video tag #${idx}:`, e);
                }
            }, 300);
        });
    }

    function renderMainMedia(m) {
        if (!m) return;
        const wrapper = elements.mainMediaContent || document.getElementById('main-media-content');
        if (!wrapper) return;

        if (m.type === 'image') {
            wrapper.innerHTML = `<img id="main-image" class="main-image" src="${m.url}" alt="${currentProduct.name || 'صورة المنتج'}" />`;
            elements.mainImage = wrapper.querySelector('#main-image');
        } else if (m.type === 'youtube') {
            const videoId = extractYouTubeId(m.url);
            console.log('renderMainMedia: YouTube video ID =', videoId);
            // Use standard Plyr HTML5 embed approach
            wrapper.innerHTML = `
                <div class="plyr__video-embed" id="yt-player" style="width: 100%; height: 100%;">
                    <iframe 
                        src="https://www.youtube.com/embed/${videoId}?enablejsapi=1&playsinline=1&rel=0&iv_load_policy=3&modestbranding=1&origin=${encodeURIComponent(window.location.origin)}" 
                        allowfullscreen 
                        allow="autoplay; encrypted-media; picture-in-picture" 
                        frameborder="0"
                        style="border: none; width: 100%; height: 100%; display: block;">
                    </iframe>
                </div>
            `;
            // Initialize Plyr with proper config matching course-page.html
            setTimeout(() => {
                if (typeof Plyr !== 'undefined') {
                    try {
                        const player = new Plyr('#yt-player', {
                            blankVideo: '', // Disable blank.mp4 to avoid CSP issues
                            youtube: {
                                noCookie: false,
                                rel: 0,
                                iv_load_policy: 3,
                                modestbranding: 1,
                                playsinline: 1
                            },
                            controls: ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'captions', 'settings', 'pip', 'airplay', 'fullscreen'],
                            tooltips: { controls: true, seek: true }
                        });
                        console.log('✅ Plyr initialized for YouTube - type:', player.type);
                    } catch (e) {
                        console.error('❌ Error initializing Plyr for YouTube:', e);
                    }
                } else {
                    console.warn('⚠️  Plyr not loaded yet');
                }
            }, 200);
        } else if (m.type === 'video') {
            // For video files, use HTML5 video with class="plyr"
            let finalUrl = m.url;
            let videoType = 'video/mp4';
            
            // Determine video type based on file extension
            if (m.url.endsWith('.mov') || m.url.endsWith('.MOV')) {
                // Use MOV format directly (same as in description)
                videoType = 'video/quicktime';
                console.log('🎬 Using MOV video directly:', m.url);
            } else if (m.url.endsWith('.webm')) {
                videoType = 'video/webm';
            } else if (m.url.endsWith('.avi')) {
                videoType = 'video/x-msvideo';
            } else if (m.url.endsWith('.mkv')) {
                videoType = 'video/x-matroska';
            } else if (m.url.endsWith('.ogg') || m.url.endsWith('.ogv')) {
                videoType = 'video/ogg';
            }
            
            console.log('renderMainMedia: Final video URL:', finalUrl, 'Type:', videoType);
            
            // Create unique ID for this video player
            const videoId = `video-player-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            
            // Wrap video with proper styling (same as quill-video-embed in description)
            wrapper.innerHTML = `
                <div style="width: 100%; aspect-ratio: 16/9; background: #000; border-radius: 8px; overflow: hidden; display: flex; align-items: center; justify-content: center;">
                    <video id="${videoId}" playsinline preload="metadata" style="width: 100%; height: 100%; display: block; background: #000;">
                        <source src="${finalUrl}" type="${videoType}">
                        <p>متصفحك لا يدعم تشغيل الفيديو</p>
                    </video>
                </div>
            `;
            
            // Initialize Plyr for this video
            setTimeout(() => {
                if (typeof Plyr !== 'undefined') {
                    try {
                        // Get the video element by its unique ID
                        const videoElement = document.getElementById(videoId);
                        if (videoElement) {
                            const player = new Plyr(videoElement, {
                                controls: ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'captions', 'settings', 'pip', 'airplay', 'fullscreen'],
                                tooltips: { controls: true, seek: true },
                                disableContextMenu: true
                            });
                            console.log('✅ Plyr initialized for local video - type:', player.type);
                        } else {
                            console.warn('⚠️ Video element not found:', videoId);
                        }
                    } catch (e) {
                        console.error('❌ Error initializing Plyr for video:', e);
                    }
                } else {
                    console.warn('⚠️ Plyr library not available');
                }
            }, 300);
        } else {
            // fallback: image
            wrapper.innerHTML = `<img id="main-image" class="main-image" src="${m.url}" alt="${currentProduct.name || 'صورة المنتج'}" />`;
            elements.mainImage = wrapper.querySelector('#main-image');
        }
    }

    function extractYouTubeId(url) {
        try {
            if (!url) return '';
            // Handle youtu.be short links
            if (url.includes('youtu.be/')) {
                return url.split('youtu.be/')[1].split('?')[0].split('&')[0];
            }
            // Handle youtube.com/watch links
            if (url.includes('youtube.com/watch')) {
                const params = new URL(url).searchParams;
                return params.get('v') || '';
            }
            // Handle youtube.com/embed links
            if (url.includes('youtube.com/embed/')) {
                return url.split('youtube.com/embed/')[1].split('?')[0].split('&')[0];
            }
            // Handle youtube.com/v/ links
            if (url.includes('youtube.com/v/')) {
                return url.split('youtube.com/v/')[1].split('?')[0].split('&')[0];
            }
            // Fallback: try to extract from URL
            const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
            return match ? match[1] : '';
        } catch (ex) { 
            console.warn('Error extracting YouTube ID:', ex);
            return '';
        }
    }

    function getYouTubeThumb(url) {
        const id = extractYouTubeId(url);
        if (!id) return (currentProduct && (currentProduct.image || '/img/loogo.png'));
        // Use maxresdefault for better quality, fallback to hqdefault
        return `https://img.youtube.com/vi/${id}/maxresdefault.jpg`;
    }

    function setupProductMedia() {
        if (!elements.productVideoContainer || !currentProduct.video) return;

        const videoUrl = currentProduct.video;
        let videoHTML = '';

        if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
            const videoId = videoUrl.split('v=')[1] || videoUrl.split('/').pop();
            videoHTML = `<iframe src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe>`;
        } else {
            videoHTML = `<video src="${videoUrl}" controls></video>`;
        }
        elements.productVideoContainer.innerHTML = videoHTML;
    }

    /**
     * Generate a thumbnail from the first frame of a video
     * This creates a more visual preview than a placeholder icon
     */
    function generateVideoThumbnail(videoUrl, index, tempContainer) {
        try {
            // Create a hidden video element to extract first frame
            const video = document.createElement('video');
            video.crossOrigin = 'anonymous';
            video.preload = 'metadata';
            video.style.display = 'none';
            
            video.onloadedmetadata = () => {
                // Seek to a small offset to get first visible frame
                video.currentTime = Math.min(1, video.duration * 0.1);
            };
            
            video.onseeked = () => {
                try {
                    // Create canvas and draw first frame
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    
                    // Add a play button overlay
                    const size = Math.min(canvas.width, canvas.height) / 4;
                    const x = (canvas.width - size) / 2;
                    const y = (canvas.height - size) / 2;
                    
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
                    ctx.beginPath();
                    ctx.arc(canvas.width / 2, canvas.height / 2, size / 2, 0, Math.PI * 2);
                    ctx.fill();
                    
                    ctx.fillStyle = '#fff';
                    ctx.beginPath();
                    ctx.moveTo(x + size * 0.2, y);
                    ctx.lineTo(x + size * 0.2, y + size);
                    ctx.lineTo(x + size * 0.8, y + size / 2);
                    ctx.closePath();
                    ctx.fill();
                    
                    // Convert to data URL
                    const thumbUrl = canvas.toDataURL('image/jpeg', 0.8);
                    
                    // Find and update the thumbnail image
                    const thumbImg = document.querySelector(`.thumbnail[data-index="${index}"] img`);
                    if (thumbImg) {
                        thumbImg.src = thumbUrl;
                        console.log(`✅ Video thumbnail generated for index ${index}`);
                    }
                } catch (e) {
                    console.warn(`⚠️ Could not generate video thumbnail for index ${index}:`, e);
                }
            };
            
            video.onerror = () => {
                console.warn(`⚠️ Could not load video for thumbnail: ${videoUrl}`);
            };
            
            // Set source after attaching listeners
            video.src = videoUrl;
            tempContainer.appendChild(video);
            
        } catch (e) {
            console.warn(`⚠️ Error generating video thumbnail:`, e);
        }
    }

    function updateRatingDisplay(rating) {
        if (!elements.starsContainer || !elements.ratingText) return;
        const fullStars = Math.floor(rating);
        const halfStar = rating % 1 !== 0;
        let starsHTML = '';
        for (let i = 0; i < fullStars; i++) starsHTML += '<i class="fas fa-star"></i>';
        if (halfStar) starsHTML += '<i class="fas fa-star-half-alt"></i>';
        for (let i = Math.ceil(rating); i < 5; i++) starsHTML += '<i class="far fa-star"></i>';

        elements.starsContainer.innerHTML = starsHTML;
        elements.ratingText.textContent = `(${rating.toFixed(1)} تقييم)`;
    }

    function getCategoryName(category) {
        const names = { 'electronics': 'إلكترونيات', 'hardware': 'أجهزة' };
        return names[category] || category;
    }

    function setupEventListeners() {
        if (elements.decreaseQty) elements.decreaseQty.addEventListener('click', () => updateQuantity(-1));
        if (elements.increaseQty) elements.increaseQty.addEventListener('click', () => updateQuantity(1));
        if (elements.addToCartBtn) elements.addToCartBtn.addEventListener('click', addToCart);
        if (elements.buyNowBtn) elements.buyNowBtn.addEventListener('click', buyNow);
        // Mobile buttons mapped in HTML as additional IDs
        if (elements.addToCartBtnMobile) elements.addToCartBtnMobile.addEventListener('click', (e)=>{ e.preventDefault(); addToCart(); });
        if (elements.buyNowBtnMobile) elements.buyNowBtnMobile.addEventListener('click', (e)=>{ e.preventDefault(); buyNow(); });

        document.querySelectorAll('.tab-link').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                activateTab(tabName);
            });
        });
        if (elements.productShare) elements.productShare.addEventListener('click', shareProduct);
        if (elements.productShareImage || elements['product-share-image']) {
            const el = elements.productShareImage || elements['product-share-image'];
            el.addEventListener('click', (e)=>{ e.preventDefault(); shareProduct(); });
        }

        // Slide arrows
        if (elements.slidePrev) elements.slidePrev.addEventListener('click', (e)=>{ e.preventDefault(); slidePrev(); });
        if (elements.slideNext) elements.slideNext.addEventListener('click', (e)=>{ e.preventDefault(); slideNext(); });

        // Thumbnails scrolling buttons
        if (elements.thumbPrev) elements.thumbPrev.addEventListener('click', (e)=>{ e.preventDefault(); scrollThumbs('prev'); });
        if (elements.thumbNext) elements.thumbNext.addEventListener('click', (e)=>{ e.preventDefault(); scrollThumbs('next'); });

        // Fullscreen toggle
        if (elements.toggleFullscreen) elements.toggleFullscreen.addEventListener('click', (e)=>{ e.preventDefault(); toggleFullscreen(); });

        // Keyboard navigation for gallery
        document.addEventListener('keydown', (e)=>{
            if (document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement) {
                if (e.key === 'ArrowLeft') { e.preventDefault(); slidePrev(); }
                if (e.key === 'ArrowRight') { e.preventDefault(); slideNext(); }
                if (e.key === 'Escape') { e.preventDefault(); exitFullscreen(); }
            } else {
                // when not fullscreen, still allow left/right if gallery is visible
                if (e.key === 'ArrowLeft') slidePrev();
                if (e.key === 'ArrowRight') slideNext();
            }
        });
        
        // Listen for fullscreen changes to update gallery class
        document.addEventListener('fullscreenchange', ()=>{
            const gallery = elements.productGallery || elements['product-gallery'];
            if (!gallery) return;
            if (!document.fullscreenElement) {
                gallery.classList.remove('is-fullscreen');
            }
        });
        
        // Also listen for webkit and moz variants
        document.addEventListener('webkitfullscreenchange', ()=>{
            const gallery = elements.productGallery || elements['product-gallery'];
            if (!gallery) return;
            if (!document.webkitFullscreenElement) {
                gallery.classList.remove('is-fullscreen');
            }
        });
        
        document.addEventListener('mozfullscreenchange', ()=>{
            const gallery = elements.productGallery || elements['product-gallery'];
            if (!gallery) return;
            if (!document.mozFullScreenElement) {
                gallery.classList.remove('is-fullscreen');
            }
        });
        // Clicking on the main media for video should attempt to play it
        const mainMedia = elements.mainMediaContent || elements['main-media-content'];
        if (mainMedia) {
            mainMedia.addEventListener('click', (e)=>{
                try{
                    const m = productMedia[currentImageIndex];
                    if (!m) return;
                    if (m.type === 'video'){
                        const v = mainMedia.querySelector('video');
                        if (v && v.paused) v.play();
                    }
                }catch(err){console.warn('media click',err)}
            });
        }

        // When clicking thumbnails, change main media and ensure focus
        if (elements.thumbnailGallery) {
            elements.thumbnailGallery.addEventListener('click', (e)=>{
                const thumb = e.target.closest('.thumbnail');
                if (!thumb) return;
                const i = parseInt(thumb.dataset.index);
                if (!isNaN(i)) showImage(i);
            });
            // support keyboard activation for thumbnails
            elements.thumbnailGallery.addEventListener('keydown', (e)=>{
                if (e.key === 'Enter' || e.key === ' ') {
                    const thumb = e.target.closest('.thumbnail');
                    if (!thumb) return;
                    e.preventDefault();
                    const i = parseInt(thumb.dataset.index);
                    if (!isNaN(i)) showImage(i);
                }
            });
        }
    }
    
    function updateQuantity(change) {
        const newQuantity = quantity + change;
        if (newQuantity >= 1 && newQuantity <= 99) {
            quantity = newQuantity;
            elements.quantity.value = quantity;
        }
    }

    function showToast(title, message, type = 'info') {
        if (window.showToast) {
            return window.showToast(message, { type, title, timeout: 4000 });
        }
        
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
            <span>${message}</span>
        `;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    function updateCartBadge() {
        try {
            const cartData = localStorage.getItem('cart');
            const cartItems = cartData ? JSON.parse(cartData) : [];
            const cartBadge = document.getElementById('cartBadge');

            if (cartBadge) {
                const count = cartItems.length;
                cartBadge.textContent = count > 0 ? count : '';
                cartBadge.classList.toggle('empty', count === 0);

                if (count > 0) {
                    cartBadge.classList.add('pulse');
                    setTimeout(() => {
                        cartBadge.classList.remove('pulse');
                    }, 1500);
                }
            }
        } catch (error) {
            console.error('Error updating cart badge:', error);
        }
    }
    window.updateCartBadge = updateCartBadge;

    function addToCart() {
        if (!currentProduct) return;
        
        try {
            const cartData = localStorage.getItem('cart');
            let cartItems = cartData ? JSON.parse(cartData) : [];
            
            const productId = currentProduct._id || currentProduct.id;
            const existingItemIndex = cartItems.findIndex(item => item.productId === productId);

            if (existingItemIndex !== -1) {
                 cartItems[existingItemIndex].quantity = (cartItems[existingItemIndex].quantity || 1) + quantity;
                 cartItems[existingItemIndex].qty = cartItems[existingItemIndex].quantity; // Keep for compatibility
            } else {
                cartItems.push({
                    id: productId,
                    productId: productId,
                    quantity: quantity,
                    qty: quantity,
                    title: currentProduct.name,
                    name: currentProduct.name,
                    price: currentProduct.price,
                    image: currentProduct.image,
                    category: currentProduct.category,
                    addedAt: new Date().toISOString()
                });
            }

            localStorage.setItem('cart', JSON.stringify(cartItems));
            
            if (window.updateCartBadge) window.updateCartBadge();
            
            showToast('نجاح', `تم إضافة ${quantity} من ${currentProduct.name} إلى السلة`, 'success');

        } catch (error) {
            console.error('Error adding to cart:', error);
            showToast('خطأ', 'فشل إضافة المنتج للسلة', 'error');
        }
    }

    function buyNow() {
        if (!currentProduct) return;
        
        try {
            const cartData = localStorage.getItem('cart');
            let cartItems = cartData ? JSON.parse(cartData) : [];
            
            const productId = currentProduct._id || currentProduct.id;
            const existingItemIndex = cartItems.findIndex(item => (item.productId === productId || item.id === productId));

            if (existingItemIndex !== -1) {
                cartItems[existingItemIndex].quantity = (cartItems[existingItemIndex].quantity || 1) + quantity;
                cartItems[existingItemIndex].qty = cartItems[existingItemIndex].quantity;
            } else {
                cartItems.push({
                    id: productId,
                    productId: productId,
                    quantity: quantity,
                    qty: quantity,
                    title: currentProduct.name,
                    name: currentProduct.name,
                    price: currentProduct.price,
                    image: currentProduct.image,
                    category: currentProduct.category,
                    addedAt: new Date().toISOString()
                });
            }

            localStorage.setItem('cart', JSON.stringify(cartItems));
            
            if (window.updateCartBadge) window.updateCartBadge();
            
            // Show custom "Buy Now" toast exactly as requested
            showToast('جاري التوجيه', 'جاري التوجيه للسلة', 'success');

            // Redirect after a short delay to allow toast to be seen
            setTimeout(() => {
                window.location.href = 'cart.html';
            }, 800);

        } catch (error) {
            console.error('Error in buy now:', error);
            showToast('خطأ', 'فشل في عملية الشراء الفوري', 'error');
        }
    }

    function shareProduct(e){
        try{
            const url = window.location.href;
            navigator.clipboard.writeText(url).then(()=>{
                alert('تم نسخ رابط المنتج');
            }, ()=>{
                window.prompt('انسخ الرابط', url);
            });
        }catch(ex){
            window.prompt('انسخ الرابط', window.location.href);
        }
    }

    function activateTab(tabName) {
        document.querySelectorAll('.tab-link').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === tabName);
        });
        
        // Load data when switching to reviews or comments tab
        if (tabName === 'reviews') {
            loadReviews();
        } else if (tabName === 'comments') {
            loadComments();
        }

        // Fullscreen change handler to toggle class and icon
        document.addEventListener('fullscreenchange', (e)=>{
            const gallery = elements.productGallery || elements['product-gallery'];
            const btn = elements.toggleFullscreen || elements['toggle-fullscreen'];
            if (document.fullscreenElement) {
                if (gallery) gallery.classList.add('is-fullscreen');
                if (btn) btn.innerHTML = '<i class="fa-solid fa-compress"></i>';
            } else {
                if (gallery) gallery.classList.remove('is-fullscreen');
                if (btn) btn.innerHTML = '<i class="fa-solid fa-expand"></i>';
            }
        });
        // vendor-prefixed events
        document.addEventListener('webkitfullscreenchange', () => {
            const gallery = elements.productGallery || elements['product-gallery'];
            const btn = elements.toggleFullscreen || elements['toggle-fullscreen'];
            if (document.webkitFullscreenElement) {
                if (gallery) gallery.classList.add('is-fullscreen');
                if (btn) btn.innerHTML = '<i class="fa-solid fa-compress"></i>';
            } else {
                if (gallery) gallery.classList.remove('is-fullscreen');
                if (btn) btn.innerHTML = '<i class="fa-solid fa-expand"></i>';
            }
        });

        // Thumbnail scroll state
        const gallery = elements.thumbnailGallery || elements['thumbnail-gallery'];
        if (gallery) {
            gallery.addEventListener('scroll', () => updateThumbScrollButtons());
            updateThumbScrollButtons();
        }

        // Window resize: recompute sticky and thumbnail layout
        let resizeTimer = null;
        const onResize = ()=>{
            if(resizeTimer) clearTimeout(resizeTimer);
            resizeTimer = setTimeout(()=>{
                try {
                    const galleryEl = elements.productGallery || elements['product-gallery'];
                    if (galleryEl) {
                        if (window.innerWidth >= 992) galleryEl.classList.add('sticky');
                        else galleryEl.classList.remove('sticky');
                    }
                    updateThumbScrollButtons();
                } catch(ex){ }
            }, 120);
        };
        window.addEventListener('resize', onResize);
    }

    function showLoading(isLoading) {
        const loadingEl = elements.loadingState || elements['loading-state'];
        const content = elements.productContent || elements['product-content'];
        const additional = elements.productAdditionalInfo || elements['product-additional-info'];
        if (loadingEl) loadingEl.style.display = isLoading ? 'block' : 'none';
        if (content) content.style.display = isLoading ? 'none' : 'grid';
        if (additional) additional.style.display = isLoading ? 'none' : 'block';
    }

    function showError(message) {
        const loadingEl = elements.loadingState || elements['loading-state'];
        const content = elements.productContent || elements['product-content'];
        const error = elements.errorState || elements['error-state'];
        if (loadingEl) loadingEl.style.display = 'none';
        if (content) content.style.display = 'none';
        if (error) {
            error.style.display = 'block';
            const p = error.querySelector('p');
            if (p) p.textContent = message;
        }
    }

    // Reviews Functions
    async function loadReviews() {
        if (!currentProduct) return;

        // Use cached data if available
        if (window.cachedReviews) {
            displayReviews(window.cachedReviews);
            updateReviewsStats(window.cachedReviews);
            return;
        }

        try {
            // Try API first
            const response = await fetch(`/api/products/${currentProduct._id || currentProduct.id}/reviews`);
            if (response.ok) {
                const reviews = await response.json();
                displayReviews(reviews);
                updateReviewsStats(reviews);
                window.cachedReviews = reviews; // Cache it
                return;
            }
        } catch (error) {
            console.log('API not available, using localStorage');
        }

        // Fallback to localStorage
        const productId = currentProduct._id || currentProduct.id;
        const reviews = JSON.parse(localStorage.getItem(`reviews_${productId}`) || '[]');
        displayReviews(reviews);
        updateReviewsStats(reviews);
    }

    function displayReviews(reviews) {
        const container = document.getElementById('reviews-container');
        const countEl = document.getElementById('reviews-count');
        
        if (countEl) countEl.textContent = reviews.length;
        if (!container) return;
        
        if (reviews.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-star"></i>
                    <h3>لا توجد تقييمات بعد</h3>
                    <p>كن أول من يقيم هذا المنتج</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = reviews.map(review => {
            const userName = review.user && typeof review.user === 'object' ? review.user.name : review.user || 'مستخدم';
            const userAvatar = review.user && typeof review.user === 'object' ? review.user.avatarUrl : null;
            const avatarHTML = userAvatar 
                ? `<img src="${userAvatar}" alt="${userName}" class="reviewer-avatar-img">`
                : `<div class="reviewer-avatar">${userName.charAt(0).toUpperCase()}</div>`;
            
            return `
            <div class="review-item">
                <div class="review-header">
                    <div class="reviewer-info">
                        ${avatarHTML}
                        <div class="reviewer-details">
                            <div class="reviewer-name">${escapeHtml(userName)}</div>
                            <div class="review-date">${formatFullDate(review.createdAt)}</div>
                        </div>
                    </div>
                    <div class="review-rating">${renderStarsHTML(review.rating)}</div>
                </div>
                ${review.title ? `<div class="review-title">${escapeHtml(review.title)}</div>` : ''}
                <div class="review-text">${escapeHtml(review.text || review.comment || '')}</div>
                <div class="review-actions">
                    <button class="action-btn like-btn" onclick="likeReview('${review._id}')" data-review-id="${review._id}" data-liked="${review.likes?.length > 0 ? 'true' : 'false'}">
                        <i class="far fa-thumbs-up"></i>
                        <span>مفيد (<span class="like-count">${review.likes?.length || 0}</span>)</span>
                    </button>
                </div>
            </div>
        `}).join('');
    }

    // Update tab counts from product data
    function updateTabCounts() {
        const reviewsCount = (currentProduct.reviews || []).length;
        const commentsCount = (currentProduct.comments || []).length;
        
        const reviewsCountEl = document.getElementById('reviews-count');
        const commentsCountEl = document.getElementById('comments-count');
        
        if (reviewsCountEl) reviewsCountEl.textContent = reviewsCount;
        if (commentsCountEl) commentsCountEl.textContent = commentsCount;
    }

    function updateReviewsStats(reviews) {
        const avgRatingEl = document.getElementById('avg-rating');
        const avgStarsEl = document.getElementById('avg-rating-stars');
        const totalReviewsEl = document.getElementById('total-reviews');
        const distributionEl = document.getElementById('rating-distribution');
        
        if (reviews.length === 0) {
            if (avgRatingEl) avgRatingEl.textContent = '0.0';
            if (avgStarsEl) avgStarsEl.innerHTML = renderStarsHTML(0);
            if (totalReviewsEl) totalReviewsEl.textContent = '0';
            return;
        }
        
        const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
        if (avgRatingEl) avgRatingEl.textContent = avg.toFixed(1);
        if (avgStarsEl) avgStarsEl.innerHTML = renderStarsHTML(avg);
        if (totalReviewsEl) totalReviewsEl.textContent = reviews.length;
        
        const distribution = [5, 4, 3, 2, 1].map(rating => {
            const count = reviews.filter(r => r.rating === rating).length;
            const percentage = (count / reviews.length) * 100;
            return { rating, count, percentage };
        });
        
        if (distributionEl) {
            distributionEl.innerHTML = distribution.map(d => `
                <div class="rating-bar">
                    <div class="rating-bar-label"><span>${d.rating}</span><i class="fas fa-star"></i></div>
                    <div class="rating-bar-track"><div class="rating-bar-fill" style="width: ${d.percentage}%"></div></div>
                    <div class="rating-bar-count">${d.count}</div>
                </div>
            `).join('');
        }
    }

    async function submitReview(event) {
        event.preventDefault();
        
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (!user.name && !user.email) {
            alert('يجب تسجيل الدخول أولاً');
            window.location.href = '/login.html';
            return;
        }
        
        const rating = document.getElementById('review-rating').value;
        const title = document.getElementById('review-title').value;
        const text = document.getElementById('review-text').value;
        
        if (!rating) {
            alert('يرجى اختيار التقييم');
            return;
        }
        
        const productId = currentProduct._id || currentProduct.id;
        const token = localStorage.getItem('token');
        
        try {
            // Try API first
            if (token) {
                const response = await fetch(`/api/products/${productId}/reviews`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ 
                        rating: parseInt(rating), 
                        title, 
                        text,
                        user: {
                            name: user.name || 'مستخدم',
                            email: user.email,
                            avatarUrl: user.avatarUrl
                        }
                    })
                });
                
                if (response.ok) {
                    alert('تم إضافة تقييمك بنجاح');
                    document.getElementById('review-form').reset();
                    document.querySelectorAll('.star-rating-input i').forEach(star => {
                        star.classList.remove('active', 'fas');
                        star.classList.add('far');
                    });
                    window.cachedReviews = null; // Clear cache
                    loadReviews();
                    return;
                }
            }
        } catch (error) {
            console.log('API not available, using localStorage');
        }
        
        // Fallback to localStorage
        const reviews = JSON.parse(localStorage.getItem(`reviews_${productId}`) || '[]');
        const newReview = {
            _id: Date.now().toString(),
            rating: parseInt(rating),
            title,
            text,
            user: { name: user.name || user.username || user.email },
            createdAt: new Date().toISOString(),
            likes: 0
        };
        
        reviews.unshift(newReview);
        localStorage.setItem(`reviews_${productId}`, JSON.stringify(reviews));
        
        alert('تم إضافة تقييمك بنجاح');
        document.getElementById('review-form').reset();
        document.querySelectorAll('.star-rating-input i').forEach(star => {
            star.classList.remove('active', 'fas');
            star.classList.add('far');
        });
        loadReviews();
    }

    // Comments Functions
    async function loadComments() {
        if (!currentProduct) return;

        // Use cached data if available
        if (window.cachedComments) {
            displayComments(window.cachedComments);
            return;
        }

        try {
            // Try API first
            const response = await fetch(`/api/products/${currentProduct._id || currentProduct.id}/comments`);
            if (response.ok) {
                const comments = await response.json();
                displayComments(comments);
                window.cachedComments = comments; // Cache it
                return;
            }
        } catch (error) {
            console.log('API not available, using localStorage');
        }

        // Fallback to localStorage
        const productId = currentProduct._id || currentProduct.id;
        const comments = JSON.parse(localStorage.getItem(`comments_${productId}`) || '[]');
        displayComments(comments);
    }

    function displayComments(comments) {
        const container = document.getElementById('comments-container');
        const countEl = document.getElementById('comments-count');
        
        if (countEl) countEl.textContent = comments.length;
        if (!container) return;
        
        if (comments.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-comments"></i>
                    <h3>لا توجد تعليقات بعد</h3>
                    <p>كن أول من يعلق على هذا المنتج</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = comments.map(comment => {
            const userName = comment.user && typeof comment.user === 'object' ? comment.user.name : comment.user || 'مستخدم';
            const userAvatar = comment.user && typeof comment.user === 'object' ? comment.user.avatarUrl : null;
            const avatarHTML = userAvatar 
                ? `<img src="${userAvatar}" alt="${userName}" class="commenter-avatar-img">`
                : `<div class="commenter-avatar">${userName.charAt(0).toUpperCase()}</div>`;
            
            return `
            <div class="comment-item">
                <div class="comment-header">
                    <div class="commenter-info">
                        ${avatarHTML}
                        <div class="commenter-details">
                            <div class="commenter-name">${escapeHtml(userName)}</div>
                            <div class="comment-date">${formatFullDate(comment.createdAt)}</div>
                        </div>
                    </div>
                </div>
                <div class="comment-text">${escapeHtml(comment.text)}</div>
                <div class="comment-actions">
                    <button class="action-btn like-btn" onclick="likeComment('${comment._id}')" data-comment-id="${comment._id}" data-liked="${comment.likes?.length > 0 ? 'true' : 'false'}">
                        <i class="far fa-thumbs-up"></i>
                        <span>إعجاب (<span class="like-count">${comment.likes?.length || 0}</span>)</span>
                    </button>
                </div>
            </div>
        `}).join('');
    }

    async function submitComment(event) {
        event.preventDefault();
        
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (!user.name && !user.email) {
            alert('يجب تسجيل الدخول أولاً');
            window.location.href = '/login.html';
            return;
        }
        
        const text = document.getElementById('comment-text').value;
        const productId = currentProduct._id || currentProduct.id;
        const token = localStorage.getItem('token');
        
        try {
            // Try API first
            if (token) {
                const response = await fetch(`/api/products/${productId}/comments`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ 
                        text,
                        user: {
                            name: user.name || 'مستخدم',
                            email: user.email,
                            avatarUrl: user.avatarUrl
                        }
                    })
                });
                
                if (response.ok) {
                    alert('تم إضافة تعليقك بنجاح');
                    document.getElementById('comment-form').reset();
                    window.cachedComments = null; // Clear cache
                    loadComments();
                    return;
                }
            }
        } catch (error) {
            console.log('API not available, using localStorage');
        }
        
        // Fallback to localStorage
        const comments = JSON.parse(localStorage.getItem(`comments_${productId}`) || '[]');
        const newComment = {
            _id: Date.now().toString(),
            text,
            user: { name: user.name || user.username || user.email },
            createdAt: new Date().toISOString(),
            likes: 0
        };
        
        comments.unshift(newComment);
        localStorage.setItem(`comments_${productId}`, JSON.stringify(comments));
        
        alert('تم إضافة تعليقك بنجاح');
        document.getElementById('comment-form').reset();
        loadComments();
    }

    // Related Products
    async function loadRelatedProducts() {
        if (!currentProduct) return;
        
        try {
            const response = await fetch(`/api/products?category=${currentProduct.category}&limit=4`);
            if (response.ok) {
                let products = await response.json();
                products = products.filter(p => (p._id || p.id) !== (currentProduct._id || currentProduct.id));
                displayRelatedProducts(products.slice(0, 4));
            }
        } catch (error) {
            console.error('Error loading related products:', error);
        }
    }

    function displayRelatedProducts(products) {
        const section = document.getElementById('related-products-section');
        const grid = document.getElementById('related-products-grid');
        
        if (!grid || products.length === 0) {
            if (section) section.style.display = 'none';
            return;
        }
        
        if (section) section.style.display = 'block';
        
        grid.innerHTML = products.map(product => `
            <div class="related-product-card" onclick="window.location.href='product-details.html?id=${product._id || product.id}'">
                <div class="related-product-image">
                    <img src="${product.image || '/img/profile.png'}" alt="${escapeHtml(product.name)}">
                    ${product.featured ? '<div class="related-product-badge">مميز</div>' : ''}
                </div>
                <div class="related-product-info">
                    <div class="related-product-category">${getCategoryName(product.category)}</div>
                    <div class="related-product-title">${escapeHtml(product.name)}</div>
                    <div class="related-product-rating">
                        <div class="stars">${renderStarsHTML(product.rating || 0)}</div>
                        <span class="rating-text">(${product.rating || 0})</span>
                    </div>
                    <div class="related-product-price">${product.price || 0} ج.م</div>
                    <div class="related-product-actions">
                        <button class="btn btn-primary" onclick="event.stopPropagation(); window.location.href='product-details.html?id=${product._id || product.id}'">
                            <i class="fas fa-eye"></i> عرض
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // Helper Functions
    function renderStarsHTML(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;
        let stars = '';
        for (let i = 0; i < fullStars; i++) stars += '<i class="fas fa-star"></i>';
        if (hasHalfStar) stars += '<i class="fas fa-star-half-alt"></i>';
        for (let i = Math.ceil(rating); i < 5; i++) stars += '<i class="far fa-star"></i>';
        return stars;
    }

    function formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return 'اليوم';
        if (diffDays === 1) return 'أمس';
        if (diffDays < 7) return `منذ ${diffDays} أيام`;
        if (diffDays < 30) return `منذ ${Math.floor(diffDays / 7)} أسابيع`;
        if (diffDays < 365) return `منذ ${Math.floor(diffDays / 30)} أشهر`;
        return `منذ ${Math.floor(diffDays / 365)} سنة`;
    }

    function formatFullDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        const options = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit',
            locale: 'ar-EG'
        };
        return date.toLocaleDateString('ar-EG', options);
    }

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    window.likeReview = async function(reviewId) {
        if (!currentProduct) return;
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (!user.name && !user.email) {
            alert('يجب تسجيل الدخول أولاً');
            return;
        }
        
        const productId = currentProduct._id || currentProduct.id;
        const token = localStorage.getItem('token');
        const btn = document.querySelector(`button[data-review-id="${reviewId}"]`);
        
        if (!btn) return;
        
        // Add animation class
        btn.classList.add('like-animating');
        
        try {
            // Try API first
            if (token) {
                const response = await fetch(`/api/products/${productId}/reviews/${reviewId}/like`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    window.cachedReviews = null; // Clear cache to refresh
                    loadReviews();
                    return;
                }
            }
        } catch (error) {
            console.log('API not available, using localStorage');
            btn.classList.remove('like-animating');
        }
        
        // Fallback to localStorage
        const reviews = JSON.parse(localStorage.getItem(`reviews_${productId}`) || '[]');
        const review = reviews.find(r => r._id === reviewId);
        if (review) {
            review.likes = (review.likes || 0) + 1;
            localStorage.setItem(`reviews_${productId}`, JSON.stringify(reviews));
            loadReviews();
        }
        btn.classList.remove('like-animating');
    };

    window.likeComment = async function(commentId) {
        if (!currentProduct) return;
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (!user.name && !user.email) {
            alert('يجب تسجيل الدخول أولاً');
            return;
        }
        
        const productId = currentProduct._id || currentProduct.id;
        const token = localStorage.getItem('token');
        const btn = document.querySelector(`button[data-comment-id="${commentId}"]`);
        
        if (!btn) return;
        
        // Add animation class
        btn.classList.add('like-animating');
        
        try {
            // Try API first
            if (token) {
                const response = await fetch(`/api/products/${productId}/comments/${commentId}/like`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    window.cachedComments = null; // Clear cache to refresh
                    loadComments();
                    return;
                }
            }
        } catch (error) {
            console.log('API not available, using localStorage');
            btn.classList.remove('like-animating');
        }
        
        // Fallback to localStorage
        const comments = JSON.parse(localStorage.getItem(`comments_${productId}`) || '[]');
        const comment = comments.find(c => c._id === commentId);
        if (comment) {
            comment.likes = (comment.likes || 0) + 1;
            localStorage.setItem(`comments_${productId}`, JSON.stringify(comments));
            loadComments();
        }
        btn.classList.remove('like-animating');
    };

    // Star Rating Input Handler
    function setupStarRating() {
        const stars = document.querySelectorAll('.star-rating-input i');
        const ratingInput = document.getElementById('review-rating');
        
        stars.forEach((star, index) => {
            star.addEventListener('click', () => {
                const rating = index + 1;
                if (ratingInput) ratingInput.value = rating;
                
                stars.forEach((s, i) => {
                    if (i < rating) {
                        s.classList.remove('far');
                        s.classList.add('fas', 'active');
                    } else {
                        s.classList.remove('fas', 'active');
                        s.classList.add('far');
                    }
                });
            });
            
            star.addEventListener('mouseenter', () => {
                const rating = index + 1;
                stars.forEach((s, i) => {
                    if (i < rating) {
                        s.classList.add('fas');
                        s.classList.remove('far');
                    } else {
                        s.classList.add('far');
                        s.classList.remove('fas');
                    }
                });
            });
        });
        
        const starContainer = document.querySelector('.star-rating-input');
        if (starContainer) {
            starContainer.addEventListener('mouseleave', () => {
                const currentRating = parseInt(ratingInput?.value || 0);
                stars.forEach((s, i) => {
                    if (i < currentRating) {
                        s.classList.add('fas', 'active');
                        s.classList.remove('far');
                    } else {
                        s.classList.add('far');
                        s.classList.remove('fas', 'active');
                    }
                });
            });
        }
    }

    // Initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            init();
            setupStarRating();
            
            const reviewForm = document.getElementById('review-form');
            if (reviewForm) reviewForm.addEventListener('submit', submitReview);
            
            const commentForm = document.getElementById('comment-form');
            if (commentForm) commentForm.addEventListener('submit', submitComment);
            
            setTimeout(loadRelatedProducts, 1000);
        });
    } else {
        init();
        setupStarRating();
        
        const reviewForm = document.getElementById('review-form');
        if (reviewForm) reviewForm.addEventListener('submit', submitReview);
        
        const commentForm = document.getElementById('comment-form');
        if (commentForm) commentForm.addEventListener('submit', submitComment);
        
        setTimeout(loadRelatedProducts, 1000);
    }

})();
