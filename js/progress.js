/**
 * progress.js — AlgoCard 학생 진도 관리 시스템
 * localStorage 기반 인증 및 진도 관리
 */

/* ── 상수 ─────────────────────────────────────────────────────────── */
const ADMIN_CLASS = '0';
const ADMIN_ID    = '00000';
const ADMIN_NAME  = '김나영';
const TOTAL       = 19;

const SORT_ALGOS   = ['bubble', 'selection', 'insertion', 'merge'];
const SEARCH_ALGOS = ['linear', 'binary'];
const DIFFS        = ['easy', 'medium', 'hard'];

const LABEL = {
  sortAlgo:  { bubble: '버블 정렬', selection: '선택 정렬', insertion: '삽입 정렬', merge: '합병 정렬' },
  searchAlgo:{ linear: '순차 탐색', binary: '이분 탐색' },
  diff:      { easy: '쉬움', medium: '보통', hard: '어려움' },
  diffColor: { easy: '#10b981', medium: '#f59e0b', hard: '#ef4444' }
};

/* ── 진도 데이터 구조 ──────────────────────────────────────────────── */
function emptyProgress() {
  const p = { sort: {}, search: {}, advanced: false };
  SORT_ALGOS.forEach(a => {
    p.sort[a] = {};
    DIFFS.forEach(d => { p.sort[a][d] = false; });
  });
  SEARCH_ALGOS.forEach(a => {
    p.search[a] = {};
    DIFFS.forEach(d => { p.search[a][d] = false; });
  });
  return p;
}

function countDone(progress) {
  let n = 0;
  SORT_ALGOS.forEach(a => DIFFS.forEach(d => { if (progress.sort[a][d]) n++; }));
  SEARCH_ALGOS.forEach(a => DIFFS.forEach(d => { if (progress.search[a][d]) n++; }));
  if (progress.advanced) n++;
  return n;
}

/* ── localStorage 헬퍼 ────────────────────────────────────────────── */
const LS = { students: 'algocard_students', session: 'algocard_session' };

const store = {
  students:     ()  => JSON.parse(localStorage.getItem(LS.students) || '[]'),
  saveStudents: (s) => localStorage.setItem(LS.students, JSON.stringify(s)),
  session:      ()  => JSON.parse(localStorage.getItem(LS.session)  || 'null'),
  saveSession:  (s) => localStorage.setItem(LS.session, JSON.stringify(s)),
  clearSession: ()  => localStorage.removeItem(LS.session)
};

/* ── 학생 데이터 관리 ──────────────────────────────────────────────── */
function findStudent(classNum, id, name) {
  return store.students().find(s =>
    s.classNum === classNum && s.studentId === id && s.name === name
  ) || null;
}

function upsertStudent(classNum, id, name) {
  const students = store.students();
  if (!students.find(s => s.classNum === classNum && s.studentId === id && s.name === name)) {
    students.push({ classNum, studentId: id, name, progress: emptyProgress() });
    store.saveStudents(students);
  }
}

function saveProgress(classNum, id, name, progress) {
  const students = store.students();
  const i = students.findIndex(s =>
    s.classNum === classNum && s.studentId === id && s.name === name
  );
  if (i >= 0) { students[i].progress = progress; store.saveStudents(students); }
}

/* ── 인증 ──────────────────────────────────────────────────────────── */
function doLogin(classNum, id, name) {
  if (!classNum || !id || !name) return null;
  const isTeacher = classNum === ADMIN_CLASS && id === ADMIN_ID && name === ADMIN_NAME;
  if (!isTeacher) upsertStudent(classNum, id, name);
  const session = { classNum, studentId: id, name, isTeacher };
  store.saveSession(session);
  return session;
}

function doLogout() {
  store.clearSession();
  showLoginScreen();
}

/* ── 화면 전환 ────────────────────────────────────────────────────── */
function showLoginScreen() {
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('app-wrapper').style.display  = 'none';
}

function showAppScreen(session) {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app-wrapper').style.display  = 'block';
  applyNavSession(session);
}

function applyNavSession(session) {
  document.querySelectorAll('.nav-teacher-only').forEach(el =>
    el.style.display = session.isTeacher ? '' : 'none'
  );
  document.querySelectorAll('.nav-student-only').forEach(el =>
    el.style.display = session.isTeacher ? 'none' : ''
  );
  const info = document.getElementById('nav-user-info');
  if (info) info.textContent = `${session.classNum}반 · ${session.name}`;
}

/* ── 학생 진도 페이지 렌더링 ───────────────────────────────────────── */
function renderStudentPage() {
  const s = store.session();
  if (!s || s.isTeacher) return;

  const student = findStudent(s.classNum, s.studentId, s.name);
  if (!student) return;

  const { progress } = student;
  document.getElementById('stu-info').textContent =
    `${s.classNum}반 / 학번 ${s.studentId} / ${s.name}`;

  updateStuSummary(progress);
  renderChecklist('sort-checklist',   'sort',   progress, s);
  renderChecklist('search-checklist', 'search', progress, s);
  renderAdvancedCheck(progress, s);
}

function updateStuSummary(progress) {
  const done = countDone(progress);
  const pct  = Math.round((done / TOTAL) * 100);
  document.getElementById('stu-done').textContent     = done;
  document.getElementById('stu-pct').textContent      = pct + '%';
  document.getElementById('stu-bar-fill').style.width = pct + '%';
}

function renderChecklist(containerId, type, progress, session) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  const algos  = type === 'sort' ? SORT_ALGOS : SEARCH_ALGOS;
  const labels = type === 'sort' ? LABEL.sortAlgo : LABEL.searchAlgo;

  algos.forEach(algo => {
    const card = document.createElement('div');
    card.className = 'pc-card';

    const title = document.createElement('div');
    title.className = 'pc-title';
    title.textContent = labels[algo];
    card.appendChild(title);

    DIFFS.forEach(diff => {
      const row = document.createElement('label');
      row.className = 'pc-item' + (progress[type][algo][diff] ? ' pc-done' : '');

      const cb = document.createElement('input');
      cb.type     = 'checkbox';
      cb.checked  = progress[type][algo][diff];
      cb.disabled = true; // 읽기 전용 — 정답 제출 시 자동 완료

      const badge = document.createElement('span');
      badge.className        = 'pc-diff-badge';
      badge.style.background = LABEL.diffColor[diff];
      badge.textContent      = LABEL.diff[diff];

      row.appendChild(cb);
      row.appendChild(badge);
      card.appendChild(row);
    });

    container.appendChild(card);
  });
}

function renderAdvancedCheck(progress, session) {
  const container = document.getElementById('adv-checklist');
  container.innerHTML = '';

  const label = document.createElement('label');
  label.className = 'pc-item pc-advanced' + (progress.advanced ? ' pc-done' : '');

  const cb = document.createElement('input');
  cb.type     = 'checkbox';
  cb.checked  = progress.advanced;
  cb.disabled = true; // 읽기 전용 — 심화 활동 완료 시 자동 완료

  const txt = document.createElement('span');
  txt.textContent = '🏆 심화 문제 완료';

  label.appendChild(cb);
  label.appendChild(txt);
  container.appendChild(label);
}

/* ── 교사 페이지 렌더링 ────────────────────────────────────────────── */
function renderTeacherPage() {
  const s = store.session();
  if (!s || !s.isTeacher) return;
  refreshClassFilter();
  renderTeacherTable();
}

function refreshClassFilter() {
  const classes = [...new Set(store.students().map(s => s.classNum))].sort((a, b) => +a - +b);
  const sel     = document.getElementById('class-filter');
  const prev    = sel.value;
  sel.innerHTML = '<option value="">전체 반</option>';
  classes.forEach(c => {
    const opt = document.createElement('option');
    opt.value       = c;
    opt.textContent = c + '반';
    sel.appendChild(opt);
  });
  if (classes.includes(prev)) sel.value = prev;
}

function renderTeacherTable() {
  const filter   = document.getElementById('class-filter').value;
  let students   = store.students();
  if (filter) students = students.filter(s => s.classNum === filter);
  students.sort((a, b) => a.studentId.localeCompare(b.studentId));

  const tbody = document.getElementById('teacher-tbody');
  tbody.innerHTML = '';

  if (!students.length) {
    tbody.innerHTML = `<tr><td colspan="25" class="t-empty">등록된 학생이 없습니다.</td></tr>`;
    return;
  }

  students.forEach(({ classNum, studentId, name, progress }) => {
    const done = countDone(progress);
    const pct  = Math.round((done / TOTAL) * 100);
    const tr   = document.createElement('tr');

    // 기본 정보 5열
    [classNum + '반', studentId, name, done, TOTAL].forEach(v => {
      const td = document.createElement('td');
      td.textContent = v;
      tr.appendChild(td);
    });

    // 진도율 셀
    const pctTd = document.createElement('td');
    pctTd.innerHTML =
      `<div class="t-prog-wrap">` +
      `<div class="t-prog-bar"><div class="t-prog-fill" style="width:${pct}%"></div></div>` +
      `<span>${pct}%</span></div>`;
    tr.appendChild(pctTd);

    // 정렬 12열
    SORT_ALGOS.forEach(a => DIFFS.forEach(d => {
      const td = document.createElement('td');
      td.className  = progress.sort[a][d] ? 'tc-done' : 'tc-none';
      td.textContent = progress.sort[a][d] ? '✅' : '□';
      tr.appendChild(td);
    }));

    // 탐색 6열
    SEARCH_ALGOS.forEach(a => DIFFS.forEach(d => {
      const td = document.createElement('td');
      td.className  = progress.search[a][d] ? 'tc-done' : 'tc-none';
      td.textContent = progress.search[a][d] ? '✅' : '□';
      tr.appendChild(td);
    }));

    // 심화 1열
    const advTd = document.createElement('td');
    advTd.className  = progress.advanced ? 'tc-done' : 'tc-none';
    advTd.textContent = progress.advanced ? '✅' : '□';
    tr.appendChild(advTd);

    tbody.appendChild(tr);
  });
}

/* ── 자동 진도 완료 (app.js에서 호출) ─────────────────────────────── */

/**
 * 정렬/탐색 문제를 정답 처리할 때 호출.
 * type: 'sort' | 'search'
 * algoKey: 'bubble' | 'selection' | 'insertion' | 'merge' | 'linear' | 'binary'
 * diffKey:  'easy' | 'medium' | 'hard'
 */
function autoComplete(type, algoKey, diffKey) {
  const s = store.session();
  if (!s || s.isTeacher) return;

  const student = findStudent(s.classNum, s.studentId, s.name);
  if (!student || student.progress[type][algoKey][diffKey]) return;

  student.progress[type][algoKey][diffKey] = true;
  saveProgress(s.classNum, s.studentId, s.name, student.progress);

  // 진도 페이지가 열려 있으면 즉시 반영
  if (typeof App !== 'undefined' && App.currentPage === 'student') renderStudentPage();
}

/** 심화 활동 탐색 성공 시 호출 */
function autoCompleteAdvanced() {
  const s = store.session();
  if (!s || s.isTeacher) return;

  const student = findStudent(s.classNum, s.studentId, s.name);
  if (!student || student.progress.advanced) return;

  student.progress.advanced = true;
  saveProgress(s.classNum, s.studentId, s.name, student.progress);

  if (typeof App !== 'undefined' && App.currentPage === 'student') renderStudentPage();
}

/* ── 로그인 오류 표시 ──────────────────────────────────────────────── */
function setLoginError(msg) {
  const el = document.getElementById('login-error');
  el.textContent    = msg;
  el.style.display  = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 3500);
}

/* ── 초기화 ────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  // 로그인 폼
  document.getElementById('login-form').addEventListener('submit', e => {
    e.preventDefault();
    const classNum = document.getElementById('login-class').value.trim();
    const id       = document.getElementById('login-id').value.trim();
    const name     = document.getElementById('login-name').value.trim();

    if (!classNum || !id || !name) {
      setLoginError('모든 항목을 입력해주세요.');
      return;
    }

    const session = doLogin(classNum, id, name);
    showAppScreen(session);
    if (session.isTeacher) {
      showPage('teacher');
    } else {
      showPage('student');
    }
  });

  // 로그아웃
  document.getElementById('nav-logout').addEventListener('click', doLogout);

  // 반 필터
  document.getElementById('class-filter').addEventListener('change', renderTeacherTable);

  // 세션 복원 (새로고침 후에도 유지)
  const session = store.session();
  if (session) {
    showAppScreen(session);
    if (session.isTeacher) {
      showPage('teacher');
    } else {
      showPage('student');
    }
  }
  // 세션 없으면 login-screen이 기본으로 표시됨
});
