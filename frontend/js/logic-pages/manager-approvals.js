// Menggunakan pendekatan prosedural (Tanpa OOP / Class)

function bindEvents() {
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }

  // Bind event untuk tombol approve/reject
  const actionButtons = document.querySelectorAll('.btn-action');
  actionButtons.forEach(button => {
    button.addEventListener('click', handleApprovalAction);
  });
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('pilih-in-theme', newTheme);
  
  const themeIcon = document.getElementById('themeIcon');
  if (themeIcon) {
    themeIcon.setAttribute('data-feather', newTheme === 'dark' ? 'moon' : 'sun');
    if (typeof feather !== 'undefined') feather.replace();
  }
}

function initTheme() {
  const savedTheme = localStorage.getItem('pilih-in-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  
  const themeIcon = document.getElementById('themeIcon');
  if (themeIcon) {
    themeIcon.setAttribute('data-feather', savedTheme === 'dark' ? 'moon' : 'sun');
  }
}

function handleApprovalAction(event) {
  // Mencari elemen tombol dan card pembungkusnya
  const button = event.currentTarget;
  const card = button.closest('.approval-card');
  const approvalId = card.getAttribute('data-id');
  
  const isApprove = button.classList.contains('btn-approve');
  const actionName = isApprove ? 'disetujui' : 'ditolak';

  // Efek transisi menghilang
  card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
  card.style.opacity = '0';
  card.style.transform = 'translateX(20px)';

  setTimeout(() => {
    card.remove();
    // Di sini nantinya Anda bisa memanggil repository untuk mengubah status database
    // contoh: repositories.transactions.updateStatus(approvalId, isApprove);
    console.log(`Item ${approvalId} telah ${actionName}.`);
    
    checkEmptyState();
  }, 300);
}

function checkEmptyState() {
  const container = document.getElementById('approvalContainer');
  const cards = container.querySelectorAll('.approval-card');
  
  if (cards.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 40px; color: var(--text-muted);">
        <i data-feather="check-circle" style="width: 48px; height: 48px; margin-bottom: 16px; color: var(--success);"></i>
        <h3>Semua Selesai!</h3>
        <p>Tidak ada lagi antrean yang perlu disetujui saat ini.</p>
      </div>
    `;
    if (typeof feather !== 'undefined') feather.replace();
  }
}

function render() {
  if (typeof feather !== 'undefined') {
    feather.replace();
  }
}

function initApprovalsPage() {
  initTheme();
  bindEvents();
  render();
}

document.addEventListener('DOMContentLoaded', initApprovalsPage);