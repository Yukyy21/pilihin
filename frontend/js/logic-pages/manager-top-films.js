// Strict Procedural Pattern (Sesuai dengan arahan "dilarang menggunakan class")

// ==== Inisialisasi Fungsi Utama ====
function initTopFilmsPage() {
  initTheme();
  bindEvents();
  renderIcons();
}

// ==== Event Listener Binder ====
function bindEvents() {
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }

  // Bind input pencarian
  const searchInput = document.querySelector('.search-input');
  if (searchInput) {
    searchInput.addEventListener('input', handleSearch);
  }
}

// ==== Logika Manajemen Tema (Dark/Light) ====
function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('pilih-in-theme', newTheme);
  
  updateThemeIcon(newTheme);
}

function initTheme() {
  const savedTheme = localStorage.getItem('pilih-in-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);
}

function updateThemeIcon(theme) {
  const themeIcon = document.getElementById('themeIcon');
  if (themeIcon) {
    themeIcon.setAttribute('data-feather', theme === 'dark' ? 'moon' : 'sun');
    renderIcons();
  }
}

// ==== Render UI & Utilities ====
function renderIcons() {
  if (typeof feather !== 'undefined') {
    feather.replace();
  }
}

function handleSearch(event) {
  const query = event.target.value.toLowerCase();
  const tableRows = document.querySelectorAll('#topFilmsTableBody tr');
  
  tableRows.forEach(row => {
    // Ambil nama film dari dalam baris
    const filmNameElement = row.querySelector('.film-name');
    if (filmNameElement) {
      const filmName = filmNameElement.textContent.toLowerCase();
      // Tampilkan atau sembunyikan baris berdasarkan kecocokan string
      if (filmName.includes(query)) {
        row.style.display = '';
      } else {
        row.style.display = 'none';
      }
    }
  });
}

// Eksekusi ketika struktur DOM selesai dimuat
document.addEventListener('DOMContentLoaded', initTopFilmsPage);