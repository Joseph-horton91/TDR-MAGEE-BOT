const TDR_GUILD_ID = '1443050733200212012';

const OOM_TOP_10_ROLE_ID = '1521133387488821399';
const OOM_NUMBER_1_ROLE_ID = '1521133297546297437';
const OOM_NUMBER_2_ROLE_ID = '1521852465425809448';
const OOM_NUMBER_3_ROLE_ID = '1521852565531267182';

const ONE_DAY = 24 * 60 * 60 * 1000;

async function syncOOMRoles(client, sheets, OOM_SPREADSHEET_ID, OOM_RANGE) {
  try {
    console.log('🔄 Starting OOM Role Sync...');

    const guild = await client.guilds.fetch(TDR_GUILD_ID).catch(() => null);

    if (!guild) {
      console.log('❌ OOM Role Sync failed: Could not find TDR Discord server.');
      return;
    }

    await guild.roles.fetch();

    const top10Role = await guild.roles.fetch(OOM_TOP_10_ROLE_ID).catch(() => null);
    const number1Role = await guild.roles.fetch(OOM_NUMBER_1_ROLE_ID).catch(() => null);
    const number2Role = await guild.roles.fetch(OOM_NUMBER_2_ROLE_ID).catch(() => null);
    const number3Role = await guild.roles.fetch(OOM_NUMBER_3_ROLE_ID).catch(() => null);

    if (!top10Role || !number1Role || !number2Role || !number3Role) {
      console.log('❌ OOM Role Sync failed: Could not find one or more OOM role IDs.');
      return;
    }

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: OOM_SPREADSHEET_ID,
      range: OOM_RANGE,
    });

    const rows = response.data.values || [];
    const headers = rows[0];
    const data = rows.slice(1);

    const rankCol = headers.indexOf('Rank');
    const playerCol = headers.indexOf('Player');
    const discordCol = headers.indexOf('Discord ID');

    if ([rankCol, playerCol, discordCol].includes(-1)) {
      throw new Error('OOM sheet headers missing. Check Rank, Player, Discord ID.');
    }

    const top10Ids = new Set();

    let number1Id = null;
    let number2Id = null;
    let number3Id = null;

    let number1Name = '';
    let number2Name = '';
    let number3Name = '';

    data.forEach(row => {
      const rank = Number(row[rankCol]);
      const playerName = row[playerCol];
      const discordId = String(row[discordCol] || '').trim();

      if (!discordId || Number.isNaN(rank)) return;

      if (rank >= 1 && rank <= 10) {
        top10Ids.add(discordId);
      }

      if (rank === 1) {
        number1Id = discordId;
        number1Name = playerName;
      }

      if (rank === 2) {
        number2Id = discordId;
        number2Name = playerName;
      }

      if (rank === 3) {
        number3Id = discordId;
        number3Name = playerName;
      }
    });

    for (const discordId of top10Ids) {
      const member = await guild.members.fetch(discordId).catch(() => null);

      if (!member) {
        console.log(`⚠️ Could not find Discord member for Top 10 ID: ${discordId}`);
        continue;
      }

      if (!member.roles.cache.has(OOM_TOP_10_ROLE_ID)) {
        await member.roles.add(top10Role);
        console.log(`⭐ Added OOM Top 10 to ${member.user.tag}`);
      }
    }

    if (number1Id) {
      const member = await guild.members.fetch(number1Id).catch(() => null);

      if (member && !member.roles.cache.has(OOM_NUMBER_1_ROLE_ID)) {
        await member.roles.add(number1Role);
        console.log(`🥇 Added OOM #1 to ${member.user.tag}`);
      }
    }

    if (number2Id) {
      const member = await guild.members.fetch(number2Id).catch(() => null);

      if (member && !member.roles.cache.has(OOM_NUMBER_2_ROLE_ID)) {
        await member.roles.add(number2Role);
        console.log(`🥈 Added OOM #2 to ${member.user.tag}`);
      }
    }

    if (number3Id) {
      const member = await guild.members.fetch(number3Id).catch(() => null);

      if (member && !member.roles.cache.has(OOM_NUMBER_3_ROLE_ID)) {
        await member.roles.add(number3Role);
        console.log(`🥉 Added OOM #3 to ${member.user.tag}`);
      }
    }

    for (const member of top10Role.members.values()) {
      if (!top10Ids.has(member.id)) {
        await member.roles.remove(top10Role);
        console.log(`➖ Removed OOM Top 10 from ${member.user.tag}`);
      }
    }

    for (const member of number1Role.members.values()) {
      if (member.id !== number1Id) {
        await member.roles.remove(number1Role);
        console.log(`➖ Removed OOM #1 from ${member.user.tag}`);
      }
    }

    for (const member of number2Role.members.values()) {
      if (member.id !== number2Id) {
        await member.roles.remove(number2Role);
        console.log(`➖ Removed OOM #2 from ${member.user.tag}`);
      }
    }

    for (const member of number3Role.members.values()) {
      if (member.id !== number3Id) {
        await member.roles.remove(number3Role);
        console.log(`➖ Removed OOM #3 from ${member.user.tag}`);
      }
    }

    console.log(
      `✅ OOM Role Sync complete. Top 10: ${top10Ids.size}. ` +
      `#1: ${number1Name || 'Not found'}, ` +
      `#2: ${number2Name || 'Not found'}, ` +
      `#3: ${number3Name || 'Not found'}`
    );

  } catch (error) {
    console.error('❌ OOM Role Sync Error:', error);
  }
}

function startOOMRoleSyncTimer(client, sheets, OOM_SPREADSHEET_ID, OOM_RANGE) {
  console.log('⏱️ OOM Role Sync timer started. Running every 24 hours.');

  setInterval(async () => {
    await syncOOMRoles(client, sheets, OOM_SPREADSHEET_ID, OOM_RANGE);
  }, ONE_DAY);
}

module.exports = {
  syncOOMRoles,
  startOOMRoleSyncTimer
};