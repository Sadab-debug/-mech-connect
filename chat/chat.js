// Modern Chat System - Full Functionality
class ChatSystem {
    constructor() {
        this.currentUser = null;
        this.currentConversation = null;
        this.conversations = new Map();
        this.messages = new Map();
        this.typingTimeout = null;
        this.isTyping = false;
        
        this.init();
    }

    async init() {
        this.pusher = null;
        this.pusherChannel = null;
        await this.loadConfig();
        await this.loadCurrentUser();
        this.setupEventListeners();
        this.loadConversations();
        this.setupAutoResize();
        this.setupKeyboardShortcuts();
        
        // Check if we should open a specific mechanic chat
        const mechanicId = sessionStorage.getItem('chatMechanicId');
        const mechanicName = sessionStorage.getItem('chatMechanicName');
        if (mechanicId && mechanicName) {
            // Clear the stored info
            sessionStorage.removeItem('chatMechanicId');
            sessionStorage.removeItem('chatMechanicName');
            
            // Create and open conversation
            await this.createDirectConversation(mechanicId, mechanicName);
        }
    }

    async loadConfig() {
        try {
            const response = await fetch('http://127.0.0.1:5000/api/config', {
                credentials: 'include'
            });
            const data = await response.json();
            if (data.pusher_key) {
                this.pusher = new Pusher(data.pusher_key, {
                    cluster: data.pusher_cluster || 'ap2'
                });
            }
        } catch (error) {
            console.error('Error loading config:', error);
        }
    }

    async loadCurrentUser() {
        try {
            const response = await fetch('http://127.0.0.1:5000/profile', {
                credentials: 'include'
            });
            const data = await response.json();
            
            if (data.logged_in) {
                this.currentUser = data.user;
                this.updateCurrentUserUI();
                this.subscribeToPusher();
            } else {
                // Redirect to login if not authenticated
                window.location.href = 'http://127.0.0.1:5000/login/login.html';
            }
        } catch (error) {
            console.error('Error loading current user:', error);
            window.location.href = 'http://127.0.0.1:5000/login/login.html';
        }
    }

    subscribeToPusher() {
        if (!this.pusher) {
            console.warn('Pusher is not initialized');
            return;
        }
        const userPrefixedId = this.getCurrentUserPrefixedId();
        console.log(`Subscribing to Pusher channel: chat-${userPrefixedId}`);
        this.pusherChannel = this.pusher.subscribe(`chat-${userPrefixedId}`);
        this.pusherChannel.bind('new_message', (data) => {
            console.log('Received real-time message:', data);
            this.handleIncomingMessage(data);
        });
    }

    async handleIncomingMessage(msg) {
        // 1. Reload conversations to update sidebar (last message, last time, unread count)
        await this.loadConversations();
        
        // 2. If the message belongs to the active conversation, append it
        const currentUserId = this.getCurrentUserPrefixedId();
        const partnerId = msg.sender_id === currentUserId ? msg.receiver_id : msg.sender_id;
        
        if (this.currentConversation === partnerId) {
            if (!this.messages.has(this.currentConversation)) {
                this.messages.set(this.currentConversation, []);
            }
            
            const msgs = this.messages.get(this.currentConversation);
            // Check if message is already in list (e.g. if we sent it and added it temporarily)
            const exists = msgs.some(m => m.id === msg.id || (m.content === msg.content && m.sender_id === msg.sender_id && Math.abs(new Date(m.created_at) - new Date(msg.created_at)) < 5000));
            
            if (!exists) {
                // Remove temporary placeholder message
                const tempIndex = msgs.findIndex(m => m.sender_id === currentUserId && m.content === msg.content && typeof m.id === 'number' && m.id > 1700000000000);
                if (tempIndex > -1) {
                    msgs.splice(tempIndex, 1);
                }
                
                msgs.push(msg);
                this.renderMessages();
            } else {
                // If it exists, update it (e.g. update temp ID to real ID)
                const tempIndex = msgs.findIndex(m => m.sender_id === currentUserId && m.content === msg.content && typeof m.id === 'number' && m.id > 1700000000000);
                if (tempIndex > -1) {
                    msgs[tempIndex] = msg;
                    this.renderMessages();
                }
            }
        }
    }

    updateCurrentUserUI() {
        document.getElementById('currentUserName').textContent = this.currentUser.username;
        
        // Update avatar
        const avatar = document.getElementById('currentUserAvatar');
        if (this.currentUser.profile_pic) {
            avatar.src = this.currentUser.profile_pic;
        } else {
            avatar.src = `https://ui-avatars.com/api/?name=${this.currentUser.username}&background=20c997&color=fff`;
        }
    }

    setupEventListeners() {
        // New chat button
        document.getElementById('newChatBtn').addEventListener('click', () => {
            this.showNewChatModal();
        });

        // Close modal
        document.getElementById('closeNewChatModal').addEventListener('click', () => {
            this.hideNewChatModal();
        });

        // Modal overlay click
        document.getElementById('newChatModal').addEventListener('click', (e) => {
            if (e.target.id === 'newChatModal') {
                this.hideNewChatModal();
            }
        });

        // Search conversations
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.filterConversations(e.target.value);
        });

        // Search users in modal
        document.getElementById('newChatSearch').addEventListener('input', (e) => {
            this.filterUsers(e.target.value);
        });

        // Message input
        const messageInput = document.getElementById('messageInput');
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Send button
        document.getElementById('sendBtn').addEventListener('click', () => {
            this.sendMessage();
        });

        // Emoji button
        document.getElementById('emojiBtn').addEventListener('click', () => {
            this.toggleEmojiPicker();
        });

        // Attach button
        document.getElementById('attachBtn').addEventListener('click', () => {
            document.getElementById('fileInput').click();
        });

        // File input
        document.getElementById('fileInput').addEventListener('change', (e) => {
            this.handleFileSelect(e.target.files[0]);
        });

        // Emoji picker
        document.querySelectorAll('.emoji').forEach(emoji => {
            emoji.addEventListener('click', () => {
                this.insertEmoji(emoji.textContent);
            });
        });

        // Header buttons (placeholder functionality)
        document.getElementById('videoCallBtn').addEventListener('click', () => {
            this.showNotification('Video calls coming soon!');
        });

        document.getElementById('voiceCallBtn').addEventListener('click', () => {
            this.showNotification('Voice calls coming soon!');
        });

        document.getElementById('moreOptionsBtn').addEventListener('click', () => {
            this.showNotification('More options coming soon!');
        });

        // Click outside emoji picker to close
        document.addEventListener('click', (e) => {
            const emojiPicker = document.getElementById('emojiPicker');
            const emojiBtn = document.getElementById('emojiBtn');
            
            if (!emojiPicker.contains(e.target) && e.target !== emojiBtn) {
                emojiPicker.style.display = 'none';
            }
        });
    }

    setupAutoResize() {
        const messageInput = document.getElementById('messageInput');
        messageInput.addEventListener('input', () => {
            messageInput.style.height = 'auto';
            messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + 'px';
        });
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + K for search
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                document.getElementById('searchInput').focus();
            }
            
            // Escape to close modal
            if (e.key === 'Escape') {
                this.hideNewChatModal();
                document.getElementById('emojiPicker').style.display = 'none';
            }
        });
    }

    async loadConversations() {
        try {
            const response = await fetch('http://127.0.0.1:5000/chat/conversations', {
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    this.conversations = new Map(data.conversations.map(c => [c.id, c]));
                    this.renderConversations();
                }
            }
        } catch (error) {
            console.error('Error loading conversations:', error);
        }
    }

    renderConversations() {
        const container = document.getElementById('conversationsList');
        
        if (this.conversations.size === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-comments"></i>
                    <p>No conversations yet</p>
                </div>
            `;
            return;
        }

        const conversationsHTML = Array.from(this.conversations.values())
            .sort((a, b) => new Date(b.last_message_time) - new Date(a.last_message_time))
            .map(conv => this.renderConversationItem(conv))
            .join('');
        
        container.innerHTML = conversationsHTML;

        // Add click listeners
        container.querySelectorAll('.conversation-item').forEach(item => {
            item.addEventListener('click', () => {
                const convId = parseInt(item.dataset.conversationId);
                this.openConversation(convId);
            });
        });
    }

    renderConversationItem(conversation) {
        const lastMessage = conversation.last_message || 'Start a conversation';
        const time = this.formatTime(conversation.last_message_time);
        const unreadCount = conversation.unread_count || 0;
        
        return `
            <div class="conversation-item ${this.currentConversation === conversation.id ? 'active' : ''}" 
                 data-conversation-id="${conversation.id}">
                <img src="${conversation.avatar || `https://ui-avatars.com/api/?name=${conversation.name}&background=20c997&color=fff`}" 
                     alt="${conversation.name}" class="conversation-avatar">
                <div class="conversation-info">
                    <div class="conversation-name">${conversation.name}</div>
                    <div class="conversation-message">${lastMessage}</div>
                </div>
                <div class="conversation-meta">
                    <div class="conversation-time">${time}</div>
                    ${unreadCount > 0 ? `<div class="unread-badge">${unreadCount}</div>` : ''}
                </div>
            </div>
        `;
    }

    async openConversation(conversationId) {
        this.currentConversation = conversationId;
        const conversation = this.conversations.get(conversationId);
        
        if (!conversation) return;

        // Update UI
        document.getElementById('chatWelcome').style.display = 'none';
        document.getElementById('chatActive').style.display = 'flex';
        
        // Update header
        document.getElementById('chatName').textContent = conversation.name;
        document.getElementById('chatStatus').textContent = conversation.online ? 'Online' : 'Offline';
        document.getElementById('chatAvatar').src = conversation.avatar || 
            `https://ui-avatars.com/api/?name=${conversation.name}&background=20c997&color=fff`;

        // Mark conversation as active
        document.querySelectorAll('.conversation-item').forEach(item => {
            item.classList.toggle('active', parseInt(item.dataset.conversationId) === conversationId);
        });

        // Load messages
        await this.loadMessages(conversationId);
        
        // Clear unread count
        conversation.unread_count = 0;
        this.renderConversations();
    }

    async loadMessages(conversationId) {
        try {
            const response = await fetch(`http://127.0.0.1:5000/chat/messages/${conversationId}`, {
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    this.messages.set(conversationId, data.messages);
                    this.renderMessages();
                }
            }
        } catch (error) {
            console.error('Error loading messages:', error);
        }
    }

    renderMessages() {
        const container = document.getElementById('messagesContainer');
        const messages = this.messages.get(this.currentConversation) || [];
        
        if (messages.length === 0) {
            container.innerHTML = '<div class="empty-state">No messages yet. Start a conversation!</div>';
            return;
        }
        
        const messagesHTML = messages.map(msg => this.renderMessage(msg)).join('');
        container.innerHTML = messagesHTML;
        
        // Scroll to bottom
        this.scrollToBottom();
        
        // Add click listeners for avatars/profiles
        container.querySelectorAll('.message-avatar').forEach(avatar => {
            avatar.addEventListener('click', () => {
                const userId = avatar.dataset.userId;
                const userName = avatar.dataset.userName;
                this.openUserProfile(userId, userName);
            });
        });
        
        // Add click listeners for images
        container.querySelectorAll('.message-image').forEach(img => {
            img.addEventListener('click', () => {
                this.viewImage(img.src);
            });
        });
    }

    renderMessage(message) {
        const isSent = message.sender_id === this.getCurrentUserPrefixedId();
        const time = this.formatTime(message.created_at);
        const sender = this.getSenderInfo(message.sender_id);
        
        return `
            <div class="message ${isSent ? 'sent' : 'received'}">
                ${!isSent ? `<img src="${sender.avatar}" alt="${sender.name}" 
                                 class="message-avatar" 
                                 data-user-id="${message.sender_id}"
                                 data-user-name="${sender.name}"
                                 style="width: 32px; height: 32px; border-radius: 50%; margin-right: 8px;">` : ''}
                <div class="message-bubble">
                    ${message.image_url ? 
                        `<img src="${message.image_url}" alt="Image" class="message-image">` : 
                        `<div class="message-content">${this.escapeHtml(message.content)}</div>`
                    }
                    <div class="message-time">
                        ${time}
                        ${isSent ? `<span class="message-status">${this.getMessageStatus(message)}</span>` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    getCurrentUserPrefixedId() {
        if (this.currentUser.role === 'user') {
            return `user_${this.currentUser.id}`;
        } else if (this.currentUser.role === 'mechanic') {
            return `mechanic_${this.currentUser.id}`;
        }
        return String(this.currentUser.id);
    }

    getSenderInfo(senderId) {
        // Try to get sender info from conversations
        for (let conv of this.conversations.values()) {
            if (conv.id === senderId) {
                return {
                    name: conv.name,
                    avatar: conv.avatar || `https://ui-avatars.com/api/?name=${conv.name}&background=20c997&color=fff`
                };
            }
        }
        
        // Fallback
        return {
            name: 'Unknown',
            avatar: 'https://ui-avatars.com/api/?name=User&background=20c997&color=fff'
        };
    }

    getMessageStatus(message) {
        // Simple status indicators
        if (message.is_read) return '✓✓';
        return '✓';
    }

    openUserProfile(userId, userName) {
        // If clicking on current user, do nothing
        if (userId === this.currentUser.id) return;
        
        // Check if conversation already exists
        if (this.conversations.has(userId)) {
            this.openConversation(userId);
        } else {
            // Create new conversation
            this.createDirectConversation(userId, userName);
        }
    }

    async sendMessage() {
        const input = document.getElementById('messageInput');
        const content = input.value.trim();
        
        if (!content && !this.currentFile) return;
        
        console.log('Sending message:', {
            conversation_id: this.currentConversation,
            receiver_id: this.getReceiverId(),
            content: content
        });
        
        // Create temporary message to show immediately
        const tempMessage = {
            id: Date.now(),
            sender_id: this.getCurrentUserPrefixedId(),
            receiver_id: this.getReceiverId(),
            content: content,
            image_url: null,
            created_at: new Date().toISOString(),
            is_read: false
        };
        
        // Add message to local storage immediately
        if (!this.messages.has(this.currentConversation)) {
            this.messages.set(this.currentConversation, []);
        }
        this.messages.get(this.currentConversation).push(tempMessage);
        this.renderMessages();
        
        // Clear input
        input.value = '';
        input.style.height = 'auto';
        
        const messageData = {
            conversation_id: this.currentConversation,
            content: content,
            receiver_id: this.getReceiverId()
        };

        // Handle file upload if present
        if (this.currentFile) {
            const formData = new FormData();
            formData.append('file', this.currentFile);
            formData.append('conversation_id', this.currentConversation);
            formData.append('receiver_id', messageData.receiver_id);
            
            try {
                const response = await fetch('http://127.0.0.1:5000/chat/upload', {
                    method: 'POST',
                    credentials: 'include',
                    body: formData
                });
                
                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        messageData.image_url = data.image_url;
                        tempMessage.image_url = data.image_url;
                        this.renderMessages();
                    }
                }
            } catch (error) {
                console.error('Error uploading file:', error);
                this.showNotification('Failed to upload file');
                return;
            }
        }

        try {
            const response = await fetch('http://127.0.0.1:5000/chat/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(messageData)
            });
            
            console.log('Response status:', response.status);
            const data = await response.json();
            console.log('Response data:', data);
            
            if (response.ok) {
                if (data.success) {
                    // Update message with real ID
                    tempMessage.id = data.message_id;
                    this.renderMessages();
                    
                    // Update conversation list
                    await this.loadConversations();
                } else {
                    console.error('Server error:', data.message);
                    this.showNotification(data.message || 'Failed to send message');
                    // Remove temporary message on failure
                    const msgs = this.messages.get(this.currentConversation);
                    const index = msgs.findIndex(m => m.id === tempMessage.id);
                    if (index > -1) {
                        msgs.splice(index, 1);
                        this.renderMessages();
                    }
                }
            } else {
                console.error('HTTP error:', response.status);
                // Remove temporary message on failure
                const msgs = this.messages.get(this.currentConversation);
                const index = msgs.findIndex(m => m.id === tempMessage.id);
                if (index > -1) {
                    msgs.splice(index, 1);
                    this.renderMessages();
                }
                this.showNotification('Failed to send message');
            }
        } catch (error) {
            console.error('Network error:', error);
            // Remove temporary message on failure
            const msgs = this.messages.get(this.currentConversation);
            const index = msgs.findIndex(m => m.id === tempMessage.id);
            if (index > -1) {
                msgs.splice(index, 1);
                this.renderMessages();
            }
            this.showNotification('Failed to send message');
        }
        
        // Clear file
        this.currentFile = null;
        const preview = document.querySelector('.file-preview');
        if (preview) {
            preview.remove();
        }
    }

    getReceiverId() {
        // For direct conversations, the receiver is the conversation partner
        return this.currentConversation;
    }

    async showNewChatModal() {
        document.getElementById('newChatModal').style.display = 'flex';
        await this.loadUsers();
    }

    hideNewChatModal() {
        document.getElementById('newChatModal').style.display = 'none';
        document.getElementById('newChatSearch').value = '';
        this.filterUsers('');
    }

    async loadUsers() {
        try {
            const response = await fetch('http://127.0.0.1:5000/chat/users', {
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    this.renderUsers(data.users);
                }
            }
        } catch (error) {
            console.error('Error loading users:', error);
        }
    }

    renderUsers(users) {
        const container = document.getElementById('usersList');
        
        if (users.length === 0) {
            container.innerHTML = '<p>No users found</p>';
            return;
        }

        const usersHTML = users.map(user => `
            <div class="user-item" data-user-id="${user.id}">
                <img src="${user.avatar || `https://ui-avatars.com/api/?name=${user.username}&background=20c997&color=fff`}" 
                     alt="${user.username}" class="user-avatar">
                <div class="user-info">
                    <div class="user-name">${user.username}</div>
                    <div class="user-role">${user.role}</div>
                </div>
            </div>
        `).join('');
        
        container.innerHTML = usersHTML;

        // Add click listeners
        container.querySelectorAll('.user-item').forEach(item => {
            item.addEventListener('click', () => {
                const userId = item.dataset.userId;
                this.startConversation(userId);
            });
        });
    }

    async createDirectConversation(userId, userName) {
        try {
            // First create a mock conversation object
            const conversation = {
                id: userId,
                name: userName,
                avatar: `https://ui-avatars.com/api/?name=${userName}&background=20c997&color=fff`,
                role: userId.startsWith('mechanic_') ? 'mechanic' : 'user',
                last_message: 'Start a conversation',
                last_message_time: new Date(),
                unread_count: 0,
                online: true
            };
            
            // Add to conversations map
            this.conversations.set(userId, conversation);
            
            // Update conversations list
            this.renderConversations();
            
            // Open conversation
            this.openConversation(userId);
            
            // Send a welcome message
            await this.sendMessageDirect(userId, `Hello! I'm interested in your services.`);
        } catch (error) {
            console.error('Error creating conversation:', error);
            this.showNotification('Failed to start conversation');
        }
    }

    async sendMessageDirect(conversationId, content) {
        try {
            const response = await fetch('http://127.0.0.1:5000/chat/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    conversation_id: conversationId,
                    receiver_id: conversationId,
                    content: content
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    // Reload messages
                    await this.loadMessages(conversationId);
                }
            }
        } catch (error) {
            console.error('Error sending message:', error);
        }
    }

    async startConversation(userId) {
        try {
            const response = await fetch('http://127.0.0.1:5000/chat/start', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ user_id: userId })
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    this.hideNewChatModal();
                    await this.loadConversations();
                    this.openConversation(data.conversation_id);
                } else {
                    this.showNotification(data.message || 'Failed to start conversation');
                }
            }
        } catch (error) {
            console.error('Error starting conversation:', error);
            this.showNotification('Failed to start conversation');
        }
    }

    filterConversations(query) {
        const items = document.querySelectorAll('.conversation-item');
        const lowerQuery = query.toLowerCase();
        
        items.forEach(item => {
            const name = item.querySelector('.conversation-name').textContent.toLowerCase();
            const message = item.querySelector('.conversation-message').textContent.toLowerCase();
            
            const matches = name.includes(lowerQuery) || message.includes(lowerQuery);
            item.style.display = matches ? 'flex' : 'none';
        });
    }

    filterUsers(query) {
        const items = document.querySelectorAll('.user-item');
        const lowerQuery = query.toLowerCase();
        
        items.forEach(item => {
            const name = item.querySelector('.user-name').textContent.toLowerCase();
            const role = item.querySelector('.user-role').textContent.toLowerCase();
            
            const matches = name.includes(lowerQuery) || role.includes(lowerQuery);
            item.style.display = matches ? 'flex' : 'none';
        });
    }

    toggleEmojiPicker() {
        const picker = document.getElementById('emojiPicker');
        picker.style.display = picker.style.display === 'none' ? 'block' : 'none';
    }

    insertEmoji(emoji) {
        const input = document.getElementById('messageInput');
        const start = input.selectionStart;
        const end = input.selectionEnd;
        
        input.value = input.value.substring(0, start) + emoji + input.value.substring(end);
        input.selectionStart = input.selectionEnd = start + emoji.length;
        input.focus();
        
        document.getElementById('emojiPicker').style.display = 'none';
    }

    handleFileSelect(file) {
        if (!file) return;
        
        // Check file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            this.showNotification('File size must be less than 10MB');
            return;
        }
        
        // Check file type
        if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
            this.showNotification('Only images and videos are supported');
            return;
        }
        
        this.currentFile = file;
        
        // Show preview
        const preview = document.createElement('div');
        preview.className = 'file-preview';
        preview.innerHTML = `
            <i class="fas fa-image"></i>
            <div class="file-preview-info">
                <div class="file-preview-name">${file.name}</div>
                <div class="file-preview-size">${this.formatFileSize(file.size)}</div>
            </div>
            <button class="remove-file" onclick="chatSystem.removeFile()">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // Remove existing preview
        const existingPreview = document.querySelector('.file-preview');
        if (existingPreview) {
            existingPreview.remove();
        }
        
        document.getElementById('messageInput').parentNode.appendChild(preview);
    }

    removeFile() {
        this.currentFile = null;
        const preview = document.querySelector('.file-preview');
        if (preview) {
            preview.remove();
        }
        document.getElementById('fileInput').value = '';
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) return 'now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
        if (diff < 604800000) return `${Math.floor(diff / 86400000)}d`;
        
        return date.toLocaleDateString();
    }

    scrollToBottom() {
        const container = document.getElementById('messagesContainer');
        container.scrollTop = container.scrollHeight;
    }

    showNotification(message) {
        // Simple notification (you could replace this with a toast library)
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #333;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    viewImage(src) {
        // Simple image viewer
        const viewer = document.createElement('div');
        viewer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            cursor: pointer;
        `;
        
        const img = document.createElement('img');
        img.src = src;
        img.style.cssText = `
            max-width: 90%;
            max-height: 90%;
            object-fit: contain;
            border-radius: 8px;
        `;
        
        viewer.appendChild(img);
        viewer.addEventListener('click', () => viewer.remove());
        document.body.appendChild(viewer);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Initialize chat system
const chatSystem = new ChatSystem();
