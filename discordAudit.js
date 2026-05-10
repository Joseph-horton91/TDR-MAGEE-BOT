const { getSheetValues } = require("./sheets");

const SEND_DMS = true;

const SHEET_ID = "1oEAHCMdi66bxEOOx9ULrhK_XGWSSxynEYm356bH1Slg";
const SHEET_RANGE = "'Player List'!A1:I150";
const GUILD_ID = "1443050733200212012";
const REVIEW_CHANNEL_ID = "1501604626464641086";

function isMissing(value) {
  return !value || value.trim() === "" || value === "#N/A" || value === "???";
}

function buildMissingInfoMessage(playerName, issues) {
  return `🎯 **TDR Player Info Update Required**

G’day ${playerName || "mate"},

Magee here — I’m cleaning up TDR onboarding and player data.

We’re missing the following information from your player record:

${issues.map((issue) => `• ${issue}`).join("\n")}

Please reply to a TDR Admin with the missing details so we can keep the game sheets, Player Dashboard and OOM data accurate.

Thanks,
Magee 🥂🎯`;
}

async function runAudit(client) {
  console.log(`Running TDR audit as ${client.user.tag}`);

  try {
    const rows = await getSheetValues(SHEET_ID, SHEET_RANGE);
    const players = rows.slice(1);

    const guild = await client.guilds.fetch(GUILD_ID);
    const members = await guild.members.fetch();
    const reviewChannel = await client.channels.fetch(REVIEW_CHANNEL_ID);

    console.log("\n==============================");
    console.log("      TDR AUDIT REPORT");
    console.log("==============================\n");

    console.log(`Discord Members Found: ${members.size}`);
    console.log(`Player List Records: ${players.length}\n`);

    const missingFromSheet = [];

    members.forEach((member) => {
      if (member.user.bot) return;

      const existsInSheet = players.some((row) => row[2] === member.id);

      if (!existsInSheet) {
        missingFromSheet.push({
          discordName: member.user.username,
          discordId: member.id,
        });
      }
    });

    console.log("=== MEMBERS NOT FOUND IN PLAYER LIST ===\n");

    if (missingFromSheet.length === 0) {
      console.log("No missing Discord members found.\n");
    } else {
      missingFromSheet.forEach((player, index) => {
        console.log(`${index + 1}. ${player.discordName} | ${player.discordId}`);
      });

      console.log(`\nTotal Missing Players: ${missingFromSheet.length}\n`);
    }

    const missingData = [];

    players.forEach((row) => {
      const player = {
        playerId: row[1],
        discordId: row[2],
        discordUsername: row[3],
        playerName: row[4],
        dartCounterUsername: row[5],
        threeDartAverage: row[6],
        country: row[7],
        location: row[8],
      };

      const issues = [];

      if (isMissing(player.playerId)) issues.push("Player ID");
      if (isMissing(player.discordId)) issues.push("Discord ID");
      if (isMissing(player.discordUsername)) issues.push("Discord Username");
      if (isMissing(player.playerName)) issues.push("Player Name");
      if (isMissing(player.dartCounterUsername)) issues.push("DartCounter Username");
      if (isMissing(player.threeDartAverage)) issues.push("3 Dart Average");
      if (isMissing(player.country)) issues.push("Country");
      if (isMissing(player.location)) issues.push("Location");

      if (issues.length > 0) {
        missingData.push({
          playerName: player.playerName || "Unknown Player",
          discordUsername: player.discordUsername || "Unknown Discord",
          discordId: player.discordId,
          issues,
        });
      }
    });

    console.log("=== PLAYERS WITH MISSING DATA ===\n");

    if (missingData.length === 0) {
      console.log("No missing player data found.\n");
    } else {
      for (const [index, player] of missingData.entries()) {
        console.log(`${index + 1}. ${player.playerName} | ${player.discordUsername}`);
        console.log(`   Missing: ${player.issues.join(", ")}`);

        const message = buildMissingInfoMessage(player.playerName, player.issues);

        if (SEND_DMS) {
          const member = members.get(player.discordId);

          if (member) {
            await member.send(message).catch(() => {
              console.log(`   ❌ Could not DM ${player.discordUsername}`);
            });

            console.log(`   ✅ DM sent to ${player.discordUsername}`);
          } else {
            console.log("   ⚠️ Member not found in Discord");
          }
        } else {
          console.log(`   🧪 DRY RUN: Would DM ${player.discordUsername}`);
        }
      }

      console.log(`\nTotal Players With Issues: ${missingData.length}\n`);
    }

    const auditSummary = `
📋 **TDR AUDIT REPORT**

👥 Discord Members: ${members.size}
📄 Player Records: ${players.length}

❌ Missing From Player List: ${missingFromSheet.length}
⚠️ Players With Missing Data: ${missingData.length}

🧪 SEND_DMS Mode: ${SEND_DMS ? "LIVE" : "DRY RUN"}

Magee Audit Complete 🎯
`;

    await reviewChannel.send(auditSummary);

    console.log("==============================");
    console.log("      AUDIT COMPLETE");
    console.log("==============================\n");
  } catch (error) {
    console.error(error);
  }
}

module.exports = { runAudit };