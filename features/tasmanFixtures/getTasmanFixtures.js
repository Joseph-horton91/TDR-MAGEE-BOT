function hasScore(value) {
  return (
    value !== undefined &&
    value !== null &&
    String(value).trim() !== ''
  );
}

function toNumber(value) {
  const number = Number(value);
  return Number.isNaN(number) ? 0 : number;
}

function findDivisionRoleId(member, divisionConfig) {
  return Object.keys(divisionConfig).find(roleId =>
    member.roles.cache.has(roleId)
  );
}

async function getTasmanFixtures({
  sheets,
  discordUserId,
  member,
  divisionConfig
}) {
  const divisionRoleId = findDivisionRoleId(
    member,
    divisionConfig
  );

  if (!divisionRoleId) {
    throw new Error('NO_DIVISION_ROLE');
  }

  const division = divisionConfig[divisionRoleId];

  if (!division || !division.sheetId) {
    throw new Error('DIVISION_SHEET_NOT_CONFIGURED');
  }

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: division.sheetId,
    range: 'BOT_FIXTURES!A:N'
  });

  const rows = response.data.values || [];

  if (rows.length < 2) {
    throw new Error('NO_FIXTURES_FOUND');
  }

  const fixtureRows = rows.slice(1);

  const playerDiscordId = String(discordUserId).trim();

  let playerName = null;

  const fixtures = fixtureRows
    .filter(row => {
      const homeDiscordId = String(row[4] || '').trim();
      const awayDiscordId = String(row[6] || '').trim();

      return (
        homeDiscordId === playerDiscordId ||
        awayDiscordId === playerDiscordId
      );
    })
    .map(row => {

      const fixtureId = String(row[0] || '').trim();

      const week = toNumber(row[1]);

      const homePlayer = String(row[3] || '').trim();
      const homeDiscordId = String(row[4] || '').trim();

      const awayPlayer = String(row[5] || '').trim();
      const awayDiscordId = String(row[6] || '').trim();

      const homeLegsValue = row[7];
      const awayLegsValue = row[8];

      const resultType = String(row[9] || '').trim();
      const winner = String(row[10] || '').trim();
      const status = String(row[11] || '').trim();
      const threadId = String(row[13] || '').trim();

      const isHome = homeDiscordId === playerDiscordId;

      const completed =
        hasScore(homeLegsValue) &&
        hasScore(awayLegsValue);

      const currentPlayerName = isHome
        ? homePlayer
        : awayPlayer;

      if (!playerName && currentPlayerName) {
        playerName = currentPlayerName;
      }

      const opponent = isHome
        ? awayPlayer
        : homePlayer;

      const playerLegs = completed
        ? toNumber(
            isHome
              ? homeLegsValue
              : awayLegsValue
          )
        : null;

      const opponentLegs = completed
        ? toNumber(
            isHome
              ? awayLegsValue
              : homeLegsValue
          )
        : null;

      let outcome = null;

      if (completed) {
        if (playerLegs > opponentLegs) {
          outcome = 'WIN';
        } else if (playerLegs < opponentLegs) {
          outcome = 'LOSS';
        } else {
          outcome = 'DRAW';
        }
      }

      return {
        fixtureId,
        week,
        playerName: currentPlayerName,
        opponent,
        homeAway: isHome ? 'HOME' : 'AWAY',
        playerLegs,
        opponentLegs,
        completed,
        outcome,
        resultType,
        winner,
        status,
        threadId
      };
    })
    .sort((a, b) => a.week - b.week);

  if (fixtures.length === 0) {
    throw new Error('NO_FIXTURES_FOUND');
  }

  return {
    playerName:
      playerName ||
      member.displayName ||
      member.user.username,

    season:
      division.seasonName || 'Tasman Series',

    divisionName:
      division.divisionName || 'Tasman Series',

    completed: fixtures.filter(f => f.completed),

    upcoming: fixtures.filter(f => !f.completed)
  };
}

module.exports = {
  getTasmanFixtures
};