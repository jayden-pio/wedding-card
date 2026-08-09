'use strict';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ✏️ EDIT: 아래 상수만 수정하면 날짜·갤러리·공유 URL이 자동 반영됩니다.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// 예식 날짜·시간 (한국 표준시 KST, UTC+9)
const WEDDING_DATE = new Date('2026-12-05T13:00:00+09:00');

// 갤러리 이미지 목록 — 순서대로 표시됩니다. 파일을 추가/삭제하려면 이 배열만 수정하세요.
const GALLERY_IMAGES = [
  './img/optimized/KakaoTalk_20260504_233217382_11.jpg', // 반지 사진 — 첫 번째
  './img/optimized/KakaoTalk_20260504_233231164_03.jpg', // 야외 사진
  './img/optimized/KakaoTalk_20260504_233217382.jpg',
  './img/optimized/KakaoTalk_20260504_233217382_06.jpg',
];

// 공유 버튼에 사용될 URL과 제목 ✏️ EDIT
const SHARE_URL   = 'https://msandyj.github.io/wedding-card/';
const SHARE_TITLE = '청첩장을 보내드립니다';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

document.addEventListener('DOMContentLoaded', () => {
  renderCalendar();
  renderDday();
  initGallery();
  initMapViewer();
  initAccordions();
  initCopyButtons();
  initShare();
  initRevealOnScroll();
  initBgm();
});

// ── 캘린더 렌더링 ─────────────────────────────────────────
function renderCalendar() {
  const container = document.getElementById('calendarContainer');
  if (!container) return;

  const year       = WEDDING_DATE.getFullYear();
  const month      = WEDDING_DATE.getMonth(); // 0-indexed
  const weddingDay = WEDDING_DATE.getDate();

  const monthNames = [
    'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
    'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER',
  ];

  const header = document.createElement('p');
  header.className = 'cal-header';
  header.textContent = `${monthNames[month]} ${year}`;
  container.appendChild(header);

  const grid = document.createElement('div');
  grid.className = 'cal-grid';
  grid.setAttribute('role', 'grid');
  grid.setAttribute('aria-label', `${year}년 ${month + 1}월 달력`);

  // 요일 헤더 (일 ~ 토)
  ['일', '월', '화', '수', '목', '금', '토'].forEach(name => {
    const cell = document.createElement('div');
    cell.className = 'cal-day-name';
    cell.setAttribute('role', 'columnheader');
    cell.textContent = name;
    grid.appendChild(cell);
  });

  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0=Sun
  const lastDate        = new Date(year, month + 1, 0).getDate();

  // 1일 전 빈 칸
  for (let i = 0; i < firstDayOfWeek; i++) {
    const cell = document.createElement('div');
    cell.className = 'cal-cell cal-cell--empty';
    cell.setAttribute('aria-hidden', 'true');
    grid.appendChild(cell);
  }

  // 날짜 칸
  for (let d = 1; d <= lastDate; d++) {
    const dow  = (firstDayOfWeek + d - 1) % 7;
    const cell = document.createElement('div');
    cell.setAttribute('role', 'gridcell');

    let cls = 'cal-cell';
    if (dow === 0) cls += ' cal-cell--sun';
    if (dow === 6) cls += ' cal-cell--sat';
    if (d === weddingDay) {
      cls += ' cal-cell--wedding';
      cell.setAttribute('aria-label', `${d}일 — 결혼식`);
    }
    cell.className = cls;
    cell.textContent = d;
    grid.appendChild(cell);
  }

  container.appendChild(grid);
}

// ── D-day 카운트다운 ──────────────────────────────────────
function renderDday() {
  const el = document.getElementById('ddayText');
  if (!el) return;

  function tick() {
    const now     = new Date();
    const wedding = new Date(WEDDING_DATE);
    const diff    = wedding - now;

    if (diff > 0) {
      const totalSec = Math.floor(diff / 1000);
      const days  = Math.floor(totalSec / 86400);
      const hours = Math.floor((totalSec % 86400) / 3600);
      const mins  = Math.floor((totalSec % 3600) / 60);
      const secs  = totalSec % 60;
      const pad   = n => String(n).padStart(2, '0');
      el.innerHTML =
        `<span class="dday-unit">${days}<small>일</small></span>` +
        `<span class="dday-sep">:</span>` +
        `<span class="dday-unit">${pad(hours)}<small>시간</small></span>` +
        `<span class="dday-sep">:</span>` +
        `<span class="dday-unit">${pad(mins)}<small>분</small></span>` +
        `<span class="dday-sep">:</span>` +
        `<span class="dday-unit">${pad(secs)}<small>초</small></span>`;
    } else if (diff > -86_400_000) {
      el.textContent = '오늘, 결혼합니다 💍';
    } else {
      const daysPast = Math.floor(Math.abs(diff) / 86_400_000);
      el.textContent = `결혼한 지 ${daysPast}일 🎉`;
    }
  }

  tick();
  setInterval(tick, 1000);
}

// ── 갤러리 + 라이트박스 ───────────────────────────────────
let currentIndex = 0;
let touchStartX  = 0;

function initGallery() {
  const grid = document.getElementById('galleryGrid');
  if (!grid) return;

  GALLERY_IMAGES.forEach((src, i) => {
    const thumb = document.createElement('div');
    thumb.className = 'gallery-thumb';
    thumb.setAttribute('tabindex', '0');
    thumb.setAttribute('role', 'button');
    thumb.setAttribute('aria-label', `사진 ${i + 1} 크게 보기`);

    const img = document.createElement('img');
    img.src      = src;
    img.alt      = `커플 사진 ${i + 1}`;
    img.loading  = 'lazy';
    img.decoding = 'async';

    thumb.appendChild(img);
    thumb.addEventListener('click',   () => openLightbox(i));
    thumb.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLightbox(i); }
    });
    grid.appendChild(thumb);
  });

  // 라이트박스 이벤트
  const lightbox = document.getElementById('lightbox');
  document.getElementById('lightboxBack').addEventListener('click', closeLightbox);
  document.getElementById('lightboxClose').addEventListener('click', closeLightbox);
  document.getElementById('lightboxPrev').addEventListener('click', () => navigate(-1));
  document.getElementById('lightboxNext').addEventListener('click', () => navigate(1));

  lightbox.addEventListener('click', e => {
    if (e.target === lightbox) closeLightbox();
  });

  document.addEventListener('keydown', e => {
    if (lightbox.hidden) return;
    if (e.key === 'Escape')     closeLightbox();
    if (e.key === 'ArrowLeft')  navigate(-1);
    if (e.key === 'ArrowRight') navigate(1);
  });

  // 브라우저 뒤로가기 버튼으로 라이트박스 / 약도 뷰어 닫기
  window.addEventListener('popstate', () => {
    const lb = document.getElementById('lightbox');
    const mv = document.getElementById('mapViewer');
    if (!lb.hidden) closeLightbox(false);
    if (!mv.hidden) closeMapViewer(false);
  });

  // 스와이프 (터치)
  lightbox.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].clientX;
  }, { passive: true });

  lightbox.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 48) navigate(dx < 0 ? 1 : -1);
  }, { passive: true });
}

function openLightbox(index) {
  currentIndex = index;
  updateLightboxImage();
  const lb = document.getElementById('lightbox');
  lb.hidden = false;
  document.body.style.overflow = 'hidden';
  document.getElementById('lightboxBack').focus();
  history.pushState({ modal: 'lightbox' }, '');
}

function closeLightbox(shouldGoBack = true) {
  const lb = document.getElementById('lightbox');
  lb.hidden = true;
  document.body.style.overflow = '';
  if (shouldGoBack) history.back();
}

function navigate(dir) {
  currentIndex = (currentIndex + dir + GALLERY_IMAGES.length) % GALLERY_IMAGES.length;
  updateLightboxImage(dir);
}

function updateLightboxImage(dir = 0) {
  const img     = document.getElementById('lightboxImg');
  const counter = document.getElementById('lightboxCounter');
  img.src = GALLERY_IMAGES[currentIndex];
  img.alt = `커플 사진 ${currentIndex + 1}`;
  if (counter) counter.textContent = `${currentIndex + 1} / ${GALLERY_IMAGES.length}`;

  if (dir !== 0) {
    const cls = dir > 0 ? 'lightbox-img--enter-right' : 'lightbox-img--enter-left';
    img.classList.remove('lightbox-img--enter-right', 'lightbox-img--enter-left');
    void img.offsetWidth; // reflow to restart animation
    img.classList.add(cls);
  }
}

// ── 약도 뷰어 ────────────────────────────────────────────
function closeMapViewer(shouldGoBack = true) {
  const viewer = document.getElementById('mapViewer');
  if (!viewer) return;
  viewer.hidden = true;
  document.body.style.overflow = '';
  if (shouldGoBack) history.back();
}

function initMapViewer() {
  const thumb  = document.getElementById('mapThumb');
  const viewer = document.getElementById('mapViewer');
  const closeBtn = document.getElementById('mapViewerClose');
  const backBtn  = document.getElementById('mapViewerBack');
  if (!thumb || !viewer) return;

  const open = () => {
    viewer.hidden = false;
    document.body.style.overflow = 'hidden';
    backBtn.focus();
    history.pushState({ modal: 'map' }, '');
  };

  thumb.addEventListener('click', open);
  thumb.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
  backBtn.addEventListener('click', () => closeMapViewer());
  closeBtn.addEventListener('click', () => closeMapViewer());
  viewer.addEventListener('click', e => { if (e.target === viewer) closeMapViewer(); });
  document.addEventListener('keydown', e => { if (!viewer.hidden && e.key === 'Escape') closeMapViewer(); });
}

// ── 아코디언 ─────────────────────────────────────────────
function initAccordions() {
  document.querySelectorAll('.accordion-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const isOpen = btn.getAttribute('aria-expanded') === 'true';
      const body   = btn.nextElementSibling;
      btn.setAttribute('aria-expanded', String(!isOpen));
      body.hidden = isOpen;
    });
  });
}

// ── 계좌번호 복사 버튼 ────────────────────────────────────
let toastTimer = null;

function initCopyButtons() {
  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const text = btn.dataset.copy;
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        fallbackCopy(text);
      }
      showToast('계좌번호가 복사되었어요');
    });
  });
}

function fallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0';
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  try { document.execCommand('copy'); } catch { /* ignore */ }
  document.body.removeChild(ta);
}

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2400);
}

// ── 공유 버튼 ────────────────────────────────────────────
function initShare() {
  const btn = document.getElementById('shareBtn');
  if (!btn) return;

  btn.addEventListener('click', async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: SHARE_TITLE, url: SHARE_URL });
        return;
      } catch {
        // 사용자가 취소했거나 에러 — fallback으로 복사
      }
    }
    try {
      await navigator.clipboard.writeText(SHARE_URL);
    } catch {
      fallbackCopy(SHARE_URL);
    }
    showToast('청첩장 링크가 복사되었어요');
  });
}

// ── 스크롤 리빌 애니메이션 ───────────────────────────────
function initRevealOnScroll() {
  if (!('IntersectionObserver' in window)) {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('is-revealed'));
    return;
  }

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-revealed');
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.08 },
  );

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

// ── BGM 토글 ──────────────────────────────────────────────
function initBgm() {
  const audio  = document.getElementById('bgm');
  const btn    = document.getElementById('bgmBtn');
  const note   = btn.querySelector('.bgm-icon--note');
  const mute   = btn.querySelector('.bgm-icon--mute');

  if (!audio || !btn) return;

  audio.volume = 0.5;

  function setPlaying(playing) {
    if (playing) {
      audio.muted = false;
      audio.play().catch(() => {});
      note.hidden = false;
      mute.hidden = true;
      btn.classList.add('is-playing');
      btn.setAttribute('aria-label', '배경음악 끄기');
    } else {
      audio.muted = true;
      note.hidden = true;
      mute.hidden = false;
      btn.classList.remove('is-playing');
      btn.setAttribute('aria-label', '배경음악 켜기');
    }
  }

  // 페이지 로드 시 음소거 상태로 재생 대기
  audio.muted = true;
  audio.play().catch(() => {});
  setPlaying(false);

  btn.addEventListener('click', () => {
    setPlaying(audio.muted);
  });
}
