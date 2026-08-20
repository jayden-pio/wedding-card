'use strict';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ✏️ EDIT: 아래 상수만 수정하면 날짜·갤러리·공유 URL이 자동 반영됩니다.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// 예식 날짜·시간 (한국 표준시 KST, UTC+9)
const WEDDING_DATE = new Date('2026-12-05T13:00:00+09:00');

// 갤러리 이미지 목록 — 순서대로 표시됩니다. 파일을 추가/삭제하려면 이 배열만 수정하세요.
const GALLERY_IMAGES = [
  './img/optimized/CHO04156.jpg',
  './img/optimized/CHO04243.jpg',
  './img/optimized/CHO04433.jpg',
  './img/optimized/CHO04490.jpg',
  './img/optimized/CHO04551.jpg',
  './img/optimized/CHO04579.jpg',
  './img/optimized/CHO04777.jpg',
  './img/optimized/CHO04843.jpg',
  './img/optimized/CHO04899.jpg',
  './img/optimized/CHO04951.jpg',
  './img/optimized/CHO05053.jpg',
  './img/optimized/CHO05143.jpg',
  './img/optimized/CHO05237.jpg',
  './img/optimized/CHO05427.jpg',
  './img/optimized/CHO05517.jpg',
  './img/optimized/CHO05533.jpg',
  './img/optimized/CHO05570.jpg',
  './img/optimized/CHO05670.jpg',
  './img/optimized/CHO05918.jpg',
  './img/optimized/CHO05972.jpg',
];

// 위 배열에서 자동 파생되는 가로 스트립용 경량본(1080px 폭).
// scripts/make-thumbs.sh 로 생성합니다. 사진을 바꿀 땐 위 배열만 수정하면 됩니다.
// 크게 보기(라이트박스)는 계속 위 원본(1600px)을 사용합니다.
const THUMB_IMAGES = GALLERY_IMAGES.map(src => src.replace('/optimized/', '/thumb/'));

// 모션 최소화 설정 (스와이프 애니메이션에서 참조)
const REDUCE_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)');

// 공유 버튼에 사용될 URL과 제목 ✏️ EDIT
const SHARE_URL   = 'https://msandyj.store/';
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
// 매초 innerHTML 을 다시 만들면 1초마다 파싱·레이아웃·페인트가 발생해
// 사진을 스와이프하는 동안 주기적으로 프레임이 끊긴다.
// 구조는 한 번만 만들고, 값이 바뀐 텍스트 노드만 갱신한다.
function renderDday() {
  const el = document.getElementById('ddayText');
  if (!el) return;

  const UNIT_LABELS = ['일', '시간', '분', '초'];
  const valueNodes  = [];
  let mode = '';   // '' | 'countdown' | 'today' | 'past'

  function buildCountdown() {
    el.textContent = '';
    valueNodes.length = 0;

    UNIT_LABELS.forEach((label, i) => {
      if (i > 0) {
        const sep = document.createElement('span');
        sep.className   = 'dday-sep';
        sep.textContent = ':';
        el.appendChild(sep);
      }
      const unit  = document.createElement('span');
      unit.className = 'dday-unit';

      const value = document.createTextNode('');
      const small = document.createElement('small');
      small.textContent = label;

      unit.appendChild(value);
      unit.appendChild(small);
      el.appendChild(unit);
      valueNodes.push(value);
    });
  }

  const pad = n => String(n).padStart(2, '0');

  function tick() {
    const diff = WEDDING_DATE - Date.now();

    if (diff > 0) {
      if (mode !== 'countdown') { buildCountdown(); mode = 'countdown'; }

      const totalSec = Math.floor(diff / 1000);
      const next = [
        String(Math.floor(totalSec / 86400)),
        pad(Math.floor((totalSec % 86400) / 3600)),
        pad(Math.floor((totalSec % 3600) / 60)),
        pad(totalSec % 60),
      ];
      // 보통 '초'만 바뀌므로 달라진 노드만 건드린다
      for (let i = 0; i < next.length; i++) {
        if (valueNodes[i].nodeValue !== next[i]) valueNodes[i].nodeValue = next[i];
      }
    } else if (diff > -86_400_000) {
      if (mode !== 'today') {
        el.textContent = '오늘, 결혼합니다 💍';
        valueNodes.length = 0;
        mode = 'today';
      }
    } else {
      const text = `결혼한 지 ${Math.floor(Math.abs(diff) / 86_400_000)}일 🎉`;
      if (mode !== 'past' || el.textContent !== text) {
        el.textContent = text;
        valueNodes.length = 0;
        mode = 'past';
      }
    }
  }

  let timer = null;
  const start = () => { if (timer === null) timer = setInterval(tick, 1000); };
  const stop  = () => { clearInterval(timer); timer = null; };

  tick();
  start();

  // 백그라운드 탭에서는 타이머를 멈추고, 돌아오면 즉시 재동기화한다
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stop();
    } else {
      tick();
      start();
    }
  });
}

// ── 갤러리 + 라이트박스 ───────────────────────────────────
let currentIndex = 0;

// 라이트박스 원본(1600px) 프리로드 캐시. 넘기기 전에 미리 받아 디코드까지 끝내둔다.
const preloadCache = new Map();
// 늦게 도착한 디코드가 이미 지나간 사진을 덮어쓰지 않도록 하는 렌더 토큰
let renderToken = 0;

function preload(index) {
  const src = GALLERY_IMAGES[index];
  let entry = preloadCache.get(src);
  if (entry) return entry;

  const img = new Image();
  img.decoding = 'async';
  entry = { img, ready: false };
  preloadCache.set(src, entry);

  entry.done = new Promise(resolve => {
    img.onload  = () => {
      const finish = () => { entry.ready = true; resolve(); };
      if (img.decode) img.decode().then(finish, finish);
      else finish();
    };
    img.onerror = () => { entry.ready = true; resolve(); };   // 실패해도 흐름은 막지 않는다
    img.src = src;
  });
  return entry;
}

function preloadAround(index) {
  const n = GALLERY_IMAGES.length;
  preload(index);
  preload((index + 1) % n);
  preload((index - 1 + n) % n);
}

function initGallery() {
  const grid = document.getElementById('galleryGrid');
  if (!grid) return;

  THUMB_IMAGES.forEach((src, i) => {
    const thumb = document.createElement('div');
    thumb.className = 'gallery-thumb';
    thumb.setAttribute('tabindex', '0');
    thumb.setAttribute('role', 'button');
    thumb.setAttribute('aria-label', `사진 ${i + 1} 크게 보기`);

    const img = document.createElement('img');
    // loading/fetchpriority 는 반드시 src 보다 먼저 지정해야 브라우저가 존중한다
    img.setAttribute('decoding', 'async');
    // 처음 3장은 즉시 받아둬야 첫 스와이프에서 빈 칸이 보이지 않는다
    img.setAttribute('loading', i < 3 ? 'eager' : 'lazy');
    if (i === 0) img.setAttribute('fetchpriority', 'high');
    img.width  = 1080;             // 레이아웃 시프트 방지
    img.height = 720;
    img.alt    = `커플 사진 ${i + 1}`;
    img.src    = src;              // 스트립은 경량본(1080px)만 사용

    thumb.appendChild(img);
    thumb.addEventListener('click',   () => openLightbox(i));
    thumb.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLightbox(i); }
    });
    grid.appendChild(thumb);
  });

  // 마우스 드래그로 가로 스크롤 (데스크톱) — 터치는 네이티브 스크롤 사용
  let dragId = null, dragMoved = false, dragStartX = 0, dragStartScroll = 0;
  let dragRaf = 0, dragTarget = 0;

  const flushDrag = () => { dragRaf = 0; grid.scrollLeft = dragTarget; };

  grid.addEventListener('pointerdown', e => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    dragId          = e.pointerId;
    dragMoved       = false;
    dragStartX      = e.clientX;
    dragStartScroll = grid.scrollLeft;
    dragTarget      = dragStartScroll;
    grid.setPointerCapture(dragId);     // 커서가 밖으로 나가도 드래그 유지
    grid.classList.add('is-dragging');
    e.preventDefault();                 // 이미지 고스트 드래그·텍스트 선택 방지
  });

  // 캡처 덕분에 리스너는 grid 에만 달면 되고, 드래그 중이 아닐 땐 아무 일도 하지 않는다
  grid.addEventListener('pointermove', e => {
    if (dragId === null || e.pointerId !== dragId) return;
    const dx = e.clientX - dragStartX;
    if (Math.abs(dx) > 5) dragMoved = true;
    dragTarget = dragStartScroll - dx;
    // 입력 이벤트마다 scrollLeft 를 쓰면 프레임당 여러 번 레이아웃이 돈다 → rAF 로 1회만
    if (!dragRaf) dragRaf = requestAnimationFrame(flushDrag);
  });

  const endDrag = e => {
    if (dragId === null || (e && e.pointerId !== dragId)) return;
    if (grid.hasPointerCapture(dragId)) grid.releasePointerCapture(dragId);
    dragId = null;
    if (dragRaf) { cancelAnimationFrame(dragRaf); flushDrag(); }
    grid.classList.remove('is-dragging');
  };
  grid.addEventListener('pointerup',          endDrag);
  grid.addEventListener('pointercancel',      endDrag);
  grid.addEventListener('lostpointercapture', endDrag);

  // 드래그 직후 발생하는 클릭이 라이트박스를 열지 않도록 차단 (캡처 단계)
  grid.addEventListener('click', e => {
    if (dragMoved) { e.stopPropagation(); e.preventDefault(); dragMoved = false; }
  }, true);

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

  initLightboxSwipe(lightbox);
}

// ── 라이트박스: 손가락을 따라오는 스와이프 ──────────────────
// 예전 방식은 touchstart/touchend 만 봤기 때문에 미는 동안 화면이 가만히 있다가
// 손을 뗄 때 툭 바뀌었다. 이동 중에는 transform/opacity 만 바꿔 컴포지터에서 처리한다.
const SWIPE_THRESHOLD = 56;   // 이 이상 밀면 사진 넘김
const AXIS_LOCK       = 8;    // 첫 8px 로 가로/세로를 확정

function initLightboxSwipe(lightbox) {
  const img = document.getElementById('lightboxImg');
  let active = false, axis = null, startX = 0, startY = 0, dx = 0, raf = 0;

  const paint = () => {
    raf = 0;
    img.style.transform = `translate3d(${dx}px,0,0)`;
    img.style.opacity   = String(1 - Math.min(Math.abs(dx) / 320, 0.4));
  };

  const stop = () => {
    active = false;
    axis   = null;
    if (raf) { cancelAnimationFrame(raf); raf = 0; }
    img.classList.remove('is-swiping');
  };

  lightbox.addEventListener('touchstart', e => {
    if (e.touches.length !== 1) { stop(); return; }
    active = true; axis = null; dx = 0;
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
  }, { passive: true });

  lightbox.addEventListener('touchmove', e => {
    if (!active || e.touches.length !== 1) return;
    const mx = e.touches[0].clientX - startX;
    const my = e.touches[0].clientY - startY;

    if (axis === null) {
      if (Math.abs(mx) < AXIS_LOCK && Math.abs(my) < AXIS_LOCK) return;
      axis = Math.abs(mx) > Math.abs(my) ? 'x' : 'y';
      if (axis !== 'x') { active = false; return; }   // 세로 제스처는 브라우저에 양보
      img.style.transition = 'none';
      img.classList.add('is-swiping');                // 드래그 중에만 will-change
    }

    dx = mx;
    if (!raf) raf = requestAnimationFrame(paint);     // 프레임당 1회만 반영
  }, { passive: true });

  const finish = () => {
    if (!active || axis !== 'x') { stop(); return; }
    const moved = dx;
    stop();
    if (Math.abs(moved) > SWIPE_THRESHOLD) {
      navigate(moved < 0 ? 1 : -1);
    } else {
      // 임계값 미달 → 제자리로 부드럽게 복귀
      img.style.transition = 'transform 180ms ease-out, opacity 180ms ease-out';
      img.style.transform  = 'translate3d(0,0,0)';
      img.style.opacity    = '1';
    }
  };

  lightbox.addEventListener('touchend',    finish, { passive: true });
  lightbox.addEventListener('touchcancel', () => { stop(); resetLightboxImg(); }, { passive: true });
}

function resetLightboxImg() {
  const img = document.getElementById('lightboxImg');
  img.style.transition = 'transform 180ms ease-out, opacity 180ms ease-out';
  img.style.transform  = 'translate3d(0,0,0)';
  img.style.opacity    = '1';
}

function openLightbox(index) {
  currentIndex = index;
  showLightboxImage(0);
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
  showLightboxImage(dir);
}

// 현재 인덱스의 사진을 img 에 얹는다.
// 원본이 아직 준비되지 않았으면 스트립에서 이미 받아둔 썸네일을 먼저 그려
// 빈 화면이 단 한 프레임도 나오지 않게 한다.
function applyLightboxSrc(img, index, token) {
  const full  = GALLERY_IMAGES[index];
  const entry = preload(index);

  img.alt = `커플 사진 ${index + 1}`;

  if (entry.ready) {
    img.src = full;
  } else {
    img.src = THUMB_IMAGES[index];          // 브라우저 캐시 히트 → 즉시 표시
    entry.done.then(() => {
      if (token !== renderToken) return;    // 그 사이 다른 사진으로 넘어갔으면 버린다
      img.src = full;
    });
  }
}

let swapTimer = null;
const SWAP_OUT_MS = 130;
const SWAP_IN_MS  = 200;

function showLightboxImage(dir = 0) {
  const img     = document.getElementById('lightboxImg');
  const counter = document.getElementById('lightboxCounter');
  const token   = ++renderToken;

  if (counter) counter.textContent = `${currentIndex + 1} / ${GALLERY_IMAGES.length}`;
  if (swapTimer !== null) { clearTimeout(swapTimer); swapTimer = null; }

  // 다음/이전 사진을 미리 받아두면 연속 스와이프에서도 대기가 없다
  preloadAround(currentIndex);

  if (dir === 0 || REDUCE_MOTION.matches) {
    img.style.transition = 'none';
    img.style.transform  = 'translate3d(0,0,0)';
    img.style.opacity    = '1';
    applyLightboxSrc(img, currentIndex, token);
    return;
  }

  const outX = dir > 0 ? '-14%' : '14%';
  const inX  = dir > 0 ? '14%'  : '-14%';

  // 1) 밀려 나가기 (손가락으로 밀던 위치에서 그대로 이어진다)
  img.style.transition = `transform ${SWAP_OUT_MS}ms ease-in, opacity ${SWAP_OUT_MS}ms ease-in`;
  img.style.transform  = `translate3d(${outX},0,0)`;
  img.style.opacity    = '0';

  swapTimer = setTimeout(() => {
    swapTimer = null;
    if (token !== renderToken) return;

    // 2) 보이지 않는 동안 사진 교체 (강제 리플로우 없이 반대편으로 순간이동)
    applyLightboxSrc(img, currentIndex, token);
    img.style.transition = 'none';
    img.style.transform  = `translate3d(${inX},0,0)`;

    // 3) 반대편에서 들어오기.
    //    rAF 를 두 번 겹치는 이유: 위의 transition:none 상태가 한 프레임 실제로
    //    계산돼야 다음 transform 이 애니메이션된다. void offsetWidth 같은
    //    강제 동기 레이아웃을 쓰지 않고 같은 효과를 낸다.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (token !== renderToken) return;
        img.style.transition = `transform ${SWAP_IN_MS}ms cubic-bezier(.22,.61,.36,1), opacity ${SWAP_IN_MS}ms ease-out`;
        img.style.transform  = 'translate3d(0,0,0)';
        img.style.opacity    = '1';
      });
    });
  }, SWAP_OUT_MS);
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
