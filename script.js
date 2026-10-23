
// ==========================================
// ANATOMY TRACKER
// 每日 3.5 小時・彈性章節進度
// ==========================================

// ===== 基本設定 =====

const DAILY_TARGET = 210; // 3.5 小時
const EXAM_DATE = "2026-11-09";
const MOCK_START = "2026-11-07";

const STORAGE_KEY = "anatomy-study-progress-v2";
const PARTIAL_KEY = "anatomy-study-partial-minutes-v1";
const MOCK_KEY = "anatomy-study-mock-v1";

const chapterStages = [
  "PPT 課前預習",
  "觀看影片＋做筆記",
  "基礎觀念測驗",
  "歷屆考古題"
];

// ===== 章節 =====
// 舊日期只用於對應原本的儲存進度
// 新版不要求在指定日期完成

const chapters = [
  {
    id: "2026-10-24",
    title: "5.1 Abdominal Cavity & Abdominal Wall",
    description: "腹腔、前外側腹壁"
  },
  {
    id: "2026-10-25",
    title: "5.2 Inguinal Region, Scrotum & Testis",
    description: "腹股溝管、精索、陰囊與睪丸"
  },
  {
    id: "2026-10-26",
    title: "Peritoneum & Peritoneal Cavity",
    description: "腹膜、大小網膜、腹膜腔"
  },
  {
    id: "2026-10-27",
    title: "Abdominal Autonomic Innervation",
    description: "交感、副交感與內臟神經叢"
  },
  {
    id: "2026-10-28",
    title: "Esophagus & Stomach",
    description: "食道、胃、血管與淋巴"
  },
  {
    id: "2026-10-29",
    title: "Intestines",
    description: "小腸、大腸、血管供應"
  },
  {
    id: "2026-10-30",
    title: "Spleen & Pancreas",
    description: "脾臟、胰臟、韌帶與血管"
  },
  {
    id: "2026-10-31",
    title: "Liver",
    description: "肝臟、膽道、膽囊"
  },
  {
    id: "2026-11-01",
    title: "Kidney & Ureter",
    description: "腎臟、輸尿管、腎上腺"
  },
  {
    id: "2026-11-02",
    title: "Posterior Abdominal Wall",
    description: "橫膈、後腹壁肌肉、腰神經叢"
  },
  {
    id: "2026-11-03",
    title: "Pelvis & Pelvic Viscera",
    description: "骨盆壁、骨盆底、骨盆內臟"
  },
  {
    id: "2026-11-04",
    title: "Male & Female Pelvic Viscera",
    description: "男女生殖器官、血管與韌帶"
  },
  {
    id: "2026-11-05",
    title: "Perineum",
    description: "會陰、肛管、神經與血管"
  }
];

// ===== 影片資料 =====

const videos = [
  {
    id: "inguinal",
    title: "Inguinal scrutom testis.mp4",
    duration: "00:57:22",
    speed: 1,
    chapters: ["2026-10-25"]
  },
  {
    id: "abdomen1013",
    title: "Peritoneum & Esophagus & Stomach",
    duration: "04:12:40",
    speed: 1.5,
    chapters: ["2026-10-26", "2026-10-28"]
  },
  {
    id: "abdomen1015",
    title: "Small & Large Intestines",
    duration: "03:21:21",
    speed: 1.5,
    chapters: ["2026-10-29"]
  },
  {
    id: "abdomen1016",
    title: "Spleen & Pancreas & Liver",
    duration: "04:12:35",
    speed: 1.5,
    chapters: ["2026-10-30", "2026-10-31"]
  },
  {
    id: "abdomen1020",
    title: "Innervation & Posterior Abdominal Wall",
    duration: "03:52:57",
    speed: 1.5,
    chapters: ["2026-10-27", "2026-11-02"]
  }
];

// ===== 日期工具 =====

function localDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1)
    .padStart(2, "0");
  const day = String(date.getDate())
    .padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseLocalDate(value) {
  const [year, month, day] = value
    .split("-")
    .map(Number);

  return new Date(year, month - 1, day);
}

function daysBetween(start, end) {
  const a = parseLocalDate(start);
  const b = parseLocalDate(end);

  return Math.round((b - a) / 86400000);
}

function getToday() {
  return localDateString(new Date());
}

// ===== 時間工具 =====

function durationToSeconds(value) {
  const [hours, minutes, seconds] =
    value.split(":").map(Number);

  return hours * 3600 + minutes * 60 + seconds;
}

function watchMinutes(video) {
  return Math.ceil(
    durationToSeconds(video.duration) /
    video.speed / 60
  );
}

function formatMinutes(minutes) {
  minutes = Math.max(0, Math.round(minutes));

  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;

  if (hours === 0) {
    return `${remaining} 分鐘`;
  }

  if (remaining === 0) {
    return `${hours} 小時`;
  }

  return `${hours} 小時 ${remaining} 分鐘`;
}

// 共用影片分配時，確保總分鐘數不重複
function allocatedVideoMinutes(video, chapterId) {
  const position = video.chapters.indexOf(chapterId);

  if (position === -1) return 0;

  const total = watchMinutes(video);
  const count = video.chapters.length;
  const base = Math.floor(total / count);
  const remainder = total % count;

  return base + (position < remainder ? 1 : 0);
}

function videosForChapter(chapterId) {
  return videos.filter(video =>
    video.chapters.includes(chapterId)
  );
}

// ===== 每個階段預估耗時 =====

function getStageDurations(chapter) {
  const related = videosForChapter(chapter.id);

  let videoTime = 60;

  if (related.length > 0) {
    videoTime = related.reduce(
      (sum, video) =>
        sum + allocatedVideoMinutes(video, chapter.id),
      0
    );
  }

  return [
    25,             // PPT 預習
    videoTime + 25, // 影片＋筆記
    35,             // 基礎測驗
    50              // 考古題
  ];
}

// ===== 讀取舊版進度 =====

function loadObject(key) {
  try {
    const value = JSON.parse(
      localStorage.getItem(key) || "{}"
    );

    return value &&
      typeof value === "object" &&
      !Array.isArray(value)
      ? value
      : {};
  } catch (error) {
    return {};
  }
}

const progress = loadObject(STORAGE_KEY);
const partial = loadObject(PARTIAL_KEY);
const mockProgress = loadObject(MOCK_KEY);

// 5.1 已完成
if (!Array.isArray(progress["2026-10-24"])) {
  progress["2026-10-24"] = [
    true, true, true, true
  ];
}

// 匯入更早版本的 5.2
if (!Array.isArray(progress["2026-10-25"])) {
  let oldProgress = [];

  try {
    oldProgress = JSON.parse(
      localStorage.getItem("anatomy-5-2") || "[]"
    );
  } catch (error) {
    oldProgress = [];
  }

  progress["2026-10-25"] =
    chapterStages.map(
      (_, index) =>
        Array.isArray(oldProgress) &&
        oldProgress[index] === true
    );
}

// 其他章節不覆蓋原有資料
chapters.forEach(chapter => {
  if (!Array.isArray(progress[chapter.id])) {
    progress[chapter.id] = [
      false, false, false, false
    ];
  }

  if (!Array.isArray(partial[chapter.id])) {
    partial[chapter.id] = [0, 0, 0, 0];
  }

  const durations = getStageDurations(chapter);

  for (let i = 0; i < 4; i++) {
    if (progress[chapter.id][i] === true) {
      partial[chapter.id][i] = durations[i];
    } else {
      partial[chapter.id][i] = Math.max(
        0,
        Math.min(
          durations[i],
          Number(partial[chapter.id][i]) || 0
        )
      );
    }
  }
});

function saveAll() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(progress)
  );

  localStorage.setItem(
    PARTIAL_KEY,
    JSON.stringify(partial)
  );

  localStorage.setItem(
    MOCK_KEY,
    JSON.stringify(mockProgress)
  );
}

// ===== 章節進度 =====

function completedStages(chapter) {
  return progress[chapter.id].filter(
    value => value === true
  ).length;
}

function isChapterComplete(chapter) {
  return completedStages(chapter) === 4;
}

function stageRemaining(chapter, stageIndex) {
  if (progress[chapter.id][stageIndex] === true) {
    return 0;
  }

  const durations = getStageDurations(chapter);

  return Math.max(
    0,
    durations[stageIndex] -
    partial[chapter.id][stageIndex]
  );
}

function chapterRemaining(chapter) {
  return chapterStages.reduce(
    (sum, _, index) =>
      sum + stageRemaining(chapter, index),
    0
  );
}

function chapterTotal(chapter) {
  return getStageDurations(chapter).reduce(
    (sum, minutes) => sum + minutes,
    0
  );
}

function totalRemaining() {
  return chapters.reduce(
    (sum, chapter) =>
      sum + chapterRemaining(chapter),
    0
  );
}

// ===== 彈性任務規劃 =====

// 每天最多安排 210 分鐘
// 未完成階段自動接續
// 不會自動把部分完成當作整階段完成

function buildDailyPlan(limit = DAILY_TARGET) {
  const plan = [];
  let available = limit;

  for (const chapter of chapters) {
    if (available <= 0) break;

    for (let i = 0; i < 4; i++) {
      if (available <= 0) break;

      const remaining = stageRemaining(chapter, i);

      if (remaining <= 0) continue;

      const allocated = Math.min(
        remaining,
        available
      );

      plan.push({
        chapterId: chapter.id,
        chapterTitle: chapter.title,
        stageIndex: i,
        stageName: chapterStages[i],
        minutes: allocated,
        remainingBefore: remaining,
        partialTask: allocated < remaining
      });

      available -= allocated;
    }
  }

  return plan;
}

// ===== 記錄已讀分鐘數 =====

function completePlanTask(task) {
  const chapter = chapters.find(
    item => item.id === task.chapterId
  );

  if (!chapter) return;

  const index = task.stageIndex;
  const durations = getStageDurations(chapter);

  if (progress[chapter.id][index] === true) {
    return;
  }

  const current = partial[chapter.id][index];

  partial[chapter.id][index] = Math.min(
    durations[index],
    current + task.minutes
  );

  if (partial[chapter.id][index] >= durations[index]) {
    progress[chapter.id][index] = true;
  }

  saveAll();
  updateAll();
}

// ===== 手動勾選整個階段 =====

function setStageCompleted(chapter, index, checked) {
  const durations = getStageDurations(chapter);

  progress[chapter.id][index] = checked;

  partial[chapter.id][index] =
    checked ? durations[index] : 0;

  saveAll();
  updateAll();
}

// ===== 考試倒數與統計 =====

function renderStats() {
  const remainingDays = Math.max(
    0,
    daysBetween(getToday(), EXAM_DATE)
  );

  document.getElementById("countdown").textContent =
    `${remainingDays} 天`;

  const complete = chapters.filter(
    isChapterComplete
  ).length;

  const percent = Math.round(
    complete / chapters.length * 100
  );

  document.getElementById("completed").textContent =
    `${complete} / ${chapters.length} 章`;

  document.getElementById("progress-percent").textContent =
    `${percent}%`;

  document.getElementById("overall-progress").style.width =
    `${percent}%`;

  document.getElementById("progress-text").textContent =
    `已完整複習 ${complete} 章，` +
    `剩餘 ${chapters.length - complete} 章。` +
    `部分完成的階段會另外保留進度。`;
}

// ===== 今日建議任務 =====

function renderTodayPlan() {
  const container = document.getElementById(
    "today-task-list"
  );

  const todayTotal = document.getElementById(
    "today-total"
  );

  const remainingTotal = document.getElementById(
    "remaining-total"
  );

  const notice = document.getElementById(
    "schedule-notice"
  );

  container.innerHTML = "";

  const remaining = totalRemaining();

  remainingTotal.textContent =
    formatMinutes(remaining);

  const currentDate = getToday();

  // 保留模擬考日，不安排一般章節
  if (currentDate >= MOCK_START &&
      currentDate < EXAM_DATE) {

    todayTotal.textContent = "模擬考";

    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent =
      "今天保留給歷屆考古題模擬考與訂正。";

    container.appendChild(empty);

    notice.textContent = remaining > 0
      ? `提醒：目前仍有 ${formatMinutes(remaining)} ` +
        "章節工作量未完成，可依弱點選擇性補強。"
      : "全部章節已完成，專心練習考古題！";

    return;
  }

  if (currentDate >= EXAM_DATE) {
    todayTotal.textContent = "考試日";

    container.innerHTML =
      '<div class="empty-state">考試日：快速回顧重點，保持正常作息。</div>';

    notice.textContent =
      "祝考試順利！";

    return;
  }

  const plan = buildDailyPlan();

  const plannedMinutes = plan.reduce(
    (sum, task) => sum + task.minutes,
    0
  );

  todayTotal.textContent =
    formatMinutes(plannedMinutes);

  if (plan.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent =
      "所有章節的四階段都完成了！";

    container.appendChild(empty);
  }

  plan.forEach(task => {
    const row = document.createElement("label");
    row.className = "today-task";

    if (task.partialTask) {
      row.classList.add("partial");
    }

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";

    const content = document.createElement("div");
    content.className = "today-task-content";

    const title = document.createElement("div");
    title.className = "today-task-title";
    title.textContent = task.stageName;

    const chapter = document.createElement("div");
    chapter.className = "today-task-chapter";
    chapter.textContent = task.chapterTitle;

    content.append(title, chapter);

    if (task.partialTask) {
      const note = document.createElement("div");
      note.className = "today-task-note";
      note.textContent =
        `這次先完成 ${formatMinutes(task.minutes)}，` +
        `其餘 ${formatMinutes(
          task.remainingBefore - task.minutes
        )} 留待下次。`;

      content.appendChild(note);
    }

    const duration = document.createElement("span");
    duration.className = "today-task-duration";
    duration.textContent =
      formatMinutes(task.minutes);

    checkbox.addEventListener("change", () => {
      if (checkbox.checked) {
        completePlanTask(task);
      }
    });

    row.append(checkbox, content, duration);
    container.appendChild(row);
  });

  const daysAvailable = Math.max(
    0,
    daysBetween(currentDate, MOCK_START)
  );

  const capacity = daysAvailable * DAILY_TARGET;

  if (remaining > capacity && daysAvailable > 0) {
    notice.textContent =
      `依目前進度，剩餘工作量約 ${formatMinutes(remaining)}。` +
      `在 11/7 前以每天 3.5 小時計算，` +
      `預計可安排 ${formatMinutes(capacity)}。` +
      "可能需要優先處理重要章節，或適度調整複習量。";
  } else if (daysAvailable === 0) {
    notice.textContent =
      "目前不在一般章節排程期間，請以考前重點為主。";
  } else {
    notice.textContent =
      "不必一天完成一章。完成今天安排的部分後，" +
      "剩餘工作量會保留，下一次自動接續。";
  }
}

// ===== 章節清單 =====

let selectedChapterId = "2026-10-25";

function getSelectedChapter() {
  return chapters.find(
    chapter => chapter.id === selectedChapterId
  ) || chapters[0];
}

function renderChapterList() {
  const container = document.getElementById(
    "chapter-list"
  );

  container.innerHTML = "";

  chapters.forEach(chapter => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "chapter-item";

    if (chapter.id === selectedChapterId) {
      button.classList.add("active");
    }

    if (isChapterComplete(chapter)) {
      button.classList.add("completed");
    }

    const title = document.createElement("strong");
    title.textContent = chapter.title;

    const status = document.createElement("span");

    status.textContent = isChapterComplete(chapter)
      ? "✓ 已完成"
      : `${completedStages(chapter)} / 4 階段完成`;

    button.append(title, status);

    button.addEventListener("click", () => {
      selectedChapterId = chapter.id;
      renderChapterList();
      renderChapterDetail();
    });

    container.appendChild(button);
  });
}

// ===== 章節詳細資訊 =====

function renderChapterDetail() {
  const chapter = getSelectedChapter();

  document.getElementById("chapter-title").textContent =
    chapter.title;

  document.getElementById(
    "chapter-description"
  ).textContent = chapter.description;

  const status = document.getElementById(
    "chapter-status"
  );

  status.className = "status-badge";

  if (isChapterComplete(chapter)) {
    status.textContent = "已完成";
    status.classList.add("done");
  } else if (
    completedStages(chapter) > 0 ||
    partial[chapter.id].some(value => value > 0)
  ) {
    status.textContent = "進行中";
    status.classList.add("working");
  } else {
    status.textContent = "未開始";
  }

  document.getElementById(
    "chapter-total-duration"
  ).textContent = formatMinutes(
    chapterTotal(chapter)
  );

  document.getElementById(
    "chapter-remaining-duration"
  ).textContent = isChapterComplete(chapter)
    ? "四階段已全部完成"
    : `尚需約 ${formatMinutes(
        chapterRemaining(chapter)
      )}`;

  renderChapterVideos(chapter);
  renderChapterDurations(chapter);
  renderChapterStages(chapter);
}

// ===== 影片資訊 =====

function renderChapterVideos(chapter) {
  const container = document.getElementById(
    "chapter-video-info"
  );

  container.innerHTML = "";

  const related = videosForChapter(chapter.id);

  if (related.length === 0) {
    if (chapter.id !== "2026-10-24") {
      const note = document.createElement("p");
      note.className = "video-note";
      note.textContent =
        "尚無影片時長資料，暫以 60 分鐘估算。";
      container.appendChild(note);
    }

    return;
  }

  related.forEach(video => {
    const card = document.createElement("div");
    card.className = "video-card";

    const title = document.createElement("strong");
    title.textContent = video.title;

    const info = document.createElement("span");
    info.textContent =
      `原長 ${video.duration} · ` +
      `${video.speed}× 播放 · ` +
      `本章暫分配 ${formatMinutes(
        allocatedVideoMinutes(video, chapter.id)
      )}`;

    card.append(title, info);
    container.appendChild(card);
  });

  if (related.some(video => video.chapters.length > 1)) {
    const note = document.createElement("p");
    note.className = "video-note";
    note.textContent =
      "共用影片暫時平均分配時間，" +
      "不是老師實際的章節切點。";
    container.appendChild(note);
  }
}

// ===== 階段耗時 =====

function renderChapterDurations(chapter) {
  const container = document.getElementById(
    "chapter-duration-list"
  );

  container.innerHTML = "";

  const durations = getStageDurations(chapter);

  chapterStages.forEach((name, index) => {
    const row = document.createElement("div");
    row.className = "duration-row";

    const label = document.createElement("span");
    label.textContent = name;

    const duration = document.createElement("strong");
    duration.textContent = formatMinutes(
      durations[index]
    );

    row.append(label, duration);
    container.appendChild(row);
  });
}

// ===== 四階段進度 =====

function renderChapterStages(chapter) {
  const container = document.getElementById(
    "chapter-tasks"
  );

  container.innerHTML = "";

  const count = completedStages(chapter);

  document.getElementById("stage-count").textContent =
    `${count} / 4`;

  document.getElementById("stage-progress").style.width =
    `${count * 25}%`;

  const durations = getStageDurations(chapter);

  chapterStages.forEach((stage, index) => {
    const label = document.createElement("label");
    label.className = "chapter-task";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked =
      progress[chapter.id][index] === true;

    const name = document.createElement("span");
    name.textContent = stage;

    const detail = document.createElement("small");

    if (checkbox.checked) {
      detail.textContent = "已完成";
    } else {
      const studied = partial[chapter.id][index];

      detail.textContent = studied > 0
        ? `已讀 ${formatMinutes(studied)} / ` +
          `${formatMinutes(durations[index])}`
        : formatMinutes(durations[index]);
    }

    checkbox.addEventListener("change", () => {
      setStageCompleted(
        chapter,
        index,
        checkbox.checked
      );
    });

    label.append(checkbox, name, detail);
    container.appendChild(label);
  });
}

// ===== 模擬考進度 =====

function renderMockExams() {
  const first = document.getElementById("mock-1");
  const second = document.getElementById("mock-2");

  first.checked = mockProgress.first === true;
  second.checked = mockProgress.second === true;
}

document.getElementById("mock-1")
  .addEventListener("change", event => {
    mockProgress.first = event.target.checked;
    saveAll();
  });

document.getElementById("mock-2")
  .addEventListener("change", event => {
    mockProgress.second = event.target.checked;
    saveAll();
  });

// ===== 初始化 =====

function updateAll() {
  renderStats();
  renderTodayPlan();
  renderChapterList();
  renderChapterDetail();
  renderMockExams();
}

saveAll();
updateAll();
