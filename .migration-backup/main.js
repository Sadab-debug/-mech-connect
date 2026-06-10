document.addEventListener('DOMContentLoaded', function() {
  var btn = document.getElementById('darkModeToggle');
  function applySavedTheme() {
    var saved = localStorage.getItem('themeMode');
    if (saved === 'dark') {
      document.body.classList.add('dark-mode');
      if (btn) btn.textContent = '☀️ Light Mode';
    } else if (btn) {
      btn.textContent = '🌙 Dark Mode';
    }
  }

  if (btn) {
    btn.onclick = function() {
      document.body.classList.toggle('dark-mode');
      var isDark = document.body.classList.contains('dark-mode');
      localStorage.setItem('themeMode', isDark ? 'dark' : 'light');
      this.textContent = isDark ? '☀️ Light Mode' : '🌙 Dark Mode';
    };
  }

  applySavedTheme();

  var allMechanics = [];
  var currentQuery = '';

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function buildMechanicCard(mechanic) {
    var expertise = mechanic.expertise || '';
    var skills = expertise
      .split(',')
      .map(function(s) { return s.trim(); })
      .filter(Boolean);

    var imgSrc = mechanic.profile_pic || 'https://via.placeholder.com/100';
    var roleText = (skills[0] || 'Mechanic');
    var descText = mechanic.workshop_name ? ('Workshop: ' + mechanic.workshop_name) : 'Available for booking';
    var experienceText = (mechanic.experience_years != null && mechanic.experience_years !== '') ? (mechanic.experience_years + ' years') : 'N/A';
    var rateText = (mechanic.hourly_rate != null && mechanic.hourly_rate !== '') ? ('$' + mechanic.hourly_rate + '/hour') : 'N/A';

    var card = document.createElement('div');
    card.className = 'card';
    card.dataset.mechanicId = mechanic.id || '';
    card.dataset.name = mechanic.full_name || mechanic.name || '';
    card.dataset.role = roleText;
    card.dataset.desc = descText;
    card.dataset.experience = experienceText;
    card.dataset.skills = skills.join(', ');
    card.dataset.hours = mechanic.working_hours || '';
    card.dataset.address = mechanic.address || '';
    card.dataset.education = '';
    card.dataset.rate = rateText;
    card.dataset.img = imgSrc;

    var skillsHtml = skills.slice(0, 6).map(function(s) {
      return '<span class="skill-pill">' + escapeHtml(s) + '</span>';
    }).join('');

    card.innerHTML = ''
      + '<img class="profile-img" src="' + escapeHtml(imgSrc) + '" alt="Mechanic">'
      + '<h3>' + escapeHtml(mechanic.name || 'Mechanic') + '</h3>'
      + '<p><strong>' + escapeHtml(roleText) + '</strong></p>'
      + '<p>' + escapeHtml(descText) + '</p>'
      + '<p>Experience: ' + escapeHtml(experienceText) + '</p>'
      + '<div class="skills">'
      + '  <p><strong>Skills:</strong></p>'
      + '  <div class="skills-list">' + skillsHtml + '</div>'
      + (mechanic.working_hours ? ('  <p>Working hours: ' + escapeHtml(mechanic.working_hours) + '</p>') : '')
      + '</div>'
      + '<div class="buttons">'
      + '  <button class="hire-btn" type="button">Hire</button>'
      + '  <button class="msg-btn" type="button">Message</button>'
      + '</div>';

    return card;
  }

  function renderMechanics(mechanics) {
    var popularContainer = document.getElementById('popularMechanics');
    var activeContainer = document.getElementById('activeMechanics');

    var activeCountEl = document.getElementById('statActiveCount');
    var popularCountEl = document.getElementById('statPopularCount');

    if (popularContainer) popularContainer.innerHTML = '';
    if (activeContainer) activeContainer.innerHTML = '';

    if (!mechanics || mechanics.length === 0) {
      if (activeContainer) {
        activeContainer.innerHTML = '<div style="padding:24px;color:#666;font-weight:600;">No active mechanics right now.</div>';
      }
      if (popularContainer) {
        popularContainer.innerHTML = '<div style="padding:24px;color:#666;font-weight:600;">No mechanics available yet.</div>';
      }
      return;
    }

    if (activeCountEl) activeCountEl.textContent = String(mechanics.length);

    mechanics.forEach(function(m) {
      var card = buildMechanicCard(m);
      if (activeContainer) activeContainer.appendChild(card.cloneNode(true));
    });

    var popular = mechanics.slice().sort(function(a, b) {
      var ar = (a.rating == null ? 0 : a.rating);
      var br = (b.rating == null ? 0 : b.rating);
      return br - ar;
    }).slice(0, 6);

    if (popularCountEl) popularCountEl.textContent = String(popular.length);

    popular.forEach(function(m) {
      if (popularContainer) popularContainer.appendChild(buildMechanicCard(m));
    });
  }

  async function loadMechanics() {
    try {
      var res = await fetch('/mechanics', { credentials: 'include' });
      var data = await res.json();
      if (data && data.success) {
        allMechanics = Array.isArray(data.mechanics) ? data.mechanics : [];
        applyFilter();
      }
    } catch (e) {
    }
  }

  function normalizeText(v) {
    return String(v || '').toLowerCase();
  }

  function applyFilter() {
    var q = normalizeText(currentQuery).trim();
    if (!q) {
      renderMechanics(allMechanics);
      return;
    }

    var filtered = allMechanics.filter(function(m) {
      var hay = [
        m.name,
        m.full_name,
        m.expertise,
        m.workshop,
        m.workshop_name,
        m.address,
        m.mobile
      ].map(normalizeText).join(' | ');
      return hay.indexOf(q) !== -1;
    });

    renderMechanics(filtered);
  }

  loadMechanics();
  setInterval(loadMechanics, 15000);

  var searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', function() {
      currentQuery = this.value || '';
      applyFilter();
    });
  }

  var searchClear = document.getElementById('searchClear');
  if (searchClear) {
    searchClear.addEventListener('click', function() {
      if (searchInput) searchInput.value = '';
      currentQuery = '';
      applyFilter();
    });
  }

  var searchClear = document.getElementById('searchClear');
  if (searchClear) {
    searchClear.addEventListener('click', function() {
      if (searchInput) searchInput.value = '';
      currentQuery = '';
      applyFilter();
    });
  }

  document.addEventListener('click', function(e) {
    var hireBtn = e.target.closest('.hire-btn');
    if (hireBtn) {
      var card = e.target.closest('.card');
      if (!card) return;
      // Navigate to booking page with mechanic_id
      var mechanicId = card.dataset.mechanicId;
      if (mechanicId) {
        window.location.href = 'booking/booking.html?mechanic_id=' + encodeURIComponent(mechanicId);
      } else {
        // Fallback: open modal (old behavior)
        var modal = document.getElementById('mechanicModal');
        if (!modal) return;
        document.getElementById('modalImg').src = card.dataset.img || '';
        document.getElementById('modalName').textContent = card.dataset.name || '';
        document.getElementById('modalRole').textContent = card.dataset.role || '';
        document.getElementById('modalDesc').textContent = card.dataset.desc || '';
        document.getElementById('modalExperience').textContent = card.dataset.experience || '';
        document.getElementById('modalSkills').textContent = card.dataset.skills || '';
        document.getElementById('modalHours').textContent = card.dataset.hours || '';
        document.getElementById('modalAddress').textContent = card.dataset.address || '';
        document.getElementById('modalEducation').textContent = card.dataset.education || '';
        document.getElementById('modalRate').textContent = card.dataset.rate || '';
        modal.style.display = 'flex';
      }
      return;
    }

    var msgBtn = e.target.closest('.msg-btn');
    if (msgBtn) {
      var card = e.target.closest('.card');
      if (!card) return;
      var mechanicId = card.dataset.mechanicId;
      var mechanicName = card.dataset.name;
      
      // Store mechanic info for chat
      sessionStorage.setItem('chatMechanicId', 'mechanic_' + mechanicId);
      sessionStorage.setItem('chatMechanicName', mechanicName);
      
      // Redirect to chat
      window.location.href = "chat/chat.html";
    }
  });

  // Modal Hire button functionality
  var modalHireBtn = document.getElementById('modalHireBtn');
  if (modalHireBtn) {
    modalHireBtn.onclick = function() {
      window.location.href = "booking/booking.html";
    };
  }

  // Close modal
  var closeModal = document.getElementById('closeMechanicModal');
  if (closeModal) {
    closeModal.onclick = function() {
      var modal = document.getElementById('mechanicModal');
      if (modal) modal.style.display = 'none';
    };
  }

  // Login/Signup button or link functionality
  var loginBtn = document.getElementById('loginBtn');
  if (loginBtn) {
    loginBtn.onclick = function() {
      window.location.href = "login/login.html";
    };
  }
  // If using a class for multiple login links
  document.querySelectorAll('.login-link').forEach(function(link) {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      window.location.href = "login/login.html";
    });
  });
});
