// js/pages/manager-dashboard.js
// Logic halaman Dashboard Manager — Pilih.in
// Pola: import dari db/init.js → repositories.* → update DOM

import { repositories } from '../db/init.js';
import { authService }  from '../db/services/AuthService.js';
import { DOM }          from '../utils/dom.js';

class ManagerDashboard {
  constructor() {
    // Guard: hanya role manager yang boleh masuk
    if (!authService.requireRole('manager', '/frontend/pages/main/login.html')) {
      throw new Error('Akses ditolak — hanya manager');
    }

    this.period = 30; // hari, default
    this._init();
  }

  // ─── INIT ────────────────────────────────────────────────
  _init() {
    this._initTheme();
    this._renderNavbar();
    this._bindEvents();
    this._renderAll();
  }

  _initTheme() {
    const saved = localStorage.getItem('pilih-in-theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
    const icon = document.getElementById('themeIcon');
    if (icon) icon.setAttribute('data-feather', saved === 'dark' ? 'moon' : 'sun');
  }

  _renderNavbar() {
    const user = authService.getCurrentUser();
    if (!user) return;

    // Nama user di navbar
    const nameEl = document.getElementById('userName');
    if (nameEl) nameEl.textContent = user.fullName || user.username;

    // Avatar (inisial)
    const avatarEl = document.getElementById('userAvatar');
    if (avatarEl) {
      const initials = (user.fullName || user.username || '?')
        .split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
      avatarEl.textContent = initials;
    }

    // Tanggal
    const dateEl = document.getElementById('currentDate');
    if (dateEl) {
      dateEl.textContent = new Date().toLocaleDateString('id-ID', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
      });
    }

    // Pesan sambutan
    const welcomeEl = document.getElementById('welcomeMsg');
    if (welcomeEl) {
      const hour = new Date().getHours();
      const greeting = hour < 11 ? 'Selamat pagi' : hour < 15 ? 'Selamat siang' : hour < 19 ? 'Selamat sore' : 'Selamat malam';
      welcomeEl.textContent = `${greeting}, ${user.fullName || user.username}! Berikut ringkasan performa platform.`;
    }
  }

  // ─── EVENTS ──────────────────────────────────────────────
  _bindEvents() {
    // Toggle sidebar
    document.getElementById('sidebarToggle')?.addEventListener('click', () => {
      document.getElementById('sidebar')?.classList.toggle('open');
    });

    // Toggle tema
    document.getElementById('themeToggle')?.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('pilih-in-theme', next);
      const icon = document.getElementById('themeIcon');
      if (icon) {
        icon.setAttribute('data-feather', next === 'dark' ? 'moon' : 'sun');
        feather.replace();
      }
    });

    // Filter periode
    document.getElementById('periodFilter')?.addEventListener('change', (e) => {
      this.period = parseInt(e.target.value, 10);
      this._renderAll();
    });

    // Tombol logout — buka modal
    document.getElementById('btnLogout')?.addEventListener('click', () => {
      document.getElementById('logoutModal')?.classList.add('active');
      document.body.style.overflow = 'hidden';
    });

    // Konfirmasi logout
    document.getElementById('btnLogoutConfirm')?.addEventListener('click', () => {
      authService.logout();
      window.location.href = '/frontend/pages/main/login.html';
    });

    // Tutup modal via overlay / tombol close
    document.querySelectorAll('[data-action="close"]').forEach(el => {
      el.addEventListener('click', () => {
        el.closest('.modal')?.classList.remove('active');
        document.body.style.overflow = '';
      });
    });

    // Tutup modal dengan Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal.active').forEach(m => {
          m.classList.remove('active');
          document.body.style.overflow = '';
        });
      }
    });
  }

  // ─── RENDER ALL ──────────────────────────────────────────
  _renderAll() {
    const stats = this._computeStats();
    this._renderKPI(stats);
    this._renderRevenueChart(stats);
    this._renderSubscriptionChart();
    this._renderTopFilms();
    this._renderTransactions();
    this._renderApprovals();
    feather.replace();
  }

  // ─── COMPUTE STATS ───────────────────────────────────────
  _computeStats() {
    const now       = new Date();
    const cutoff    = new Date(now - this.period * 86400000);
    const prevStart = new Date(cutoff - this.period * 86400000);

    const allTx = repositories.transactions.findAll();

    // Transaksi periode ini
    const curTx  = allTx.filter(t => new Date(t.createdAt) >= cutoff);
    const prevTx = allTx.filter(t => {
      const d = new Date(t.createdAt);
      return d >= prevStart && d < cutoff;
    });

    const sumAmount = (txList) =>
      txList.reduce((acc, t) => acc + (Number(t.amount) || 0), 0);

    const curRevenue  = sumAmount(curTx);
    const prevRevenue = sumAmount(prevTx);

    // Users aktif (yang pernah login dalam periode)
    const allUsers   = repositories.users.findAll().filter(u => u.role === 'user');
    const curUsers   = allUsers.filter(u => u.lastLogin && new Date(u.lastLogin) >= cutoff);
    const prevUsers  = allUsers.filter(u => {
      const d = u.lastLogin && new Date(u.lastLogin);
      return d && d >= prevStart && d < cutoff;
    });

    // Watch history
    const allWatch  = repositories.watchHistory.findAll();
    const curWatch  = allWatch.filter(w => new Date(w.createdAt) >= cutoff);
    const prevWatch = allWatch.filter(w => {
      const d = new Date(w.createdAt);
      return d >= prevStart && d < cutoff;
    });

    // Subscriber baru (transaksi dengan tier bukan free)
    const tierFreeId   = repositories.pricingTiers.findWhere(t => t.name?.toLowerCase().includes('free'))?.[0]?.id;
    const curSubs  = curTx.filter(t => t.tierId !== tierFreeId && t.type !== 'refund');
    const prevSubs = prevTx.filter(t => t.tierId !== tierFreeId && t.type !== 'refund');

    // Revenue per hari untuk chart
    const dailyRevenue = this._buildDailyRevenue(curTx, this.period);

    return {
      revenue:      { cur: curRevenue,     prev: prevRevenue     },
      users:        { cur: curUsers.length, prev: prevUsers.length},
      watches:      { cur: curWatch.length, prev: prevWatch.length},
      subs:         { cur: curSubs.length,  prev: prevSubs.length },
      dailyRevenue,
      recentTx:     allTx.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 6),
    };
  }

  _buildDailyRevenue(txList, days) {
    const map = {};
    const now = new Date();
    // Inisialisasi semua hari
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now - i * 86400000);
      map[this._dateKey(d)] = 0;
    }
    txList.forEach(t => {
      const key = this._dateKey(new Date(t.createdAt));
      if (key in map) map[key] += Number(t.amount) || 0;
    });
    return Object.entries(map).map(([date, amount]) => ({ date, amount }));
  }

  _dateKey(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  // ─── KPI ─────────────────────────────────────────────────
  _renderKPI(stats) {
    this._setKPI('kpiRevenue',  this._formatCurrency(stats.revenue.cur),
      stats.revenue.prev,  stats.revenue.cur,  'kpiRevenueDelta');

    this._setKPI('kpiUsers',    this._formatNumber(stats.users.cur),
      stats.users.prev,    stats.users.cur,    'kpiUsersDelta');

    this._setKPI('kpiWatch',    this._formatNumber(stats.watches.cur),
      stats.watches.prev,  stats.watches.cur,  'kpiWatchDelta');

    this._setKPI('kpiSubs',     this._formatNumber(stats.subs.cur),
      stats.subs.prev,     stats.subs.cur,     'kpiSubsDelta');
  }

  _setKPI(valueId, valueStr, prev, cur, deltaId) {
    const valEl   = document.getElementById(valueId);
    const deltaEl = document.getElementById(deltaId);
    if (valEl)   valEl.textContent = valueStr;
    if (!deltaEl) return;

    const pct = prev === 0 ? (cur > 0 ? 100 : 0) : Math.round(((cur - prev) / prev) * 100);
    const up  = pct >= 0;
    const icon = up ? 'trending-up' : 'trending-down';
    deltaEl.innerHTML = `<i data-feather="${icon}"></i> ${up ? '+' : ''}${pct}%`;
    deltaEl.classList.toggle('kpi-card__badge--up',   up);
    deltaEl.classList.toggle('kpi-card__badge--down', !up);
  }

  // ─── REVENUE CHART (SVG bar chart) ───────────────────────
  _renderRevenueChart(stats) {
    const container = document.getElementById('revenueChart');
    if (!container) return;

    const data   = stats.dailyRevenue;
    const maxAmt = Math.max(...data.map(d => d.amount), 1);

    // Tampilkan hanya label setiap N hari agar tidak crowded
    const labelStep = this.period <= 7 ? 1 : this.period <= 30 ? 5 : this.period <= 90 ? 15 : 30;

    const W = 560, H = 180, padL = 48, padR = 12, padT = 12, padB = 32;
    const chartW = W - padL - padR;
    const chartH = H - padT - padB;
    const barW   = Math.max(2, Math.floor(chartW / data.length) - 2);

    // Sumbu Y — 4 gridlines
    const yTicks = [0, 0.25, 0.5, 0.75, 1].map(f => ({
      y:   padT + chartH * (1 - f),
      val: maxAmt * f,
    }));

    const gridLines = yTicks.map(t =>
      `<line x1="${padL}" y1="${t.y.toFixed(1)}" x2="${W - padR}" y2="${t.y.toFixed(1)}"
             stroke="var(--border-color)" stroke-width="1" stroke-dasharray="4 4"/>`
    ).join('');

    const yLabels = yTicks.map(t =>
      `<text x="${padL - 6}" y="${(t.y + 4).toFixed(1)}" text-anchor="end"
             font-size="10" fill="var(--text-muted)" font-family="var(--font-family)"
             >${this._formatShort(t.val)}</text>`
    ).join('');

    // Bars + x-labels
    const bars = data.map((d, i) => {
      const bH  = Math.max(2, (d.amount / maxAmt) * chartH);
      const x   = padL + i * (chartW / data.length) + (chartW / data.length - barW) / 2;
      const y   = padT + chartH - bH;
      const showLabel = i % labelStep === 0 || i === data.length - 1;
      const dateParts = d.date.split('-');
      const labelTxt  = `${dateParts[2]}/${dateParts[1]}`;

      const xLabel = showLabel
        ? `<text x="${(x + barW / 2).toFixed(1)}" y="${H - 4}"
                 text-anchor="middle" font-size="9" fill="var(--text-muted)"
                 font-family="var(--font-family)">${labelTxt}</text>`
        : '';

      return `
        <rect class="chart-bar" x="${x.toFixed(1)}" y="${y.toFixed(1)}"
              width="${barW}" height="${bH.toFixed(1)}"
              rx="2" fill="var(--accent-primary)" opacity="0.85">
          <title>${d.date}: ${this._formatCurrency(d.amount)}</title>
        </rect>
        ${xLabel}`;
    }).join('');

    container.innerHTML = `
      <svg class="revenue-chart-svg" viewBox="0 0 ${W} ${H}"
           xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        ${gridLines}
        ${yLabels}
        ${bars}
        <!-- Sumbu X -->
        <line x1="${padL}" y1="${padT + chartH}" x2="${W - padR}" y2="${padT + chartH}"
              stroke="var(--border-color)" stroke-width="1"/>
      </svg>`;
  }

  // ─── SUBSCRIPTION CHART ──────────────────────────────────
  _renderSubscriptionChart() {
    const container = document.getElementById('subscriptionChart');
    const legendEl  = document.getElementById('subscriptionLegend');
    if (!container) return;

    const tiers = repositories.pricingTiers.findAll();
    const users = repositories.users.findWhere(u => u.role === 'user' && u.status === 'active');

    const colors = ['var(--text-muted)', 'var(--info)', 'var(--accent-primary)', 'var(--warning)'];

    const tierCounts = tiers.map((tier, i) => ({
      name:  tier.name || `Tier ${i + 1}`,
      count: users.filter(u => u.subscriptionTier === tier.id).length,
      color: colors[i % colors.length],
    }));

    // Tambah "Tanpa langganan" untuk user tanpa tier
    const assignedIds = new Set(tiers.map(t => t.id));
    const unassigned  = users.filter(u => !assignedIds.has(u.subscriptionTier)).length;
    if (unassigned > 0) {
      tierCounts.push({ name: 'Lainnya', count: unassigned, color: 'var(--border-color)' });
    }

    const total = tierCounts.reduce((a, c) => a + c.count, 0) || 1;

    container.innerHTML = tierCounts.map(t => `
      <div class="sub-bar-row">
        <span class="sub-bar-label">${t.name}</span>
        <div class="sub-bar-track">
          <div class="sub-bar-fill"
               style="width:${((t.count / total) * 100).toFixed(1)}%; background:${t.color}">
          </div>
        </div>
        <span class="sub-bar-count">${t.count}</span>
      </div>`).join('');

    if (legendEl) {
      legendEl.innerHTML = tierCounts.map(t => `
        <div class="legend-item">
          <span class="legend-dot" style="background:${t.color}"></span>
          <span>${t.name} (${((t.count / total) * 100).toFixed(0)}%)</span>
        </div>`).join('');
    }
  }

  // ─── TOP FILMS ───────────────────────────────────────────
  _renderTopFilms() {
    const listEl = document.getElementById('topFilmList');
    if (!listEl) return;

    const films = repositories.films.findPopular(5);

    if (!films.length) {
      listEl.innerHTML = `<li class="top-film-list__loading">
        <i data-feather="film"></i> Belum ada data film
      </li>`;
      return;
    }

    const rankClass = (i) => {
      if (i === 0) return 'rank--gold';
      if (i === 1) return 'rank--silver';
      if (i === 2) return 'rank--bronze';
      return 'rank--normal';
    };

    listEl.innerHTML = films.map((film, i) => `
      <li class="top-film-item">
        <div class="top-film-item__rank ${rankClass(i)}">${i + 1}</div>
        <img class="top-film-item__poster"
             src="${film.poster || ''}"
             alt="${film.title}"
             loading="lazy"
             onerror="this.style.display='none'">
        <div class="top-film-item__info">
          <p class="top-film-item__title">${film.title}</p>
          <p class="top-film-item__meta">${new Date(film.releaseDate).getFullYear()} • ${film.duration} mnt</p>
        </div>
        <div class="top-film-item__stat">
          <span class="top-film-item__watches">${this._formatNumber(film.watchCount)}</span>
          <span class="top-film-item__rating">
            <i data-feather="star"></i> ${film.averageRating?.toFixed(1) ?? '—'}
          </span>
        </div>
      </li>`).join('');
  }

  // ─── TRANSAKSI TERBARU ───────────────────────────────────
  _renderTransactions() {
    const container = document.getElementById('transactionList');
    if (!container) return;

    const txList = repositories.transactions
      .findAll()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 6);

    if (!txList.length) {
      container.innerHTML = `<div class="list-loading">
        <i data-feather="credit-card"></i> Belum ada transaksi
      </div>`;
      return;
    }

    container.innerHTML = txList.map(tx => {
      const user = repositories.users.findById(tx.userId);
      const tier = repositories.pricingTiers.findById(tx.tierId);
      const initials = user
        ? (user.fullName || user.username || '?').split(' ').slice(0,2).map(w => w[0]).join('').toUpperCase()
        : '?';

      return `
        <div class="transaction-item">
          <div class="transaction-item__avatar">${initials}</div>
          <div class="transaction-item__info">
            <p class="transaction-item__user">${user?.fullName || user?.username || 'Pengguna'}</p>
            <p class="transaction-item__tier">${tier?.name || 'Langganan'}</p>
          </div>
          <div class="transaction-item__amount">
            +${this._formatCurrency(tx.amount)}
            <span class="transaction-item__date">${this._relativeDate(tx.createdAt)}</span>
          </div>
        </div>`;
    }).join('');
  }

  // ─── APPROVALS (review pending) ──────────────────────────
  _renderApprovals() {
    const container = document.getElementById('approvalList');
    const emptyEl   = document.getElementById('approvalEmpty');
    if (!container) return;

    const pending = repositories.reviews
      .findWhere(r => r.status === 'pending')
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);

    if (!pending.length) {
      container.classList.add('hidden');
      emptyEl?.classList.remove('hidden');
      return;
    }

    container.classList.remove('hidden');
    emptyEl?.classList.add('hidden');

    container.innerHTML = pending.map(review => {
      const film = repositories.films.findById(review.filmId);
      const user = repositories.users.findById(review.userId);

      return `
        <div class="approval-item" data-review-id="${review.id}">
          <div class="approval-item__icon">
            <i data-feather="message-square"></i>
          </div>
          <div class="approval-item__info">
            <p class="approval-item__title">${review.title || 'Ulasan tanpa judul'}</p>
            <p class="approval-item__meta">
              ${film?.title ?? 'Film'} • oleh ${user?.username ?? 'Pengguna'}
              • ${this._relativeDate(review.createdAt)}
            </p>
          </div>
          <div class="approval-item__actions">
            <button class="btn-icon-sm btn-icon-sm--approve"
                    title="Setujui"
                    data-action="approve-review"
                    data-id="${review.id}"
                    aria-label="Setujui ulasan">
              <i data-feather="check"></i>
            </button>
            <button class="btn-icon-sm btn-icon-sm--reject"
                    title="Tolak"
                    data-action="reject-review"
                    data-id="${review.id}"
                    aria-label="Tolak ulasan">
              <i data-feather="x"></i>
            </button>
          </div>
        </div>`;
    }).join('');

    // Event delegation untuk tombol approve/reject
    DOM.delegate(container, 'click', '[data-action]', (e, target) => {
      const action = target.dataset.action;
      const id     = target.dataset.id;
      if (!id) return;

      if (action === 'approve-review') {
        this._handleReviewAction(id, 'approved', target);
      } else if (action === 'reject-review') {
        this._handleReviewAction(id, 'rejected', target);
      }
    });
  }

  _handleReviewAction(reviewId, status, triggerEl) {
    try {
      repositories.reviews.update(reviewId, { status });
      const item = triggerEl.closest('.approval-item');
      item?.remove();

      const remaining = document.querySelectorAll('.approval-item').length;
      if (remaining === 0) {
        document.getElementById('approvalList')?.classList.add('hidden');
        document.getElementById('approvalEmpty')?.classList.remove('hidden');
      }

      const label = status === 'approved' ? 'disetujui' : 'ditolak';
      DOM.showToast(`Ulasan berhasil ${label}`, status === 'approved' ? 'success' : 'info');
      feather.replace();
    } catch (err) {
      DOM.showToast(err.message, 'error');
    }
  }

  // ─── FORMAT HELPERS ──────────────────────────────────────
  _formatCurrency(val) {
    if (!val) return 'Rp 0';
    return 'Rp ' + Math.round(val).toLocaleString('id-ID');
  }

  _formatNumber(val) {
    if (!val) return '0';
    if (val >= 1_000_000) return (val / 1_000_000).toFixed(1) + ' jt';
    if (val >= 1_000)     return (val / 1_000).toFixed(1) + ' rb';
    return String(val);
  }

  _formatShort(val) {
    if (!val) return '0';
    if (val >= 1_000_000) return (val / 1_000_000).toFixed(1) + 'jt';
    if (val >= 1_000)     return (val / 1_000).toFixed(0) + 'rb';
    return String(Math.round(val));
  }

  _relativeDate(iso) {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1)   return 'Baru saja';
    if (mins < 60)  return `${mins} mnt lalu`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)   return `${hrs} jam lalu`;
    const days = Math.floor(hrs / 24);
    if (days < 30)  return `${days} hari lalu`;
    return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  }
}

export default ManagerDashboard;