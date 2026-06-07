// Strict Functional Procedural Architecture Pattern
// (Dilarang keras memakai keyword 'class' atau paradigma OOP penuh)

// ==== Inisialisasi Fungsi Utama Halaman ====
function initTrafficPage() {
  initTheme();
  bindEvents();
  renderIcons();
}

// ==== Pengikatan Event Listener ====
function bindEvents() {
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }

  const timeRangeSelect = document.getElementById('timeRangeSelect');
  if (timeRangeSelect) {
    timeRangeSelect.addEventListener('change', handleTimeRangeChange);
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

// ==== Render Ikon Modul & Aksi Filter ====
function renderIcons() {
  if (typeof feather !== 'undefined') {
    feather.replace();
  }
}

function handleTimeRangeChange(event) {
  const selectedRange = event.target.value;
  const chartPlaceholder = document.querySelector('.chart-placeholder');
  
  if (chartPlaceholder) {
    chartPlaceholder.textContent = `[ Memuat ulang data tren kunjungan untuk ${selectedRange} Hari Terakhir... ]`;
    
    // Simulasi pengambilan data baru secara prosedural
    setTimeout(() => {
      chartPlaceholder.textContent = `[ Area Grafik Tren Kunjungan: Rentang ${selectedRange} Hari ]`;
    }, 600);
  }
}

// Menjalankan modul inisialisasi saat kerangka DOM selesai dimuat
document.addEventListener('DOMContentLoaded', initTrafficPage);