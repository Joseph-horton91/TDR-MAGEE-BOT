const {
  sendFixtureReminder
} = require('./sendFixtureReminder');

function normalise(value) {
  return String(value || '').trim().toLowerCase();
}

async function runSingleFixtureTest(
  client,
  sheets,
  divisionConfig,
  divisionName,
  fixtureId
) {
  console.log(
    `[Fixture Monitoring Test] Looking for ${divisionName} | ${fixtureId}`
  );

  const division = Object.values(divisionConfig).find(
    config => config.divisionName === divisionName
  );

  if (!division) {
    throw new Error(`Division not found: ${divisionName}`);
  }

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: division.sheetId,
    range: 'BOT_FIXTURES!A:Q'
  });

  const rows = response.data.values || [];

  const rowIndex = rows
    .slice(1)
    .findIndex(row =>
      String(row[0] || '').trim().toUpperCase() ===
      fixtureId.trim().toUpperCase()
    );

  if (rowIndex === -1) {
    throw new Error(
      `Fixture ${fixtureId} was not found in ${divisionName}.`
    );
  }

  const rowNumber = rowIndex + 2;
  const row = rows[rowNumber - 1];

  const fixture = {
    rowNumber,
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
    reminderSentAt: row[16] || ''
  };

  const status = normalise(fixture.status);

  console.log('[Fixture Monitoring Test] Fixture found:', {
    fixtureId: fixture.fixtureId,
    homePlayer: fixture.homePlayer,
    awayPlayer: fixture.awayPlayer,
    status: fixture.status,
    threadId: fixture.threadId,
    reminderSentAt: fixture.reminderSentAt
  });

  if (status === 'completed') {
    throw new Error(
      `Fixture ${fixtureId} is already marked Completed.`
    );
  }

  if (status === 'arranged') {
    throw new Error(
      `Fixture ${fixtureId} is already marked Arranged.`
    );
  }

  if (!fixture.threadId) {
    throw new Error(
      `Fixture ${fixtureId} does not have a Thread ID in Column N.`
    );
  }

  if (!fixture.homeDiscordId || !fixture.awayDiscordId) {
    throw new Error(
      `Fixture ${fixtureId} is missing a player Discord ID.`
    );
  }

  if (fixture.reminderSentAt) {
    throw new Error(
      `Fixture ${fixtureId} already has a reminder timestamp in Column Q.`
    );
  }

  await sendFixtureReminder(
    client,
    fixture,
    division.divisionName
  );

  await sheets.spreadsheets.values.update({
    spreadsheetId: division.sheetId,
    range: `BOT_FIXTURES!Q${rowNumber}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[new Date().toISOString()]]
    }
  });

  console.log(
    `[Fixture Monitoring Test] SUCCESS: Reminder sent for ` +
    `${divisionName} | ${fixtureId}`
  );
}

module.exports = {
  runSingleFixtureTest
};