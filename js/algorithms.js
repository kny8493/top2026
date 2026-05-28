/**
 * algorithms.js
 * 정렬·탐색 알고리즘 단계(Step) 생성기 모듈
 * 모든 함수는 순수 함수 — 입력 배열을 변경하지 않습니다.
 */

// ─── 단계 타입 ────────────────────────────────────────────────────────────────
const ST = {
  START:       'start',
  COMPARE:     'compare',
  SWAP:        'swap',
  NO_SWAP:     'no-swap',
  MARK_SORTED: 'mark-sorted',
  PICK:        'pick',
  FIND_MIN:    'find-min',
  NEW_MIN:     'new-min',
  SET_PIVOT:   'set-pivot',
  PLACE_PIVOT: 'place-pivot',
  SEARCHING:   'searching',
  ELIMINATE:   'eliminate',
  FOUND:       'found',
  NOT_FOUND:   'not-found',
  DONE:        'done'
};

// ─── 유틸리티 ─────────────────────────────────────────────────────────────────
const copyArr = arr => [...arr];

/** Fisher-Yates 셔플 */
function shuffle(arr) {
  const a = copyArr(arr);
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** 1~100 사이에서 count개의 유니크한 랜덤 숫자 생성 */
function generateCards(count) {
  const pool = Array.from({ length: 100 }, (_, i) => i + 1);
  return shuffle(pool).slice(0, count);
}

/** 배열이 오름차순 정렬되어 있는지 확인 */
function isSorted(arr) {
  for (let i = 0; i < arr.length - 1; i++) {
    if (arr[i] > arr[i + 1]) return false;
  }
  return true;
}

// ─── 정렬 단계 생성기 ─────────────────────────────────────────────────────────

/**
 * 버블 정렬 단계 생성
 * 각 패스에서 인접한 두 원소를 비교, 왼쪽이 크면 교환
 */
function bubbleSortSteps(arr) {
  const steps = [];
  const a = copyArr(arr);
  const n = a.length;
  const sorted = new Set();

  steps.push({ type: ST.START, array: copyArr(a), comparing: [], sorted: [], description: '버블 정렬 시작! 왼쪽부터 인접한 두 카드를 비교합니다.' });

  for (let pass = 0; pass < n - 1; pass++) {
    for (let j = 0; j < n - 1 - pass; j++) {
      steps.push({
        type: ST.COMPARE,
        array: copyArr(a),
        comparing: [j, j + 1],
        sorted: [...sorted],
        description: `패스 ${pass + 1}: ${a[j]}와 ${a[j + 1]} 비교 (${a[j]} ${a[j] > a[j + 1] ? '>' : '≤'} ${a[j + 1]})`
      });

      if (a[j] > a[j + 1]) {
        [a[j], a[j + 1]] = [a[j + 1], a[j]];
        steps.push({
          type: ST.SWAP,
          array: copyArr(a),
          comparing: [j, j + 1],
          sorted: [...sorted],
          description: `${a[j + 1]}이 ${a[j]}보다 크므로 교환!`
        });
      }
    }

    sorted.add(n - 1 - pass);
    steps.push({
      type: ST.MARK_SORTED,
      array: copyArr(a),
      comparing: [],
      sorted: [...sorted],
      newlySorted: n - 1 - pass,
      description: `패스 ${pass + 1} 완료 — ${a[n - 1 - pass]}이(가) 올바른 위치에 정착!`
    });
  }

  // 아직 sorted에 없는 인덱스 모두 추가
  for (let k = 0; k < n; k++) sorted.add(k);
  steps.push({ type: ST.DONE, array: copyArr(a), comparing: [], sorted: [...sorted], description: '버블 정렬 완료! 🎉' });
  return steps;
}

/**
 * 선택 정렬 단계 생성
 * 미정렬 구간에서 최솟값을 찾아 맨 앞으로 이동
 */
function selectionSortSteps(arr) {
  const steps = [];
  const a = copyArr(arr);
  const n = a.length;
  const sorted = new Set();

  steps.push({ type: ST.START, array: copyArr(a), comparing: [], sorted: [], description: '선택 정렬 시작! 매 단계에서 가장 작은 카드를 선택합니다.' });

  for (let i = 0; i < n - 1; i++) {
    let minIdx = i;

    steps.push({
      type: ST.FIND_MIN,
      array: copyArr(a),
      comparing: [i],
      sorted: [...sorted],
      minIdx,
      description: `${i + 1}번째 자리에 올 최솟값 탐색 시작 (현재 최솟값: ${a[minIdx]})`
    });

    for (let j = i + 1; j < n; j++) {
      steps.push({
        type: ST.COMPARE,
        array: copyArr(a),
        comparing: [j, minIdx],
        sorted: [...sorted],
        minIdx,
        description: `${a[j]}와 현재 최솟값 ${a[minIdx]} 비교`
      });

      if (a[j] < a[minIdx]) {
        minIdx = j;
        steps.push({
          type: ST.NEW_MIN,
          array: copyArr(a),
          comparing: [minIdx],
          sorted: [...sorted],
          minIdx,
          description: `새로운 최솟값 발견: ${a[minIdx]} (${minIdx + 1}번째 위치)`
        });
      }
    }

    if (minIdx !== i) {
      [a[i], a[minIdx]] = [a[minIdx], a[i]];
      steps.push({
        type: ST.SWAP,
        array: copyArr(a),
        comparing: [i, minIdx],
        sorted: [...sorted],
        description: `최솟값 ${a[i]}를 ${i + 1}번째 자리로 이동!`
      });
    }

    sorted.add(i);
    steps.push({
      type: ST.MARK_SORTED,
      array: copyArr(a),
      comparing: [],
      sorted: [...sorted],
      newlySorted: i,
      description: `${a[i]}이(가) ${i + 1}번째 위치에 정렬 완료!`
    });
  }

  sorted.add(n - 1);
  steps.push({ type: ST.DONE, array: copyArr(a), comparing: [], sorted: [...sorted], description: '선택 정렬 완료! 🎉' });
  return steps;
}

/**
 * 삽입 정렬 단계 생성
 * 카드를 하나씩 꺼내 정렬된 구간의 올바른 위치에 삽입
 */
function insertionSortSteps(arr) {
  const steps = [];
  const a = copyArr(arr);
  const n = a.length;
  const sorted = new Set([0]);

  steps.push({ type: ST.START, array: copyArr(a), comparing: [], sorted: [0], description: '삽입 정렬 시작! 카드를 하나씩 올바른 위치에 끼워 넣습니다.' });

  for (let i = 1; i < n; i++) {
    const key = a[i];

    steps.push({
      type: ST.PICK,
      array: copyArr(a),
      comparing: [i],
      sorted: [...sorted],
      description: `${key} 카드 선택 — 앞의 정렬된 구간에서 올바른 자리를 찾습니다.`
    });

    let insertPos = i;   // key가 들어갈 자리 (이동할수록 왼쪽으로)
    let j = i - 1;
    while (j >= 0) {
      const displayArr = copyArr(a);
      displayArr[insertPos] = key;   // key를 현재 gap 위치에 표시
      const needsShift = a[j] > key;
      steps.push({
        type: ST.COMPARE,
        array: displayArr,
        comparing: [j, insertPos],
        sorted: [...sorted],
        description: needsShift
          ? `${a[j]}이(가) ${key}보다 크므로 오른쪽으로 밉니다.`
          : `${a[j]}이(가) ${key}보다 작거나 같습니다. 계속 비교합니다.`
      });

      if (needsShift) {
        a[insertPos] = a[j];          // a[j]를 gap 위치로 이동
        const prevInsertPos = insertPos;
        insertPos = j;                // 새로운 gap은 j
        steps.push({
          type: ST.SWAP,
          array: copyArr(a),
          comparing: [j, prevInsertPos],
          sorted: [...sorted],
          key,
          description: `${a[prevInsertPos]}을(를) ${prevInsertPos + 1}번 자리로 이동 (${key} 삽입 중)`
        });
      }

      j--;    // shift 여부와 무관하게 항상 앞으로 이동
    }

    a[insertPos] = key;
    sorted.add(i);

    steps.push({
      type: ST.MARK_SORTED,
      array: copyArr(a),
      comparing: [],
      sorted: [...sorted],
      newlySorted: insertPos,
      description: `${key}을(를) ${insertPos + 1}번째 자리에 삽입 완료!`
    });
  }

  steps.push({ type: ST.DONE, array: copyArr(a), comparing: [], sorted: [...Array(n).keys()], description: '삽입 정렬 완료! 🎉' });
  return steps;
}

/**
 * 퀵 정렬 단계 생성 (피벗: 마지막 원소)
 * 재귀적으로 단계를 수집합니다.
 */
function quickSortSteps(arr) {
  const steps = [];
  const a = copyArr(arr);
  const sorted = new Set();

  steps.push({ type: ST.START, array: copyArr(a), comparing: [], sorted: [], pivots: [], description: '퀵 정렬 시작! 피벗을 기준으로 작은 값은 왼쪽, 큰 값은 오른쪽에 배치합니다.' });

  function partition(low, high) {
    const pivot = a[high];
    let i = low - 1;

    steps.push({
      type: ST.SET_PIVOT,
      array: copyArr(a),
      comparing: [high],
      sorted: [...sorted],
      pivots: [high],
      range: [low, high],
      description: `피벗 선택: ${pivot} (${high + 1}번째 카드), 범위 [${low + 1}~${high + 1}]`
    });

    for (let j = low; j < high; j++) {
      steps.push({
        type: ST.COMPARE,
        array: copyArr(a),
        comparing: [j, high],
        sorted: [...sorted],
        pivots: [high],
        range: [low, high],
        description: `${a[j]}와 피벗 ${pivot} 비교: ${a[j] <= pivot ? `${a[j]} ≤ ${pivot} → 왼쪽 구간` : `${a[j]} > ${pivot} → 오른쪽 구간`}`
      });

      if (a[j] <= pivot) {
        i++;
        if (i !== j) {
          [a[i], a[j]] = [a[j], a[i]];
          steps.push({
            type: ST.SWAP,
            array: copyArr(a),
            comparing: [i, j],
            sorted: [...sorted],
            pivots: [high],
            range: [low, high],
            description: `${a[i]}를 왼쪽 구간으로 이동!`
          });
        }
      }
    }

    [a[i + 1], a[high]] = [a[high], a[i + 1]];
    const pivotPos = i + 1;
    sorted.add(pivotPos);

    steps.push({
      type: ST.PLACE_PIVOT,
      array: copyArr(a),
      comparing: [],
      sorted: [...sorted],
      pivots: [pivotPos],
      newlySorted: pivotPos,
      range: [low, high],
      description: `피벗 ${a[pivotPos]}이(가) ${pivotPos + 1}번째 위치에 확정!`
    });

    return pivotPos;
  }

  function qsort(low, high) {
    if (low >= high) {
      if (low === high) sorted.add(low);
      return;
    }
    const pi = partition(low, high);
    qsort(low, pi - 1);
    qsort(pi + 1, high);
  }

  qsort(0, a.length - 1);

  for (let k = 0; k < a.length; k++) sorted.add(k);
  steps.push({ type: ST.DONE, array: copyArr(a), comparing: [], sorted: [...sorted], pivots: [], description: '퀵 정렬 완료! 🎉' });
  return steps;
}

// ─── 탐색 단계 생성기 ─────────────────────────────────────────────────────────

/**
 * 순차 탐색 단계 생성
 * 처음부터 하나씩 확인
 */
function sequentialSearchSteps(arr, target) {
  const steps = [];
  steps.push({
    type: ST.START, array: copyArr(arr), current: -1, visited: [],
    low: 0, high: arr.length - 1, mid: -1, eliminated: [], target,
    description: `${target}을(를) 찾습니다. 처음부터 하나씩 확인합니다.`
  });

  for (let i = 0; i < arr.length; i++) {
    steps.push({
      type: ST.SEARCHING, array: copyArr(arr), current: i,
      visited: Array.from({ length: i + 1 }, (_, k) => k),
      low: 0, high: arr.length - 1, mid: -1, eliminated: [], target,
      description: `${i + 1}번째 카드 확인: ${arr[i]} ${arr[i] === target ? `== ${target} ✓` : `≠ ${target}`}`
    });

    if (arr[i] === target) {
      steps.push({
        type: ST.FOUND, array: copyArr(arr), current: i, foundAt: i,
        visited: Array.from({ length: i + 1 }, (_, k) => k),
        low: 0, high: arr.length - 1, mid: -1, eliminated: [], target,
        description: `${target}을(를) ${i + 1}번째 위치에서 찾았습니다! (총 ${i + 1}번 비교)`
      });
      return steps;
    }
  }

  steps.push({
    type: ST.NOT_FOUND, array: copyArr(arr), current: -1,
    visited: Array.from({ length: arr.length }, (_, k) => k),
    low: 0, high: arr.length - 1, mid: -1, eliminated: [], target,
    description: `${target}을(를) 찾지 못했습니다. (총 ${arr.length}번 비교)`
  });
  return steps;
}

/**
 * 이분 탐색 단계 생성 (배열이 정렬되어 있어야 함)
 * 중간값과 비교하며 절반씩 범위 축소
 */
function binarySearchSteps(arr, target) {
  const steps = [];
  let low = 0, high = arr.length - 1;
  const eliminated = [];
  let count = 0;

  steps.push({
    type: ST.START, array: copyArr(arr), current: -1, visited: [],
    low, high, mid: -1, eliminated: [...eliminated], target,
    description: `정렬된 배열에서 ${target}을(를) 이분 탐색합니다. 중간값과 비교하여 절반씩 줄입니다.`
  });

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    count++;

    steps.push({
      type: ST.SEARCHING, array: copyArr(arr), current: mid,
      visited: [mid], low, high, mid, eliminated: [...eliminated], target,
      description: `범위 [${low + 1}~${high + 1}] → 중간(${mid + 1}번째): ${arr[mid]} 확인`
    });

    if (arr[mid] === target) {
      steps.push({
        type: ST.FOUND, array: copyArr(arr), current: mid, foundAt: mid,
        visited: [mid], low, high, mid, eliminated: [...eliminated], target,
        description: `${target}을(를) ${mid + 1}번째 위치에서 찾았습니다! (단 ${count}번 비교로 탐색 완료!)`
      });
      return steps;
    } else if (arr[mid] < target) {
      for (let k = low; k <= mid; k++) eliminated.push(k);
      steps.push({
        type: ST.ELIMINATE, array: copyArr(arr), current: mid,
        visited: [], low: mid + 1, high, mid, eliminated: [...eliminated], target,
        description: `${arr[mid]} < ${target} → 왼쪽 절반 제거! 오른쪽 [${mid + 2}~${high + 1}]만 탐색`
      });
      low = mid + 1;
    } else {
      for (let k = mid; k <= high; k++) eliminated.push(k);
      steps.push({
        type: ST.ELIMINATE, array: copyArr(arr), current: mid,
        visited: [], low, high: mid - 1, mid, eliminated: [...eliminated], target,
        description: `${arr[mid]} > ${target} → 오른쪽 절반 제거! 왼쪽 [${low + 1}~${mid}]만 탐색`
      });
      high = mid - 1;
    }
  }

  for (let k = 0; k < arr.length; k++) eliminated.push(k);
  steps.push({
    type: ST.NOT_FOUND, array: copyArr(arr), current: -1,
    visited: [], low, high, mid: -1, eliminated: [...eliminated], target,
    description: `${target}을(를) 찾지 못했습니다. (총 ${count}번 비교)`
  });
  return steps;
}

// ─── 힌트 생성기 ──────────────────────────────────────────────────────────────

/**
 * 학생의 현재 배열에서 알고리즘별 다음 수행 단계 힌트를 생성합니다.
 * @returns { message, highlightIndices }
 */
function getNextStepHint(algorithm, currentArr) {
  const n = currentArr.length;

  if (algorithm === 'bubble') {
    // 왼쪽부터 교환이 필요한 첫 번째 인접 쌍 탐색
    for (let i = 0; i < n - 1; i++) {
      if (currentArr[i] > currentArr[i + 1]) {
        return {
          message: `🫧 버블 정렬: ${i + 1}번째 카드(${currentArr[i]})와 ${i + 2}번째 카드(${currentArr[i + 1]})를 비교하세요. ${currentArr[i]} > ${currentArr[i + 1]}이므로 두 카드를 교환해야 합니다!`,
          highlightIndices: [i, i + 1]
        };
      }
    }
    return { message: '모든 인접 쌍이 올바른 순서입니다. 정렬 완료!', highlightIndices: [] };
  }

  if (algorithm === 'selection') {
    const sorted = [...currentArr].sort((a, b) => a - b);
    // 첫 번째로 틀린 위치 탐색
    for (let i = 0; i < n; i++) {
      if (currentArr[i] !== sorted[i]) {
        const minInRest = Math.min(...currentArr.slice(i));
        const minIdx = currentArr.indexOf(minInRest, i);
        return {
          message: `🎯 선택 정렬: ${i + 1}번째 자리에는 ${sorted[i]}이(가) 와야 합니다. ${i + 1}번째부터 끝까지 중 최솟값은 ${minInRest}(${minIdx + 1}번째)입니다. 이 카드를 ${i + 1}번째 자리로 이동하세요!`,
          highlightIndices: [i, minIdx]
        };
      }
    }
    return { message: '모두 올바른 위치에 있습니다. 정렬 완료!', highlightIndices: [] };
  }

  if (algorithm === 'insertion') {
    // 정렬된 앞부분을 깨는 첫 번째 카드 탐색
    for (let i = 1; i < n; i++) {
      if (currentArr[i] < currentArr[i - 1]) {
        return {
          message: `📥 삽입 정렬: ${i + 1}번째 카드(${currentArr[i]})가 앞 카드(${currentArr[i - 1]})보다 작습니다. ${currentArr[i]}을(를) 왼쪽으로 이동하여 올바른 위치에 삽입하세요!`,
          highlightIndices: [i - 1, i]
        };
      }
    }
    return { message: '모든 카드가 순서대로 있습니다. 정렬 완료!', highlightIndices: [] };
  }

  if (algorithm === 'quick') {
    // 현재 배열에서 피벗(마지막)보다 큰데 왼쪽에 있거나, 작은데 오른쪽에 있는 카드 탐색
    const pivot = currentArr[n - 1];
    for (let i = 0; i < n - 1; i++) {
      if (currentArr[i] > pivot) {
        return {
          message: `⚡ 퀵 정렬: 현재 피벗은 마지막 카드 ${pivot}입니다. ${i + 1}번째 카드(${currentArr[i]})가 피벗(${pivot})보다 크지만 왼쪽에 있습니다. 피벗보다 큰 카드는 오른쪽으로 이동해야 합니다!`,
          highlightIndices: [i, n - 1]
        };
      }
    }
    return { message: `피벗(${pivot}) 기준으로 분할이 완료되었습니다. 각 하위 구간도 재귀적으로 정렬하세요.`, highlightIndices: [n - 1] };
  }

  return { message: '카드를 오름차순으로 정렬하세요.', highlightIndices: [] };
}

/**
 * 정답 검사 후 오류 메시지와 상세 힌트를 반환합니다.
 */
function getErrorFeedback(algorithm, currentArr) {
  const sorted = [...currentArr].sort((a, b) => a - b);
  const wrongPositions = [];

  for (let i = 0; i < currentArr.length; i++) {
    if (currentArr[i] !== sorted[i]) {
      wrongPositions.push({ index: i, current: currentArr[i], expected: sorted[i] });
    }
  }

  if (wrongPositions.length === 0) return null;

  const algoHints = {
    bubble: `버블 정렬은 인접한 두 카드만 비교하고 교환합니다. 왼쪽부터 차례로 이웃한 두 카드를 비교해보세요.`,
    selection: `선택 정렬은 정렬되지 않은 구간에서 가장 작은 카드를 찾아 맨 앞으로 보냅니다.`,
    insertion: `삽입 정렬은 카드를 하나씩 꺼내 앞쪽 정렬된 구간의 올바른 자리에 끼워 넣습니다.`,
    quick: `퀵 정렬은 피벗을 기준으로 작은 값은 왼쪽, 큰 값은 오른쪽에 배치합니다.`
  };

  const first = wrongPositions[0];
  return {
    summary: `오류입니다! ${wrongPositions.length}개 카드가 잘못된 위치에 있습니다.`,
    detail: `${first.index + 1}번째 자리에 ${first.current}이(가) 있지만, ${first.expected}이(가) 와야 합니다.`,
    algoHint: algoHints[algorithm] || '',
    wrongCount: wrongPositions.length
  };
}

// ─── 알고리즘 메타 정보 ───────────────────────────────────────────────────────
const AlgorithmInfo = {
  bubble: {
    name: '버블 정렬',
    emoji: '🫧',
    complexity: 'O(n²)',
    spaceComplexity: 'O(1)',
    description: '인접한 두 원소를 비교하여 큰 값을 오른쪽으로 밀어내는 정렬',
    detail: '왼쪽부터 이웃한 두 카드를 비교하여 왼쪽이 크면 자리를 바꿉니다. 한 번 순회하면 가장 큰 수가 맨 오른쪽에 위치합니다.',
    color: '#3b82f6',
    getSortSteps: bubbleSortSteps
  },
  selection: {
    name: '선택 정렬',
    emoji: '🎯',
    complexity: 'O(n²)',
    spaceComplexity: 'O(1)',
    description: '전체에서 가장 작은 원소를 선택하여 앞으로 보내는 정렬',
    detail: '정렬되지 않은 부분에서 최솟값을 찾아 맨 앞 위치와 교환합니다. n-1번 반복하면 정렬됩니다.',
    color: '#8b5cf6',
    getSortSteps: selectionSortSteps
  },
  insertion: {
    name: '삽입 정렬',
    emoji: '📥',
    complexity: 'O(n²)',
    spaceComplexity: 'O(1)',
    description: '카드를 하나씩 꺼내 정렬된 부분의 올바른 위치에 끼워 넣는 정렬',
    detail: '두 번째 카드부터 시작하여 앞쪽 정렬된 구간에서 자신보다 큰 카드들을 오른쪽으로 밀고 삽입합니다.',
    color: '#10b981',
    getSortSteps: insertionSortSteps
  },
  quick: {
    name: '퀵 정렬',
    emoji: '⚡',
    complexity: 'O(n log n)',
    spaceComplexity: 'O(log n)',
    description: '피벗을 기준으로 작은 값과 큰 값을 나누어 재귀적으로 정렬하는 방법',
    detail: '마지막 원소를 피벗으로 선택하여 피벗보다 작은 원소는 왼쪽, 큰 원소는 오른쪽으로 분류한 뒤 재귀 정렬합니다.',
    color: '#f59e0b',
    getSortSteps: quickSortSteps
  },
  sequential: {
    name: '순차 탐색',
    emoji: '🔍',
    complexity: 'O(n)',
    spaceComplexity: 'O(1)',
    description: '처음부터 하나씩 확인하는 탐색 방법',
    detail: '배열의 첫 번째부터 마지막까지 하나씩 비교합니다. 정렬 여부와 관계없이 사용 가능합니다.',
    color: '#6366f1',
    getSearchSteps: sequentialSearchSteps
  },
  binary: {
    name: '이분 탐색',
    emoji: '🎯',
    complexity: 'O(log n)',
    spaceComplexity: 'O(1)',
    description: '정렬된 배열에서 중간값과 비교하여 절반씩 줄이는 탐색 방법',
    detail: '반드시 정렬된 배열에서만 사용 가능합니다. 매 단계마다 탐색 범위를 절반으로 줄여 매우 빠릅니다.',
    color: '#ec4899',
    getSearchSteps: binarySearchSteps
  }
};

// 레벨별 카드 개수 설정
const LevelConfig = {
  1: { count: 5,  label: '1단계 (5개)' },
  2: { count: 8,  label: '2단계 (8개)' },
  3: { count: 15, label: '3단계 (15개)' }
};

// 값에 따른 카드 색상 클래스 반환 (1~100)
function getCardColorClass(value) {
  if (value <= 20)  return 'card-blue';
  if (value <= 40)  return 'card-teal';
  if (value <= 60)  return 'card-yellow';
  if (value <= 80)  return 'card-orange';
  return 'card-red';
}
