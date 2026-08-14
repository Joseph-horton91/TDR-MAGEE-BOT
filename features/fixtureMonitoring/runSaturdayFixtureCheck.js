const {
  getFixturesNeedingReminder
} = require('./getFixturesNeedingReminder');

const {
  sendSaturdayFixtureReminder
} = require('./sendSaturdayFixtureReminder');

async function markSaturdayReminderSent(
  sheets,
  spreadsheetId,
  rowNumber
) {
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `BOT_FIXTURES!R${rowNumber}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[new Date().toISOString()]]
    }
  });
}

async function runSaturdayFixtureCheck(
  client,
  sheets,
  divisionConfig
) {
  let remindersSent = 0;
  let errors = 0;

  for (const division of Object.values(divisionConfig)) {
    try {
      const fixtures = await getFixturesNeedingReminder(
        sheets,
        division.sheetId,
        'saturday'
      );

      console.log(
        `[Fixture Monitoring] ${division.divisionName}: ` +
        `${fixtures.length} Saturday reminder(s) required.`
      );

      for (const fixture of fixtures) {
        try {
          await sendSaturdayFixtureReminder(
            client,
            fixture,
            division.divisionName
          );

          await markSaturdayReminderSent(
            sheets,
            division.sheetId,
            fixture.rowNumber
          );

          remindersSent += 1;

          console.log(
            `[Fixture Monitoring] Saturday reminder sent: ` +
            `${division.divisionName} | ${fixture.fixtureId}`
          );
        } catch (error) {
          errors += 1;

          console.error(
            `[Fixture Monitoring] Saturday reminder failed for ` +
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
  runSaturdayFixtureCheck
};
