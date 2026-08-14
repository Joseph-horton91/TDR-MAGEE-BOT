const TDR_GUILD_ID = '1443050733200212012';

const ACHIEVEMENT_SYNC_ENABLED = true; // KEEP FALSE UNTIL GO LIVE

const ACHIEVEMENT_ROLE_IDS = {
  nineDarter: '1521862295326556160',
  bigFishHunter: '1521862437131915444',

  oneEightyClub: '1521864816224899283',
  oneEighty5: '1521877734970884176',
  oneEighty10: '1521877835868803302',
  oneEighty25: '1521877896732344472',
  oneEighty50: '1521877971739345017',

  average50: '1521862555407089705',
  average60: '1521862663603359834',
  average70: '1521862743747985539',

  hotStreak: '1521863492091772978',

  games50: '1521863265666334771',
  games100: '1521862834810519613',
  games250: '1521862917140516924',
  games500: '1521863092995100754'
};

const ONE_DAY = 24 * 60 * 60 * 1000;

function toNumber(value) {
  const num = Number(value);
  return Number.isNaN(num) ? 0 : num;
}

function getProgressiveRole(value, tiers) {
  for (const tier of tiers) {
    if (value >= tier.min) return tier.key;
  }

  return null;
}

async function syncAchievementRoles(client, sheets, SPREADSHEET_ID, PLAYER_DATA_RANGE) {
  try {
    console.log('🔄 Starting Achievement Role Scan...');
    console.log(`Safe mode: ${ACHIEVEMENT_SYNC_ENABLED ? 'LIVE - roles will update' : 'DRY RUN - no roles will change'}`);

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: PLAYER_DATA_RANGE,
    });

    const rows = response.data.values || [];
    const headers = rows[0];
    const data = rows.slice(1);

    const col = name => headers.indexOf(name);

    const discordCol = col('Player Discord ID');
    const playerCol = col('Official Player Name');
    const threeDaCol = col('3DA');
    const bestCoCol = col('Best CO');
    const bestLegCol = col('Best Leg');
    const oneEightyCol = col('180');
    const matchSeqCol = col('Match Seq');
    const last5Col = col('Last 5 Flag');
    const resultCol = col('Result');

    if ([discordCol, playerCol, threeDaCol, bestCoCol, bestLegCol, oneEightyCol, matchSeqCol, last5Col, resultCol].includes(-1)) {
      throw new Error('Player Data headers missing.');
    }

    const players = new Map();

    for (const row of data) {
      const discordId = String(row[discordCol] || '').trim();
      if (!discordId) continue;

      if (!players.has(discordId)) {
        players.set(discordId, {
          discordId,
          name: row[playerCol] || 'Unknown Player',
          matches: 0,
          bestCheckout: 0,
          hasBigFish: false,
          bestLeg: 999,
          total180s: 0,
          highestMatchSeq: 0,
          total3DA: 0,
          counted3DA: 0,
          last5Count: 0,
          last5Wins: 0
        });
      }

      const player = players.get(discordId);

      const threeDA = toNumber(row[threeDaCol]);
      const bestCO = toNumber(row[bestCoCol]);
      const bestLeg = toNumber(row[bestLegCol]);
      const oneEighties = toNumber(row[oneEightyCol]);
      const matchSeq = toNumber(row[matchSeqCol]);
      const last5Flag = toNumber(row[last5Col]);
      const result = String(row[resultCol] || '').trim().toUpperCase();

      player.matches += 1;
      player.bestCheckout = Math.max(player.bestCheckout, bestCO);
      player.hasBigFish = player.hasBigFish || bestCO === 170;
      player.bestLeg = Math.min(player.bestLeg, bestLeg || 999);
      player.total180s += oneEighties;
      player.highestMatchSeq = Math.max(player.highestMatchSeq, matchSeq);

      if (threeDA > 0) {
        player.total3DA += threeDA;
        player.counted3DA += 1;
      }

      if (last5Flag === 1 && player.last5Count < 5) {
  player.last5Count += 1;

  if (result === 'W') {
    player.last5Wins += 1;
  }
}
    }

    let guild = null;
    const roleCache = new Map();

    async function getRole(roleId) {
      if (!ACHIEVEMENT_SYNC_ENABLED) return null;

      if (roleCache.has(roleId)) return roleCache.get(roleId);

      const role = await guild.roles.fetch(roleId).catch(() => null);
      roleCache.set(roleId, role);

      return role;
    }

    async function addRole(member, roleKey) {
      const roleId = ACHIEVEMENT_ROLE_IDS[roleKey];
      if (!roleId) return;

      const role = await getRole(roleId);
      if (!role) return;

      if (!member.roles.cache.has(roleId)) {
        await member.roles.add(role);
        console.log(`➕ Added ${role.name} to ${member.user.tag}`);
      }
    }

    async function removeRole(member, roleKey) {
      const roleId = ACHIEVEMENT_ROLE_IDS[roleKey];
      if (!roleId) return;

      const role = await getRole(roleId);
      if (!role) return;

      if (member.roles.cache.has(roleId)) {
        await member.roles.remove(role);
        console.log(`➖ Removed ${role.name} from ${member.user.tag}`);
      }
    }

    if (ACHIEVEMENT_SYNC_ENABLED) {
      guild = await client.guilds.fetch(TDR_GUILD_ID).catch(() => null);

      if (!guild) {
        console.log('❌ Achievement Sync failed: Could not find TDR Discord server.');
        return;
      }

      await guild.roles.fetch();
    }

    const averageTiers = [
      { min: 70, key: 'average70', label: '70+ Average' },
      { min: 60, key: 'average60', label: '60+ Average' },
      { min: 50, key: 'average50', label: '50+ Average' }
    ];

    const matchTiers = [
      { min: 500, key: 'games500', label: '500 Matches' },
      { min: 250, key: 'games250', label: '250 Matches' },
      { min: 100, key: 'games100', label: '100 Matches' },
      { min: 50, key: 'games50', label: '50 Matches' }
    ];

    const oneEightyTiers = [
      { min: 50, key: 'oneEighty50', label: '50x 180s' },
      { min: 25, key: 'oneEighty25', label: '25x 180s' },
      { min: 10, key: 'oneEighty10', label: '10x 180s' },
      { min: 5, key: 'oneEighty5', label: '5x 180s' },
      { min: 1, key: 'oneEightyClub', label: '180 Club' }
    ];

    const allAverageKeys = averageTiers.map(t => t.key);
    const allMatchKeys = matchTiers.map(t => t.key);
    const all180Keys = oneEightyTiers.map(t => t.key);

    for (const player of players.values()) {
      const average3DA = player.counted3DA > 0
        ? player.total3DA / player.counted3DA
        : 0;

      const matchCount = Math.max(player.highestMatchSeq, player.matches);

      const permanentEarned = {
        nineDarter: player.bestLeg === 9,
        bigFishHunter: player.hasBigFish
      };

      const liveEarned = {
        hotStreak: player.last5Count >= 5 && player.last5Wins >= 4
      };

      const progressiveEarned = {
        average: getProgressiveRole(average3DA, averageTiers),
        matches: getProgressiveRole(matchCount, matchTiers),
        oneEighties: getProgressiveRole(player.total180s, oneEightyTiers)
      };

      const displayEarned = [];

      for (const [key, earned] of Object.entries(permanentEarned)) {
        if (earned) displayEarned.push(key);
      }

      if (liveEarned.hotStreak) displayEarned.push('hotStreak');

      if (progressiveEarned.average) displayEarned.push(progressiveEarned.average);
      if (progressiveEarned.matches) displayEarned.push(progressiveEarned.matches);
      if (progressiveEarned.oneEighties) displayEarned.push(progressiveEarned.oneEighties);

     if (displayEarned.length > 0) {
  const achievementNames = {
    nineDarter: '💎 Nine Darter',
    bigFishHunter: '🎯 Big Fish Hunter',
    average50: '📈 50+ Average',
    average60: '📈 60+ Average',
    average70: '📈 70+ Average',
    oneEightyClub: '💥 180 Club',
    oneEighty5: '🔥 5x 180s',
    oneEighty10: '🚀 10x 180s',
    oneEighty25: '⚡ 25x 180s',
    oneEighty50: '👑 50x 180s',
    games50: '🏅 50 Match Club',
    games100: '🏅 100 Match Club',
    games250: '🏅 250 Match Club',
    games500: '🏅 500 Match Club',
    hotStreak: '🔥 Hot Streak'
  };

  const hotStreakText =
    player.last5Count >= 5
      ? `${Math.min(player.last5Wins, 5)}/5 Wins`
      : 'Not enough recent matches';

  const earnedOutput = displayEarned
    .map(a => `✅ ${achievementNames[a] || a}`)
    .join('\n');

  console.log([
    '',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    '🏆 TDR ACHIEVEMENT SCAN',
    '',
    `👤 ${player.name}`,
    '',
    `📈 Career Average : ${average3DA.toFixed(2)}`,
    `🏅 Career Matches : ${matchCount}`,
    `💥 Career 180s    : ${player.total180s}`,
    `🎯 Best Checkout  : ${player.bestCheckout}`,
    `⚡ Best Leg       : ${player.bestLeg === 999 ? '-' : player.bestLeg}`,
    '',
    `🔥 Hot Streak     : ${hotStreakText}`,
    '',
    'Achievements Earned:',
    earnedOutput,
    '',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    ''
  ].join('\n'));
}

      if (!ACHIEVEMENT_SYNC_ENABLED) continue;

      const member = await guild.members.fetch(player.discordId).catch(() => null);
      if (!member) continue;

      // Permanent roles: add only, never remove
      if (permanentEarned.nineDarter) await addRole(member, 'nineDarter');
      if (permanentEarned.bigFishHunter) await addRole(member, 'bigFishHunter');

      // Live role: add or remove
      if (liveEarned.hotStreak) {
        await addRole(member, 'hotStreak');
      } else {
        await removeRole(member, 'hotStreak');
      }

      // Progressive group: Average — only highest role stays
      for (const key of allAverageKeys) {
        if (key === progressiveEarned.average) {
          await addRole(member, key);
        } else {
          await removeRole(member, key);
        }
      }

      // Progressive group: Matches — only highest role stays
      for (const key of allMatchKeys) {
        if (key === progressiveEarned.matches) {
          await addRole(member, key);
        } else {
          await removeRole(member, key);
        }
      }

      // Progressive group: 180s — only highest role stays
      for (const key of all180Keys) {
        if (key === progressiveEarned.oneEighties) {
          await addRole(member, key);
        } else {
          await removeRole(member, key);
        }
      }
    }

    console.log(`✅ Achievement Role Scan complete. Players scanned: ${players.size}`);

  } catch (error) {
    console.error('❌ Achievement Role Sync Error:', error);
  }
}

function startAchievementRoleSyncTimer(client, sheets, SPREADSHEET_ID, PLAYER_DATA_RANGE) {
  console.log('⏱️ Achievement Role Sync timer started. Running every 24 hours.');

  setInterval(async () => {
    await syncAchievementRoles(client, sheets, SPREADSHEET_ID, PLAYER_DATA_RANGE);
  }, ONE_DAY);
}

module.exports = {
  syncAchievementRoles,
  startAchievementRoleSyncTimer
};