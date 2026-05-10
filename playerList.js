const { getSheetValues, appendSheetValues, updateSheetValues } = require("./sheets");

const SHEET_ID = "1oEAHCMdi66bxEOOx9ULrhK_XGWSSxynEYm356bH1Slg";
const PLAYER_LIST_RANGE = "'Player List'!A:I";

async function generateNextPlayerId() {
  const rows = await getSheetValues(SHEET_ID, PLAYER_LIST_RANGE);

  const existingIds = rows
    .slice(1)
    .map((row) => row[1])
    .filter((id) => /^P\d+$/.test(id));

  const highestNumber = existingIds.reduce((highest, id) => {
    const number = parseInt(id.replace("P", ""), 10);
    return number > highest ? number : highest;
  }, 0);

  return `P${String(highestNumber + 1).padStart(3, "0")}`;
}

async function playerExistsInPlayerList(discordId) {
  const rows = await getSheetValues(SHEET_ID, PLAYER_LIST_RANGE);

  return rows
    .slice(1)
    .some((row) => row[2] === discordId);
}
async function updateExistingPlayerInPlayerList(user, data) {
  const rows = await getSheetValues(SHEET_ID, PLAYER_LIST_RANGE);

  const rowIndex = rows
    .slice(1)
    .findIndex((row) => row[2] === user.id);

  if (rowIndex === -1) {
    return {
      updated: false,
      reason: "Player not found",
    };
  }

  const sheetRowNumber = rowIndex + 2;

  await updateSheetValues(
    SHEET_ID,
    `'Player List'!D${sheetRowNumber}:I${sheetRowNumber}`,
    [[
      user.username,
      rows[sheetRowNumber - 1][4],
      data.dartCounterUsername,
      data.threeDartAverage,
      data.country,
      data.location,
    ]]
  );

  return {
    updated: true,
    reason: "Existing player updated",
    playerId: rows[sheetRowNumber - 1][1],
  };
}


async function appendApprovedPlayerToPlayerList(user, data) {
  const alreadyExists = await playerExistsInPlayerList(user.id);

if (alreadyExists) {
  return {
    added: false,
    reason: "Player already exists",
  };
}

  const playerId = await generateNextPlayerId();

  await appendSheetValues(SHEET_ID, PLAYER_LIST_RANGE, [[
    new Date().toISOString(),
    playerId,
    user.id,
    user.username,
    data.playerName,
    data.dartCounterUsername,
    data.threeDartAverage,
    data.country,
    data.location,
  ]]);

  console.log(`Added ${data.playerName} to Player List as ${playerId}`);

  return {
    added: true,
    playerId,
  };
}

module.exports = {
  generateNextPlayerId,
  appendApprovedPlayerToPlayerList,
  updateExistingPlayerInPlayerList,
};