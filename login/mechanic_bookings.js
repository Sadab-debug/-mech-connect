document.addEventListener('DOMContentLoaded', function() {
    let allBookings = [];
    let currentBookingId = null;
    let pusher = null;
    let pusherChannel = null;

    async function initPusher() {
        try {
            // Get config
            const configRes = await fetch('http://127.0.0.1:5000/api/config', { credentials: 'include' });
            const configData = await configRes.json();
            
            // Get profile
            const profileRes = await fetch('http://127.0.0.1:5000/profile', { credentials: 'include' });
            const profileData = await profileRes.json();
            
            if (configData.pusher_key && profileData.logged_in) {
                const user = profileData.user;
                pusher = new Pusher(configData.pusher_key, {
                    cluster: configData.pusher_cluster || 'ap2'
                });
                
                const channelName = `mechanic-${user.id}`;
                console.log(`Subscribing to Pusher channel: ${channelName}`);
                pusherChannel = pusher.subscribe(channelName);
                
                pusherChannel.bind('booking_update', function(data) {
                    console.log('Received booking update:', data);
                    // Reload bookings and statistics when a booking is created, accepted, countered, completed
                    loadBookings();
                    
                    if (data.status) {
                        const statusText = data.status.toUpperCase();
                        let message = `Booking #${data.id} status updated to ${statusText}!`;
                        if (data.status === 'requested') {
                            message = `New booking request received (Booking #${data.id})!`;
                        } else if (data.status === 'completed') {
                            message = `Booking #${data.id} has been marked as COMPLETED by the user!`;
                        }
                        alert(message);
                    }
                });
            }
        } catch (e) {
            console.error('Failed to initialize Pusher in mechanic_bookings.js', e);
        }
    }


    async function loadBookings() {
        try {
            const res = await fetch('http://127.0.0.1:5000/mechanic/bookings', { credentials: 'include' });
            const data = await res.json();
            if (data && data.success) {
                allBookings = Array.isArray(data.bookings) ? data.bookings : [];
                renderBookings();
                updateStats();
            }
        } catch (e) {
            console.error('Failed to load bookings', e);
        }
    }

    function renderBookings() {
        const requestedEl = document.getElementById('requestedBookings');
        const confirmedEl = document.getElementById('confirmedBookings');
        const pendingEl = document.getElementById('pendingWork');

        const requested = allBookings.filter(b => b.status === 'requested');
        const confirmed = allBookings.filter(b => b.status === 'confirmed');
        const pending = allBookings.filter(b => b.status === 'pending');

        renderBookingList(requestedEl, requested, true);
        renderBookingList(confirmedEl, confirmed, false);
        renderBookingList(pendingEl, pending, false);
    }

    function renderBookingList(container, bookings, showActions) {
        if (!container) return;
        if (!bookings || bookings.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📭</div>
                    <p>No bookings here.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = '';
        bookings.forEach(b => {
            const item = document.createElement('div');
            item.className = 'booking-item';
            item.innerHTML = `
                <img src="${b.user_profile_pic || 'https://via.placeholder.com/60'}" alt="${b.user_name}">
                <div class="booking-info">
                    <h3>${b.user_name}</h3>
                    <p>${b.problem_description}</p>
                    <p>Offer: ${b.offer} BDT</p>
                    <p>Time: ${new Date(b.preferred_time).toLocaleString()}</p>
                    <p>Address: ${b.address}</p>
                </div>
                <div class="booking-actions">
                    <button class="btn-message" data-user-id="${b.user_id}">Message</button>
                    ${showActions ? `
                        <button class="btn-accept" data-booking-id="${b.id}">Accept</button>
                        <button class="btn-counter" data-booking-id="${b.id}">Counter</button>
                        <button class="btn-reject" data-booking-id="${b.id}">Reject</button>
                    ` : ''}
                </div>
            `;
            container.appendChild(item);
        });
    }

    function updateStats() {
        const requested = allBookings.filter(b => b.status === 'requested').length;
        const confirmed = allBookings.filter(b => b.status === 'confirmed').length;
        const pending = allBookings.filter(b => b.status === 'pending').length;
        const completed = allBookings.filter(b => b.status === 'completed').length;

        document.getElementById('statRequested').textContent = requested;
        document.getElementById('statConfirmed').textContent = confirmed;
        document.getElementById('statPending').textContent = pending;
        document.getElementById('statCompleted').textContent = completed;
    }

    // Accept booking
    document.addEventListener('click', async function(e) {
        if (e.target.classList.contains('btn-accept')) {
            const bookingId = e.target.dataset.bookingId;
            if (!bookingId) return;
            try {
                const res = await fetch(`http://127.0.0.1:5000/mechanic/bookings/${bookingId}/accept`, {
                    method: 'POST',
                    credentials: 'include'
                });
                const data = await res.json();
                if (data && data.success) {
                    alert('Booking accepted!');
                    loadBookings();
                } else {
                    alert('Failed to accept booking: ' + (data.message || ''));
                }
            } catch (e) {
                alert('Error accepting booking: ' + e.message);
            }
        }
    });

    // Counter offer modal
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('btn-counter')) {
            currentBookingId = e.target.dataset.bookingId;
            const booking = allBookings.find(b => b.id === currentBookingId);
            if (!booking) return;
            const summary = document.getElementById('counterSummary');
            summary.innerHTML = `
                <p><strong>User:</strong> ${booking.user_name}</p>
                <p><strong>Problem:</strong> ${booking.problem_description}</p>
                <p><strong>Current offer:</strong> ${booking.offer} BDT</p>
                <p><strong>Time:</strong> ${new Date(booking.preferred_time).toLocaleString()}</p>
                <p><strong>Address:</strong> ${booking.address}</p>
            `;
            document.getElementById('counterModal').style.display = 'flex';
        }
    });

    // Submit counter offer
    document.getElementById('counterForm')?.addEventListener('submit', async function(e) {
        e.preventDefault();
        if (!currentBookingId) return;
        const payload = {
            counter_offer: parseFloat(document.getElementById('counterOffer').value),
            note: document.getElementById('counterNote').value
        };
        try {
            const res = await fetch(`http://127.0.0.1:5000/mechanic/bookings/${currentBookingId}/counter`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data && data.success) {
                alert('Counter offer sent!');
                document.getElementById('counterModal').style.display = 'none';
                loadBookings();
            } else {
                alert('Failed to send counter offer: ' + (data.message || ''));
            }
        } catch (e) {
            alert('Error sending counter offer: ' + e.message);
        }
    });

    // Reject booking
    document.addEventListener('click', async function(e) {
        if (e.target.classList.contains('btn-reject')) {
            const bookingId = e.target.dataset.bookingId;
            if (!bookingId) return;
            if (!confirm('Reject this booking?')) return;
            try {
                const res = await fetch(`http://127.0.0.1:5000/mechanic/bookings/${bookingId}/reject`, {
                    method: 'POST',
                    credentials: 'include'
                });
                const data = await res.json();
                if (data && data.success) {
                    alert('Booking rejected.');
                    loadBookings();
                } else {
                    alert('Failed to reject booking: ' + (data.message || ''));
                }
            } catch (e) {
                alert('Error rejecting booking: ' + e.message);
            }
        }
    });

    // Message button -> chat
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('btn-message')) {
            const userId = e.target.dataset.userId;
            window.location.href = `../chat/chat.html?user_id=${userId}`;
        }
    });

    // Close modal
    document.getElementById('closeCounterModal')?.addEventListener('click', () => {
        document.getElementById('counterModal').style.display = 'none';
    });

    // Initial load
    loadBookings();
    initPusher();
});
