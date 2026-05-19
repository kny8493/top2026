/**
 * app.js — AlgoCard 메인 애플리케이션
 * 네비게이션, 데모, 정렬 실습, 탐색 실습, 심화 활동을 담당합니다.
 */

/* ════════════════════════════════════════════════════════════════════
   전역 앱 상태
   ════════════════════════════════════════════════════════════════════ */
const App = {
  currentPage: 'home',

  demo: {
    algorithm: 'bubble',
    steps: [],
    stepIndex: 0,
    playing: false,
    timer: null,
    speed: 800
  },

  sort: {
    algorithm: 'bubble',
    level: 1,
    cards: [],
    original: [],
    moveCount: 0,
    dragSrcIdx: null,
    touchSelected: null
  },

  search: {
    algorithm: 'sequential',
    level: 1,
    cards: [],
    target: null,
    steps: [],
    stepIndex: 0,
    timer: null,
    done: false
  },

  adv: {
    cards: [],
    original: [],
    sortAlgo: 'bubble',
    phase: 'sort',
    target: null,
    searchSteps: [],
    searchStepIdx: 0,
    searchTimer: null,
    dragSrc: null,
    touchSel: null
  }
};

/* ════════════════════════════════════════════════════════════════════
   유틸리티
   ════════════════════════════════════════════════════════════════════ */

/** 배열 오름차순 정렬 완료 여부 */
const isSortedArr = arr => arr.every((v, i) => i === 0 || arr[i - 1] <= v);

/** 정렬된 배열 반환 (불변) */
const asSorted = arr => [...arr].sort((a, b) => a - b);

/** 현재 배열이 목표에 얼마나 가까운지 (%) */
function sortedness(arr) {
  const s = asSorted(arr);
  let m = 0;
  arr.forEach((v, i) => { if (v === s[i]) m++; });
  return Math.round((m / arr.length) * 100);
}

/** 카드 DOM 요소 생성 */
function makeCard(value, index, extraClasses = []) {
  const el = document.createElement('div');
  el.className = ['card', getCardColorClass(value), ...extraClasses].join(' ');
  el.dataset.index = index;
  el.dataset.value = value;
  el.textContent = value;
  el.draggable = true;
  return el;
}

/** 콘페티 이펙트 */
function showConfetti() {
  const colors = ['#6366f1','#8b5cf6','#10b981','#f59e0b','#ef4444','#3b82f6'];
  const wrap = document.createElement('div');
  wrap.className = 'confetti-container';
  for (let i = 0; i < 14; i++) {
    const dot = document.createElement('div');
    dot.className = 'confetti-dot';
    dot.style.cssText = `background:${colors[i % colors.length]};animation-delay:${i*0.05}s`;
    wrap.appendChild(dot);
  }
  document.body.appendChild(wrap);
  setTimeout(() => wrap.remove(), 1300);
}

/* ════════════════════════════════════════════════════════════════════
   내비게이션
   ════════════════════════════════════════════════════════════════════ */
function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(a => {
    a.classList.toggle('active', a.dataset.page === name);
  });
  const target = document.getElementById(`page-${name}`);
  if (target) target.classList.add('active');
  App.currentPage = name;

  stopDemoTimer();
  stopSearchTimer();
  stopAdvTimer();
  document.querySelector('.nav-links').classList.remove('open');
}

/* ════════════════════════════════════════════════════════════════════
   홈 — 알고리즘 데모 애니메이션
   ════════════════════════════════════════════════════════════════════ */
function initDemo(algo) {
  stopDemoTimer();
  App.demo.algorithm = algo;

  const fixed = [64, 25, 12, 22, 11, 90];
  App.demo.steps     = AlgorithmInfo[algo].getSortSteps(fixed);
  App.demo.stepIndex = 0;

  document.querySelectorAll('.tab-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.algo === algo);
  });

  const info = AlgorithmInfo[algo];
  document.getElementById('algo-description').innerHTML =
    `<strong>${info.emoji} ${info.name} — 시간복잡도 ${info.complexity}</strong>${info.detail}`;

  renderDemoStep(0);
}

function renderDemoStep(idx) {
  const { steps } = App.demo;
  if (!steps.length) return;
  idx = Math.max(0, Math.min(idx, steps.length - 1));
  App.demo.stepIndex = idx;

  const step = steps[idx];
  const demoArea = document.getElementById('demo-cards');
  demoArea.innerHTML = '';

  step.array.forEach((val, i) => {
    const cls = [];
    if ((step.sorted || []).includes(i))    cls.push('sorted');
    if ((step.comparing || []).includes(i)) cls.push(step.type === 'swap' ? 'swapping' : 'comparing');
    if ((step.pivots || []).includes(i))    cls.push('pivot');
    demoArea.appendChild(makeCard(val, i, cls));
  });

  document.getElementById('demo-step-info').textContent =
    `${step.description || ''}  (${idx + 1}/${steps.length})`;
}

function demoNext() {
  if (App.demo.stepIndex < App.demo.steps.length - 1) {
    renderDemoStep(App.demo.stepIndex + 1);
  } else {
    stopDemoTimer();
  }
}

function startDemoTimer() {
  App.demo.playing = true;
  document.getElementById('demo-play').textContent = '⏸ 일시정지';
  App.demo.timer = setInterval(() => {
    if (App.demo.stepIndex >= App.demo.steps.length - 1) stopDemoTimer();
    else demoNext();
  }, App.demo.speed);
}

function stopDemoTimer() {
  clearInterval(App.demo.timer);
  App.demo.timer = null;
  App.demo.playing = false;
  const btn = document.getElementById('demo-play');
  if (btn) btn.textContent = '▶ 자동 실행';
}

/* ════════════════════════════════════════════════════════════════════
   정렬 실습
   ════════════════════════════════════════════════════════════════════ */
function initSort() {
  const algo  = document.getElementById('sort-algo-select').value;
  const level = parseInt(document.getElementById('sort-level-select').value);

  App.sort.algorithm    = algo;
  App.sort.level        = level;
  App.sort.cards        = generateCards(LevelConfig[level].count);
  App.sort.original     = [...App.sort.cards];
  App.sort.moveCount    = 0;
  App.sort.dragSrcIdx   = null;
  App.sort.touchSelected = null;

  const info = AlgorithmInfo[algo];
  document.getElementById('sort-algo-info').innerHTML =
    `<span class="algo-name">${info.emoji} ${info.name}</span>
     <span class="algo-badge">${info.complexity}</span>
     <span class="algo-desc">${info.description}</span>`;

  hideResult('sort');
  document.getElementById('sort-hint-text').textContent =
    '카드를 드래그(PC) 또는 탭 두 번(모바일)으로 교환하여 오름차순 정렬하세요.';

  renderSortCards();
}

function renderSortCards(highlightIdxs = []) {
  const { cards, level, dragSrcIdx, touchSelected, moveCount } = App.sort;
  const container = document.getElementById('sort-cards');
  container.className = `cards-area level-${level}`;
  container.innerHTML = '';

  const lbl = document.createElement('div');
  lbl.className = 'cards-area-label';
  lbl.textContent = `${LevelConfig[level].label} — 이동 횟수: ${moveCount}`;
  container.appendChild(lbl);

  cards.forEach((val, i) => {
    const cls = [];
    if (i === dragSrcIdx || i === touchSelected) cls.push('selected');
    if (highlightIdxs.includes(i)) cls.push('highlighted');
    container.appendChild(makeCard(val, i, cls));
  });

  updateSortProgress();
}

function updateSortProgress() {
  const pct    = sortedness(App.sort.cards);
  const sorted = isSortedArr(App.sort.cards);
  document.getElementById('sort-progress').style.width = pct + '%';
  document.getElementById('sort-progress-text').textContent = sorted ? '✅ 정렬 완료!' : `진행도 ${pct}%`;
}

/* ── 정렬 실습: 드래그 앤 드롭 (컨테이너에 한 번만 등록) ────────── */
function initSortDragDrop() {
  const container = document.getElementById('sort-cards');

  container.addEventListener('dragstart', e => {
    const card = e.target.closest('.card');
    if (!card) return;
    App.sort.dragSrcIdx = parseInt(card.dataset.index);
    card.classList.add('dragging');
    container.classList.add('drag-active');
    e.dataTransfer.effectAllowed = 'move';
  });

  container.addEventListener('dragover', e => {
    e.preventDefault();
    const card = e.target.closest('.card');
    if (!card) return;
    container.querySelectorAll('.card.drag-over').forEach(c => c.classList.remove('drag-over'));
    if (parseInt(card.dataset.index) !== App.sort.dragSrcIdx) card.classList.add('drag-over');
  });

  container.addEventListener('dragleave', e => {
    const card = e.target.closest('.card');
    if (card) card.classList.remove('drag-over');
  });

  container.addEventListener('drop', e => {
    e.preventDefault();
    const card = e.target.closest('.card');
    if (!card || App.sort.dragSrcIdx === null) return;
    const dst = parseInt(card.dataset.index);
    if (dst !== App.sort.dragSrcIdx) swapSort(App.sort.dragSrcIdx, dst);
    cleanupDragSort();
  });

  container.addEventListener('dragend', () => cleanupDragSort());

  // 터치: 이벤트 위임
  container.addEventListener('touchend', e => {
    e.preventDefault();
    const touch = e.changedTouches[0];
    const el    = document.elementFromPoint(touch.clientX, touch.clientY);
    const card  = el?.closest('.card');
    if (!card) {
      // 카드 외부 탭 → 선택 해제
      App.sort.touchSelected = null;
      renderSortCards();
      return;
    }
    const idx = parseInt(card.dataset.index);
    const prev = App.sort.touchSelected;
    if (prev === null) {
      App.sort.touchSelected = idx;
      renderSortCards();
    } else if (prev === idx) {
      App.sort.touchSelected = null;
      renderSortCards();
    } else {
      swapSort(prev, idx);
      App.sort.touchSelected = null;
    }
  }, { passive: false });
}

function cleanupDragSort() {
  document.querySelectorAll('#sort-cards .card').forEach(c => {
    c.classList.remove('dragging', 'drag-over');
  });
  document.getElementById('sort-cards').classList.remove('drag-active');
  App.sort.dragSrcIdx = null;
}

function swapSort(i, j) {
  [App.sort.cards[i], App.sort.cards[j]] = [App.sort.cards[j], App.sort.cards[i]];
  App.sort.moveCount++;
  hideResult('sort');
  document.getElementById('sort-hint-text').textContent =
    '계속 정렬하세요. 힌트가 필요하면 "힌트 보기" 버튼을 클릭하세요.';
  renderSortCards();
}

/* ── 정렬 실습: 정답 확인 ────────────────────────────────────────── */
function checkSort() {
  const { cards, algorithm, moveCount } = App.sort;
  if (isSortedArr(cards)) {
    showConfetti();
    // 정렬 완료 표시
    document.getElementById('sort-cards').querySelectorAll('.card').forEach(c => c.classList.add('sorted'));
    showResult('sort', true, {
      icon: '🎉',
      message: '정답입니다! 훌륭해요!',
      detail: `${moveCount}번의 이동으로 정렬을 완성했습니다.`,
      algoHint: `${AlgorithmInfo[algorithm].emoji} ${AlgorithmInfo[algorithm].name}으로 완벽하게 정렬했습니다!`
    });
  } else {
    const fb = getErrorFeedback(algorithm, cards);
    showResult('sort', false, {
      icon: '❌',
      message: fb.summary,
      detail: `${fb.detail}`,
      algoHint: fb.algoHint
    });
  }
}

/* ── 정렬 실습: 힌트 ─────────────────────────────────────────────── */
function showSortHint() {
  const hint = getNextStepHint(App.sort.algorithm, App.sort.cards);
  document.getElementById('sort-hint-text').textContent = hint.message;
  renderSortCards(hint.highlightIndices);
  // 3초 후 하이라이트 제거
  setTimeout(() => renderSortCards(), 3000);
}

/* ── 정렬 실습: 정답 애니메이션 ──────────────────────────────────── */
function showSortSolution() {
  const steps = AlgorithmInfo[App.sort.algorithm].getSortSteps(App.sort.original);
  let idx = 0;
  const container = document.getElementById('sort-cards');
  const hintEl    = document.getElementById('sort-hint-text');
  hintEl.textContent = '정답 애니메이션 실행 중... 잘 관찰하세요!';
  hideResult('sort');

  const timer = setInterval(() => {
    if (idx >= steps.length) {
      clearInterval(timer);
      App.sort.cards = asSorted(App.sort.original);
      renderSortCards();
      hintEl.textContent = '정렬 완료! 다시 드래그하여 직접 연습해보세요.';
      return;
    }
    const step = steps[idx];
    const level = App.sort.level;
    container.className = `cards-area level-${level}`;
    container.innerHTML = '';

    const lbl = document.createElement('div');
    lbl.className = 'cards-area-label';
    lbl.textContent = `${AlgorithmInfo[App.sort.algorithm].name} — 단계 ${idx + 1}/${steps.length}`;
    container.appendChild(lbl);

    step.array.forEach((val, i) => {
      const cls = [];
      if ((step.sorted || []).includes(i))    cls.push('sorted');
      if ((step.comparing || []).includes(i)) cls.push(step.type === 'swap' ? 'swapping' : 'comparing');
      if ((step.pivots || []).includes(i))    cls.push('pivot');
      container.appendChild(makeCard(val, i, cls));
    });
    hintEl.textContent = step.description || '';
    idx++;
  }, 550);
}

/* ── 결과 다음 단계 ─────────────────────────────────────────────── */
function nextSortLevel() {
  const next = App.sort.level < 3 ? App.sort.level + 1 : 1;
  document.getElementById('sort-level-select').value = next;
  initSort();
}

/* ════════════════════════════════════════════════════════════════════
   탐색 실습
   ════════════════════════════════════════════════════════════════════ */
function initSearch() {
  stopSearchTimer();
  const algo  = document.getElementById('search-algo-select').value;
  const level = parseInt(document.getElementById('search-level-select').value);
  let cards   = generateCards(LevelConfig[level].count);

  // 이분 탐색은 정렬된 배열 필수
  if (algo === 'binary') cards = asSorted(cards);

  // 80% 확률로 배열 내 값, 20%로 없는 값 탐색
  let target;
  if (Math.random() < 0.8) {
    target = cards[Math.floor(Math.random() * cards.length)];
  } else {
    const used = new Set(cards);
    do { target = Math.floor(Math.random() * 100) + 1; } while (used.has(target));
  }

  App.search = {
    ...App.search,
    algorithm: algo,
    level,
    cards,
    target,
    steps: AlgorithmInfo[algo].getSearchSteps(cards, target),
    stepIndex: 0,
    timer: null,
    done: false
  };

  const info = AlgorithmInfo[algo];
  document.getElementById('search-algo-info').innerHTML =
    `<span class="algo-name">${info.emoji} ${info.name}</span>
     <span class="algo-badge">${info.complexity}</span>
     <span class="algo-desc">${info.description}</span>`;

  document.getElementById('search-target').textContent = target;
  document.getElementById('search-hint-text').textContent =
    algo === 'sequential'
      ? '왼쪽부터 카드를 한 장씩 클릭하세요. 또는 "자동 탐색"으로 확인하세요.'
      : '현재 탐색 범위의 중간 카드를 클릭하세요. 또는 "자동 탐색"으로 확인하세요.';
  document.getElementById('search-step-info').textContent = '탐색을 시작하세요.';

  hideResult('search');
  renderSearchStep(0);
}

function renderSearchStep(idx) {
  const { steps, level, algorithm } = App.search;
  if (!steps.length) return;
  idx = Math.max(0, Math.min(idx, steps.length - 1));
  App.search.stepIndex = idx;

  const step = steps[idx];
  const container = document.getElementById('search-cards');
  container.className = `cards-area level-${level}`;
  container.innerHTML = '';

  step.array.forEach((val, i) => {
    const cls = [];
    if ((step.eliminated || []).includes(i)) cls.push('eliminated');
    else if (step.foundAt === i)              cls.push('found');
    else if (step.current === i)             cls.push('current');
    else if ((step.visited || []).includes(i)) cls.push('visited');
    const el = makeCard(val, i, cls);
    container.appendChild(el);
  });

  // 이분 탐색 포인터 (low / mid / high)
  if (algorithm === 'binary' && step.type !== 'start') {
    renderBinaryPointers(step, container);
  }

  document.getElementById('search-step-info').textContent = step.description || '';

  if (step.type === 'found' || step.type === 'not-found') {
    App.search.done = true;
    stopSearchTimer();
    const success = step.type === 'found';
    showResult('search', success, {
      icon: success ? '🎉' : '🔍',
      message: success ? `${step.target}을(를) 찾았습니다!` : `${step.target}은(는) 배열에 없습니다.`,
      detail: step.description,
      algoHint: ''
    });
  }
}

function renderBinaryPointers(step, container) {
  const cards = container.querySelectorAll('.card');
  const map = [
    { idx: step.low,  text: 'low',  cls: 'pointer-low'  },
    { idx: step.mid,  text: 'mid',  cls: 'pointer-mid'  },
    { idx: step.high, text: 'high', cls: 'pointer-high' }
  ];
  map.forEach(({ idx, text, cls }) => {
    if (idx < 0 || idx >= cards.length) return;
    const lbl = document.createElement('div');
    lbl.className = `pointer-label ${cls}`;
    lbl.textContent = text;
    cards[idx].style.position = 'relative';
    cards[idx].appendChild(lbl);
  });
}

/* 탐색 실습: 카드 클릭 탐색 (이벤트 위임, 한 번만 등록) */
function initSearchClickDelegation() {
  document.getElementById('search-cards').addEventListener('click', e => {
    if (App.search.done) return;
    const card = e.target.closest('.card');
    if (!card) return;
    const clickedIdx = parseInt(card.dataset.index);
    const nextIdx    = App.search.stepIndex + 1;
    if (nextIdx >= App.search.steps.length) return;

    const nextStep = App.search.steps[nextIdx];
    const hintEl   = document.getElementById('search-hint-text');

    if (App.search.algorithm === 'sequential') {
      if (clickedIdx === nextStep.current) {
        renderSearchStep(nextIdx);
      } else {
        hintEl.textContent = `❌ 순차 탐색은 ${nextStep.current + 1}번째 카드(왼쪽부터 차례로)를 확인해야 합니다!`;
      }
    } else {
      // 이분 탐색: 다음 스텝이 searching/eliminate 타입일 때만 mid 클릭 필요
      if (nextStep.mid >= 0 && clickedIdx === nextStep.mid) {
        renderSearchStep(nextIdx);
      } else if (nextStep.mid >= 0) {
        hintEl.textContent = `❌ 이분 탐색: 현재 범위 [${nextStep.low + 1}~${nextStep.high + 1}]의 중간 카드(${nextStep.mid + 1}번째)를 클릭하세요!`;
      }
    }
  });
}

function startAutoSearch() {
  stopSearchTimer();
  if (App.search.done) { initSearch(); return; }
  App.search.timer = setInterval(() => {
    const { stepIndex, steps } = App.search;
    if (stepIndex >= steps.length - 1) stopSearchTimer();
    else renderSearchStep(stepIndex + 1);
  }, 900);
}

function stopSearchTimer() {
  clearInterval(App.search.timer);
  App.search.timer = null;
}

/* ════════════════════════════════════════════════════════════════════
   심화 활동 — 정렬 후 이분 탐색
   ════════════════════════════════════════════════════════════════════ */
function initAdvanced() {
  stopAdvTimer();
  const algo  = document.getElementById('adv-sort-algo').value;
  App.adv.cards    = generateCards(LevelConfig[2].count);
  App.adv.original = [...App.adv.cards];
  App.adv.sortAlgo = algo;
  App.adv.phase    = 'sort';
  App.adv.dragSrc  = null;
  App.adv.touchSel = null;

  setAdvStep(1);
  document.getElementById('adv-sort-phase').style.display   = '';
  document.getElementById('adv-search-phase').style.display = 'none';
  document.getElementById('adv-result').style.display       = 'none';
  document.getElementById('adv-sort-hint-text').textContent = '카드를 오름차순으로 정렬하세요.';
  renderAdvCards();
}

function renderAdvCards(highlightIdxs = []) {
  const { cards } = App.adv;
  const container = document.getElementById('adv-cards');
  container.className = 'cards-area level-2';
  container.innerHTML = '';

  const lbl = document.createElement('div');
  lbl.className = 'cards-area-label';
  lbl.textContent = '드래그 또는 탭 두 번으로 카드를 교환하세요';
  container.appendChild(lbl);

  cards.forEach((val, i) => {
    const cls = [];
    if (i === App.adv.touchSel) cls.push('selected');
    if (highlightIdxs.includes(i)) cls.push('highlighted');
    container.appendChild(makeCard(val, i, cls));
  });
}

/* 심화: 드래그 앤 드롭 (한 번만 등록) */
function initAdvDragDrop() {
  const container = document.getElementById('adv-cards');

  container.addEventListener('dragstart', e => {
    const c = e.target.closest('.card');
    if (!c) return;
    App.adv.dragSrc = parseInt(c.dataset.index);
    c.classList.add('dragging');
  });

  container.addEventListener('dragover', e => { e.preventDefault(); });

  container.addEventListener('drop', e => {
    e.preventDefault();
    const c = e.target.closest('.card');
    if (!c || App.adv.dragSrc === null) return;
    const dst = parseInt(c.dataset.index);
    if (dst !== App.adv.dragSrc) {
      [App.adv.cards[App.adv.dragSrc], App.adv.cards[dst]] =
        [App.adv.cards[dst], App.adv.cards[App.adv.dragSrc]];
      renderAdvCards();
    }
    App.adv.dragSrc = null;
    container.querySelectorAll('.card').forEach(c => c.classList.remove('dragging'));
  });

  container.addEventListener('dragend', () => {
    container.querySelectorAll('.card').forEach(c => c.classList.remove('dragging'));
    App.adv.dragSrc = null;
  });

  // 터치 위임
  container.addEventListener('touchend', e => {
    e.preventDefault();
    const touch = e.changedTouches[0];
    const el    = document.elementFromPoint(touch.clientX, touch.clientY);
    const card  = el?.closest('.card');
    if (!card) { App.adv.touchSel = null; renderAdvCards(); return; }
    const idx  = parseInt(card.dataset.index);
    const prev = App.adv.touchSel;
    if (prev === null)  { App.adv.touchSel = idx; renderAdvCards(); }
    else if (prev === idx) { App.adv.touchSel = null; renderAdvCards(); }
    else {
      [App.adv.cards[prev], App.adv.cards[idx]] = [App.adv.cards[idx], App.adv.cards[prev]];
      App.adv.touchSel = null;
      renderAdvCards();
    }
  }, { passive: false });
}

function checkAdvSort() {
  if (!isSortedArr(App.adv.cards)) {
    const fb = getErrorFeedback(App.adv.sortAlgo, App.adv.cards);
    document.getElementById('adv-sort-hint-text').textContent = fb.summary + ' ' + fb.detail;
    return;
  }

  showConfetti();
  setAdvStep(3);
  document.getElementById('adv-sort-phase').style.display   = 'none';
  document.getElementById('adv-search-phase').style.display = '';

  // 찾을 값 선정 (배열 내 값)
  App.adv.target = App.adv.cards[Math.floor(Math.random() * App.adv.cards.length)];
  App.adv.searchSteps    = binarySearchSteps(App.adv.cards, App.adv.target);
  App.adv.searchStepIdx  = 0;

  document.getElementById('adv-search-target').textContent    = App.adv.target;
  document.getElementById('adv-range-text').textContent       = '전체';
  document.getElementById('adv-search-hint-text').textContent = '이분 탐색을 자동 실행하여 탐색 과정을 확인하세요.';
  renderAdvSearchStep(0);
}

function renderAdvSearchStep(idx) {
  const { searchSteps: steps, target } = App.adv;
  if (!steps.length) return;
  idx = Math.max(0, Math.min(idx, steps.length - 1));
  App.adv.searchStepIdx = idx;

  const step = steps[idx];
  const container = document.getElementById('adv-search-cards');
  container.className = 'cards-area level-2';
  container.innerHTML = '';

  step.array.forEach((val, i) => {
    const cls = [];
    if ((step.eliminated || []).includes(i)) cls.push('eliminated');
    else if (step.foundAt === i)              cls.push('found');
    else if (step.current === i)             cls.push('current');
    container.appendChild(makeCard(val, i, cls));
  });

  // 포인터
  if (step.type !== 'start') renderBinaryPointers(step, container);

  // 범위 텍스트
  if (step.low >= 0 && step.high >= 0 && step.high < step.array.length) {
    document.getElementById('adv-range-text').textContent = `[${step.low + 1}~${step.high + 1}]`;
  }
  document.getElementById('adv-search-hint-text').textContent = step.description || '';

  if (step.type === 'found' || step.type === 'not-found') {
    stopAdvTimer();
    const resultEl = document.getElementById('adv-result');
    resultEl.style.display = 'block';
    resultEl.className = `result-panel ${step.type === 'found' ? 'success' : 'error'}`;
    document.getElementById('adv-result-icon').textContent    = step.type === 'found' ? '🏆' : '🔍';
    document.getElementById('adv-result-message').textContent =
      step.type === 'found'
        ? `완벽합니다! ${target}을(를) 단 ${App.adv.searchStepIdx}번 비교로 찾았습니다!`
        : `탐색 범위를 모두 확인했지만 ${target}은(는) 없습니다.`;
    document.getElementById('adv-result-detail').textContent = step.description;
  }
}

function startAdvAutoSearch() {
  stopAdvTimer();
  App.adv.searchTimer = setInterval(() => {
    const { searchStepIdx, searchSteps } = App.adv;
    if (searchStepIdx >= searchSteps.length - 1) stopAdvTimer();
    else renderAdvSearchStep(searchStepIdx + 1);
  }, 800);
}

function stopAdvTimer() {
  clearInterval(App.adv.searchTimer);
  App.adv.searchTimer = null;
}

function setAdvStep(n) {
  [1, 2, 3].forEach(i => {
    const dot = document.getElementById(`adv-step${i}`);
    if (!dot) return;
    dot.classList.remove('active', 'complete');
    if (i < n)  dot.classList.add('complete');
    if (i === n) dot.classList.add('active');
  });
  document.querySelectorAll('.step-line').forEach((line, i) => {
    line.classList.toggle('complete', i + 2 <= n);
  });
}

/* ════════════════════════════════════════════════════════════════════
   공통 결과 패널
   ════════════════════════════════════════════════════════════════════ */
function showResult(mode, success, { icon, message, detail, algoHint }) {
  const el = document.getElementById(`${mode}-result`);
  if (!el) return;
  el.className     = `result-panel ${success ? 'success' : 'error'}`;
  el.style.display = 'block';
  el.innerHTML = `
    <div class="result-icon">${icon}</div>
    <div class="result-message">${message}</div>
    <div class="result-detail">${detail}</div>
    ${algoHint ? `<div class="result-algo-hint">${algoHint}</div>` : ''}
    <div class="result-actions" id="${mode}-result-actions"></div>
  `;

  const actions = el.querySelector('.result-actions');
  if (mode === 'sort' && success) {
    actions.innerHTML = `
      <button class="btn-primary"   onclick="nextSortLevel()">다음 단계 →</button>
      <button class="btn-secondary" onclick="initSort()">새 문제</button>
    `;
  } else if (mode === 'sort') {
    actions.innerHTML = `
      <button class="btn-check"     onclick="hideResult('sort')">계속 시도</button>
      <button class="btn-hint"      onclick="showSortHint()">💡 힌트 보기</button>
      <button class="btn-secondary" onclick="initSort()">새 문제</button>
    `;
  } else if (mode === 'search') {
    actions.innerHTML = `<button class="btn-primary" onclick="initSearch()">새 문제</button>`;
  }
}

function hideResult(mode) {
  const el = document.getElementById(`${mode}-result`);
  if (el) el.style.display = 'none';
}

/* ════════════════════════════════════════════════════════════════════
   이벤트 바인딩 (모든 버튼 리스너 한 번만 등록)
   ════════════════════════════════════════════════════════════════════ */
function bindEvents() {
  // 내비게이션
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', e => { e.preventDefault(); showPage(link.dataset.page); });
  });
  document.querySelector('.nav-toggle').addEventListener('click', () => {
    document.querySelector('.nav-links').classList.toggle('open');
  });

  // 홈
  document.getElementById('start-btn').addEventListener('click', () => showPage('sort'));
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => initDemo(btn.dataset.algo));
  });
  document.getElementById('demo-play').addEventListener('click', () => {
    if (App.demo.playing) { stopDemoTimer(); return; }
    if (App.demo.stepIndex >= App.demo.steps.length - 1) initDemo(App.demo.algorithm);
    startDemoTimer();
  });
  document.getElementById('demo-step').addEventListener('click', () => { stopDemoTimer(); demoNext(); });
  document.getElementById('demo-reset').addEventListener('click', () => initDemo(App.demo.algorithm));
  document.getElementById('demo-speed').addEventListener('input', e => {
    App.demo.speed = parseInt(e.target.value);
    if (App.demo.playing) { stopDemoTimer(); startDemoTimer(); }
  });

  // 정렬 실습
  document.getElementById('sort-algo-select').addEventListener('change', initSort);
  document.getElementById('sort-level-select').addEventListener('change', initSort);
  document.getElementById('sort-new-btn').addEventListener('click', initSort);
  document.getElementById('sort-check-btn').addEventListener('click', checkSort);
  document.getElementById('sort-hint-btn').addEventListener('click', showSortHint);
  document.getElementById('sort-solution-btn').addEventListener('click', showSortSolution);

  // 탐색 실습
  document.getElementById('search-algo-select').addEventListener('change', initSearch);
  document.getElementById('search-level-select').addEventListener('change', initSearch);
  document.getElementById('search-new-btn').addEventListener('click', initSearch);
  document.getElementById('search-auto-btn').addEventListener('click', startAutoSearch);
  document.getElementById('search-hint-btn').addEventListener('click', () => {
    const { algorithm, stepIndex, steps } = App.search;
    const nextIdx = stepIndex + 1;
    if (nextIdx >= steps.length) return;
    const ns = steps[nextIdx];
    const hintEl = document.getElementById('search-hint-text');
    hintEl.textContent = algorithm === 'sequential'
      ? `💡 순차 탐색: ${ns.current + 1}번째 카드를 클릭하세요.`
      : `💡 이분 탐색: 범위 [${ns.low + 1}~${ns.high + 1}]의 중간 카드(${ns.mid + 1}번째)를 클릭하세요.`;
  });

  // 심화 활동
  document.getElementById('adv-sort-algo').addEventListener('change', e => {
    App.adv.sortAlgo = e.target.value;
  });
  document.getElementById('adv-new-btn').addEventListener('click', initAdvanced);
  document.getElementById('adv-sort-check-btn').addEventListener('click', checkAdvSort);
  document.getElementById('adv-sort-hint-btn').addEventListener('click', () => {
    const hint = getNextStepHint(App.adv.sortAlgo, App.adv.cards);
    document.getElementById('adv-sort-hint-text').textContent = hint.message;
    renderAdvCards(hint.highlightIndices);
    setTimeout(() => renderAdvCards(), 3000);
  });
  document.getElementById('adv-search-auto-btn').addEventListener('click', startAdvAutoSearch);
}

/* ════════════════════════════════════════════════════════════════════
   앱 초기화
   ════════════════════════════════════════════════════════════════════ */
function initApp() {
  bindEvents();

  // 각 모드 초기화
  initSort();
  initSearch();
  initAdvanced();

  // 드래그 앤 드롭 / 클릭 이벤트 (단 한 번만 등록)
  initSortDragDrop();
  initSearchClickDelegation();
  initAdvDragDrop();

  // 데모는 마지막에 (DOM 완전 준비 후)
  initDemo('bubble');

  // URL 해시 기반 페이지
  const hash = window.location.hash.replace('#', '');
  showPage(['home','sort','search','advanced'].includes(hash) ? hash : 'home');
}

document.addEventListener('DOMContentLoaded', initApp);
