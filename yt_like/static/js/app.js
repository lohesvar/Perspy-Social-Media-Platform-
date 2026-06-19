// VibeFlow Client Application Logic

document.addEventListener('DOMContentLoaded', () => {
    // --- STATE MANAGEMENT ---
    let currentUser = null;
    let userChannel = null; // Current user's channel if created
    let currentFeedMode = 'all'; // 'all', 'long', 'short', 'subscribed', 'channel'
    let activeFilter = 'all'; // 'all', 'long', 'short', 'text' (local filter for 'all' mode)
    let searchVal = '';
    let activeChannelId = null; // Filter feed by specific channel ID
    
    // Shorts/Reels state
    let shortPosts = [];
    let activeShortIndex = 0;

    // --- DOM ELEMENTS ---
    const body = document.body;
    const authPage = document.getElementById('auth-page');
    const loginForm = document.getElementById('login-form');
    const emailInput = document.getElementById('email-input');
    const loginTriggerBtn = document.getElementById('login-trigger-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const profileContainer = document.getElementById('profile-container');
    const profileMenuBtn = document.getElementById('profile-menu-btn');
    const profileDropdown = document.getElementById('profile-dropdown');
    const dropdownEmail = document.getElementById('dropdown-email');
    const userAvatarChar = document.getElementById('user-avatar-char');
    const userDisplayName = document.getElementById('user-display-name');
    const createPostBtn = document.getElementById('create-post-btn');
    const headerLogoBtn = document.getElementById('header-logo-btn');

    // Sidebar & Navigation
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const navLinks = document.querySelectorAll('.nav-link');
    const myPostsLink = document.getElementById('my-posts-link');
    const subscribedChannelsList = document.getElementById('subscribed-channels-list');
    
    // Create Channel Selectors
    const createChannelModal = document.getElementById('create-channel-modal');
    const closeChannelModalBtn = document.getElementById('close-channel-modal-btn');
    const cancelChannelBtn = document.getElementById('cancel-channel-btn');
    const createChannelForm = document.getElementById('create-channel-form');
    const channelNameInput = document.getElementById('channel-name-input');
    const channelDescriptionInput = document.getElementById('channel-description-input');
    const channelAvatarInput = document.getElementById('channel-avatar-input');
    
    // Sidebar Channel links
    const createChannelNavLink = document.getElementById('create-channel-nav-link');
    const myChannelNavLink = document.getElementById('my-channel-nav-link');
    
    // Dropdown Channel buttons
    const createChannelDropdownBtn = document.getElementById('create-channel-dropdown-btn');
    const myChannelDropdownBtn = document.getElementById('my-channel-dropdown-btn');
    const channelDropdownDivider = document.getElementById('channel-dropdown-divider');

    // Channel Studio Selectors
    const channelStudioContainer = document.getElementById('channel-studio-container');
    const studioBanner = document.getElementById('studio-banner');
    const studioAvatarImg = document.getElementById('studio-avatar-img');
    const studioChannelName = document.getElementById('studio-channel-name');
    const studioSubscriberCount = document.getElementById('studio-subscriber-count');
    const studioTabs = document.querySelectorAll('.studio-tab');
    const studioPanels = document.querySelectorAll('.studio-panel');
    const studioFeedContainer = document.getElementById('studio-feed-container');
    const analyticsSubscribers = document.getElementById('analytics-subscribers');
    const analyticsViews = document.getElementById('analytics-views');
    const analyticsLikes = document.getElementById('analytics-likes');
    const analyticsComments = document.getElementById('analytics-comments');
    const analyticsTableBody = document.getElementById('analytics-table-body');
    const customizeChannelForm = document.getElementById('customize-channel-form');
    const customizeName = document.getElementById('customize-name');
    const customizeDescription = document.getElementById('customize-description');
    const customizeAvatar = document.getElementById('customize-avatar');
    const customizeBanner = document.getElementById('customize-banner');

    // Feed elements
    const filterBar = document.getElementById('filter-bar');
    const filterPills = document.querySelectorAll('.filter-pill');
    const feedContainer = document.getElementById('feed-container');
    const searchInput = document.getElementById('search-input');
    const clearSearchBtn = document.getElementById('clear-search');

    // Reels elements
    const shortsReelsContainer = document.getElementById('shorts-reels-container');
    const reelContainer = document.getElementById('reel-container');
    const shortPrevBtn = document.getElementById('short-prev-btn');
    const shortNextBtn = document.getElementById('short-next-btn');

    // Create Modal elements
    const createModal = document.getElementById('create-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const cancelPostBtn = document.getElementById('cancel-post-btn');
    const createPostForm = document.getElementById('create-post-form');
    const typeTabs = document.querySelectorAll('.type-tab');
    const postTypeInput = document.getElementById('post-type-input');
    const titleFieldGroup = document.getElementById('title-field-group');
    const mediaFieldGroup = document.getElementById('media-field-group');
    const thumbnailFieldGroup = document.getElementById('thumbnail-field-group');
    const contentLabelText = document.getElementById('content-label-text');
    const postTitle = document.getElementById('post-title');
    const postContent = document.getElementById('post-content');
    
    // Modal Resource toggle
    const tabUpload = document.getElementById('tab-upload');
    const tabUrl = document.getElementById('tab-url');
    const videoFileContainer = document.getElementById('video-file-container');
    const videoUrlContainer = document.getElementById('video-url-container');
    const postFileInput = document.getElementById('post-file-input');
    const postMediaUrl = document.getElementById('post-media-url');
    const selectedFileName = document.getElementById('selected-file-name');
    const postThumbnail = document.getElementById('post-thumbnail');

    // Progress Bar
    const progressContainer = document.getElementById('upload-progress-container');
    const progressBar = document.getElementById('progress-bar');
    const progressPercent = document.getElementById('progress-percent');

    // Comments Drawer elements
    const commentDrawer = document.getElementById('comment-drawer');
    const closeDrawerBtn = document.getElementById('close-drawer-btn');
    const commentsList = document.getElementById('comments-list');
    const commentForm = document.getElementById('comment-form');
    const commentInput = document.getElementById('comment-input');
    const commentPostId = document.getElementById('comment-post-id');
    const drawerCommentCount = document.getElementById('drawer-comment-count');

    // Theme Switch
    const themeToggle = document.getElementById('theme-toggle');
    const themeIconDark = document.querySelector('.theme-icon-dark');
    const themeIconLight = document.querySelector('.theme-icon-light');

    // --- INITIALIZATION ---
    checkAuthSession();
    loadThemePreference();
    initEventListeners();
    fetchAndRenderFeed();

    // --- THEME MANAGEMENT ---
    function loadThemePreference() {
        const cachedTheme = localStorage.getItem('theme') || 'dark';
        if (cachedTheme === 'light') {
            body.classList.remove('dark-mode');
            body.classList.add('light-mode');
            themeIconDark.classList.add('hidden');
            themeIconLight.classList.remove('hidden');
        } else {
            body.classList.remove('light-mode');
            body.classList.add('dark-mode');
            themeIconDark.classList.remove('hidden');
            themeIconLight.classList.add('hidden');
        }
    }

    function toggleTheme() {
        if (body.classList.contains('dark-mode')) {
            body.classList.remove('dark-mode');
            body.classList.add('light-mode');
            themeIconDark.classList.add('hidden');
            themeIconLight.classList.remove('hidden');
            localStorage.setItem('theme', 'light');
        } else {
            body.classList.remove('light-mode');
            body.classList.add('dark-mode');
            themeIconDark.classList.remove('hidden');
            themeIconLight.classList.add('hidden');
            localStorage.setItem('theme', 'dark');
        }
    }

    // --- SESSION HANDLER ---
    async function checkAuthSession() {
        try {
            const res = await fetch('/api/me');
            const data = await res.json();
            if (data.user) {
                setLoggedInUser(data.user);
            } else {
                setLoggedOut();
            }
        } catch (e) {
            console.error("Session check failed", e);
            setLoggedOut();
        }
    }

    async function setLoggedInUser(user) {
        currentUser = user;
        loginTriggerBtn.classList.add('hidden');
        profileContainer.classList.remove('hidden');
        createPostBtn.classList.remove('hidden');
        authPage.classList.add('hidden');
        
        // Update user elements
        userDisplayName.textContent = user.username;
        userAvatarChar.textContent = user.username.charAt(0).toUpperCase();
        dropdownEmail.textContent = user.email;
        
        // Check user's channel details
        await checkUserChannel();
        
        // Fetch subscriptions list
        fetchAndRenderSubscriptions();
    }

    async function checkUserChannel() {
        if (!currentUser) {
            userChannel = null;
            updateChannelUI();
            return;
        }
        try {
            const res = await fetch('/api/me/channel');
            const data = await res.json();
            userChannel = data.channel || null;
        } catch (e) {
            console.error("Failed to check user channel", e);
            userChannel = null;
        }
        updateChannelUI();
    }

    function updateChannelUI() {
        if (!currentUser) {
            createChannelNavLink.classList.add('hidden');
            myChannelNavLink.classList.add('hidden');
            createChannelDropdownBtn.classList.add('hidden');
            myChannelDropdownBtn.classList.add('hidden');
            channelDropdownDivider.classList.add('hidden');
            return;
        }

        if (userChannel) {
            // User has a channel
            createChannelNavLink.classList.add('hidden');
            myChannelNavLink.classList.remove('hidden');
            
            createChannelDropdownBtn.classList.add('hidden');
            myChannelDropdownBtn.classList.remove('hidden');
            channelDropdownDivider.classList.remove('hidden');
            
            // Customize user avatar with their channel avatar if they have one
            if (userChannel.avatar_path) {
                if (userChannel.avatar_path.startsWith('http') || userChannel.avatar_path.startsWith('/static')) {
                    userAvatarChar.innerHTML = `<img src="${userChannel.avatar_path}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
                } else {
                    userAvatarChar.textContent = userChannel.name.charAt(0).toUpperCase();
                }
                userDisplayName.textContent = userChannel.name;
            }
        } else {
            // User does not have a channel
            createChannelNavLink.classList.remove('hidden');
            myChannelNavLink.classList.add('hidden');
            
            createChannelDropdownBtn.classList.remove('hidden');
            myChannelDropdownBtn.classList.add('hidden');
            channelDropdownDivider.classList.remove('hidden');
            
            // Restore default character
            userAvatarChar.innerHTML = currentUser.username.charAt(0).toUpperCase();
            userDisplayName.textContent = currentUser.username;
        }
    }

    function setLoggedOut() {
        currentUser = null;
        userChannel = null;
        loginTriggerBtn.classList.remove('hidden');
        profileContainer.classList.add('hidden');
        createPostBtn.classList.add('hidden');
        
        // Hide channel items
        updateChannelUI();
        
        // Clear subscriptions list
        if (subscribedChannelsList) {
            subscribedChannelsList.innerHTML = '<div class="sidebar-no-channels">Log in to view channels</div>';
        }
    }

    // --- API & DATA FETCHING ---
    async function fetchAndRenderFeed() {
        // Pause any active videos before loading new feed
        stopAllVideos();

        if (currentFeedMode === 'short') {
            filterBar.classList.add('hidden');
            feedContainer.classList.add('hidden');
            channelStudioContainer.classList.add('hidden');
            shortsReelsContainer.classList.remove('hidden');
            
            // Render loading
            reelContainer.innerHTML = `
                <div class="loading-state">
                    <div class="spinner"></div>
                    <p>Loading shorts reels...</p>
                </div>
            `;
            
            try {
                const url = `/api/posts?type=short${searchVal ? '&q=' + encodeURIComponent(searchVal) : ''}`;
                const res = await fetch(url);
                const data = await res.json();
                shortPosts = data.posts || [];
                activeShortIndex = 0;
                renderShortsFeed();
            } catch (e) {
                console.error(e);
                reelContainer.innerHTML = `<div class="empty-state"><p>Could not load shorts</p></div>`;
            }
        } else if (currentFeedMode === 'channel' && userChannel && activeChannelId === userChannel.id) {
            // Personal Channel Studio view!
            shortsReelsContainer.classList.add('hidden');
            feedContainer.classList.add('hidden');
            filterBar.classList.add('hidden');
            channelStudioContainer.classList.remove('hidden');
            
            loadPersonalChannelStudio();
        } else {
            shortsReelsContainer.classList.add('hidden');
            channelStudioContainer.classList.add('hidden');
            feedContainer.classList.remove('hidden');
            
            if (currentFeedMode === 'all') {
                filterBar.classList.remove('hidden');
            } else {
                filterBar.classList.add('hidden'); // Mode is 'long', hide horizontal filter pills
            }

            feedContainer.innerHTML = `
                <div class="loading-state">
                    <div class="spinner"></div>
                    <p>Entering the flow...</p>
                </div>
            `;

            try {
                let url = '/api/posts';
                const params = [];
                
                if (currentFeedMode === 'long') {
                    params.push('type=long');
                } else if (currentFeedMode === 'all' && activeFilter !== 'all') {
                    params.push(`type=${activeFilter}`);
                } else if (currentFeedMode === 'subscribed') {
                    params.push('subscribed=true');
                } else if (currentFeedMode === 'channel' && activeChannelId) {
                    params.push(`channel_id=${activeChannelId}`);
                }
                
                if (searchVal) {
                    params.push(`q=${encodeURIComponent(searchVal)}`);
                }
                
                if (params.length > 0) {
                    url += '?' + params.join('&');
                }

                const res = await fetch(url);
                const data = await res.json();
                renderCardsFeed(data.posts || []);
            } catch (e) {
                console.error(e);
                feedContainer.innerHTML = `<div class="empty-state"><p>Could not load feed posts</p></div>`;
            }
        }
    }

    // --- RENDER GRID/LIST CARDS FEED ---
    function renderCardsFeed(posts, container = feedContainer) {
        container.innerHTML = '';
        if (posts.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-photo-film" style="font-size: 48px; margin-bottom: 16px;"></i>
                    <p>No content matches this feed. Be the first to upload!</p>
                </div>
            `;
            return;
        }

        posts.forEach(post => {
            const isText = post.type === 'text';
            const isShort = post.type === 'short';
            const card = document.createElement('article');
            card.className = `post-card ${isText ? 'text-variant' : ''}`;
            
            let thumbnailHTML = '';
            if (!isText) {
                const badgeText = isShort ? 'Short' : 'Long';
                const badgeClass = isShort ? 'badge-short' : 'badge-long';
                thumbnailHTML = `
                    <div class="card-thumbnail-wrapper" data-post-id="${post.id}">
                        <img class="card-thumbnail" src="${post.thumbnail_path || 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=500'}" alt="${post.title}" loading="lazy">
                        <span class="type-indicator-badge ${badgeClass}">${badgeText}</span>
                        <div class="play-overlay">
                            <div class="play-circle"><i class="fa-solid fa-play"></i></div>
                        </div>
                    </div>
                `;
            }

            // Build Subscribe Button if applicable
            let subscribeBtnHTML = '';
            if (currentUser && post.user_id !== currentUser.id && post.channel_id) {
                subscribeBtnHTML = `
                    <button class="btn-subscribe ${post.is_subscribed ? 'active' : ''}" data-channel-id="${post.channel_id}">
                        ${post.is_subscribed ? 'Subscribed' : 'Subscribe'}
                    </button>
                `;
            }

            const headerHTML = `
                <div class="card-header-row">
                    <div class="card-header-left">
                        <div class="card-author-avatar">${post.username.charAt(0).toUpperCase()}</div>
                        <div class="card-author-info">
                            <span class="card-username">${post.username}</span>
                            <span class="card-timestamp">${formatDate(post.created_at)}</span>
                        </div>
                    </div>
                    ${subscribeBtnHTML}
                </div>
            `;

            const actionsHTML = `
                <div class="card-actions">
                    <button class="action-item btn-like ${post.is_liked ? 'active' : ''}" data-post-id="${post.id}">
                        <i class="${post.is_liked ? 'fa-solid' : 'fa-regular'} fa-thumbs-up"></i>
                        <span class="like-count">${post.likes_count}</span>
                    </button>
                    <button class="action-item btn-comment" data-post-id="${post.id}">
                        <i class="fa-regular fa-comment"></i>
                        <span>${post.comments_count}</span>
                    </button>
                </div>
            `;

            card.innerHTML = `
                ${thumbnailHTML}
                <div class="card-body">
                    ${headerHTML}
                    ${post.title ? `<h3 class="card-title">${post.title}</h3>` : ''}
                    <div class="card-description">${post.content || ''}</div>
                    ${actionsHTML}
                </div>
            `;

            // Inline Play capability on hover/click
            if (!isText) {
                const thumbWrapper = card.querySelector('.card-thumbnail-wrapper');
                thumbWrapper.addEventListener('click', () => playVideoInline(thumbWrapper, post.media_path, post.id));
            } else {
                // Increment views for text post on render
                fetch(`/api/posts/${post.id}/view`, { method: 'POST' }).catch(() => {});
            }

            // Bind Actions
            const subBtn = card.querySelector('.btn-subscribe');
            if (subBtn) {
                subBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    handleSubscribeToggle(post.channel_id, subBtn);
                });
            }

            card.querySelector('.btn-like').addEventListener('click', (e) => {
                e.stopPropagation();
                handleLike(post.id, card.querySelector('.btn-like'));
            });

            card.querySelector('.btn-comment').addEventListener('click', (e) => {
                e.stopPropagation();
                openCommentDrawer(post.id);
            });

            container.appendChild(card);
        });
    }

    // --- VIDEO PLAYBACK (INLINE FEED) ---
    function playVideoInline(container, videoSrc, postId) {
        // Pause any other active inline videos
        stopAllVideos();

        if (postId) {
            fetch(`/api/posts/${postId}/view`, { method: 'POST' }).catch(() => {});
        }

        const video = document.createElement('video');
        video.src = videoSrc;
        video.className = 'card-video-player';
        video.controls = true;
        video.autoplay = true;
        
        container.innerHTML = '';
        container.appendChild(video);
        
        // Prevent clicking inside video controls from propagating
        video.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }

    // --- RENDER SHORTS VIEW ---
    function renderShortsFeed() {
        reelContainer.innerHTML = '';
        if (shortPosts.length === 0) {
            reelContainer.innerHTML = `
                <div class="empty-state" style="color: #ffffff;">
                    <i class="fa-solid fa-bolt" style="font-size: 48px; margin-bottom: 16px;"></i>
                    <p>No short reels found.</p>
                </div>
            `;
            return;
        }

        shortPosts.forEach((post, index) => {
            const item = document.createElement('div');
            item.className = `reel-item ${index === activeShortIndex ? 'active' : ''}`;
            item.dataset.index = index;

            let subBtnHTML = '';
            if (currentUser && post.user_id !== currentUser.id && post.channel_id) {
                subBtnHTML = `
                    <button class="btn-subscribe reel-subscribe-btn ${post.is_subscribed ? 'active' : ''}" data-channel-id="${post.channel_id}">
                        ${post.is_subscribed ? 'Subscribed' : 'Subscribe'}
                    </button>
                `;
            }

            item.innerHTML = `
                <video class="reel-video" loop src="${post.media_path}"></video>
                
                <div class="reel-play-indicator">
                    <i class="fa-solid fa-play"></i>
                </div>

                <div class="reel-overlay">
                    <div class="reel-overlay-content">
                        <div class="reel-author-row">
                            <div class="reel-avatar">${post.username.charAt(0).toUpperCase()}</div>
                            <span class="reel-username">${post.username}</span>
                            ${subBtnHTML}
                        </div>
                        <h4 class="reel-title">${post.title}</h4>
                        <p class="reel-description">${post.content || ''}</p>
                    </div>
                </div>

                <div class="reel-sidebar-actions">
                    <button class="reel-action-btn btn-like ${post.is_liked ? 'active' : ''}" data-post-id="${post.id}">
                        <div class="icon-circle"><i class="fa-solid fa-heart"></i></div>
                        <span class="like-count">${post.likes_count}</span>
                    </button>
                    <button class="reel-action-btn btn-comment" data-post-id="${post.id}">
                        <div class="icon-circle"><i class="fa-solid fa-comment"></i></div>
                        <span>${post.comments_count}</span>
                    </button>
                    <button class="reel-action-btn btn-share" data-url="${window.location.origin}${post.media_path}">
                        <div class="icon-circle"><i class="fa-solid fa-share-nodes"></i></div>
                        <span>Share</span>
                    </button>
                </div>
            `;

            // Bind click to play/pause reel
            const video = item.querySelector('.reel-video');
            const playIndicator = item.querySelector('.reel-play-indicator');
            
            video.addEventListener('click', () => {
                if (video.paused) {
                    video.play();
                    playIndicator.querySelector('i').className = 'fa-solid fa-play';
                } else {
                    video.pause();
                    playIndicator.querySelector('i').className = 'fa-solid fa-pause';
                }
                playIndicator.classList.remove('animate');
                void playIndicator.offsetWidth; // Trigger reflow to restart animation
                playIndicator.classList.add('animate');
            });

            // Bind Actions
            const subBtn = item.querySelector('.reel-subscribe-btn');
            if (subBtn) {
                subBtn.addEventListener('click', () => {
                    handleSubscribeToggle(post.channel_id, subBtn);
                });
            }

            item.querySelector('.btn-like').addEventListener('click', () => {
                handleLike(post.id, item.querySelector('.btn-like'));
            });

            item.querySelector('.btn-comment').addEventListener('click', () => {
                openCommentDrawer(post.id);
            });

            item.querySelector('.btn-share').addEventListener('click', (e) => {
                const url = e.currentTarget.dataset.url;
                navigator.clipboard.writeText(url);
                alert("Video link copied to clipboard!");
            });

            reelContainer.appendChild(item);
        });

        // Trigger autoplay on the current short
        playActiveShort();
    }

    function playActiveShort() {
        stopAllVideos();
        const activeItem = reelContainer.querySelector(`.reel-item[data-index="${activeShortIndex}"]`);
        if (activeItem) {
            const video = activeItem.querySelector('.reel-video');
            if (video) {
                video.currentTime = 0;
                video.play().catch(e => {
                    console.log("Autoplay blocked, waiting for user click.");
                });

                // Increment views for short reel
                const post = shortPosts[activeShortIndex];
                if (post) {
                    fetch(`/api/posts/${post.id}/view`, { method: 'POST' }).catch(() => {});
                }
            }
        }
    }

    function stopAllVideos() {
        // Stop inline grid players
        document.querySelectorAll('.card-video-player').forEach(video => {
            video.pause();
        });
        // Stop reels players
        document.querySelectorAll('.reel-video').forEach(video => {
            video.pause();
        });
    }

    // --- SHORTS NAVIGATION ---
    function navigateShort(direction) {
        if (shortPosts.length === 0) return;
        
        let newIndex = activeShortIndex + direction;
        if (newIndex < 0) {
            newIndex = shortPosts.length - 1; // loop back to end
        } else if (newIndex >= shortPosts.length) {
            newIndex = 0; // loop to start
        }

        const items = reelContainer.querySelectorAll('.reel-item');
        if (items[activeShortIndex]) items[activeShortIndex].classList.remove('active');
        
        activeShortIndex = newIndex;
        
        if (items[activeShortIndex]) {
            items[activeShortIndex].classList.add('active');
            playActiveShort();
        }
    }

    // --- CHANNEL STUDIO CONTROLLERS ---
    async function loadPersonalChannelStudio() {
        if (!userChannel) return;
        
        // 1. Populate studio header details
        studioChannelName.textContent = userChannel.name;
        
        // Populate banner
        if (userChannel.banner_path) {
            studioBanner.innerHTML = `<img class="studio-banner-img" src="${userChannel.banner_path}" alt="Channel Banner">`;
        } else {
            studioBanner.innerHTML = '';
            studioBanner.style.background = 'linear-gradient(135deg, #0b172a 0%, #1e293b 100%)';
        }
        
        // Populate avatar
        if (userChannel.avatar_path) {
            studioAvatarImg.innerHTML = `<img src="${userChannel.avatar_path}" alt="Avatar">`;
        } else {
            studioAvatarImg.innerHTML = userChannel.name.charAt(0).toUpperCase();
        }
        
        // Retrieve active tab
        const activeTab = document.querySelector('.studio-tab.active');
        const activeTabName = activeTab ? activeTab.dataset.tab : 'feed';
        
        // Show correct panel
        studioPanels.forEach(panel => {
            if (panel.id === `studio-tab-${activeTabName}`) {
                panel.classList.remove('hidden');
            } else {
                panel.classList.add('hidden');
            }
        });
        
        if (activeTabName === 'feed') {
            renderPersonalStudioFeed();
        } else if (activeTabName === 'analytics') {
            loadPersonalStudioAnalytics();
        } else if (activeTabName === 'customize') {
            populateCustomizeForm();
        }
    }

    async function renderPersonalStudioFeed() {
        studioFeedContainer.innerHTML = `
            <div class="loading-state">
                <div class="spinner"></div>
                <p>Loading your content...</p>
            </div>
        `;
        try {
            const res = await fetch(`/api/posts?channel_id=${userChannel.id}`);
            const data = await res.json();
            renderCardsFeed(data.posts || [], studioFeedContainer);
        } catch (e) {
            console.error(e);
            studioFeedContainer.innerHTML = `<div class="empty-state"><p>Could not load posts</p></div>`;
        }
    }

    async function loadPersonalStudioAnalytics() {
        analyticsTableBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center;">
                    <div class="spinner" style="margin: 20px auto;"></div>
                </td>
            </tr>
        `;
        try {
            const res = await fetch('/api/me/channel/analytics');
            const data = await res.json();
            
            if (data.analytics) {
                const analytics = data.analytics;
                
                // Populate summary cards
                studioSubscriberCount.textContent = `${analytics.subscribers_count} subscriber${analytics.subscribers_count !== 1 ? 's' : ''}`;
                analyticsSubscribers.textContent = analytics.subscribers_count;
                analyticsViews.textContent = analytics.total_views;
                analyticsLikes.textContent = analytics.total_likes;
                analyticsComments.textContent = analytics.total_comments;
                
                // Populate performance table
                analyticsTableBody.innerHTML = '';
                const posts = analytics.posts || [];
                if (posts.length === 0) {
                    analyticsTableBody.innerHTML = `
                        <tr>
                            <td colspan="6" style="text-align:center; color: var(--text-muted); padding:30px;">
                                No published posts to analyze yet.
                            </td>
                        </tr>
                    `;
                    return;
                }
                
                posts.forEach(p => {
                    const tr = document.createElement('tr');
                    const displayTitle = p.type === 'text' ? (p.content || '').substring(0, 45) + '...' : (p.title || 'Untitled');
                    
                    tr.innerHTML = `
                        <td>
                            <div class="analytics-title-cell" title="${p.title || p.content || ''}">
                                ${displayTitle}
                            </div>
                        </td>
                        <td><span class="type-indicator-badge ${p.type === 'short' ? 'badge-short' : p.type === 'long' ? 'badge-long' : ''}" style="position:static; padding:2px 6px; font-size:10px;">${p.type.toUpperCase()}</span></td>
                        <td><strong>${p.views}</strong></td>
                        <td>${p.likes_count}</td>
                        <td>${p.comments_count}</td>
                        <td style="font-size:12px; color:var(--text-muted);">${formatDate(p.created_at)}</td>
                    `;
                    analyticsTableBody.appendChild(tr);
                });
            }
        } catch (e) {
            console.error("Failed to load channel analytics", e);
            analyticsTableBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align:center; color:var(--text-danger); padding:30px;">
                        Failed to load analytics data.
                    </td>
                </tr>
            `;
        }
    }

    function populateCustomizeForm() {
        if (!userChannel) return;
        customizeName.value = userChannel.name;
        customizeDescription.value = userChannel.description || '';
        customizeAvatar.value = '';
        customizeBanner.value = '';
    }

    async function handleCustomizeChannelSubmit(e) {
        e.preventDefault();
        if (!currentUser || !userChannel) return;
        
        const name = customizeName.value.trim();
        const description = customizeDescription.value.trim();
        const avatarFile = customizeAvatar.files[0];
        const bannerFile = customizeBanner.files[0];
        
        const formData = new FormData();
        formData.append('name', name);
        formData.append('description', description);
        if (avatarFile) {
            formData.append('avatar', avatarFile);
        }
        if (bannerFile) {
            formData.append('banner', bannerFile);
        }
        
        try {
            const res = await fetch('/api/me/channel/update', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            
            if (data.success) {
                alert("Channel settings updated successfully!");
                await checkUserChannel();
                loadPersonalChannelStudio();
            } else {
                alert("Failed to update channel: " + (data.error || "Unknown error"));
            }
        } catch (err) {
            console.error("Failed to submit customize settings", err);
            alert("A network error occurred.");
        }
    }

    // --- SUBSCRIPTION & CHANNEL CONTROLLER ---
    async function fetchAndRenderSubscriptions() {
        if (!currentUser || !subscribedChannelsList) return;
        
        try {
            const res = await fetch('/api/me/subscriptions');
            const data = await res.json();
            
            subscribedChannelsList.innerHTML = '';
            const subs = data.subscriptions || [];
            
            if (subs.length === 0) {
                subscribedChannelsList.innerHTML = '<div class="sidebar-no-channels">No channels subscribed</div>';
                return;
            }
            
            subs.forEach(c => {
                const item = document.createElement('div');
                item.className = `channel-sidebar-item ${currentFeedMode === 'channel' && activeChannelId === c.id ? 'active' : ''}`;
                item.dataset.channelId = c.id;
                
                item.innerHTML = `
                    <div class="channel-sidebar-avatar">${c.username.charAt(0).toUpperCase()}</div>
                    <span class="channel-sidebar-name">${c.username}</span>
                `;
                
                item.addEventListener('click', () => {
                    // Reset regular nav link active states
                    navLinks.forEach(l => l.classList.remove('active'));
                    myPostsLink.classList.remove('active');
                    
                    // Set channel active state
                    document.querySelectorAll('.channel-sidebar-item').forEach(el => el.classList.remove('active'));
                    item.classList.add('active');
                    
                    currentFeedMode = 'channel';
                    activeChannelId = c.id;
                    searchVal = '';
                    
                    if (window.innerWidth <= 900) {
                        sidebar.classList.remove('show-mobile');
                    }
                    fetchAndRenderFeed();
                });
                
                subscribedChannelsList.appendChild(item);
            });
        } catch (e) {
            console.error("Failed to load subscriptions sidebar", e);
        }
    }

    async function handleSubscribeToggle(channelId, btnElement) {
        if (!currentUser) {
            openAuthPage();
            return;
        }
        
        try {
            const res = await fetch(`/api/channels/${channelId}/subscribe`, { method: 'POST' });
            const data = await res.json();
            
            if (data.success) {
                // Update all subscribe buttons on the page referencing this channel ID
                const btns = document.querySelectorAll(`.btn-subscribe[data-channel-id="${channelId}"]`);
                btns.forEach(btn => {
                    if (data.is_subscribed) {
                        btn.classList.add('active');
                        btn.textContent = 'Subscribed';
                    } else {
                        btn.classList.remove('active');
                        btn.textContent = 'Subscribe';
                    }
                });
                
                // Refresh subscriptions sidebar
                fetchAndRenderSubscriptions();
                
                // If we are currently in subscriptions feed and just unsubscribed, refresh the feed
                if (currentFeedMode === 'subscribed') {
                    fetchAndRenderFeed();
                }
            } else if (data.error) {
                alert(data.error);
            }
        } catch (e) {
            console.error("Failed to toggle subscription", e);
        }
    }

    // --- LIKING CONTROLLER ---
    async function handleLike(postId, btnElement) {
        if (!currentUser) {
            // Require login
            openAuthPage();
            return;
        }

        try {
            const res = await fetch(`/api/posts/${postId}/like`, { method: 'POST' });
            const data = await res.json();
            
            if (data.success) {
                // Update like buttons locally
                const likeCountText = btnElement.querySelector('.like-count');
                const icon = btnElement.querySelector('i');
                
                likeCountText.textContent = data.likes_count;
                if (data.is_liked) {
                    btnElement.classList.add('active');
                    if (icon.classList.contains('fa-regular')) {
                        icon.classList.remove('fa-regular');
                        icon.classList.add('fa-solid');
                    } else if (icon.classList.contains('fa-thumbs-up')) {
                        icon.className = 'fa-solid fa-thumbs-up';
                    } else if (icon.classList.contains('fa-heart')) {
                        icon.className = 'fa-solid fa-heart';
                    }
                } else {
                    btnElement.classList.remove('active');
                    if (icon.classList.contains('fa-solid')) {
                        icon.classList.remove('fa-solid');
                        icon.classList.add('fa-regular');
                    } else if (icon.classList.contains('fa-thumbs-up')) {
                        icon.className = 'fa-regular fa-thumbs-up';
                    } else if (icon.classList.contains('fa-heart')) {
                        icon.className = 'fa-solid fa-heart'; // keep styling similar, or hollow on heart
                    }
                }
            }
        } catch (e) {
            console.error("Like toggle failed", e);
        }
    }

    // --- COMMENTS SYSTEM ---
    async function openCommentDrawer(postId) {
        commentPostId.value = postId;
        commentInput.value = '';
        commentsList.innerHTML = `
            <div class="loading-state">
                <div class="spinner"></div>
            </div>
        `;
        commentDrawer.classList.remove('hidden');

        try {
            const res = await fetch(`/api/posts/${postId}/comments`);
            const data = await res.json();
            renderComments(data.comments || []);
        } catch (e) {
            console.error(e);
            commentsList.innerHTML = `<div class="empty-state"><p>Could not load comments</p></div>`;
        }
    }

    function renderComments(comments) {
        commentsList.innerHTML = '';
        drawerCommentCount.textContent = comments.length;

        if (comments.length === 0) {
            commentsList.innerHTML = `
                <div class="empty-state" style="padding: 40px 0;">
                    <p>No comments yet. Start the conversation!</p>
                </div>
            `;
            return;
        }

        comments.forEach(c => {
            const node = document.createElement('div');
            node.className = 'comment-node';
            node.innerHTML = `
                <div class="comment-avatar">${c.username.charAt(0).toUpperCase()}</div>
                <div class="comment-content-block">
                    <div class="comment-meta">
                        <span class="comment-user">${c.username}</span>
                        <span class="comment-time">${formatDate(c.created_at)}</span>
                    </div>
                    <div class="comment-text">${c.content}</div>
                </div>
            `;
            commentsList.appendChild(node);
        });
        
        // Auto scroll to bottom
        commentsList.scrollTop = commentsList.scrollHeight;
    }

    async function submitComment(e) {
        e.preventDefault();
        if (!currentUser) {
            openAuthPage();
            return;
        }

        const postId = commentPostId.value;
        const text = commentInput.value.trim();
        if (!text) return;

        try {
            const res = await fetch(`/api/posts/${postId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: text })
            });
            const data = await res.json();
            
            if (data.success) {
                commentInput.value = '';
                // Reload comments
                const cRes = await fetch(`/api/posts/${postId}/comments`);
                const cData = await cRes.json();
                renderComments(cData.comments || []);
                
                // Refresh numbers in main feed if applicable
                fetchAndRenderFeed();
            }
        } catch (e) {
            console.error(e);
        }
    }

    // --- CREATE NEW POST ---
    async function openCreateModal() {
        if (!currentUser) {
            openAuthPage();
            return;
        }
        
        // Re-check channel to ensure no stale state
        await checkUserChannel();
        
        if (!userChannel) {
            openCreateChannelModal();
            return;
        }
        
        createModal.classList.remove('hidden');
        resetCreateForm();
    }

    function openCreateChannelModal() {
        if (!currentUser) {
            openAuthPage();
            return;
        }
        createChannelForm.reset();
        createChannelModal.classList.remove('hidden');
    }

    async function handleCreateChannelSubmit(e) {
        e.preventDefault();
        if (!currentUser) return;
        
        const name = channelNameInput.value.trim();
        const description = channelDescriptionInput.value.trim();
        const avatarFile = channelAvatarInput.files[0];
        
        const formData = new FormData();
        formData.append('name', name);
        formData.append('description', description);
        if (avatarFile) {
            formData.append('avatar', avatarFile);
        }
        
        try {
            const res = await fetch('/api/channels', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            
            if (data.success) {
                createChannelModal.classList.add('hidden');
                // Refresh channel details
                await checkUserChannel();
                
                alert("Channel created successfully! You can now start posting.");
                
                // Open the post modal now that the channel is created
                openCreateModal();
            } else {
                alert("Failed to create channel: " + (data.error || "Unknown error"));
            }
        } catch (err) {
            console.error("Failed to submit channel creation", err);
            alert("A network error occurred.");
        }
    }

    function resetCreateForm() {
        createPostForm.reset();
        selectedFileName.classList.add('hidden');
        progressContainer.classList.add('hidden');
        setPostTypeForm('long');
        setResourceInputMode('upload');
    }

    function setPostTypeForm(type) {
        postTypeInput.value = type;
        
        // Highlight active tab
        typeTabs.forEach(tab => {
            if (tab.dataset.type === type) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });

        // Toggle visibility
        if (type === 'text') {
            titleFieldGroup.classList.add('hidden');
            mediaFieldGroup.classList.add('hidden');
            thumbnailFieldGroup.classList.add('hidden');
            contentLabelText.textContent = "Write Your Thoughts *";
            postContent.required = true;
            postTitle.required = false;
            postFileInput.required = false;
            postMediaUrl.required = false;
        } else {
            titleFieldGroup.classList.remove('hidden');
            mediaFieldGroup.classList.remove('hidden');
            thumbnailFieldGroup.classList.remove('hidden');
            contentLabelText.textContent = "Description";
            postContent.required = false;
            postTitle.required = true;
            
            // Set required state based on active tab
            const isUpload = tabUpload.classList.contains('active');
            postFileInput.required = isUpload;
            postMediaUrl.required = !isUpload;
        }
    }

    function setResourceInputMode(mode) {
        if (mode === 'upload') {
            tabUpload.classList.add('active');
            tabUrl.classList.remove('active');
            videoFileContainer.classList.remove('hidden');
            videoUrlContainer.classList.add('hidden');
            postFileInput.required = true;
            postMediaUrl.required = false;
        } else {
            tabUpload.classList.remove('active');
            tabUrl.classList.add('active');
            videoFileContainer.classList.add('hidden');
            videoUrlContainer.classList.remove('hidden');
            postFileInput.required = false;
            postMediaUrl.required = true;
        }
    }

    function handleFileSelection() {
        if (postFileInput.files && postFileInput.files.length > 0) {
            selectedFileName.textContent = `Selected: ${postFileInput.files[0].name}`;
            selectedFileName.classList.remove('hidden');
        } else {
            selectedFileName.classList.add('hidden');
        }
    }

    // Form submission via XMLHTTPRequest to get precise progress updates
    function handleCreatePostSubmit(e) {
        e.preventDefault();
        
        const type = postTypeInput.value;
        const formData = new FormData();
        formData.append('type', type);
        
        if (type !== 'text') {
            formData.append('title', postTitle.value.trim());
            formData.append('content', postContent.value.trim());
            
            // Check resource type
            const isUpload = tabUpload.classList.contains('active');
            if (isUpload) {
                if (postFileInput.files.length > 0) {
                    formData.append('file', postFileInput.files[0]);
                } else {
                    alert('Please select a video file.');
                    return;
                }
            } else {
                formData.append('media_url', postMediaUrl.value.trim());
            }

            // Thumbnail
            if (postThumbnail.files.length > 0) {
                formData.append('thumbnail', postThumbnail.files[0]);
            }
        } else {
            formData.append('content', postContent.value.trim());
        }

        // Send AJAX Request
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/posts', true);
        
        // Update progress bar
        if (type !== 'text' && tabUpload.classList.contains('active')) {
            progressContainer.classList.remove('hidden');
            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable) {
                    const percent = Math.round((e.loaded / e.total) * 100);
                    progressBar.style.width = percent + '%';
                    progressPercent.textContent = percent + '%';
                }
            });
        }

        xhr.onload = function() {
            if (xhr.status === 200) {
                createModal.classList.add('hidden');
                resetCreateForm();
                fetchAndRenderFeed();
            } else {
                const response = JSON.parse(xhr.responseText);
                alert('Upload failed: ' + (response.error || 'Server error'));
                progressContainer.classList.add('hidden');
            }
        };

        xhr.onerror = function() {
            alert('A network error occurred during uploading.');
            progressContainer.classList.add('hidden');
        };

        xhr.send(formData);
    }

    // --- EVENT LISTENERS REGISTRATION ---
    function initEventListeners() {
        // Theme Toggle
        themeToggle.addEventListener('click', toggleTheme);

        // Sidebar Collapse
        sidebarToggle.addEventListener('click', () => {
            if (window.innerWidth > 900) {
                sidebar.classList.toggle('collapsed');
            } else {
                sidebar.classList.toggle('show-mobile');
            }
        });

        // Logo returns to All Mode Home
        headerLogoBtn.addEventListener('click', () => {
            currentFeedMode = 'all';
            activeFilter = 'all';
            searchVal = '';
            searchInput.value = '';
            clearSearchBtn.classList.add('hidden');
            
            navLinks.forEach(link => {
                if (link.dataset.mode === 'all') link.classList.add('active');
                else link.classList.remove('active');
            });
            fetchAndRenderFeed();
        });

        // Sidebar Links
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                const mode = link.dataset.mode;
                if (mode === 'subscribed' && !currentUser) {
                    openAuthPage();
                    return;
                }
                
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                
                // Clear any selected channel items in the sidebar
                document.querySelectorAll('.channel-sidebar-item').forEach(el => el.classList.remove('active'));
                
                if (mode) {
                    currentFeedMode = mode;
                    activeFilter = 'all'; // Reset horizontal sub-filters
                    filterPills.forEach(p => {
                        if (p.dataset.filter === 'all') p.classList.add('active');
                        else p.classList.remove('active');
                    });
                    
                    if (window.innerWidth <= 900) {
                        sidebar.classList.remove('show-mobile'); // Hide mobile sidebar
                    }
                    fetchAndRenderFeed();
                }
            });
        });

        // My Uploads filter (simply searches user's username or handles custom filter)
        myPostsLink.addEventListener('click', () => {
            if (!currentUser) {
                openAuthPage();
                return;
            }
            searchVal = currentUser.username;
            searchInput.value = currentUser.username;
            clearSearchBtn.classList.remove('hidden');
            
            if (window.innerWidth <= 900) {
                sidebar.classList.remove('show-mobile');
            }
            fetchAndRenderFeed();
        });

        // Search Bar Handlers
        searchInput.addEventListener('input', (e) => {
            searchVal = e.target.value.trim();
            if (searchVal) {
                clearSearchBtn.classList.remove('hidden');
            } else {
                clearSearchBtn.classList.add('hidden');
            }
        });

        searchInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                fetchAndRenderFeed();
            }
        });

        clearSearchBtn.addEventListener('click', () => {
            searchVal = '';
            searchInput.value = '';
            clearSearchBtn.classList.add('hidden');
            fetchAndRenderFeed();
        });

        // Horizontal filter pills in 'All Content' mode
        filterPills.forEach(pill => {
            pill.addEventListener('click', () => {
                filterPills.forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                activeFilter = pill.dataset.filter;
                fetchAndRenderFeed();
            });
        });

        // Reels Controls
        shortPrevBtn.addEventListener('click', () => navigateShort(-1));
        shortNextBtn.addEventListener('click', () => navigateShort(1));

        // Keyboard navigation for reels
        window.addEventListener('keydown', (e) => {
            if (currentFeedMode === 'short' && !commentDrawer.classList.contains('hidden') === false) {
                if (e.key === 'ArrowUp') {
                    navigateShort(-1);
                } else if (e.key === 'ArrowDown') {
                    navigateShort(1);
                }
            }
        });

        // Auth overlays trigger
        loginTriggerBtn.addEventListener('click', openAuthPage);
        profileMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            profileDropdown.classList.toggle('hidden');
        });

        document.addEventListener('click', () => {
            profileDropdown.classList.add('hidden');
        });

        // Form Login submit
        loginForm.addEventListener('submit', handleLoginSubmit);
        logoutBtn.addEventListener('click', handleLogout);

        // Modal triggers
        createPostBtn.addEventListener('click', openCreateModal);
        closeModalBtn.addEventListener('click', () => createModal.classList.add('hidden'));
        cancelPostBtn.addEventListener('click', () => createModal.classList.add('hidden'));
        createPostForm.addEventListener('submit', handleCreatePostSubmit);

        // Post creation tabs
        typeTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                setPostTypeForm(tab.dataset.type);
            });
        });

        tabUpload.addEventListener('click', () => setResourceInputMode('upload'));
        tabUrl.addEventListener('click', () => setResourceInputMode('url'));
        postFileInput.addEventListener('change', handleFileSelection);

        // Comments Drawer close
        closeDrawerBtn.addEventListener('click', () => commentDrawer.classList.add('hidden'));
        commentForm.addEventListener('submit', submitComment);

        // Create Channel listeners
        createChannelNavLink.addEventListener('click', openCreateChannelModal);
        createChannelDropdownBtn.addEventListener('click', openCreateChannelModal);
        
        myChannelNavLink.addEventListener('click', viewMyChannel);
        myChannelDropdownBtn.addEventListener('click', viewMyChannel);
        
        closeChannelModalBtn.addEventListener('click', () => createChannelModal.classList.add('hidden'));
        cancelChannelBtn.addEventListener('click', () => createChannelModal.classList.add('hidden'));
        createChannelForm.addEventListener('submit', handleCreateChannelSubmit);

        function viewMyChannel() {
            if (!userChannel) return;
            // Reset regular nav link active states
            navLinks.forEach(l => l.classList.remove('active'));
            myPostsLink.classList.remove('active');
            
            // Set channel active state
            document.querySelectorAll('.channel-sidebar-item').forEach(el => el.classList.remove('active'));
            
            currentFeedMode = 'channel';
            activeChannelId = userChannel.id;
            searchVal = '';
            
            if (window.innerWidth <= 900) {
                sidebar.classList.remove('show-mobile');
            }
            fetchAndRenderFeed();
        }

        // Studio Tabs click listeners
        studioTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                studioTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                loadPersonalChannelStudio();
            });
        });

        // Customize Channel Form submit
        customizeChannelForm.addEventListener('submit', handleCustomizeChannelSubmit);
    }

    // --- FORM ACTIONS ---
    async function handleLoginSubmit(e) {
        e.preventDefault();
        const email = emailInput.value.trim();
        
        try {
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email })
            });
            const data = await res.json();
            
            if (data.user) {
                setLoggedInUser(data.user);
                fetchAndRenderFeed();
            } else {
                alert(data.error || 'Authentication failed');
            }
        } catch (err) {
            console.error(err);
            alert('Connection error. Please try again.');
        }
    }

    async function handleLogout() {
        try {
            await fetch('/api/logout', { method: 'POST' });
            setLoggedOut();
            fetchAndRenderFeed();
        } catch (e) {
            console.error(e);
        }
    }

    function openAuthPage() {
        emailInput.value = '';
        authPage.classList.remove('hidden');
    }

    // --- UTILS ---
    function formatDate(dateString) {
        const date = new Date(dateString);
        // Returns a clean format like "Jun 16, 2026 at 5:30 PM"
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        }) + ' at ' + date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }
});
