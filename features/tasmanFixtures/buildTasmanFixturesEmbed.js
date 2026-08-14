const { EmbedBuilder } = require('discord.js');

function formatCompletedFixture(fixture) {
  let icon = '➖';
  let result = 'DREW';

  if (fixture.outcome === 'WIN') {
    icon = '✅';
    result = 'WON';
  } else if (fixture.outcome === 'LOSS') {
    icon = '❌';
    result = 'LOST';
  }

  const venue =
    fixture.homeAway === 'HOME'
      ? '🏠 Home'
      : '✈️ Away';

  return [
    `**Week ${fixture.week}**`,
    `${icon} **${result} ${fixture.playerLegs}–${fixture.opponentLegs}**`,
    `vs ${fixture.opponent}`,
    venue
  ].join('\n');
}

function formatUpcomingFixture(fixture) {
  const venue =
    fixture.homeAway === 'HOME'
      ? '🏠 Home'
      : '✈️ Away';

  return [
    `**Week ${fixture.week}**`,
    `vs **${fixture.opponent}**`,
    venue
  ].join('\n');
}

function splitIntoColumns(items) {
  const left = [];
  const right = [];

  items.forEach((item, index) => {
    if (index % 2 === 0) {
      left.push(item);
    } else {
      right.push(item);
    }
  });

  return {
    left: left.join('\n\n') || '—',
    right: right.join('\n\n') || '—'
  };
}

function buildTasmanFixturesEmbed(data) {
  const completedBlocks = data.completed.map(formatCompletedFixture);
  const completedColumns = splitIntoColumns(completedBlocks);

  const upcomingText =
    data.upcoming.length > 0
      ? data.upcoming
          .map(formatUpcomingFixture)
          .join('\n\n')
      : 'No upcoming fixtures found.';

  const embed = new EmbedBuilder()
    .setColor('#ffcc00')
    .setTitle('📅 My Tasman Series Fixtures')
    .setDescription(
  `**${data.playerName}**\n` +
  `${data.divisionName}\n` +
  `${data.season}\n\n` +
  `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
)
embed.addFields(
 {
    name: '✅ Completed Matches',
    value: `━━━━━━━━━━━━━━━━━━━━━━\n${completedColumns.left}`,
    inline: true
},
{
    name: '\u200B',
    value: `━━━━━━━━━━━━━━━━━━━━━━\n${completedColumns.right}`,
    inline: true
},
  {
     name: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n🎯 Upcoming Fixtures',
  value: upcomingText,
  inline: false
});

  embed.setFooter({
    text: 'TDR Online Darts • Compete • Respect • Unite•'
  });

  return embed;
}

module.exports = {
  buildTasmanFixturesEmbed
};