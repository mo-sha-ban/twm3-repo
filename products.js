// Products Management Module for Dashboard
(function() {
    'use strict';

    // Global variables
    let currentEditingProductId = null;
    let products = [];
    
    // Initialize global window variables for image handling
    window.primaryImageFile = null;
    window.primaryImageRemoved = false;
    window.existingPrimaryImageUrl = null;
    window.mediaItems = [];
    window.quill = null;

    // Initialize products module
    function initProducts() {
        console.log('Initializing Products module...');
        
        // Register video blot BEFORE initializing Quill
        const BlockEmbed = Quill.import('blots/block/embed');
        class VideoBlot extends BlockEmbed {
            static create(url) {
                let node = super.create();
                node.setAttribute('src', url);
                node.setAttribute('controls', 'true');
                node.setAttribute('preload', 'metadata');
                node.setAttribute('playsinline', 'true');
                node.style.maxWidth = '100%';
                node.style.borderRadius = '8px';
                node.style.display = 'block';
                node.style.margin = '10px 0';
                
                const source = document.createElement('source');
                source.setAttribute('src', url);
                source.setAttribute('type', 'video/quicktime');
                node.appendChild(source);
                
                console.log('🎥 VideoBlot.create called with URL:', url);
                return node;
            }

            static value(node) {
                return node.getAttribute('src');
            }
        }
        VideoBlot.blotName = 'video';
        VideoBlot.tagName = 'video';
        try {
            Quill.register(VideoBlot);
            console.log('✅ VideoBlot registered globally');
        } catch (e) {
            console.warn('⚠️ VideoBlot already registered:', e.message);
        }
        
        setupEventListeners();
        loadProducts();
        console.log('Products module initialized');
    }

    // Setup event listeners
    function initQuill() {
        const editorElement = document.getElementById('productLongDescription');
        if (editorElement && typeof Quill !== 'undefined') {
            if (window.quill) return; // Already initialized
            editorElement.innerHTML = ''; // Clear any existing content

            // VideoBlot should already be registered by initProducts()
            // If not already registered, do it here
            try {
                Quill.import('formats/video');
            } catch (e) {
                console.warn('⚠️ Video blot not found, will register in initQuill');
            }

            window.quill = new Quill('#productLongDescription', {
                theme: 'snow',
                modules: {
                    toolbar: [
                        [{ 'header': [1, 2, 3, false] }],
                        ['bold', 'italic', 'underline', 'strike'],
                        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                        [{ 'script': 'sub'}, { 'script': 'super' }],
                        [{ 'indent': '-1'}, { 'indent': '+1' }],
                        [{ 'direction': 'rtl' }],
                        [{ 'color': [] }, { 'background': [] }],
                        [{ 'align': [] }],
                        ['link', 'image', 'video'],
                        ['clean']
                    ]
                },
                placeholder: 'اكتب وصف المنتج هنا...'
            });
            
            // Add custom upload video handler
            addQuillVideoUploadHandler();
        }
    }

    // Add Quill video upload handler
    function addQuillVideoUploadHandler() {
        if (!window.quill) return;
        
        // Try to find video button in toolbar
        const toolbar = document.querySelector('.ql-toolbar');
        if (toolbar) {
            // Create custom button if not found
            const videoBtnGroup = document.createElement('span');
            videoBtnGroup.className = 'ql-formats';
            const uploadVideoBtn = document.createElement('button');
            uploadVideoBtn.type = 'button';
            uploadVideoBtn.className = 'ql-uploadVideo';
            uploadVideoBtn.title = 'رفع فيديو محلي';
            uploadVideoBtn.innerHTML = '<i class="fas fa-video" style="font-size: 14px;"></i>';
            uploadVideoBtn.onclick = (e) => {
                e.preventDefault();
                openQuillVideoUploadDialog();
            };
            videoBtnGroup.appendChild(uploadVideoBtn);
            toolbar.appendChild(videoBtnGroup);
        }
    }

    // Open video upload dialog for Quill
    function openQuillVideoUploadDialog() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'video/*';
        input.onchange = async function(e) {
            const file = e.target.files[0];
            if (!file) return;
            
            // Check if file format is supported
            const supportedFormats = ['.mp4', '.webm', '.ogg', '.ogv', '.avi', '.mkv'];
            const fileName = file.name.toLowerCase();
            
            if (fileName.endsWith('.mov')) {
                alert('⚠️ تحذير: صيغة MOV غير مدعومة في جميع المتصفحات!\n\nيرجى استخدام صيغة MP4 بدلاً منها للحصول على أفضل توافقية.\n\nيمكنك تحويل الملف باستخدام:\n- VLC Media Player\n- FFmpeg\n- Online converters');
                return;
            }
            
            console.log('🎬 Quill video upload started:', file.name, 'size:', file.size);
            
            // Upload the video using the correct endpoint
            const formData = new FormData();
            formData.append('file', file);
            
            try {
                const token = localStorage.getItem('token');
                const response = await fetch('/api/uploads/lesson-asset', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData
                });
                
                const data = await response.json();
                if (data.success && data.url) {
                    console.log('✅ Video uploaded to lesson-assets:', data.url);

                    // Get the current cursor position
                    const range = window.quill.getSelection(true);
                    if (range) {
                        console.log('🎬 Attempting to insert video embed at index', range.index);
                        
                        // Simple approach: add newline, then insert video element directly
                        window.quill.insertText(range.index, '\n');
                        
                        // Get the new range after inserting newline
                        const newRange = window.quill.getSelection(true);
                        console.log('📍 New range after newline:', newRange);
                        
                        // Insert the video using insertEmbed
                        try {
                            window.quill.insertEmbed(newRange.index + 1, 'video', data.url, Quill.sources.USER);
                            console.log('✅ Video embed inserted successfully');
                            
                            // Add another newline after
                            window.quill.insertText(newRange.index + 2, '\n');
                            window.quill.setSelection(newRange.index + 3);
                            
                            // Log the HTML
                            console.log('📝 Editor HTML after insert:');
                            console.log(window.quill.root.innerHTML.substring(0, 500));
                        } catch (err) {
                            console.error('❌ insertEmbed failed:', err);
                        }
                    }
                } else {
                    alert('❌ فشل رفع الفيديو: ' + (data.error || 'خطأ غير معروف'));
                    console.error('❌ Upload response:', data);
                }
            } catch (error) {
                console.error('❌ Error uploading video to Quill:', error);
                alert('❌ خطأ في رفع الفيديو: ' + error.message);
            }
        };
        input.click();
    }

    function setupEventListeners() {
        const addBtn = document.getElementById('add-product-button');
        if (addBtn) {
            console.log('setupEventListeners: add-product-button found');
            addBtn.addEventListener('click', (e) => {
                console.log('add-product-button clicked', e);
                if (typeof openAddProductModal === 'function') {
                    openAddProductModal(e);
                } else {
                    console.warn('openAddProductModal is not a function at click time');
                }
            });
        } else {
            console.warn('setupEventListeners: add-product-button NOT found');
        }

        const form = document.getElementById('addProductForm');
        if (form) {
            console.log('setupEventListeners: addProductForm found');
            form.addEventListener('submit', (e) => {
                console.log('addProductForm submit');
                handleProductSubmit(e);
            });
        } else {
            console.warn('setupEventListeners: addProductForm NOT found');
        }

        // Add multi-media input handlers (images, videos, pdfs)
        
        // Create image input (accepts multiple images)
        let imageInput = document.getElementById('productImageInput');
        if (!imageInput) {
            imageInput = document.createElement('input');
            imageInput.type = 'file';
            imageInput.id = 'productImageInput';
            imageInput.multiple = true;
            imageInput.accept = 'image/*';
            imageInput.style.display = 'none';
            document.body.appendChild(imageInput);
        }
        
        // Create video input (accepts multiple videos)
        let videoInput = document.getElementById('productVideoInput');
        if (!videoInput) {
            videoInput = document.createElement('input');
            videoInput.type = 'file';
            videoInput.id = 'productVideoInput';
            videoInput.multiple = true;
            videoInput.accept = 'video/*';
            videoInput.style.display = 'none';
            document.body.appendChild(videoInput);
        }
        
        // Add images button trigger
        const addImagesBtn = document.getElementById('addImagesBtn');
        if (addImagesBtn) {
            addImagesBtn.addEventListener('click', () => imageInput.click());
        }
        
        // Add videos button trigger
        const addVideosBtn = document.getElementById('addVideosBtn');
        if (addVideosBtn) {
            addVideosBtn.addEventListener('click', () => videoInput.click());
        }
        
        // Handle image selection
        imageInput.addEventListener('change', function(e) {
            if (!window.mediaItems) window.mediaItems = [];
            const files = Array.from(e.target.files);
            let firstImageFile = null;
            files.forEach((file, idx) => {
                if (file.type.startsWith('image/')) {
                    if (!firstImageFile) firstImageFile = file;
                    const id = Date.now() + Math.random();
                    const previewUrl = URL.createObjectURL(file);
                    window.mediaItems.push({ id, type: 'image', file, previewUrl });
                }
            });
            
            // Set first image as primary image if no primary image is selected yet
            if (firstImageFile && !window.primaryImageFile) {
                window.primaryImageFile = firstImageFile;
                const reader = new FileReader();
                reader.onload = function(event) {
                    const img = document.getElementById('primaryImageImg');
                    const slot = document.getElementById('primaryImageSlot');
                    const preview = document.getElementById('primaryImagePreview');
                    if (img && slot && preview) {
                        img.src = event.target.result;
                        slot.style.display = 'none';
                        preview.style.display = 'block';
                    }
                };
                reader.readAsDataURL(firstImageFile);
            }
            
            if (typeof window.renderMediaGrid === 'function') window.renderMediaGrid();
            imageInput.value = ''; // Reset input for next selection
        });
        
        // Handle video selection
        videoInput.addEventListener('change', function(e) {
            if (!window.mediaItems) window.mediaItems = [];
            const files = Array.from(e.target.files);
            files.forEach((file, idx) => {
                if (file.type.startsWith('video/')) {
                    const id = Date.now() + Math.random();
                    const previewUrl = URL.createObjectURL(file);
                    window.mediaItems.push({ id, type: 'video', file, previewUrl });
                }
            });
            
            if (typeof window.renderMediaGrid === 'function') window.renderMediaGrid();
            videoInput.value = ''; // Reset input for next selection
        });
        
        setupPrimaryImageHandling();

        const searchInput = document.getElementById('productSearch');
        if (searchInput) {
            searchInput.addEventListener('input', filterProducts);
        }

        const filterSelect = document.getElementById('productFilter');
        if (filterSelect) {
            filterSelect.addEventListener('change', filterProducts);
        }
    }

    function handlePrimaryImageUpload(event) {
        const input = event.target;
        const slot = document.getElementById('primaryImageSlot');
        const preview = document.getElementById('primaryImagePreview');
        const img = document.getElementById('primaryImageImg');

        if (input.files && input.files[0] && slot && preview && img) {
            const reader = new FileReader();
            reader.onload = function(e) {
                img.src = e.target.result;
                slot.style.display = 'none';
                preview.style.display = 'block';
            };
            reader.readAsDataURL(input.files[0]);
        }
    }

    function removePrimaryImage() {
        const input = document.getElementById('primaryImage');
        const slot = document.getElementById('primaryImageSlot');
        const preview = document.getElementById('primaryImagePreview');
        const img = document.getElementById('primaryImageImg');

        if (input) input.value = '';
        if (img) img.src = '';
        if (slot) slot.style.display = 'block';
        if (preview) preview.style.display = 'none';
        window.primaryImageRemoved = true; // Flag for deletion
        window.primaryImageFile = null; // Clear any selected file
    }

    function setupPrimaryImageHandling() {
        // Setup primary image input
        const primaryImageInput = document.getElementById('primaryImage');
        const primarySlot = document.getElementById('primaryImageSlot');
        
        if (primarySlot && primaryImageInput) {
            primarySlot.addEventListener('click', () => primaryImageInput.click());
            primaryImageInput.addEventListener('change', function(e) {
                if (e.target.files && e.target.files[0]) {
                    const file = e.target.files[0];
                    // Store the primary image file for uploading later
                    window.primaryImageFile = file;
                    window.primaryImageRemoved = false; // A new file was chosen, so don't remove
                    const reader = new FileReader();
                    reader.onload = function(event) {
                        const img = document.getElementById('primaryImageImg');
                        const slot = document.getElementById('primaryImageSlot');
                        const preview = document.getElementById('primaryImagePreview');
                        if (img) {
                            img.src = event.target.result;
                            img.style.display = 'block';
                        }
                        if (slot) slot.style.display = 'none';
                        if (preview) preview.style.display = 'block';
                        console.log('Primary image file stored and displayed:', file.name);
                    };
                    reader.readAsDataURL(file);
                }
            });
        }
    }

    function resetProductModal() {
        // Reset primary image
        const primaryInput = document.getElementById('primaryImage');
        const slot = document.getElementById('primaryImageSlot');
        const preview = document.getElementById('primaryImagePreview');
        const img = document.getElementById('primaryImageImg');
        
        if (primaryInput) primaryInput.value = '';
        if (img) img.src = '';
        if (slot) slot.style.display = 'block';
        if (preview) preview.style.display = 'none';
        window.primaryImageFile = null; // Clear primary image file
        window.existingPrimaryImageUrl = null; // Clear existing image URL

        // Reset media items
        if (window.mediaItems && typeof window.renderMediaGrid === 'function') {
            window.mediaItems = [];
            window.renderMediaGrid();
        }

        const form = document.getElementById('addProductForm');
        if (form) {
            form.reset();
        }
    }

    function openAddProductModal() {
        console.log('openAddProductModal: called');
        currentEditingProductId = null;
        window.primaryImageRemoved = false; // Reset flag
        const title = document.getElementById('productModalTitle');
        if (title) title.textContent = 'إضافة منتج جديد';

        resetProductModal();
        initQuill();
        openModal('productModal');
        setTimeout(() => { if (window.quill) window.quill.focus(); }, 100);
    }

    function openEditProductModal(productId) {
        console.log('openEditProductModal: called with', productId);
        const product = products.find(p => p._id === productId);
        if (!product) return;

        currentEditingProductId = productId;
        window.primaryImageRemoved = false; // Reset flag
        document.getElementById('productModalTitle').textContent = 'تعديل المنتج';

        // Clear media items and primary image file first
        window.mediaItems = [];
        window.primaryImageFile = null;
        const form = document.getElementById('addProductForm');
        if (form) form.reset();

        // Fill form
        document.getElementById('productName').value = product.name || '';
        document.getElementById('productDescription').value = product.description || '';
        initQuill();
        if (window.quill) window.quill.root.innerHTML = product.long_description || '';
        document.getElementById('productPrice').value = product.price || '';
        document.getElementById('productRating').value = product.rating || '';
        document.getElementById('productCategory').value = product.category || '';
        document.getElementById('productInStock').checked = product.inStock !== false;
        document.getElementById('productFeatured').checked = product.featured || false;

        // Load primary image AFTER clearing form
        if (product.image) {
            loadPrimaryImage(product.image);
        }

        if (window.mediaItems && typeof window.renderMediaGrid === 'function') {
            // Build mediaItems from existing product data (support both old 'media' and current images/video/links)
            const items = [];

            // DO NOT add primary image to media items - it's handled separately!
            // The primary image should only be in the primary image field

            // additional images from product.images (img1..img6)
            if (product.images && typeof product.images === 'object') {
                for (let i = 1; i <= 6; i++) {
                    const key = 'img' + i;
                    const url = product.images[key];
                    if (url && url !== product.image) {
                        items.push({ id: Date.now() + Math.random(), type: 'image', url });
                    }
                }
            }

            // Media field - only add items that have valid URLs (not profile.png defaults)
            if (product.media && Array.isArray(product.media)) {
                console.log('openEditProductModal: Loading media items, count=', product.media.length);
                product.media.forEach((item, idx) => {
                    // Skip items that are profile.png defaults or don't have proper URLs
                    if (item && item.type && item.url && !item.url.includes('/img/profile.png')) {
                        console.log(`  Media[${idx}]: type=${item.type}, url=${item.url}`);
                        items.push({ id: Date.now() + Math.random(), type: item.type, url: item.url });
                    } else {
                        console.warn(`  Media[${idx}]: SKIPPED - invalid or profile.png default`, item);
                    }
                });
            }

            // Video field
            if (product.video) {
                let type = 'link';
                if (typeof product.video === 'string') {
                    if (product.video.includes('youtube.com') || product.video.includes('youtu.be')) type = 'youtube';
                    else if (product.video.match(/\.(mp4|mov|avi|webm)$/i)) type = 'video';
                }
                items.push({ id: Date.now() + Math.random(), type, url: product.video });
            }

            // Links
            if (product.links && Array.isArray(product.links)) {
                product.links.forEach(link => {
                    if (link && link.url) items.push({ id: Date.now() + Math.random(), type: 'link', url: link.url });
                });
            }

            window.mediaItems = items;
            window.renderMediaGrid();
        }

        openModal('productModal');
        setTimeout(() => { if (window.quill) window.quill.focus(); }, 100);
    }

    function loadPrimaryImage(imageUrl) {
        const slot = document.getElementById('primaryImageSlot');
        const preview = document.getElementById('primaryImagePreview');
        const img = document.getElementById('primaryImageImg');

        if (slot && preview && img) {
            slot.style.display = 'none';
            preview.style.display = 'block';
            img.src = imageUrl;
            // Clear file since we're loading existing image URL
            window.primaryImageFile = null;
            window.existingPrimaryImageUrl = imageUrl;
        }
    }

    async function handleProductSubmit(e) {
        e.preventDefault();

        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'جاري الحفظ...';

        try {
            const formData = new FormData();

            formData.append('name', document.getElementById('productName').value.trim());
            formData.append('description', document.getElementById('productDescription').value.trim());
            
            // Get long description from Quill editor
            let longDesc = '';
            if (window.quill) {
                longDesc = window.quill.root.innerHTML || '';
                console.log('📝 Quill HTML before submit:', longDesc.substring(0, 300));
                // Also log the Delta to see what's in the editor
                const delta = window.quill.getContents();
                console.log('📋 Quill Delta:', JSON.stringify(delta).substring(0, 300));
            } else {
                const editorElement = document.getElementById('productLongDescription');
                if (editorElement) {
                    longDesc = editorElement.innerHTML || '';
                }
            }
            console.log('handleProductSubmit: long_description length=', longDesc.length);
            formData.append('long_description', longDesc);
            
            formData.append('price', document.getElementById('productPrice').value.trim());
            formData.append('rating', document.getElementById('productRating').value || '0');
            formData.append('category', document.getElementById('productCategory').value.trim());
            formData.append('inStock', document.getElementById('productInStock').checked);
            formData.append('featured', document.getElementById('productFeatured').checked);

            // Check for primary image file from either input or window variable
            const primaryImageInput = document.getElementById('primaryImage');
            const primaryImageFile = window.primaryImageFile || (primaryImageInput && primaryImageInput.files[0]);

            console.log('handleProductSubmit: primaryImageFile=', primaryImageFile?.name || 'undefined');
            console.log('handleProductSubmit: window.primaryImageFile=', window.primaryImageFile?.name || 'undefined');

            if (primaryImageFile) {
                console.log('Appending primary image:', primaryImageFile.name);
                formData.append('image', primaryImageFile);
            } else if (window.primaryImageRemoved) {
                console.log('Appending empty image (removal signal)');
                formData.append('image', ''); // Signal to backend to remove image
            } else {
                console.log('No primary image file to send');
            }
            // If no new file and not removed, don't send image field, so it stays the same


            // Upload all image files and set their URLs
            let mediaItems = window.mediaItems || [];
            
            console.log('handleProductSubmit: Starting media upload', {
                totalItems: mediaItems.length,
                items: mediaItems.map(m => ({type: m.type, hasFile: !!m.file, hasUrl: !!m.url, fileName: m.file?.name}))
            });
            
            // Filter out the primary image file from media items to avoid uploading it twice
            const mainImageFile = window.primaryImageFile;
            if (mainImageFile) {
                mediaItems = mediaItems.filter(item => item.file !== mainImageFile);
            }
            
            console.log('handleProductSubmit: After filtering primary image', {
                totalItems: mediaItems.length
            });
            
            for (let i = 0; i < mediaItems.length; i++) {
                const item = mediaItems[i];
                if (item.file && !item.url) {
                    console.log(`handleProductSubmit: Uploading media [${i}] - type: ${item.type}, file: ${item.file.name}`);
                    const imgForm = new FormData();
                    imgForm.append('file', item.file);
                    try {
                        const uploadRes = await fetch('/api/uploads/lesson-asset', {
                            method: 'POST',
                            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                            body: imgForm
                        });
                        const uploadData = await uploadRes.json();
                        console.log(`handleProductSubmit: Upload response [${i}]`, uploadData);
                        if (uploadData && uploadData.url) {
                            item.url = uploadData.url;
                            console.log(`✅ Media [${i}] uploaded successfully: ${uploadData.url}`);
                        } else if (uploadData.error) {
                            console.error(`❌ Upload error [${i}]: ${uploadData.error}`);
                        }
                    } catch (uploadErr) {
                        console.error(`❌ Upload failed [${i}]:`, uploadErr);
                    }
                }
            }
            // Build media array with URLs only
            const uploadedMedia = mediaItems.filter(m => m.url).map(m => ({ type: m.type, url: m.url }));
            console.log('handleProductSubmit: Final media array', uploadedMedia);
            formData.append('media', JSON.stringify(uploadedMedia));

            // Log FormData entries
            console.log('FormData entries:');
            for (let [key, value] of formData.entries()) {
                if (value instanceof File) {
                    console.log(`  ${key}: File(${value.name}, ${value.size} bytes)`);
                } else {
                    console.log(`  ${key}: ${value}`);
                }
            }

            const token = localStorage.getItem('token');
            const method = currentEditingProductId ? 'PUT' : 'POST';
            const url = currentEditingProductId ? `/api/products/${currentEditingProductId}` : '/api/products';

            const response = await fetch(url, {
                method: method,
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || errorData.error || 'فشل في حفظ المنتج');
            }

            alert(currentEditingProductId ? 'تم تحديث المنتج بنجاح!' : 'تم إضافة المنتج بنجاح!');
            closeProductModal();
            loadProducts();

        } catch (error) {
            console.error('Error saving product:', error);
            alert(`خطأ: ${error.message}`);
        } finally {
            if(submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        }
    }

    async function loadProducts() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/products', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) { throw new Error('فشل في جلب المنتجات'); }
            products = await response.json();
            renderProducts(products);
        } catch (error) {
            console.error('Error loading products:', error);
            const tbody = document.getElementById('products-table');
            if(tbody) tbody.innerHTML = `<tr><td colspan="10">خطأ في تحميل المنتجات: ${error.message}</td></tr>`;
        }
    }

    function renderProducts(productsToRender) {
        const tbody = document.getElementById('products-table');
        if (!tbody) return;
        tbody.innerHTML = '';
        if (!productsToRender || productsToRender.length === 0) {
            tbody.innerHTML = '<tr><td colspan="10">لا توجد منتجات</td></tr>';
            return;
        }
        productsToRender.forEach((product, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td><img src="${product.image || '/assets/default-product.svg'}" alt="${product.name}" class="product-thumb" onerror="this.onerror=null;this.src='/assets/default-product.svg'"></td>
                <td>${escapeHtml(product.name || '')}</td>
                <td>${escapeHtml(product.description || '').substring(0, 50)}...</td>
                <td>${product.price || 0} ج.م</td>
                <td><div class="rating">${renderStars(product.rating || 0)}<span>(${product.rating || 0})</span></div></td>
                <td>${escapeHtml(product.category || '')}</td>
                <td><span class="status ${product.inStock ? 'active' : 'inactive'}">${product.inStock ? 'متوفر' : 'غير متوفر'}</span></td>
                <td>
                    <button class="btn btn-primary btn-sm btn-edit" data-id="${product._id}"><i class="fas fa-edit"></i> تعديل</button>
                    <button class="btn btn-danger btn-sm btn-delete" data-id="${product._id}"><i class="fas fa-trash"></i> حذف</button>
                </td>
            `;
            tbody.appendChild(row);
            // Attach click handlers for edit/delete to avoid relying on inline globals
            const editBtn = row.querySelector('.btn-edit');
            if (editBtn) editBtn.addEventListener('click', () => { console.log('Edit button clicked for', product._id); openEditProductModal(product._id); });
            const delBtn = row.querySelector('.btn-delete');
            if (delBtn) delBtn.addEventListener('click', () => { console.log('Delete button clicked for', product._id); deleteProduct(product._id); });
        });
    }

    function renderStars(rating) {
        let stars = '';
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;
        for (let i = 0; i < fullStars; i++) { stars += '<i class="fas fa-star"></i>'; }
        if (hasHalfStar) { stars += '<i class="fas fa-star-half-alt"></i>'; }
        const emptyStars = 5 - Math.ceil(rating);
        for (let i = 0; i < emptyStars; i++) { stars += '<i class="far fa-star"></i>'; }
        return stars;
    }

    function filterProducts() {
        const searchTerm = document.getElementById('productSearch')?.value.toLowerCase() || '';
        const filterValue = document.getElementById('productFilter')?.value || 'all';
        let filtered = products.filter(p =>
            (p.name?.toLowerCase().includes(searchTerm) || p.description?.toLowerCase().includes(searchTerm) || p.category?.toLowerCase().includes(searchTerm)) &&
            (filterValue === 'all' || (filterValue === 'available' && p.inStock) || (filterValue === 'unavailable' && !p.inStock) || (filterValue === 'featured' && p.featured))
        );
        renderProducts(filtered);
    }

    async function deleteProduct(productId) {
        if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) return;
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/products/${productId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || errorData.error || 'فشل في حذف المنتج');
            }
            alert('تم حذف المنتج بنجاح!');
            loadProducts();
        } catch (error) {
            console.error('Error deleting product:', error);
            alert(`خطأ: ${error.message}`);
        }
    }

    function closeProductModal() {
        closeModal('productModal');
        currentEditingProductId = null;
        window.primaryImageFile = null;
        window.existingPrimaryImageUrl = null;
        // Destroy Quill instance
        if (window.quill) {
            window.quill = null;
        }
    }

    function escapeHtml(text) {
        if (typeof text !== 'string') return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'flex';
            modal.classList.add('show');
            // temporarily ensure modal is above other elements
            modal.style.zIndex = '100000';
            document.body.classList.add('modal-open');
            try {
                const cs = window.getComputedStyle(modal);
                console.log(`openModal: ${modalId} style.display=${modal.style.display}, computed=${cs.display}, hasShow=${modal.classList.contains('show')}`);
                const rect = modal.getBoundingClientRect();
                console.log(`openModal: ${modalId} rect`, rect);
                const content = modal.querySelector('.modal-content');
                if (content) {
                    content.setAttribute('tabindex', '-1');
                    // Give focus and scroll to modal content
                    try { content.focus(); } catch (e) {}
                    try { content.scrollIntoView({ behavior: 'auto', block: 'center' }); } catch (e) {}
                }
            } catch (e) { console.warn('openModal: unable to compute style rect', e); }
        }
    }

    function closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            modal.classList.remove('show');
            modal.style.zIndex = '';
            document.body.classList.remove('modal-open');
            console.log(`closeModal: ${modalId} closed`);
        }
    }

    // --- Expose functions to global scope ---
    window.initProducts = initProducts;
    window.openAddProductModal = openAddProductModal;
    window.editProduct = openEditProductModal;
    window.deleteProduct = deleteProduct;
    window.closeProductModal = closeProductModal;
    window.removePrimaryImage = removePrimaryImage;
    // Stubs for old functions that might be called by old HTML, to prevent errors
    window.removeProductImage = () => console.warn('removeProductImage is deprecated');
    window.addNewImageSlot = () => console.warn('addNewImageSlot is deprecated');
    window.removeProductVideo = () => console.warn('removeProductVideo is deprecated');
    window.removeYoutubeUrl = () => console.warn('removeYoutubeUrl is deprecated');
    window.removeAdditionalImage = () => console.warn('removeAdditionalImage is deprecated');

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initProducts);
    } else {
        initProducts();
    }
})();