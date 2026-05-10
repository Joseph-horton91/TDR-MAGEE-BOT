const { getSheetValues } = require("./sheets");

const SHEET_ID = "1oEAHCMdi66bxEOOx9ULrhK_XGWSSxynEYm356bH1Slg";
const SHEET_RANGE = "'Player List'!A1:I150";

function isMissing(value) {
  return !value || value.trim() === "" || value === "#N/A" || value === "???";
}

async function runPlayerListAudit() {
  const rows = await getSheetValues(SHEET_ID, SHEET_RANGE);

  console.log("=== TDR PLAYER LIST AUDIT ===");
  console.log(`Rows found: ${rows.length}`);

  const players = rows.slice(1);
  const issues = [];

  players.forEach((row) => {
    const player = {
      timestamp: row[0],
      playerId: row[1],
      discordId: row[2],
      discordUsername: row[3],
      playerName: row[4],
      dartCounterUsername: row[5],
      threeDartAverage: row[6],
      country: row[7],
      location: row[8],
    };

    const missing = [];

    if (isMissing(player.playerId)) missing.push("Player ID");
    if (isMissing(player.discordId)) missing.push("Discord ID");
    if (isMissing(player.discordUsername)) missing.push("Discord Username");
    if (isMissing(player.playerName)) missing.push("TDR Player Name");
    if (isMissing(player.dartCounterUsername)) missing.push("DartCounter Username");
    if (isMissing(player.threeDartAverage)) missing.push("3 Dart Average");
    if (isMissing(player.country)) missing.push("Country");
    if (isMissing(player.location)) missing.push("Location");

    if (missing.length > 0) {
      issues.push({
        playerName: player.playerName || "Unknown Player",
        playerId: player.playerId || "No Player ID",
        discordUsername: player.discordUsername || "No Discord Username",
        missing,
      });
    }
  });

  console.log(`Players checked: ${players.length}`);
  console.log(`Players with missing data: ${issues.length}`);

  issues.forEach((issue, index) => {
    console.log(
      `${index + 1}. ${issue.playerName} | ${issue.playerId} | ${issue.discordUsername} | Missing: ${issue.missing.join(", ")}`
    );
  });
}

runPlayerListAudit().catch(console.error);