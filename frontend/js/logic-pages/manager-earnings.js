// Menggunakan pendekatan prosedural function sepenuhnya
// (Tanpa menggunakan struktur class / OOP)

function bindEvents() {
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  
  // Update atribut HTML dan simpan preferensi di LocalStorage
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('pilih-in-theme', newTheme);
  
  // Ganti ikon bulan/matahari
  const themeIcon = document.getElementById('themeIcon');
  if (themeIcon) {
    themeIcon.setAttribute('data-feather', newTheme === 'dark' ? 'moon' : 'sun');
    if (typeof feather !== 'undefined') {
      feather.replace();
    }
  }
}

function initTheme() {
  // Cek tema yang tersimpan
  const savedTheme = localStorage.getItem('pilih-in-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  
  // Set ikon yang sesuai saat pertama kali dimuat
  const themeIcon = document.getElementById('themeIcon');
  if (themeIcon) {
    themeIcon.setAttribute('data-feather', savedTheme === 'dark' ? 'moon' : 'sun');
  }
}

function render() {
  // Render ikon feather untuk seluruh elemen UI
  if (typeof feather !== 'undefined') {
    feather.replace();
  }
  
  // Logika tambahan untuk mengambil dan me-render data 
  // dari database localStorage (DatabaseManager) bisa ditambahkan di sini
}

function initEarningsPage() {
  initTheme();
  bindEvents();
  render();
}

// Eksekusi fungsi inisialisasi saat struktur DOM selesai dirender
document.addEventListener('DOMContentLoaded', initEarningsPage);