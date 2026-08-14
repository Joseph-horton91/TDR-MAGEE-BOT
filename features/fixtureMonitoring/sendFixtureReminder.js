const { EmbedBuilder } = require('discord.js');

async function sendFixtureReminder(client, fixture, divisionName) {
  const thread = await client.channels.fetch(fixture.threadId);

  if (!thread) {
    throw new Error(`Thread ${fixture.threadId} could not be found.`);
  }

  if (!thread.isTextBased()) {
    throw new Error(`Channel ${fixture.threadId} is not text based.`);
  }

  if (thread.isThread() && thread.archived) {
    await thread.setArchived(false, 'Mageee Thursday fixture reminder');
  }

  const embed = new EmbedBuilder()
    .setColor(0xF1C40F)
    .setTitle('🎯 Tasman Series Fixture Reminder — Automatic Reminder 1')
.setDescription(
  `This is an **automatic fixture reminder from Mageee** because your ` +
  `**Tasman Series fixture** is still awaiting arrangement/completion.\n\n` +

  `⏰ **All Tasman Series fixtures must be completed by ` +
  `11:59 PM Sunday (AWST).**\n\n` +

  `**Already arranged your match?**\n` +
  `Please use the **ARRANGED** button in this match thread **as soon as ` +
  `the date and time have been agreed**. This lets Mageee and TDR Admin ` +
  `know that your fixture is organised.\n\n` +

  `**Still need to arrange your match?**\n` +
  `Please communicate with your opponent in this thread and lock in a ` +
  `suitable day and time.\n\n` +

  `If you're having difficulty arranging the fixture, contact a ` +
  `**TDR Admin as soon as possible** so we can assist before the ` +
  `Sunday deadline.\n\n` +

  `Good luck and enjoy your match! 🎯`
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
  sendFixtureReminder
};
