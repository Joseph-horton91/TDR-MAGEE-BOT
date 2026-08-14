const { EmbedBuilder } = require('discord.js');

async function sendSaturdayFixtureReminder(client, fixture, divisionName) {
  const thread = await client.channels.fetch(fixture.threadId);

  if (!thread) {
    throw new Error(`Thread ${fixture.threadId} could not be found.`);
  }

  if (!thread.isTextBased()) {
    throw new Error(`Channel ${fixture.threadId} is not text based.`);
  }

  if (thread.isThread() && thread.archived) {
    await thread.setArchived(false, 'Mageee Saturday fixture reminder');
  }

  const embed = new EmbedBuilder()
    .setColor(0xE74C3C)
    .setTitle('🚨 URGENT — Tasman Series Final Reminder')
    .setDescription(
      `**URGENT LAST REMINDER — your fixture is approaching the ` +
      `Sunday deadline.**\n\n` +
      `Unless you have already arranged an extension with TDR Admin, ` +
      `you urgently need to make arrangements to play your fixture.\n\n` +
      `⏰ **The normal fixture deadline is 11:59 PM Sunday (AWST).**\n\n` +
      `Delayed games are only approved on a **case-by-case basis**.\n\n` +
      `Where a fixture cannot be completed, **wins may be awarded to ` +
      `the player who has been the most proactive in attempting to ` +
      `arrange the match.**\n\n` +
      `Please use this match thread to communicate with your opponent ` +
      `and contact a TDR Admin immediately if assistance is required.`
    )
    .addFields(
      {
        name: 'Division',
        value: divisionName,
        inline: true
      },
      {
        name: 'Week',
        value: String(fixture.week || 'Current fixture'),
        inline: true
      },
      {
        name: 'Fixture',
        value:
          `${fixture.homePlayer || 'Home Player'} vs ` +
          `${fixture.awayPlayer || 'Away Player'}`,
        inline: false
      }
    )
    .setFooter({
      text: 'TDR Online Darts • Compete • Respect • Unite'
    })
    .setTimestamp();

  await thread.send({
    content: `<@${fixture.homeDiscordId}> <@${fixture.awayDiscordId}>`,
    embeds: [embed],
    allowedMentions: {
      users: [
        fixture.homeDiscordId,
        fixture.awayDiscordId
      ]
    }
  });
}

module.exports = {
  sendSaturdayFixtureReminder
};
