const {
  runThursdayFixtureCheck
} = require('./runThursdayFixtureCheck');

const {
  runSaturdayFixtureCheck
} = require('./runSaturdayFixtureCheck');

const CHECK_INTERVAL_MS = 15 * 60 * 1000;

const THURSDAY = 4;
const SATURDAY = 6;

const THURSDAY_RUN_HOUR_PERTH = 9;
const SATURDAY_RUN_HOUR_PERTH = 6;

function getPerthDateParts() {
  const parts = new Intl.DateTimeFormat('en-AU', {
    timeZone: 'Australia/Perth',
    weekday: 'short',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(new Date());

  const values = Object.fromEntries(
    parts
      .filter(part => part.type !== 'literal')
      .map(part => [part.type, part.value])
  );

  const weekdayMap = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6
  };

  return {
    weekday: weekdayMap[values.weekday],
    year: values.year,
    month: values.month,
    day: values.day,
    hour: Number(values.hour)
  };
}

function startFixtureMonitoring(client, sheets, divisionConfig) {
  let lastThursdayRunDate = null;
  let lastSaturdayRunDate = null;
  let checkRunning = false;

  async function checkSchedule() {
    if (checkRunning) return;

    const perth = getPerthDateParts();
    const perthDate = `${perth.year}-${perth.month}-${perth.day}`;

    const shouldRunThursday =
      perth.weekday === THURSDAY &&
      perth.hour >= THURSDAY_RUN_HOUR_PERTH &&
      lastThursdayRunDate !== perthDate;

    const shouldRunSaturday =
      perth.weekday === SATURDAY &&
      perth.hour >= SATURDAY_RUN_HOUR_PERTH &&
      lastSaturdayRunDate !== perthDate;

    if (!shouldRunThursday && !shouldRunSaturday) {
      return;
    }

    checkRunning = true;

    try {
      if (shouldRunThursday) {
        console.log(
          `[Fixture Monitoring] Thursday scan starting for ${perthDate}.`
        );

        const result = await runThursdayFixtureCheck(
          client,
          sheets,
          divisionConfig
        );

        lastThursdayRunDate = perthDate;

        console.log(
          `[Fixture Monitoring] Thursday scan complete. ` +
          `${result.remindersSent} reminder(s) sent and ` +
          `${result.errors} error(s).`
        );
      }

      if (shouldRunSaturday) {
        console.log(
          `[Fixture Monitoring] Saturday scan starting for ${perthDate}.`
        );

        const result = await runSaturdayFixtureCheck(
          client,
          sheets,
          divisionConfig
        );

        lastSaturdayRunDate = perthDate;

        console.log(
          `[Fixture Monitoring] Saturday scan complete. ` +
          `${result.remindersSent} reminder(s) sent and ` +
          `${result.errors} error(s).`
        );
      }
    } catch (error) {
      console.error('[Fixture Monitoring] Scheduled scan failed:', error);
    } finally {
      checkRunning = false;
    }
  }

  console.log(
    '[Fixture Monitoring] Scheduler started. ' +
    'Thursday reminders run after 9:00 AM Perth time and ' +
    'Saturday final reminders run after 6:00 AM Perth time.'
  );

  checkSchedule().catch(error => {
    console.error('[Fixture Monitoring] Startup check failed:', error);
  });

  setInterval(() => {
    checkSchedule().catch(error => {
      console.error('[Fixture Monitoring] Scheduled check failed:', error);
    });
  }, CHECK_INTERVAL_MS);
}

module.exports = {
  startFixtureMonitoring
};
