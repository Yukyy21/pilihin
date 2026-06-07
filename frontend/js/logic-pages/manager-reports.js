// Menggunakan pendekatan functional procedural secara ketat
// (Dilarang keras menggunakan keyword 'class' / OOP sesuai instruksi)

// ==== Variabel State Halaman ====
let isGenerating = false;

// ==== Inisialisasi Fungsi Utama ====
function initReportsPage() {
  initTheme();
  bindEvents();
  renderIcons();
  setDefaultDates();
}

// ==== Event Listener Binder ====
function bindEvents() {
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }

  const generateBtn = document.getElementById('btnGenerateReport');
  if (generateBtn) {
    generateBtn.addEventListener('click', handleGenerateReport);
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

// ==== Helper Utilities ====
function renderIcons() {
  if (typeof feather !== 'undefined') {
    feather.replace();
  }
}

function setDefaultDates() {
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  
  const formatDate = (date) => date.toISOString().split('T')[0];
  
  const startDateInput = document.getElementById('startDate');
  const endDateInput = document.getElementById('endDate');
  
  if (startDateInput) startDateInput.value = formatDate(firstDayOfMonth);
  if (endDateInput) endDateInput.value = formatDate(today);
}

// ==== Logika Pembuatan & Penambahan Data Laporan ====
function handleGenerateReport(event) {
  event.preventDefault();
  
  if (isGenerating) return;
  
  const generateBtn = event.currentTarget;
  const reportType = document.getElementById('reportType').value;
  const formatType = document.getElementById('formatType').value;
  
  if (!reportType || !formatType) {
    alert('Harap pilih jenis data dan format laporan!');
    return;
  }

  // Set State ke Loading
  isGenerating = true;
  const originalText = generateBtn.innerHTML;
  generateBtn.innerHTML = '<i data-feather="loader" class="spin"></i> Memproses...';
  generateBtn.disabled = true;
  renderIcons();

  // Simulasi asinkronus (delay proses ekspor data)
  setTimeout(() => {
    isGenerating = false;
    generateBtn.innerHTML = originalText;
    generateBtn.disabled = false;
    renderIcons();
    
    addReportToHistory(reportType, formatType);
    alert('Laporan sukses diproduksi dan ditambahkan ke riwayat!');
  }, 2000);
}

function addReportToHistory(type, format) {
  const tbody = document.getElementById('historyTableBody');
  if (!tbody) return;
  
  const today = new Date();
  const dateString = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;
  
  const typeLabels = {
    'revenue': 'Pendapatan',
    'traffic': 'Statistik_Trafik',
    'users': 'Pengguna_Aktif',
    'all': 'Laporan_Lengkap'
  };
  
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td class="file-name-cell">Laporan_${typeLabels[type] || type}_${today.getTime()}.${format}</td>
    <td>${typeLabels[type] || type}</td>
    <td>${dateString}</td>
    <td><span class="badge badge-success">Selesai</span></td>
    <td>
      <button class="btn-download" title="Unduh File">
        <i data-feather="download"></i>
      </button>
    </td>
  `;
  
  // Memasukkan baris data baru ke urutan baris teratas dalam tabel riwayat
  tbody.insertBefore(tr, tbody.firstChild);
  renderIcons();
}

// Menjalankan inisialisasi modul halaman saat DOM siap
document.addEventListener('DOMContentLoaded', initReportsPage);