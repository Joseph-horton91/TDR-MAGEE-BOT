const {
  getTasmanFixtures
} = require('./getTasmanFixtures');

const {
  buildTasmanFixturesEmbed
} = require('./buildTasmanFixturesEmbed');

async function handleTasmanFixtures(
  interaction,
  sheets,
  divisionConfig
) {
  try {
    await interaction.deferReply({
      ephemeral: true
    });

    const fixtureData = await getTasmanFixtures({
      sheets,
      discordUserId: interaction.user.id,
      member: interaction.member,
      divisionConfig
    });

    const embed = buildTasmanFixturesEmbed(fixtureData);

    await interaction.editReply({
      embeds: [embed]
    });
  } catch (error) {
    console.error(
      'Tasman fixtures error:',
      error
    );

    const errorMessage =
      error.message === 'NO_DIVISION_ROLE'
        ? '❌ Magee could not find your current Tasman Series division role.'
        : error.message === 'NO_FIXTURES_FOUND'
          ? '⚠️ Magee could not find any Tasman Series fixtures connected to your Discord account.'
          : '❌ Magee could not load your Tasman Series fixtures. Please contact an admin if this continues.';

    if (
      interaction.deferred ||
      interaction.replied
    ) {
      await interaction.editReply({
        content: errorMessage,
        embeds: []
      });
    } else {
      await interaction.reply({
        content: errorMessage,
        ephemeral: true
      });
    }
  }
}

module.exports = {
  handleTasmanFixtures
};