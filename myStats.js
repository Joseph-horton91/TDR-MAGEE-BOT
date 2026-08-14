const { EmbedBuilder } = require('discord.js');

function toNumber(value) {
  const num = Number(value);
  return Number.isNaN(num) ? 0 : num;
}

function getCol(headers, name) {
  return headers.indexOf(name);
}

function resultWord(result) {
  if (result === 'W') return 'WIN';
  if (result === 'L') return 'LOSS';
  if (result === 'D') return 'DRAW';
  return 'RESULT';
}

async function handleMyTdrStats(interaction, sheets, SPREADSHEET_ID, OOM_RANGE, PLAYER_DATA_RANGE) {
  await interaction.deferReply({ ephemeral: true });

  const discordId = interaction.user.id;

  const playerResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: PLAYER_DATA_RANGE,
  });

  const rows = playerResponse.data.values || [];
  const headers = rows[0];
  const data = rows.slice(1);

  const col = name => getCol(headers, name);

  const playerDiscordCol = col('Player Discord ID');
  const playerNameCol = col('Official Player Name');
  const opponentCol = col('Official Opponent Name');
  const eventCol = col('Event');
  const seasonCol = col('Season');
  const divisionCol = col('Division');
  const weekCol = col('Week');
  const legsWonCol = col('Legs Won');
  const legsLostCol = col('Legs Lost');
  const threeDaCol = col('3DA');
  const bestCoCol = col('Best CO');
  const bestLegCol = col('Best Leg');
  const sixtyCol = col('60+');
  const eightyCol = col('80+');
  const tonCol = col('100+');
  const oneFortyCol = col('140+');
  const oneEightyCol = col('180');
  const resultCol = col('Result');
  const matchSeqCol = col('Match Seq');

  const playerRows = data.filter(row =>
    String(row[playerDiscordCol] || '').trim() === String(discordId)
  );

  if (playerRows.length === 0) {
    return interaction.editReply({
      content: `⚠️ I couldn't find your TDR stats yet. If this looks wrong, please contact Admin Support.`
    });
  }

  const playerName = playerRows[0][playerNameCol] || interaction.user.username;

  let total3DA = 0;
  let counted3DA = 0;
  let bestCheckout = 0;
  let bestLeg = 999;
  let total60 = 0;
  let total80 = 0;
  let total100 = 0;
  let total140 = 0;
  let total180 = 0;

  for (const row of playerRows) {
    const threeDA = toNumber(row[threeDaCol]);

    if (threeDA > 0) {
      total3DA += threeDA;
      counted3DA += 1;
    }

    bestCheckout = Math.max(bestCheckout, toNumber(row[bestCoCol]));
    bestLeg = Math.min(bestLeg, toNumber(row[bestLegCol]) || 999);

    total60 += toNumber(row[sixtyCol]);
    total80 += toNumber(row[eightyCol]);
    total100 += toNumber(row[tonCol]);
    total140 += toNumber(row[oneFortyCol]);
    total180 += toNumber(row[oneEightyCol]);
  }

  const careerAverage = counted3DA > 0 ? total3DA / counted3DA : 0;

  const sortedRows = [...playerRows].sort((a, b) =>
    toNumber(b[matchSeqCol]) - toNumber(a[matchSeqCol])
  );

  const lastMatch = sortedRows[0];
  const lastFive = sortedRows.slice(0, 5);

  const lastFiveWins = lastFive.filter(row =>
    String(row[resultCol] || '').trim().toUpperCase() === 'W'
  ).length;

  const lastMatchResult = String(lastMatch[resultCol] || '').trim().toUpperCase();

  const lastMatchText =
    `**${playerName} vs ${lastMatch[opponentCol] || 'Opponent'}**\n` +
    `**${lastMatch[legsWonCol]}-${lastMatch[legsLostCol]} ${resultWord(lastMatchResult)}**\n` +
    `${lastMatch[eventCol] || ''} ${lastMatch[seasonCol] || ''} ${lastMatch[divisionCol] || ''} • Week ${lastMatch[weekCol] || '-'}`;

  const oomResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: OOM_RANGE,
  });

  const oomRows = oomResponse.data.values || [];
  const oomHeaders = oomRows[0];
  const oomData = oomRows.slice(1);

  const rankCol = oomHeaders.indexOf('Rank');
  const oomPlayerCol = oomHeaders.indexOf('Player');
  const pointsCol = oomHeaders.indexOf('Total OOM Points');
  const discordCol = oomHeaders.indexOf('Discord ID');

  const oomRow = oomData.find(row =>
    String(row[discordCol] || '').trim() === String(discordId)
  );

  const oomText = oomRow
    ? `Rank: **#${oomRow[rankCol]}**\nPoints: **${oomRow[pointsCol]}**`
    : `No OOM ranking found yet.`;

  const achievements = [];

  if (careerAverage >= 70) achievements.push('📈 70+ Average');
  else if (careerAverage >= 60) achievements.push('📈 60+ Average');
  else if (careerAverage >= 50) achievements.push('📈 50+ Average');

  if (total180 >= 50) achievements.push('👑 50x 180s');
  else if (total180 >= 25) achievements.push('⚡ 25x 180s');
  else if (total180 >= 10) achievements.push('🚀 10x 180s');
  else if (total180 >= 5) achievements.push('🔥 5x 180s');
  else if (total180 >= 1) achievements.push('💥 180 Club');

  if (playerRows.length >= 500) achievements.push('🏅 500 Match Club');
  else if (playerRows.length >= 250) achievements.push('🏅 250 Match Club');
  else if (playerRows.length >= 100) achievements.push('🏅 100 Match Club');
  else if (playerRows.length >= 50) achievements.push('🏅 50 Match Club');

  if (bestCheckout === 170) achievements.push('🎯 Big Fish Hunter');
  if (bestLeg === 9) achievements.push('💎 Nine Darter');
  if (lastFive.length >= 5 && lastFiveWins >= 4) achievements.push('🔥 Hot Streak');

 const lastFiveForm = lastFive
  .map(row => {
    const result = String(row[resultCol] || '').trim().toUpperCase();
    if (result === 'W') return '✅';
    if (result === 'L') return '❌';
    if (result === 'D') return '➖';
    return '⚪';
  })
  .join(' ');
function getNextMilestoneText() {
  const milestones = [];

  if (total180 < 5) {
    milestones.push(`💥 **180s**\n${5 - total180} more 180s until 🔥 **5x 180s**`);
  } else if (total180 < 10) {
    milestones.push(`💥 **180s**\n${10 - total180} more 180s until 🚀 **10x 180s**`);
  } else if (total180 < 25) {
    milestones.push(`💥 **180s**\n${25 - total180} more 180s until ⚡ **25x 180s**`);
  } else if (total180 < 50) {
    milestones.push(`💥 **180s**\n${50 - total180} more 180s until 👑 **50x 180s**`);
  }

  if (playerRows.length < 50) {
    milestones.push(`🏅 **Matches**\n${50 - playerRows.length} more matches until 🏅 **50 Match Club**`);
  } else if (playerRows.length < 100) {
    milestones.push(`🏅 **Matches**\n${100 - playerRows.length} more matches until 🏅 **100 Match Club**`);
  } else if (playerRows.length < 250) {
    milestones.push(`🏅 **Matches**\n${250 - playerRows.length} more matches until 🏅 **250 Match Club**`);
  } else if (playerRows.length < 500) {
    milestones.push(`🏅 **Matches**\n${500 - playerRows.length} more matches until 🏅 **500 Match Club**`);
  }

  if (careerAverage < 50) {
    milestones.push(`📈 **Average**\n${(50 - careerAverage).toFixed(2)} needed for 📈 **50+ Average**`);
  } else if (careerAverage < 60) {
    milestones.push(`📈 **Average**\n${(60 - careerAverage).toFixed(2)} needed for 📈 **60+ Average**`);
  } else if (careerAverage < 70) {
    milestones.push(`📈 **Average**\n${(70 - careerAverage).toFixed(2)} needed for 📈 **70+ Average**`);
  }

  return milestones.length
    ? milestones.slice(0, 3).join('\n\n')
    : '👑 You have reached all current milestone targets!';
}

const nextMilestoneText = getNextMilestoneText();

const embed = new EmbedBuilder()
  .setColor('#ffcc00')
  .setTitle('🎯 TDR PLAYER PROFILE')
  .setDescription(
    `# 👤 ${playerName}\n` +
    `━━━━━━━━━━━━━━━━━━━━`
  )
 .addFields(
  {
    name: '🏆 Order of Merit',
    value: oomRow
      ? `**#${oomRow[rankCol]}** • **${oomRow[pointsCol]} Points**`
      : 'No OOM ranking found yet.',
    inline: false
  },
  {
    name: '📈 Career Snapshot',
    value:
      `🎮 **Matches:** ${playerRows.length}\n` +
      `🎯 **3 Dart Average:** ${careerAverage.toFixed(2)}\n` +
      `🎣 **Best Checkout:** ${bestCheckout || '-'}\n` +
      `⚡ **Best Leg:** ${bestLeg === 999 ? '-' : bestLeg}`,
    inline: true
  },
  {
    name: '💥 Scoring Power',
    value:
      `💥 **180s:** ${total180}\n` +
      `🔥 **140+:** ${total140}\n` +
      `💯 **100+:** ${total100}\n` +
      `🎯 **80+:** ${total80}\n` +
      `✅ **60+:** ${total60}`,
    inline: true
  },
  {
    name: '🏅 Achievements',
    value: achievements.length
      ? achievements.join('\n')
      : 'No achievements unlocked yet.',
    inline: false
  },
  {
  name: '🎯 Next Milestone',
  value: nextMilestoneText,
  inline: false
},
  {
    name: '🔥 Current Form',
    value:
      `**Last 5:** ${lastFiveForm || 'No recent matches'}\n` +
      `**Record:** ${lastFiveWins}/${lastFive.length} Wins\n` +
      `${lastFive.length >= 5 && lastFiveWins >= 4
        ? '🔥 **Hot Streak Active!**'
        : 'Keep chasing the streak!'}`,
    inline: false
  },
  {
    name: '🎮 Last Match',
    value:
      `👤 **${playerName}**\n` +
      `🆚 **${lastMatch[opponentCol] || 'Opponent'}**\n\n` +
      `**${lastMatch[legsWonCol]}-${lastMatch[legsLostCol]} ${resultWord(lastMatchResult)}**\n\n` +
      `🏆 ${lastMatch[eventCol] || 'TDR Event'}\n` +
      `📅 ${lastMatch[seasonCol] || '-'} • Week ${lastMatch[weekCol] || '-'}\n` +
      `🏅 ${lastMatch[divisionCol] || '-'}`,
    inline: false
  }
)
  .setFooter({ text: 'TDR Online Darts • Compete • Respect • Unite' })
  .setTimestamp();

return interaction.editReply({
  embeds: [embed]
});    
}

module.exports = {
  handleMyTdrStats
};