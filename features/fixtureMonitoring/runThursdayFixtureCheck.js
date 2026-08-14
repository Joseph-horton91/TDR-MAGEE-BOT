const {
  getFixturesNeedingReminder
} = require('./getFixturesNeedingReminder');

const {
  sendFixtureReminder
} = require('./sendFixtureReminder');

async function markReminderSent(sheets, spreadsheetId, rowNumber) {
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `BOT_FIXTURES!Q${rowNumber}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[new Date().toISOString()]]
    }
  });
}

async function runThursdayFixtureCheck(client, sheets, divisionConfig) {
  let remindersSent = 0;
  let errors = 0;

  for (const division of Object.values(divisionConfig)) {
    try {
      const fixtures = await getFixturesNeedingReminder(
        sheets,
        division.sheetId
      );

      console.log(
        `[Fixture Monitoring] ${division.divisionName}: ` +
        `${fixtures.length} reminder(s) required.`
      );

      for (const fixture of fixtures) {
        try {
          await sendFixtureReminder(
            client,
            fixture,
            division.divisionName
          );

          await markReminderSent(
            sheets,
            division.sheetId,
            fixture.rowNumber
          );

          remindersSent += 1;

          console.log(
            `[Fixture Monitoring] Reminder sent: ` +
            `${division.divisionName} | ${fixture.fixtureId}`
          );
        } catch (error) {
          errors += 1;

          console.error(
            `[Fixture Monitoring] Reminder failed for ` +
            `${division.divisionName} | ${fixture.fixtureId}:`,
            error
          );
        }
      }
    } catch (error) {
      errors += 1;

      console.error(
        `[Fixture Monitoring] Could not scan ` +
        `${division.divisionName}:`,
        error
      );
    }
  }

  return {
    remindersSent,
    errors
  };
}

module.exports = {
  runThursdayFixtureCheck
};
