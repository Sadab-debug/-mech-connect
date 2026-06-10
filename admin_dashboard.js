document.addEventListener('DOMContentLoaded', function () {
    // Load admin profile
    loadAdminProfile();

    // Tab navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function (e) {
            e.preventDefault();
            const tabName = this.getAttribute('data-tab');
            switchTab(tabName);
            
            // Update active nav
            document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Logout
    document.getElementById('logoutAdminBtn').addEventListener('click', function () {
        fetch('/logout', {
            method: 'POST',
            credentials: 'include'
        }).then(() => {
            window.location.href = '/';
        });
    });

    // Load data on tab change
    switchTab('dashboard');
});

function switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    // Show selected tab
    const selectedTab = document.getElementById(tabName + '-tab');
    if (selectedTab) {
        selectedTab.classList.add('active');

        // Load data based on tab
        if (tabName === 'dashboard') {
            loadDashboardData();
        } else if (tabName === 'users') {
            loadUsers();
        } else if (tabName === 'mechanics') {
            loadMechanics();
        }
    }
}

function loadAdminProfile() {
    fetch('/profile', {
        method: 'GET',
        credentials: 'include'
    })
    .then(res => res.json())
    .then(data => {
        if (data.logged_in && data.user.role === 'admin') {
            document.getElementById('adminName').textContent = data.user.full_name || data.user.username;
            if (data.user.profile_pic) {
                document.getElementById('adminProfilePic').src = data.user.profile_pic;
            }
        } else {
            window.location.href = '/';
        }
    })
    .catch(() => {
        window.location.href = '/';
    });
}

function loadDashboardData() {
    Promise.all([
        fetch('/api/stats', { credentials: 'include' }).then(r => r.json()),
        fetch('/mechanics', { credentials: 'include' }).then(r => r.json())
    ])
    .then(([stats, mechanics]) => {
        // Update stats
        document.getElementById('totalUsers').textContent = stats.total_users || 0;
        document.getElementById('totalMechanics').textContent = stats.total_mechanics || 0;
        document.getElementById('totalBookings').textContent = stats.total_bookings || 0;
        
        if (mechanics.success && mechanics.mechanics.length > 0) {
            const avgRating = (mechanics.mechanics.reduce((sum, m) => sum + m.rating, 0) / mechanics.mechanics.length).toFixed(1);
            document.getElementById('avgRating').textContent = avgRating;
        }
    })
    .catch(err => console.error('Error loading dashboard:', err));
}

function loadUsers() {
    // Fetch all users
    fetch('/api/users', {
        method: 'GET',
        credentials: 'include'
    })
    .then(res => res.json())
    .then(data => {
        const tbody = document.getElementById('usersTableBody');
        tbody.innerHTML = '';

        if (data.users && data.users.length > 0) {
            data.users.forEach(user => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${user.id}</td>
                    <td>${user.username}</td>
                    <td>${user.email}</td>
                    <td>${user.full_name || '-'}</td>
                    <td>${new Date(user.created_at).toLocaleDateString()}</td>
                    <td>
                        <button class="action-btn" onclick="editUser(${user.id})">Edit</button>
                        <button class="action-btn delete" onclick="deleteUser(${user.id})">Delete</button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No users found</td></tr>';
        }
    })
    .catch(err => {
        console.error('Error loading users:', err);
        document.getElementById('usersTableBody').innerHTML = '<tr><td colspan="6" style="text-align: center; color: red;">Error loading users</td></tr>';
    });
}

function loadMechanics() {
    fetch('/mechanics', {
        method: 'GET',
        credentials: 'include'
    })
    .then(res => res.json())
    .then(data => {
        const tbody = document.getElementById('mechanicsTableBody');
        tbody.innerHTML = '';

        if (data.success && data.mechanics.length > 0) {
            data.mechanics.forEach(mechanic => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${mechanic.id}</td>
                    <td>${mechanic.name}</td>
                    <td>${mechanic.email || '-'}</td>
                    <td>${mechanic.workshop}</td>
                    <td>${mechanic.experience || '-'} years</td>
                    <td>⭐ ${mechanic.rating || 0}</td>
                    <td>
                        <button class="action-btn" onclick="editMechanic(${mechanic.id})">Edit</button>
                        <button class="action-btn delete" onclick="deleteMechanic(${mechanic.id})">Delete</button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No mechanics found</td></tr>';
        }
    })
    .catch(err => {
        console.error('Error loading mechanics:', err);
        document.getElementById('mechanicsTableBody').innerHTML = '<tr><td colspan="7" style="text-align: center; color: red;">Error loading mechanics</td></tr>';
    });
}

function editUser(userId) {
    alert('Edit user ' + userId + ' - Feature coming soon');
}

function deleteUser(userId) {
    if (confirm('Are you sure you want to delete this user?')) {
        alert('Delete user ' + userId + ' - Feature coming soon');
    }
}

function editMechanic(mechanicId) {
    alert('Edit mechanic ' + mechanicId + ' - Feature coming soon');
}

function deleteMechanic(mechanicId) {
    if (confirm('Are you sure you want to delete this mechanic?')) {
        alert('Delete mechanic ' + mechanicId + ' - Feature coming soon');
    }
}
