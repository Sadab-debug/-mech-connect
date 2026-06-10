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
});