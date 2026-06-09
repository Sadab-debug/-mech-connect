document.addEventListener('DOMContentLoaded', function() {
    let allBookings = [];
    let currentMechanic = null;

    // Load user bookings
    async function loadBookings() {
        try {
            const res = await fetch('http://127.0.0.1:5000/bookings', { credentials: 'include' });
            const data = await res.json();
            if (data && data.success) {
                allBookings = Array.isArray(data.bookings) ? data.bookings : [];
                renderBookings();
            }
        } catch (e) {
            console.error('Failed to load bookings', e);
        }
    }

    // Render bookings into sections
    function renderBookings() {
        const requestedEl = document.getElementById('requestedBookings');
        const confirmedEl = document.getElementById('confirmedBookings');

        const requested = allBookings.filter(b => b.status === 'requested');
        const confirmed = allBookings.filter(b => b.status === 'confirmed');

        renderBookingList(requestedEl, requested);
        renderBookingList(confirmedEl, confirmed);

        // Show/hide "Search for mechanic" button
        const searchBtn = document.getElementById('searchMechanicBtn');
        if (searchBtn) {
            searchBtn.style.display = allBookings.length === 0 ? '' : 'none';
        }
    }

    function renderBookingList(container, bookings) {
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
                <img src="${b.mechanic_profile_pic || 'https://via.placeholder.com/60'}" alt="${b.mechanic_name}">
                <div class="booking-info">
                    <h3>${b.mechanic_name}</h3>
                    <p>${b.problem_description}</p>
                    <p>Offer: ${b.offer} BDT</p>
                    <p>Time: ${new Date(b.preferred_time).toLocaleString()}</p>
                </div>
                <div class="booking-actions">
                    <button class="btn-message" data-mechanic-id="${b.mechanic_id}">Message</button>
                    ${b.status === 'confirmed' ? `<button class="btn-complete" data-booking-id="${b.id}">Completed</button>` : ''}
                </div>
            `;
            container.appendChild(item);
        });
    }

    // Open booking confirmation modal (from home page hire button)
    function openBookingConfirmModal(mechanic) {
        currentMechanic = mechanic;
        const modal = document.getElementById('bookingConfirmModal');
        const summary = document.getElementById('mechanicSummary');
        summary.innerHTML = `
            <img src="${mechanic.profile_pic || 'https://via.placeholder.com/60'}" alt="${mechanic.name}" style="width:60px;height:60px;border-radius:50%;vertical-align:middle;margin-right:12px;">
            <strong>${mechanic.name}</strong> — ${mechanic.expertise || 'Mechanic'}
        `;
        modal.style.display = 'flex';
    }

    // Booking form submit -> payment modal
    document.getElementById('bookingForm')?.addEventListener('submit', async function(e) {
        e.preventDefault();
        const payload = {
            mechanic_id: currentMechanic.id,
            address: document.getElementById('bookingAddress').value,
            preferred_time: document.getElementById('bookingTime').value,
            problem_description: document.getElementById('bookingProblem').value,
            offer: parseFloat(document.getElementById('bookingOffer').value),
            payment_method: document.querySelector('input[name="paymentMethod"]:checked').value
        };
        // Show payment modal
        showPaymentModal(payload);
    });

    function showPaymentModal(payload) {
        const mechanicFee = payload.offer;
        const platformFee = Math.round(mechanicFee * 0.05);
        const total = mechanicFee + platformFee;

        document.getElementById('paymentMechanicFee').textContent = `${mechanicFee} BDT`;
        document.getElementById('paymentPlatformFee').textContent = `${platformFee} BDT`;
        document.getElementById('paymentTotal').textContent = `${total} BDT`;

        // Render provider logos
        const providersEl = document.getElementById('paymentProviders');
        providersEl.innerHTML = '';
        const providers = ['bkash', 'nagad', 'rocket', 'card'];
        providers.forEach(p => {
            const div = document.createElement('div');
            div.className = 'payment-provider';
            div.textContent = p.toUpperCase();
            div.dataset.provider = p;
            if (p === payload.payment_method) div.classList.add('selected');
            div.addEventListener('click', () => {
                document.querySelectorAll('.payment-provider').forEach(d => d.classList.remove('selected'));
                div.classList.add('selected');
                payload.payment_method = p;
            });
            providersEl.appendChild(div);
        });

        // Store payload for final confirm
        window.currentBookingPayload = payload;

        document.getElementById('bookingConfirmModal').style.display = 'none';
        document.getElementById('paymentModal').style.display = 'flex';
    }

    // Confirm payment -> create booking
    document.getElementById('confirmPaymentBtn')?.addEventListener('click', async function() {
        const payload = window.currentBookingPayload;
        if (!payload) return;
        try {
            const res = await fetch('http://127.0.0.1:5000/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data && data.success) {
                document.getElementById('paymentModal').style.display = 'none';
                alert('Booking confirmed! Mechanic will respond shortly.');
                loadBookings();
            } else {
                alert('Failed to create booking: ' + (data.message || 'Unknown error'));
            }
        } catch (e) {
            alert('Error creating booking: ' + e.message);
        }
    });

    // Close modals
    document.getElementById('closeConfirmModal')?.addEventListener('click', () => {
        document.getElementById('bookingConfirmModal').style.display = 'none';
    });
    document.getElementById('closePaymentModal')?.addEventListener('click', () => {
        document.getElementById('paymentModal').style.display = 'none';
    });

    // Message button -> chat page
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('btn-message')) {
            const mechanicId = e.target.dataset.mechanicId;
            window.location.href = `../chat/chat.html?mechanic_id=${mechanicId}`;
        }
    });

    // Completed button -> mark as completed
    document.addEventListener('click', async function(e) {
        if (e.target.classList.contains('btn-complete')) {
            const bookingId = e.target.dataset.bookingId;
            if (!bookingId) return;
            try {
                const res = await fetch(`http://127.0.0.1:5000/bookings/${bookingId}/complete`, {
                    method: 'POST',
                    credentials: 'include'
                });
                const data = await res.json();
                if (data && data.success) {
                    alert('Work marked as completed. Thank you!');
                    loadBookings();
                } else {
                    alert('Failed to complete booking: ' + (data.message || ''));
                }
            } catch (e) {
                alert('Error completing booking: ' + e.message);
            }
        }
    });

    // Search for mechanic button -> go home
    document.getElementById('searchMechanicBtn')?.addEventListener('click', () => {
        window.location.href = '../main.html';
    });

    // Support opening from home page (pass mechanic via query param)
    const urlParams = new URLSearchParams(window.location.search);
    const mechanicId = urlParams.get('mechanic_id');
    if (mechanicId) {
        // Fetch mechanic details and open confirmation modal
        fetch(`http://127.0.0.1:5000/mechanics/${mechanicId}`, { credentials: 'include' })
            .then(res => res.json())
            .then(data => {
                if (data && data.success && data.mechanic) {
                    openBookingConfirmModal(data.mechanic);
                }
            })
            .catch(() => {});
    }

    // Initial load
    loadBookings();
});
