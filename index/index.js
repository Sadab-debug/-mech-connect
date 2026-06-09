document.addEventListener('DOMContentLoaded', function() {
  var btn = document.getElementById('darkModeToggle');
  if (btn) {
    btn.onclick = function() {
      document.body.classList.toggle('dark-mode');
      this.textContent = document.body.classList.contains('dark-mode') ? '☀️ Light Mode' : '🌙 Dark Mode';
    };
  }
});