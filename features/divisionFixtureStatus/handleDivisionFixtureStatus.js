const { EmbedBuilder } = require('discord.js');

const {
  getDivisionFixtureStatus
} = require('./getDivisionFixtureStatus');

const TDR_GUILD_ID = '1443050733200212012';
const MAX_FIELDS_PER_EMBED = 20;
const MAX_TEXT_LENGTH = 1024;

function truncate(text, maxLength = MAX_TEXT_LENGTH) {
  const value = String(text || '');
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 3)}...`;
}

function getThreadLink(threadId) {
  if (!threadId) return 'Thread unavailable';

  return `[Open Fixture Thread](https://discord.com/channels/${TDR_GUILD_ID}/${threadId})`;
}

function formatPerthDate(date, includeTime = false) {
  if (!date) return 'Unknown';

  return new Intl.DateTimeFormat('en-AU', {
    timeZone: 'Australia/Perth',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...(includeTime
      ? {
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23'
      }
      : {})
  }).format(date);
}

function formatStatus(statusGroup, rawStatus) {
  const labels = {
    completed: '✅ Completed',
    arranged: '🔵 Arranged',
    posted: '🟡 Posted',
    pendingConfirmation: '🟠 Pending Confirmation',
    noStatus: '🔴 No Status',
    other: `⚪ ${rawStatus || 'Other'}`
  };

  return labels[statusGroup] || labels.other;
}

function getWeekLabel(fixture) {
  const week = String(fixture.week || '').trim();

  if (!week) return 'Week unknown';
  if (/^week\b/i.test(week)) return week;

  return `Week ${week}`;
}

function getProgressIcon(percentage) {
  if (percentage === 100) return '✅';
  if (percentage >= 90) return '🟢';
  if (percentage >= 70) return '🟡';
  if (percentage >= 40) return '🟠';
  return '🔴';
}

function buildProgressBar(percentage, blocks = 10) {
  const safePercentage = Math.max(0, Math.min(100, percentage));
  const filled = Math.round((safePercentage / 100) * blocks);
  return `${'█'.repeat(filled)}${'░'.repeat(blocks - filled)}`;
}

function chunkArray(items, size) {
  const chunks = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

function buildOverviewEmbed(statusData) {
  const averageAge = statusData.averageActiveAgeDays === null
    ? 'Not available'
    : `${statusData.averageActiveAgeDays} days`;

  const fastest = statusData.fastestDivision
    ? `${statusData.fastestDivision.label} (${statusData.fastestDivision.percentage}%)`
    : 'Not available';

  const slowest = statusData.slowestDivision
    ? `${statusData.slowestDivision.label} (${statusData.slowestDivision.percentage}%)`
    : 'Not available';

  const lastCompletion = statusData.latestCompletedFixture
    ? `${statusData.latestCompletedFixture.homePlayer} ` +
      `${statusData.latestCompletedFixture.homeLegs || 0}–` +
      `${statusData.latestCompletedFixture.awayLegs || 0} ` +
      `${statusData.latestCompletedFixture.awayPlayer}\n` +
      formatPerthDate(statusData.latestCompletedFixture.completedAt, true)
    : 'No completed fixtures with a completion date.';

  const oldestActive = statusData.oldestActiveFixture
    ? `${statusData.oldestActiveFixture.divisionName} | ` +
      `${statusData.oldestActiveFixture.fixtureId}\n` +
      `${statusData.oldestActiveFixture.homePlayer} vs ` +
      `${statusData.oldestActiveFixture.awayPlayer}\n` +
      `${statusData.oldestActiveFixture.ageDays} days old`
    : 'No dated active fixtures.';

  const embed = new EmbedBuilder()
    .setColor(statusData.health.score >= 75 ? 0x2ECC71 : statusData.health.score >= 55 ? 0xF1C40F : 0xE74C3C)
    .setTitle('📋 Mageee Fixture Control Centre')
    .setDescription(
      '**Full-season scan complete.** Every valid fixture in every configured ' +
      '`BOT_FIXTURES` sheet has been checked.\n\n' +
      `**Overall Completion**\n${buildProgressBar(statusData.completionPercentage)} ` +
      `**${statusData.completionPercentage}%**`
    )
    .addFields(
      {
        name: '📊 Competition',
        value:
          `Divisions: **${statusData.divisionsScanned}/${statusData.divisionsConfigured}**\n` +
          `Fixtures: **${statusData.fixturesScanned}**\n` +
          `Remaining: **${statusData.fixturesRemaining}**`,
        inline: true
      },
      {
        name: '🎯 Status',
        value:
          `✅ Completed: **${statusData.completed.length}**\n` +
          `🔵 Arranged: **${statusData.arranged.length}**\n` +
          `🟡 Posted: **${statusData.posted.length}**`,
        inline: true
      },
      {
        name: '🚨 Needs Attention',
        value:
          `🟠 Pending: **${statusData.pendingConfirmation.length}**\n` +
          `⚪ Not Posted: **${statusData.noStatus.length}**\n` +
          `🚨 Overdue: **${statusData.overdue.length}**`,
        inline: true
      },
      {
        name: `${statusData.health.icon} Season Health`,
        value:
          `**${statusData.health.score}/100 — ${statusData.health.label}**\n` +
          `Average active age: **${averageAge}**`,
        inline: true
      },
      {
        name: '🏆 Division Leaders',
        value:
          `Fastest: **${fastest}**\n` +
          `Needs attention: **${slowest}**`,
        inline: true
      },
      {
        name: '🔥 Latest Completion',
        value: truncate(lastCompletion),
        inline: true
      },
      {
        name: '⏳ Oldest Active Fixture',
        value: truncate(oldestActive),
        inline: false
      }
    )
    .setFooter({
      text: 'Mageee Admin Tools • Tasman Series fixture control centre'
    })
    .setTimestamp(statusData.generatedAt);

  if (statusData.errors.length > 0) {
    embed.addFields({
      name: `⚠️ Sheet Errors (${statusData.errors.length})`,
      value: truncate(
        statusData.errors
          .map(error => `**${error.divisionName}:** ${error.message}`)
          .join('\n')
      ),
      inline: false
    });
  }

  return embed;
}

function buildProgressEmbeds(title, description, color, progressRows, footer) {
  if (progressRows.length === 0) return [];

  const fields = progressRows.map(row => ({
    name: `${getProgressIcon(row.percentage)} ${row.label}`,
    value:
      `${buildProgressBar(row.percentage)} **${row.percentage}%**\n` +
      `Completed: **${row.completed}/${row.total}** • ` +
      `Active: **${row.active}** • Overdue: **${row.overdue}**`,
    inline: false
  }));

  return chunkArray(fields, MAX_FIELDS_PER_EMBED).map((chunk, index, chunks) => {
    const page = chunks.length > 1 ? ` • Page ${index + 1}/${chunks.length}` : '';

    return new EmbedBuilder()
      .setColor(color)
      .setTitle(`${title}${page}`)
      .setDescription(description)
      .addFields(chunk)
      .setFooter({ text: footer })
      .setTimestamp();
  });
}

function buildFixtureField(fixture, mode = 'active') {
  const matchLabel = fixture.match
    ? `Match ${fixture.match}`
    : fixture.fixtureId;

  const base =
    `${formatStatus(fixture.statusGroup, fixture.status)} • ` +
    `**${getWeekLabel(fixture)}**${matchLabel ? ` • ${matchLabel}` : ''}\n` +
    `**${fixture.homePlayer || 'Home Player'} vs ` +
    `${fixture.awayPlayer || 'Away Player'}**`;

  const extraLines = [];

  if (mode === 'overdue' && fixture.ageDays !== null) {
    extraLines.push(`🚨 Posted **${fixture.ageDays} days ago**`);
  } else if (mode === 'nearOverdue' && fixture.ageDays !== null) {
    extraLines.push(`⚠️ Posted **${fixture.ageDays} days ago**`);
  } else if (mode === 'completed') {
    extraLines.push(
      `✅ **${fixture.homePlayer || 'Home Player'} ${fixture.homeLegs || 0}–` +
      `${fixture.awayLegs || 0} ${fixture.awayPlayer || 'Away Player'}**`
    );

    if (fixture.completedAt) {
      extraLines.push(formatPerthDate(fixture.completedAt, true));
    }
  }

  return {
    name: `${fixture.divisionName} | ${fixture.fixtureId}`,
    value: truncate(
      [base, ...extraLines, getThreadLink(fixture.threadId)].join('\n')
    ),
    inline: false
  };
}

function buildFixtureEmbeds(title, description, color, fixtures, mode = 'active') {
  if (fixtures.length === 0) return [];

  const chunks = chunkArray(fixtures, MAX_FIELDS_PER_EMBED);

  return chunks.map((chunk, index) => {
    const pageText = chunks.length > 1
      ? ` • Page ${index + 1}/${chunks.length}`
      : '';

    return new EmbedBuilder()
      .setColor(color)
      .setTitle(`${title}${pageText}`)
      .setDescription(description)
      .addFields(chunk.map(fixture => buildFixtureField(fixture, mode)))
      .setFooter({
        text: 'Mageee Admin Tools • Sorted by week, division and match'
      })
      .setTimestamp();
  });
}

function buildDivisionFixtureStatusEmbeds(statusData) {
  return [
    buildOverviewEmbed(statusData),
    ...buildProgressEmbeds(
      '📅 Week Progress',
      'Completion progress across every fixture week.',
      0x5865F2,
      statusData.weekProgress,
      'Mageee Admin Tools • Week-by-week completion'
    ),
    ...buildProgressEmbeds(
      '🏆 Division Progress',
      'Divisions are sorted from highest completion percentage to lowest.',
      0x9B59B6,
      statusData.divisionProgress,
      'Mageee Admin Tools • Division completion overview'
    ),
    ...buildFixtureEmbeds(
      '🚨 Overdue Fixtures',
      'Active fixtures posted at least seven days ago. Oldest fixtures appear first.',
      0xE74C3C,
      statusData.overdue,
      'overdue'
    ),
    ...buildFixtureEmbeds(
      '⚠️ Near Overdue',
      'Active fixtures posted five or six days ago.',
      0xF39C12,
      statusData.nearOverdue,
      'nearOverdue'
    ),
    ...buildFixtureEmbeds(
      '🟡 Posted Fixtures',
      'Fixtures released to players but not yet Arranged or Completed.',
      0xF1C40F,
      statusData.posted
    ),
    ...buildFixtureEmbeds(
      '🟠 Pending Confirmation',
      'Fixtures awaiting confirmation or final result processing.',
      0xE67E22,
      statusData.pendingConfirmation
    ),
    ...buildFixtureEmbeds(
      '🔵 Arranged Fixtures',
      'Fixtures with an agreed arrangement that are awaiting completion.',
      0x3498DB,
      statusData.arranged
    ),
    ...buildFixtureEmbeds(
      '⚪ Other Fixture Statuses',
      'Fixtures using a status Mageee does not currently recognise.',
      0x95A5A6,
      statusData.other
    ),
    ...buildFixtureEmbeds(
      '✅ Recent Results',
      'The most recent completed fixtures with a completion timestamp.',
      0x2ECC71,
      statusData.recentResults,
      'completed'
    )
  ];
}

async function sendEmbeds(interaction, embeds) {
  if (embeds.length === 0) {
    await interaction.editReply({
      content: 'No fixture data was found.',
      embeds: []
    });
    return;
  }

  await interaction.editReply({
    content: '📋 **Tasman Series full fixture scan complete.**',
    embeds: [embeds[0]]
  });

  for (const embed of embeds.slice(1)) {
    await interaction.followUp({
      embeds: [embed],
      ephemeral: true
    });
  }
}

async function handleDivisionFixtureStatus(
  interaction,
  sheets,
  divisionConfig,
  adminRoleId
) {
  if (!interaction.member.roles.cache.has(adminRoleId)) {
    await interaction.reply({
      content: '❌ This fixture status report is for TDR Admins only.',
      ephemeral: true
    });
    return;
  }

  await interaction.deferReply({ ephemeral: true });

  try {
    console.log(
      `[Division Fixture Status] Requested by ${interaction.user.username}.`
    );

    const statusData = await getDivisionFixtureStatus(
      sheets,
      divisionConfig
    );

    const embeds = buildDivisionFixtureStatusEmbeds(statusData);
    await sendEmbeds(interaction, embeds);

    console.log(
      `[Division Fixture Status] Complete. ` +
      `${statusData.divisionsScanned} division(s), ` +
      `${statusData.fixturesScanned} fixture(s), ` +
      `${statusData.completed.length} completed, ` +
      `${statusData.active.length} active, ` +
      `${statusData.overdue.length} overdue, ` +
      `${statusData.errors.length} error(s).`
    );
  } catch (error) {
    console.error('[Division Fixture Status] Failed:', error);

    await interaction.editReply({
      content:
        '❌ Mageee could not build the division fixture status report. ' +
        'Check the terminal for the full error.',
      embeds: []
    });
  }
}

module.exports = {
  handleDivisionFixtureStatus
};
