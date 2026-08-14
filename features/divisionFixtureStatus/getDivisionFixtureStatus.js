const OVERDUE_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const NEAR_OVERDUE_MIN_MS = 5 * 24 * 60 * 60 * 1000;
const RECENT_RESULTS_LIMIT = 20;

function normalise(value) {
  return String(value || '').trim().toLowerCase();
}

function parseSheetDate(value) {
  if (!value) return null;

  const text = String(value).trim();

  if (/^\d{4}-\d{2}-\d{2}T/.test(text)) {
    const isoDate = new Date(text);
    return Number.isNaN(isoDate.getTime()) ? null : isoDate;
  }

  const australianMatch = text.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[,\s]+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/
  );

  if (australianMatch) {
    const day = Number(australianMatch[1]);
    const month = Number(australianMatch[2]) - 1;
    const year = Number(australianMatch[3]);
    const hour = Number(australianMatch[4] || 0);
    const minute = Number(australianMatch[5] || 0);
    const second = Number(australianMatch[6] || 0);

    return new Date(Date.UTC(year, month, day, hour - 8, minute, second));
  }

  const fallbackDate = new Date(text);
  return Number.isNaN(fallbackDate.getTime()) ? null : fallbackDate;
}

function getWeekNumber(value) {
  const match = String(value || '').match(/\d+/);
  return match ? Number(match[0]) : null;
}

function getMatchNumber(value) {
  const match = String(value || '').match(/\d+/);
  return match ? Number(match[0]) : Number.MAX_SAFE_INTEGER;
}

function classifyStatus(status) {
  const cleanStatus = normalise(status).replace(/[\s-]+/g, '_');

  if (['complete', 'completed', 'resulted', 'finished'].includes(cleanStatus)) {
    return 'completed';
  }

  if (['arranged', 'organised', 'organized', 'scheduled'].includes(cleanStatus)) {
    return 'arranged';
  }

  if (['posted', 'open', 'released'].includes(cleanStatus)) {
    return 'posted';
  }

  if (
    [
      'pending_confirmation',
      'pending',
      'awaiting_confirmation',
      'awaiting_result_confirmation'
    ].includes(cleanStatus)
  ) {
    return 'pendingConfirmation';
  }

  if (!cleanStatus || ['not_posted', 'unposted', 'no_status'].includes(cleanStatus)) {
    return 'noStatus';
  }

  return 'other';
}

function shouldIgnoreFixture(fixture) {
  const combined = [
    fixture.fixtureId,
    fixture.week,
    fixture.match,
    fixture.homePlayer,
    fixture.awayPlayer,
    fixture.resultType,
    fixture.status
  ]
    .map(normalise)
    .join(' ');

  return /\bbye\b/.test(combined) || /\bconsolation\b/.test(combined);
}

function getAgeDays(date, now) {
  if (!date) return null;
  return Math.max(0, Math.floor((now.getTime() - date.getTime()) / 86400000));
}

function mapFixture(row, rowNumber, divisionName, now) {
  const fixture = {
    rowNumber,
    divisionName,
    fixtureId: row[0] || '',
    week: row[1] || '',
    match: row[2] || '',
    homePlayer: row[3] || '',
    homeDiscordId: String(row[4] || '').trim(),
    awayPlayer: row[5] || '',
    awayDiscordId: String(row[6] || '').trim(),
    homeLegs: row[7] || '',
    awayLegs: row[8] || '',
    resultType: row[9] || '',
    winner: row[10] || '',
    status: row[11] || '',
    messageId: String(row[12] || '').trim(),
    threadId: String(row[13] || '').trim(),
    postedAtRaw: row[14] || '',
    completedAtRaw: row[15] || '',
    reminderSentAt: row[16] || '',
    postedAt: parseSheetDate(row[14]),
    completedAt: parseSheetDate(row[15])
  };

  fixture.statusGroup = classifyStatus(fixture.status);
  fixture.weekNumber = getWeekNumber(fixture.week);
  fixture.matchNumber = getMatchNumber(fixture.match || fixture.fixtureId);
  fixture.ageDays = getAgeDays(fixture.postedAt, now);
  fixture.isOverdue =
    fixture.statusGroup !== 'completed' &&
    fixture.postedAt &&
    now.getTime() - fixture.postedAt.getTime() >= OVERDUE_AGE_MS;
  fixture.isNearOverdue =
    fixture.statusGroup !== 'completed' &&
    fixture.postedAt &&
    now.getTime() - fixture.postedAt.getTime() >= NEAR_OVERDUE_MIN_MS &&
    now.getTime() - fixture.postedAt.getTime() < OVERDUE_AGE_MS;

  return fixture;
}

async function readDivisionFixtures(sheets, spreadsheetId, divisionName, now) {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'BOT_FIXTURES!A:Q'
  });

  const rows = response.data.values || [];

  return rows
    .slice(1)
    .map((row, index) => mapFixture(row, index + 2, divisionName, now))
    .filter(fixture => fixture.fixtureId)
    .filter(fixture => !shouldIgnoreFixture(fixture));
}

function compareFixtures(a, b) {
  const weekA = a.weekNumber ?? Number.MAX_SAFE_INTEGER;
  const weekB = b.weekNumber ?? Number.MAX_SAFE_INTEGER;

  if (weekA !== weekB) return weekA - weekB;

  const divisionCompare = a.divisionName.localeCompare(b.divisionName);
  if (divisionCompare !== 0) return divisionCompare;

  if (a.matchNumber !== b.matchNumber) return a.matchNumber - b.matchNumber;

  return String(a.fixtureId).localeCompare(String(b.fixtureId));
}

function sortFixtures(fixtures) {
  fixtures.sort(compareFixtures);
  return fixtures;
}

function createProgressSummary(key, label) {
  return {
    key,
    label,
    total: 0,
    completed: 0,
    arranged: 0,
    posted: 0,
    pendingConfirmation: 0,
    noStatus: 0,
    other: 0,
    active: 0,
    overdue: 0,
    percentage: 0
  };
}

function finaliseProgress(summary) {
  summary.active = summary.total - summary.completed;
  summary.percentage = summary.total === 0
    ? 0
    : Math.round((summary.completed / summary.total) * 100);
  return summary;
}

function buildWeekProgress(fixtures) {
  const weeks = new Map();

  for (const fixture of fixtures) {
    const key = fixture.weekNumber !== null
      ? fixture.weekNumber
      : String(fixture.week || 'Unknown').trim() || 'Unknown';

    const label = fixture.weekNumber !== null
      ? `Week ${fixture.weekNumber}`
      : String(fixture.week || 'Unknown Week');

    if (!weeks.has(key)) {
      weeks.set(key, createProgressSummary(key, label));
    }

    const summary = weeks.get(key);
    summary.total += 1;
    summary[fixture.statusGroup] += 1;
    if (fixture.isOverdue) summary.overdue += 1;
  }

  return [...weeks.values()]
    .map(finaliseProgress)
    .sort((a, b) => {
      const aNumber = typeof a.key === 'number' ? a.key : Number.MAX_SAFE_INTEGER;
      const bNumber = typeof b.key === 'number' ? b.key : Number.MAX_SAFE_INTEGER;
      if (aNumber !== bNumber) return aNumber - bNumber;
      return String(a.label).localeCompare(String(b.label));
    });
}

function buildDivisionProgress(fixtures, divisionNames) {
  const divisions = new Map();

  for (const divisionName of divisionNames) {
    divisions.set(
      divisionName,
      createProgressSummary(divisionName, divisionName)
    );
  }

  for (const fixture of fixtures) {
    if (!divisions.has(fixture.divisionName)) {
      divisions.set(
        fixture.divisionName,
        createProgressSummary(fixture.divisionName, fixture.divisionName)
      );
    }

    const summary = divisions.get(fixture.divisionName);
    summary.total += 1;
    summary[fixture.statusGroup] += 1;
    if (fixture.isOverdue) summary.overdue += 1;
  }

  return [...divisions.values()]
    .map(finaliseProgress)
    .sort((a, b) => {
      if (b.percentage !== a.percentage) return b.percentage - a.percentage;
      return a.label.localeCompare(b.label);
    });
}

function calculateAverageActiveAge(activeFixtures) {
  const dated = activeFixtures.filter(fixture => fixture.ageDays !== null);
  if (dated.length === 0) return null;

  const totalDays = dated.reduce((sum, fixture) => sum + fixture.ageDays, 0);
  return Math.round((totalDays / dated.length) * 10) / 10;
}

function calculateHealthScore(completionPercentage, activeCount, overdueCount, noStatusCount) {
  let score = completionPercentage;

  if (activeCount > 0) {
    score -= Math.round((overdueCount / activeCount) * 25);
    score -= Math.round((noStatusCount / activeCount) * 15);
  }

  score = Math.max(0, Math.min(100, score));

  let label = 'Needs Attention';
  let icon = '🔴';

  if (score >= 90) {
    label = 'Excellent';
    icon = '🟢';
  } else if (score >= 75) {
    label = 'Good';
    icon = '🟡';
  } else if (score >= 55) {
    label = 'Watch Closely';
    icon = '🟠';
  }

  return { score, label, icon };
}

async function getDivisionFixtureStatus(sheets, divisionConfig, now = new Date()) {
  const allFixtures = [];
  const errors = [];
  let divisionsScanned = 0;

  const configuredDivisions = Object.values(divisionConfig);

  for (const division of configuredDivisions) {
    try {
      const fixtures = await readDivisionFixtures(
        sheets,
        division.sheetId,
        division.divisionName,
        now
      );

      divisionsScanned += 1;
      allFixtures.push(...fixtures);
    } catch (error) {
      console.error(
        `[Division Fixture Status] Could not read ${division.divisionName}:`,
        error
      );

      errors.push({
        divisionName: division.divisionName,
        message: error.message
      });
    }
  }

  const groups = {
    completed: [],
    arranged: [],
    posted: [],
    pendingConfirmation: [],
    noStatus: [],
    other: []
  };

  for (const fixture of allFixtures) {
    groups[fixture.statusGroup].push(fixture);
  }

  for (const fixtures of Object.values(groups)) {
    sortFixtures(fixtures);
  }

  const active = sortFixtures([
    ...groups.noStatus,
    ...groups.posted,
    ...groups.pendingConfirmation,
    ...groups.arranged,
    ...groups.other
  ]);

  const overdue = active
    .filter(fixture => fixture.isOverdue)
    .sort((a, b) => {
      const aTime = a.postedAt ? a.postedAt.getTime() : Number.MAX_SAFE_INTEGER;
      const bTime = b.postedAt ? b.postedAt.getTime() : Number.MAX_SAFE_INTEGER;
      if (aTime !== bTime) return aTime - bTime;
      return compareFixtures(a, b);
    });

  const nearOverdue = active
    .filter(fixture => fixture.isNearOverdue)
    .sort((a, b) => {
      const aTime = a.postedAt ? a.postedAt.getTime() : Number.MAX_SAFE_INTEGER;
      const bTime = b.postedAt ? b.postedAt.getTime() : Number.MAX_SAFE_INTEGER;
      if (aTime !== bTime) return aTime - bTime;
      return compareFixtures(a, b);
    });

  const recentResults = [...groups.completed]
    .filter(fixture => fixture.completedAt)
    .sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime())
    .slice(0, RECENT_RESULTS_LIMIT);

  const fixturesScanned = allFixtures.length;
  const completionPercentage = fixturesScanned === 0
    ? 0
    : Math.round((groups.completed.length / fixturesScanned) * 100);

  const weekProgress = buildWeekProgress(allFixtures);
  const divisionProgress = buildDivisionProgress(
    allFixtures,
    configuredDivisions.map(division => division.divisionName)
  );

  const divisionsWithFixtures = divisionProgress.filter(division => division.total > 0);
  const fastestDivision = divisionsWithFixtures.length > 0
    ? divisionsWithFixtures[0]
    : null;
  const slowestDivision = divisionsWithFixtures.length > 0
    ? [...divisionsWithFixtures].sort((a, b) => {
      if (a.percentage !== b.percentage) return a.percentage - b.percentage;
      return a.label.localeCompare(b.label);
    })[0]
    : null;

  const oldestActiveFixture = active
    .filter(fixture => fixture.postedAt)
    .sort((a, b) => a.postedAt.getTime() - b.postedAt.getTime())[0] || null;

  const latestCompletedFixture = recentResults[0] || null;
  const averageActiveAgeDays = calculateAverageActiveAge(active);
  const health = calculateHealthScore(
    completionPercentage,
    active.length,
    overdue.length,
    groups.noStatus.length
  );

  return {
    generatedAt: now,
    divisionsConfigured: configuredDivisions.length,
    divisionsScanned,
    fixturesScanned,
    completionPercentage,
    fixturesRemaining: active.length,
    averageActiveAgeDays,
    health,
    fastestDivision,
    slowestDivision,
    oldestActiveFixture,
    latestCompletedFixture,
    ...groups,
    active,
    overdue,
    nearOverdue,
    recentResults,
    weekProgress,
    divisionProgress,
    errors
  };
}

module.exports = {
  getDivisionFixtureStatus
};
