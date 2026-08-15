function normalise(value) {
  return String(value || '').trim().toLowerCase();
}

function shouldIgnoreStatus(status) {
  const cleanStatus = normalise(status);

  return (
    cleanStatus === 'complete' ||
    cleanStatus === 'completed' ||
    cleanStatus === 'arranged'
  );
}

function getLatestFixtureWeek(fixtures) {
  const fixturesWithThreads = fixtures.filter(fixture => fixture.threadId);

  if (fixturesWithThreads.length === 0) {
    return null;
  }

  const numberedWeeks = fixturesWithThreads
    .map(fixture => {
      const match = String(fixture.week || '').match(/\d+/);

      return {
        week: fixture.week,
        weekNumber: match ? Number(match[0]) : null
      };
    })
    .filter(item => item.weekNumber !== null);

  if (numberedWeeks.length > 0) {
    const latestWeekNumber = Math.max(
      ...numberedWeeks.map(item => item.weekNumber)
    );

    const latestWeek = numberedWeeks.find(
      item => item.weekNumber === latestWeekNumber
    );

    return normalise(latestWeek.week);
  }

  return normalise(
    fixturesWithThreads[fixturesWithThreads.length - 1].week
  );
}

async function getFixturesNeedingReminder(
  sheets,
  spreadsheetId,
  reminderType = 'thursday'
) {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'BOT_FIXTURES!A:R'
  });

  const rows = response.data.values || [];

  if (rows.length <= 1) {
    return [];
  }

  const fixtures = rows
    .slice(1)
    .map((row, index) => ({
      rowNumber: index + 2,
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
      postedAt: row[14] || '',
      completedAt: row[15] || '',
      thursdayReminderSentAt: row[16] || '',
      saturdayReminderSentAt: row[17] || ''
    }));

  const latestFixtureWeek = getLatestFixtureWeek(fixtures);

  return fixtures.filter(fixture => {
    if (!fixture.fixtureId) return false;
    if (!fixture.threadId) return false;
    if (!fixture.homeDiscordId || !fixture.awayDiscordId) return false;

    if (
      latestFixtureWeek !== null &&
      normalise(fixture.week) !== latestFixtureWeek
    ) {
      return false;
    }

    if (shouldIgnoreStatus(fixture.status)) return false;

    if (
      reminderType === 'thursday' &&
      fixture.thursdayReminderSentAt
    ) {
      return false;
    }

    if (
      reminderType === 'saturday' &&
      fixture.saturdayReminderSentAt
    ) {
      return false;
    }

    return true;
  });
}

module.exports = {
  getFixturesNeedingReminder
};
