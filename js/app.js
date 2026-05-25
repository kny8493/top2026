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
    compareCount: 0,     // ★ 비교 횟수 (핵심 지표)
    swapCount: 0,        // 교환 횟수 (부가 정보)
    steps: [],           // 알고리즘 단계 배열 (미리 계산)
    stepIndex: 0,        // 현재 COMPARE 단계 인덱스
    selected: null,      // 첫 번째 선택 카드 인덱스
    solutionShown: false,  // 정답 애니메이션 시청 여부
    solutionTimer: null    // 정답 애니메이션 타이머
  },

  search: {
    algorithm: 'sequential',
    level: 1,
    cards: [],
    target: null,
    steps: [],
    stepIndex: 0,
    searchCount: 0,    // ★ 탐색(비교) 횟수
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
function makeCard(value, index, extraClasses = [], draggable = true) {
  const el = document.createElement('div');
  el.className = ['card', getCardColorClass(value), ...extraClasses].join(' ');
  el.dataset.index = index;
  el.dataset.value = value;
  el.textContent = value;
  el.draggable = draggable;
  return el;
}

/* ════════════════════════════════════════════════════════════════════
   자동 진행 (정답 후 자동으로 다음 문제)
   ════════════════════════════════════════════════════════════════════ */
let _autoAdvTimer    = null;
let _autoAdvInterval = null;

function startAutoAdvance(callback, delay) {
  stopAutoAdvance();
  let remaining = Math.ceil(delay / 1000);

  const update = () => {
    document.querySelectorAll('.auto-next-label').forEach(el => {
      el.textContent = `${remaining}초 후 자동으로 다음 문제`;
    });
  };

  update();
  _autoAdvInterval = setInterval(() => {
    remaining = Math.max(0, remaining - 1);
    update();
  }, 1000);

  _autoAdvTimer = setTimeout(() => {
    stopAutoAdvance();
    callback();
  }, delay);
}

function stopAutoAdvance() {
  clearTimeout(_autoAdvTimer);
  clearInterval(_autoAdvInterval);
  _autoAdvTimer    = null;
  _autoAdvInterval = null;
}

function injectAutoNextLabel(actionsId) {
  const el = document.getElementById(actionsId);
  if (!el) return;
  const lbl = document.createElement('div');
  lbl.className = 'auto-next-label';
  el.appendChild(lbl);
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
  stopAutoAdvance();
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(a => {
    a.classList.toggle('active', a.dataset.page === name);
  });
  const target = document.getElementById(`page-${name}`);
  if (target) target.classList.add('active');
  App.currentPage = name;

  stopDemoTimer();
  stopSortSolutionTimer();
  stopSearchTimer();
  stopAdvTimer();
  const navLinks = document.querySelector('.nav-links');
  if (navLinks) navLinks.classList.remove('open');

  // 진도 페이지 렌더링 (progress.js에서 정의)
  if (name === 'student' && typeof renderStudentPage === 'function') renderStudentPage();
  if (name === 'teacher' && typeof renderTeacherPage === 'function') renderTeacherPage();
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

function stopSortSolutionTimer() {
  clearInterval(App.sort.solutionTimer);
  App.sort.solutionTimer = null;
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
  stopAutoAdvance();
  stopSortSolutionTimer();
  const algo  = document.getElementById('sort-algo-select').value;
  const level = parseInt(document.getElementById('sort-level-select').value);

  const cards = generateCards(LevelConfig[level].count);
  const steps = AlgorithmInfo[algo].getSortSteps(cards);
  const firstCompareIdx = steps.findIndex(s => s.type === ST.COMPARE);

  App.sort.algorithm     = algo;
  App.sort.level         = level;
  App.sort.original      = [...cards];
  App.sort.steps         = steps;
  App.sort.compareCount  = 0;
  App.sort.swapCount     = 0;
  App.sort.selected      = null;
  App.sort.solutionShown = false;

  if (firstCompareIdx >= 0) {
    App.sort.stepIndex = firstCompareIdx;
    App.sort.cards     = [...steps[firstCompareIdx].array];
  } else {
    App.sort.stepIndex = 0;
    App.sort.cards     = [...cards];
  }

  const info = AlgorithmInfo[algo];
  document.getElementById('sort-algo-info').innerHTML =
    `<span class="algo-name">${info.emoji} ${info.name}</span>
     <span class="algo-badge">${info.complexity}</span>
     <span class="algo-desc">${info.description}</span>`;

  hideResult('sort');
  clearSwapLog();
  enableSortButtons();
  updateSortStepInfo();
  renderSortCards();
}

function renderSortCards(highlightIdxs = []) {
  const { cards, level, compareCount, swapCount, selected, steps, stepIndex } = App.sort;
  const container = document.getElementById('sort-cards');
  container.className = `cards-area level-${level}`;
  container.innerHTML = '';

  const lbl = document.createElement('div');
  lbl.className = 'cards-area-label';
  lbl.textContent = `${LevelConfig[level].label} — 비교 횟수: ${compareCount}회, 교환 횟수: ${swapCount}회`;
  container.appendChild(lbl);

  const sortedSet = new Set((steps[stepIndex] || {}).sorted || []);

  cards.forEach((val, i) => {
    const cls = [];
    if (sortedSet.has(i))        cls.push('sorted');
    if (i === selected)          cls.push('selected');
    if (highlightIdxs.includes(i)) cls.push('highlighted');
    // draggable=false: 정렬 실습은 클릭 방식 사용
    container.appendChild(makeCard(val, i, cls, false));
  });

  updateSortProgress();
}

function updateSortProgress() {
  const { steps, compareCount } = App.sort;
  const total   = steps.filter(s => s.type === ST.COMPARE).length;
  const pct     = total > 0 ? Math.round((compareCount / total) * 100) : 0;
  const isDone  = App.sort.steps[App.sort.stepIndex]?.type === ST.DONE;
  document.getElementById('sort-progress').style.width = pct + '%';
  document.getElementById('sort-progress-text').textContent =
    isDone ? '✅ 정렬 완료!' : `비교 진행도 ${pct}%`;
}

/* ── 정렬 실습: 클릭 비교 (이벤트 위임, 한 번만 등록) ────────────── */
function initSortClickDelegation() {
  document.getElementById('sort-cards').addEventListener('click', e => {
    const card = e.target.closest('.card');
    if (!card) return;
    const idx = parseInt(card.dataset.index);
    if (isNaN(idx)) return;
    handleSortCardClick(idx);
  });
}

/** 카드 클릭 처리: 두 번 클릭으로 비교 쌍 선택 */
function handleSortCardClick(clickedIdx) {
  // 정답 애니메이션을 시청한 경우 클릭 비활성화
  if (App.sort.solutionShown) return;

  const { steps, stepIndex, selected } = App.sort;
  const step = steps[stepIndex];
  if (!step || step.type !== ST.COMPARE) return;

  if (selected === null) {
    App.sort.selected = clickedIdx;
    renderSortCards();
    return;
  }

  const firstIdx = App.sort.selected;
  App.sort.selected = null;

  if (firstIdx === clickedIdx) {
    renderSortCards();
    return;
  }

  const [a, b] = step.comparing;
  const correct = (firstIdx === a && clickedIdx === b) ||
                  (firstIdx === b && clickedIdx === a);

  if (correct) {
    App.sort.compareCount++;
    advanceSortAfterCorrectCompare();
  } else {
    alert('다시 시도해 보세요');
    renderSortCards();
  }
}

/** 교환 로그에 항목 추가 */
function addSwapLog(step, swapNum) {
  const panel = document.getElementById('swap-log-panel');
  const list  = document.getElementById('swap-log-list');
  if (!panel || !list) return;

  panel.style.display = '';

  const [i, j] = step.comparing;
  // step.array는 교환 후 배열 상태
  const valAtI = step.array[i];
  const valAtJ = step.array[j];

  // 교환 후 배열을 렌더링: 교환된 위치는 강조
  const arrHTML = step.array.map((v, idx) => {
    if (idx === i || idx === j) {
      return `<span class="swap-log-highlight">${v}</span>`;
    }
    return `<span class="swap-log-normal">${v}</span>`;
  }).join(' ');

  const li = document.createElement('li');
  li.className = 'swap-log-item';
  li.innerHTML =
    `<div class="swap-log-desc">` +
      `<strong>${swapNum}번째 교환</strong> — ` +
      `<span class="swap-vals">${valAtJ}</span>(${i+1}번 자리) ↔ ` +
      `<span class="swap-vals">${valAtI}</span>(${j+1}번 자리)` +
      `<span class="swap-log-algo-desc">${step.description || ''}</span>` +
    `</div>` +
    `<div class="swap-log-array">배열: [ ${arrHTML} ]</div>`;

  list.appendChild(li);
  list.scrollTop = list.scrollHeight;
}

/** 교환 로그 초기화 */
function clearSwapLog() {
  document.getElementById('swap-log-list').innerHTML = '';
  document.getElementById('swap-log-panel').style.display = 'none';
}

/** 정답 비교 후: SWAP·기타 중간 단계 자동 처리 → 다음 COMPARE 또는 완료 */
function advanceSortAfterCorrectCompare() {
  const steps = App.sort.steps;
  let idx = App.sort.stepIndex + 1;

  while (idx < steps.length) {
    const type = steps[idx].type;
    if (type === ST.SWAP) {
      App.sort.swapCount++;
      addSwapLog(steps[idx], App.sort.swapCount);
      idx++;
      continue;
    }
    if (type === ST.COMPARE || type === ST.DONE) break;
    idx++;
  }

  if (idx >= steps.length || steps[idx].type === ST.DONE) {
    const last = steps[steps.length - 1];
    App.sort.cards     = [...last.array];
    App.sort.stepIndex = steps.length - 1;
    renderSortCards();
    handleSortComplete();
    return;
  }

  App.sort.stepIndex = idx;
  App.sort.cards     = [...steps[idx].array];
  renderSortCards();
  updateSortStepInfo();
}

/** 힌트 텍스트: 알고리즘 단계 설명 (정답 쌍은 공개하지 않음) */
function updateSortStepInfo() {
  const { algorithm, steps, stepIndex, compareCount, swapCount } = App.sort;
  const step = steps[stepIndex];
  if (!step) return;

  const guide = {
    bubble:    '버블 정렬: 현재 패스에서 비교해야 할 인접한 두 카드를 클릭하세요.',
    selection: '선택 정렬: 미정렬 구간에서 비교할 두 카드(현재 후보와 다음 원소)를 클릭하세요.',
    insertion: '삽입 정렬: 삽입할 카드와 비교 대상 카드를 클릭하세요.'
  };
  document.getElementById('sort-hint-text').textContent =
    `${guide[algorithm] || '비교할 두 카드를 클릭하세요.'}  (비교 ${compareCount}회 / 교환 ${swapCount}회)`;
}

/** 정렬 완료 처리 (자동 타이머 없음 — 학생이 직접 다음 행동 선택) */
function handleSortComplete() {
  const { algorithm, compareCount, swapCount, level } = App.sort;
  showConfetti();

  document.getElementById('sort-cards').querySelectorAll('.card')
    .forEach(c => c.classList.add('sorted'));

  if (typeof autoComplete === 'function') {
    const diffMap = { 1: 'easy', 2: 'medium', 3: 'hard' };
    const algoMap = { bubble: 'bubble', selection: 'selection', insertion: 'insertion' };
    const key = algoMap[algorithm];
    if (key) autoComplete('sort', key, diffMap[level]);
  }

  showResult('sort', true, {
    icon:      '🎉',
    message:   '정렬 완료! 훌륭해요!',
    detail:    `비교 횟수: ${compareCount}회, 교환 횟수: ${swapCount}회로 정렬을 완성했습니다!`,
    algoHint:  `${AlgorithmInfo[algorithm].emoji} ${AlgorithmInfo[algorithm].name}의 모든 비교 단계를 완주했습니다!`
  });
}

/* ── 정렬 실습: 진행 상태 확인 (완료 처리 없이 현황만 표시) ────── */
function checkSort() {
  const { compareCount, swapCount, steps } = App.sort;
  const total = steps.filter(s => s.type === ST.COMPARE).length;
  document.getElementById('sort-hint-text').textContent =
    `현재까지 비교: ${compareCount}회 / 총 ${total}회, 교환: ${swapCount}회. 두 카드를 클릭해 비교를 계속하세요!`;
}

/* ── 정렬 실습: 같은 카드로 처음부터 다시 ───────────────────────── */
function restartSort() {
  stopSortSolutionTimer();
  const algo  = App.sort.algorithm;
  const cards = [...App.sort.original];
  const steps = AlgorithmInfo[algo].getSortSteps(cards);
  const firstCompareIdx = steps.findIndex(s => s.type === ST.COMPARE);

  App.sort.steps         = steps;
  App.sort.compareCount  = 0;
  App.sort.swapCount     = 0;
  App.sort.selected      = null;
  App.sort.solutionShown = false;
  App.sort.stepIndex     = firstCompareIdx >= 0 ? firstCompareIdx : 0;
  App.sort.cards         = [...steps[App.sort.stepIndex].array];

  hideResult('sort');
  clearSwapLog();
  enableSortButtons();
  updateSortStepInfo();
  renderSortCards();
}

/** 정렬 실습 버튼 활성화/비활성화 헬퍼 */
function enableSortButtons() {
  document.getElementById('sort-check-btn').disabled    = false;
  document.getElementById('sort-hint-btn').disabled     = false;
  document.getElementById('sort-solution-btn').disabled = false;
}
function disableSortButtons() {
  document.getElementById('sort-check-btn').disabled    = true;
  document.getElementById('sort-hint-btn').disabled     = true;
  document.getElementById('sort-solution-btn').disabled = true;
}

/* ── 정렬 실습: 힌트 (클릭해야 할 두 카드 위치 공개) ─────────────── */
function showSortHint() {
  const { steps, stepIndex, compareCount, swapCount } = App.sort;
  const step = steps[stepIndex];
  if (!step || step.type !== ST.COMPARE) return;

  const [a, b] = step.comparing;
  document.getElementById('sort-hint-text').textContent =
    `💡 힌트: ${step.description}  →  ${a + 1}번째 카드와 ${b + 1}번째 카드를 클릭하세요! (비교 ${compareCount}회 / 교환 ${swapCount}회)`;

  renderSortCards([a, b]);
  setTimeout(() => renderSortCards(), 3000);
}

/* ── 정렬 실습: 정답 애니메이션 ──────────────────────────────────── */
function showSortSolution() {
  // 애니메이션 시작 → 정답 확인·힌트 버튼 비활성화
  App.sort.solutionShown = true;
  disableSortButtons();

  const steps = AlgorithmInfo[App.sort.algorithm].getSortSteps(App.sort.original);
  let idx = 0;
  const container = document.getElementById('sort-cards');
  const hintEl    = document.getElementById('sort-hint-text');
  hintEl.textContent = '정답 애니메이션 실행 중... 잘 관찰하세요!';
  hideResult('sort');

  App.sort.solutionTimer = setInterval(() => {
    if (idx >= steps.length) {
      clearInterval(App.sort.solutionTimer);
      App.sort.solutionTimer = null;
      App.sort.cards = asSorted(App.sort.original);
      renderSortCards();
      // 애니메이션 완료 후: 정답 확인·힌트 버튼은 여전히 비활성, 안내만 표시
      hintEl.textContent = '정답 애니메이션을 시청했습니다. 직접 풀려면 "↺ 처음부터 다시" 또는 "새 문제"를 선택하세요.';
      showResult('sort', false, {
        icon:     '👀',
        message:  '정답 애니메이션을 시청했습니다.',
        detail:   '직접 단계를 클릭해서 풀어야 진도가 인정됩니다!',
        algoHint: ''
      });
      // 결과 패널 버튼을 처음부터 다시 / 새 문제로 교체
      const actions = document.getElementById('sort-result-actions');
      if (actions) {
        actions.innerHTML = `
          <button class="btn-hint"      onclick="restartSort()">↺ 처음부터 다시 (직접 풀기)</button>
          <button class="btn-secondary" onclick="initSort()">새 문제</button>
        `;
      }
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
  }, 2000);
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
  stopAutoAdvance();
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
    searchCount: 0,
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

  document.getElementById('search-step-info').textContent =
    `${step.description || ''}   [탐색 횟수: ${App.search.searchCount}회]`;

  if (step.type === 'found' || step.type === 'not-found') {
    App.search.done = true;
    stopSearchTimer();
    // 진도 자동 완료 (탐색 완주 시 — found/not-found 모두 인정)
    if (typeof autoComplete === 'function') {
      const diffMap  = { 1: 'easy', 2: 'medium', 3: 'hard' };
      const algoMap  = { sequential: 'linear', binary: 'binary' };
      autoComplete('search', algoMap[App.search.algorithm], diffMap[App.search.level]);
    }
    const success = step.type === 'found';
    showResult('search', success, {
      icon: success ? '🎉' : '🔍',
      message: success ? `${step.target}을(를) 찾았습니다!` : `${step.target}은(는) 배열에 없습니다.`,
      detail: step.description,
      algoHint: ''
    });
    injectAutoNextLabel('search-result-actions');
    startAutoAdvance(initSearch, 2000);
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

    const { algorithm, steps, stepIndex } = App.search;
    const nextIdx = stepIndex + 1;
    if (nextIdx >= steps.length) return;

    const nextStep = steps[nextIdx];

    if (algorithm === 'sequential') {
      // 순차 탐색: 다음 SEARCHING 단계의 current 위치를 클릭해야 함
      if (nextStep.type === ST.SEARCHING && clickedIdx === nextStep.current) {
        App.search.searchCount++;
        renderSearchStep(nextIdx);
        autoAdvanceSearchPost(nextIdx);   // FOUND/NOT_FOUND 자동 진행
      } else {
        alert('다시 시도해 보세요');
      }
    } else {
      // 이분 탐색: 다음 SEARCHING 단계의 mid 위치를 클릭해야 함
      if (nextStep.type === ST.SEARCHING && nextStep.mid >= 0 && clickedIdx === nextStep.mid) {
        App.search.searchCount++;
        renderSearchStep(nextIdx);
        autoAdvanceBinaryPost(nextIdx);   // ELIMINATE/FOUND/NOT_FOUND 자동 진행
      } else {
        alert('다시 시도해 보세요');
      }
    }
  });
}

/** 순차 탐색: SEARCHING 렌더 후 FOUND/NOT_FOUND 자동 처리 */
function autoAdvanceSearchPost(searchingIdx) {
  const { steps } = App.search;
  const next = searchingIdx + 1;
  if (next >= steps.length) return;
  const type = steps[next].type;
  if (type === ST.FOUND || type === ST.NOT_FOUND) {
    renderSearchStep(next);
  }
}

/** 이분 탐색: SEARCHING 렌더 후 ELIMINATE → (FOUND|NOT_FOUND) 자동 처리
 *  학생은 SEARCHING 단계(mid 클릭)만 수행, 나머지는 자동으로 보여줌 */
function autoAdvanceBinaryPost(searchingIdx) {
  const { steps } = App.search;
  const next = searchingIdx + 1;
  if (next >= steps.length) return;

  const nextType = steps[next].type;

  if (nextType === ST.FOUND || nextType === ST.NOT_FOUND) {
    // 바로 결과
    renderSearchStep(next);
    return;
  }

  if (nextType === ST.ELIMINATE) {
    // 제거 범위 보여주기 (자동)
    renderSearchStep(next);
    // ELIMINATE 다음이 NOT_FOUND면 추가 자동 진행
    const afterElim = next + 1;
    if (afterElim < steps.length && steps[afterElim].type === ST.NOT_FOUND) {
      renderSearchStep(afterElim);
    }
    // 다음이 SEARCHING이면 멈추고 학생 클릭 대기
  }
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
  stopAutoAdvance();
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
    // 심화 진도 자동 완료 (이분 탐색 성공 시)
    if (step.type === 'found' && typeof autoCompleteAdvanced === 'function') autoCompleteAdvanced();
    const resultEl = document.getElementById('adv-result');
    resultEl.style.display = 'block';
    resultEl.className = `result-panel ${step.type === 'found' ? 'success' : 'error'}`;
    document.getElementById('adv-result-icon').textContent    = step.type === 'found' ? '🏆' : '🔍';
    document.getElementById('adv-result-message').textContent =
      step.type === 'found'
        ? `완벽합니다! ${target}을(를) 단 ${App.adv.searchStepIdx}번 비교로 찾았습니다!`
        : `탐색 범위를 모두 확인했지만 ${target}은(는) 없습니다.`;
    document.getElementById('adv-result-detail').textContent = step.description;
    if (step.type === 'found') {
      const retryBtn = document.getElementById('adv-retry-btn');
      if (retryBtn) {
        const lbl = document.createElement('div');
        lbl.className = 'auto-next-label';
        retryBtn.insertAdjacentElement('beforebegin', lbl);
      }
      startAutoAdvance(initAdvanced, 2000);
    }
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
      <button class="btn-hint"      onclick="restartSort()">↺ 처음부터 다시</button>
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
    const { algorithm, stepIndex, steps, searchCount } = App.search;
    // ELIMINATE 단계를 건너뛰고 다음 SEARCHING 단계를 찾음
    let nextIdx = stepIndex + 1;
    while (nextIdx < steps.length && steps[nextIdx].type === ST.ELIMINATE) nextIdx++;
    if (nextIdx >= steps.length) return;
    const ns = steps[nextIdx];
    if (ns.type !== ST.SEARCHING) return;
    const hintEl = document.getElementById('search-hint-text');
    hintEl.textContent = algorithm === 'sequential'
      ? `💡 순차 탐색: ${ns.current + 1}번째 카드를 클릭하세요. [탐색 횟수: ${searchCount}회]`
      : `💡 이분 탐색: 범위 [${ns.low + 1}~${ns.high + 1}]의 중간 카드(${ns.mid + 1}번째)를 클릭하세요. [탐색 횟수: ${searchCount}회]`;
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

  // 정렬 실습: 클릭 비교 / 탐색 실습: 클릭 탐색 / 심화: 드래그 앤 드롭 (단 한 번만 등록)
  initSortClickDelegation();
  initSearchClickDelegation();
  initAdvDragDrop();

  // 데모는 마지막에 (DOM 완전 준비 후)
  initDemo('bubble');

  // URL 해시 기반 페이지
  const hash = window.location.hash.replace('#', '');
  showPage(['home','sort','search','advanced'].includes(hash) ? hash : 'home');
}

document.addEventListener('DOMContentLoaded', initApp);
