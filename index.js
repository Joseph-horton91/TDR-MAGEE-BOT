const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  StringSelectMenuBuilder
} = require('discord.js');

const { google } = require('googleapis');
const { getSheetValues } = require('./sheets');
const WELCOME_CHANNEL_ID = '1443050734051524850';
const REVIEW_CHANNEL_ID = '1501604626464641086';
const ADMIN_ROLE_ID = '1460063602353635419';
const DARTCOUNTER_SCREENSHOT_CHANNEL_ID = '1477822351616905327';
const MAGEE_SUPPORT_CHANNEL_ID = '1502486705654206574';
const PLAYER_LIST_SHEET_ID = '1oEAHCMdi66bxEOOx9ULrhK_XGWSSxynEYm356bH1Slg';
const PLAYER_LIST_RANGE = "'Player List'!A:I";
const SHEET_ID = '1oEAHCMdi66bxEOOx9ULrhK_XGWSSxynEYm356bH1Slg';
const SHEET_RANGE = 'TDR-Player registration!A:J';
const { runAudit } = require("./discordAudit");
const {
  appendApprovedPlayerToPlayerList,
  updateExistingPlayerInPlayerList,
} = require("./playerList");
const ROLE_IDS = {
  pendingReview: '1501604858523025550',
  registeredPlayer: '1501604967209762948',

  australia: '1460084692169523516',
  newZealand: '1460084532215550179',

  nzNorth: '1486968988641792121',
  nzSouth: '1486969738411118613',
  nsw: '1476454738345328691',
  qld: '1476454587727745128',
  act: '1476454791654670461',
  vic: '1476456304154378262',
  tas: '1476456204002787401',
  sa: '1476454925356765274',
  wa: '1476455145746333696',
  nt: '1476455244320739388',

  casualPlayer: '1462268714136244400',
  tasmanSeriesPlayer: '1460063836727152795',
  weeklySeriesPlayer: '1501605079441211493',
  majorsPlayer: '1501605157366923364',
  
};
const PROFILE_ROLE_IDS = [
  ROLE_IDS.australia,
  ROLE_IDS.newZealand,
  ROLE_IDS.nzNorth,
  ROLE_IDS.nzSouth,
  ROLE_IDS.nsw,
  ROLE_IDS.qld,
  ROLE_IDS.act,
  ROLE_IDS.vic,
  ROLE_IDS.tas,
  ROLE_IDS.sa,
  ROLE_IDS.wa,
  ROLE_IDS.nt,
];
const auth = new google.auth.GoogleAuth({
  keyFile: 'credentials.json',
  scopes: ['https://www.googleapis.com/auth/spreadsheets']
});

const sheets = google.sheets({
  version: 'v4',
  auth
});

const pendingRegistrations = new Map();
const pendingUpdates = new Map();
const completedRegistrations = new Set();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

client.once('clientReady', () => {
  console.log(`Logged in as ${client.user.tag}`);
  console.log('Magee pending approval check timer started.');

  setInterval(async () => {
    try {
      console.log('Magee pending approval check running...');

      const pendingPlayers = await getPendingPlayers();

      console.log(`Pending players found: ${pendingPlayers.length}`);

      const reviewChannel = await client.channels.fetch(REVIEW_CHANNEL_ID);

      if (pendingPlayers.length === 0) {
        await reviewChannel.send({
          content: `<@&1460063602353635419> ✅ Magee pending approval check complete. No players pending approval.`,
          allowedMentions: {
            roles: ['1460063602353635419']
          }
        });

        return;
      }

      const pendingList = pendingPlayers
        .map((player, index) => {
          return `**${index + 1}. ${player.playerName}**
Discord: <@${player.discordId}>
DartCounter: ${player.dartCounterUsername}
3DA: ${player.threeDartAverage}
Country: ${player.country}
Location: ${player.location}
Reason: ${player.reason}
Status: ${player.status}`;
        })
        .join('\n\n');

      await reviewChannel.send({
        content:
`<@&1460063602353635419> 🎯 **Magee Automated Pending Approval Check**

${pendingList}

Use **/approve user:@player** to approve players.`,
        allowedMentions: {
          roles: ['1460063602353635419']
        }
      });

      console.log('Magee pending approval message sent.');

    } catch (error) {
      console.error('Automatic pending approval check error:', error);
    }

  }, 24 * 60 * 60 * 1000);
});

function buildWelcomeEmbed() {
  return new EmbedBuilder()
    .setColor(0xD4AF37)
    .setTitle('🎯 Welcome to TDR | Online Darts 🌏')
    .setDescription(
      `We’re glad to have you join the community!\n\n` +
      `Before gaining access to leagues, tournaments, and official events, there are a few quick onboarding steps to complete. Magee will guide you through the onboarding process, which will then be verified by the TDR Admin team.\n\n` +
      `⚠️ It is critical that all onboarding information is completed accurately, as this feeds directly into our registration systems, player dashboard, statistics, and Order of Merit (OOM) rankings.\n\n` +
      `Once completed, you’ll be ready to get involved in everything TDR has to offer.`
    )
    .addFields(
      {
        name: 'What TDR offers',
        value:
          `🎯 Weekly Friendlies\n` +
          `🏆 Weekly Series\n` +
          `📊 Player Dashboard & OOM Rankings\n` +
          `🌏 Online Leagues\n` +
          `🔥 Major Events & Tournaments\n` +
          `💬 Community Games & Practice Sessions`,
        inline: false
      },
      {
        name: 'Next Step',
        value: `Click **Register with TDR** below to submit your onboarding details.`,
        inline: false
      }
    )
    .setFooter({ text: 'We’re building something big for AU & NZ darts — welcome aboard!' })
    .setTimestamp();
}

function buildRegisterButton() {
  const registerButton = new ButtonBuilder()
    .setCustomId('register_button')
    .setLabel('Register with TDR')
    .setStyle(ButtonStyle.Primary)
    .setEmoji('🎯');

  return new ActionRowBuilder().addComponents(registerButton);
}
function buildMageeSupportButtons() {
  const registerButton = new ButtonBuilder()
    .setCustomId('register_button')
    .setLabel('Register with TDR')
    .setStyle(ButtonStyle.Primary)
    .setEmoji('🎯');

const onboardedButton = new ButtonBuilder()
  .setCustomId('check_onboarding')
    .setLabel('Check Onboarding')
    .setStyle(ButtonStyle.Secondary)
    .setEmoji('✅');

const updateDetailsButton = new ButtonBuilder()
  .setCustomId('update_details')
    .setLabel('Update My Details')
    .setStyle(ButtonStyle.Success)
    .setEmoji('🔄');

  return new ActionRowBuilder().addComponents(
    registerButton,
    onboardedButton,
    updateDetailsButton
  );
}
async function openRegisterModal(interaction) {
  const modal = new ModalBuilder()
    .setCustomId('tdr_register_modal')
    .setTitle('TDR Player Registration');

  const playerNameInput = new TextInputBuilder()
    .setCustomId('player_name')
    .setLabel('TDR Player Name')
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const dartCounterInput = new TextInputBuilder()
    .setCustomId('dartcounter_username')
    .setLabel('DartCounter Username')
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const threeDartAverageInput = new TextInputBuilder()
    .setCustomId('three_dart_average')
    .setLabel('Current 3 Dart Average')
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  modal.addComponents(
    new ActionRowBuilder().addComponents(playerNameInput),
    new ActionRowBuilder().addComponents(dartCounterInput),
    new ActionRowBuilder().addComponents(threeDartAverageInput)
  );

  await interaction.showModal(modal);
}

async function openUpdateDetailsModal(interaction) {
  const modal = new ModalBuilder()
    .setCustomId('tdr_update_details_modal')
    .setTitle('Update TDR Player Details');

  const dartCounterInput = new TextInputBuilder()
    .setCustomId('dartcounter_username')
    .setLabel('DartCounter Username')
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const threeDartAverageInput = new TextInputBuilder()
    .setCustomId('three_dart_average')
    .setLabel('Current 3 Dart Average')
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

modal.addComponents(
  new ActionRowBuilder().addComponents(dartCounterInput),
  new ActionRowBuilder().addComponents(threeDartAverageInput)
);

  await interaction.showModal(modal);
}

async function sendToAdminReview(user, data) {
  const reviewChannel = await client.channels.fetch(REVIEW_CHANNEL_ID);

  const rejectButton = new ButtonBuilder()
    .setCustomId(`reject_onboarding_${user.id}`)
    .setLabel('Reject')
    .setStyle(ButtonStyle.Secondary)
    .setEmoji('❌');

  const needsFixingButton = new ButtonBuilder()
    .setCustomId(`needs_fixing_${user.id}`)
    .setLabel('Needs Fixing')
    .setStyle(ButtonStyle.Secondary)
    .setEmoji('🔧');

  const adminRow = new ActionRowBuilder().addComponents(
    rejectButton,
    needsFixingButton
  );

  await reviewChannel.send({
    content: `🎯 **NEW TDR PLAYER REGISTRATION**

**TDR Player Name:** ${data.playerName}
**DartCounter Username:** ${data.dartCounterUsername}
**3 Dart Average:** ${data.threeDartAverage}
**Country:** ${data.country}
**State / Location:** ${data.location}
**What Brings You to TDR:** ${data.reason}

**Discord User:** ${user}
**Discord Username:** ${user.username}
**Discord ID:** ${user.id}

📋 Status: Pending Review`,
    components: [adminRow]
  });
}

async function writePlayerToSheet(user, data) {
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: SHEET_RANGE,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[
        new Date().toISOString(),
        user.id,
        user.username,
        data.playerName,
        data.dartCounterUsername,
        data.threeDartAverage,
        data.country,
        data.location,
        data.reason,
        'Pending Review'
      ]]
    }
  });
}

async function checkPlayerOnboarded(discordId) {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: SHEET_RANGE
  });

  const rows = response.data.values || [];
  const rowIndex = rows.slice(1).findIndex(row => row[1] === discordId);

  if (rowIndex === -1) {
    return null;
  }

  const playerRow = rows[rowIndex + 1];

  return {
    rowNumber: rowIndex + 2,
    timestamp: playerRow[0],
    discordId: playerRow[1],
    discordUsername: playerRow[2],
    playerName: playerRow[3],
    dartCounterUsername: playerRow[4],
    threeDartAverage: playerRow[5],
    country: playerRow[6],
    location: playerRow[7],
    reason: playerRow[8],
    status: playerRow[9]
  };
}
async function findPlayerByDiscordId(discordId) {
  const rows = await getSheetValues(PLAYER_LIST_SHEET_ID, PLAYER_LIST_RANGE);

  const playerRow = rows.find(row => row[2] === discordId);

  if (!playerRow) {
    return null;
  }

  return {
    playerId: playerRow[1],
    discordId: playerRow[2],
    discordUsername: playerRow[3],
    playerName: playerRow[4],
    dartCounterUsername: playerRow[5],
    threeDartAverage: playerRow[6],
    country: playerRow[7],
    location: playerRow[8],
    status: playerRow[9],
  };
}
async function updatePlayerStatus(rowNumber, status) {
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `TDR-Player registration!J${rowNumber}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[status]]
    }
  });
}

async function logApprovalDetails(rowNumber, playerId, approvedBy) {
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `TDR-Player registration!K${rowNumber}:M${rowNumber}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[
        playerId,
        approvedBy,
        new Date().toISOString()
      ]]
    }
  });
}
async function getPendingPlayers() {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: SHEET_RANGE
  });

  const rows = response.data.values || [];

  return rows
    .slice(1)
    .filter(row => row[9] === 'Pending Review')
    .map(row => ({
      discordId: row[1],
      discordUsername: row[2],
      playerName: row[3],
      dartCounterUsername: row[4],
      threeDartAverage: row[5],
      country: row[6],
      location: row[7],
      reason: row[8],
      status: row[9]
    }));
}

client.on('guildMemberAdd', async member => {
  try {
    const welcomeChannel = await client.channels.fetch(WELCOME_CHANNEL_ID);

    await welcomeChannel.send({
      content: `🎯 Welcome to TDR ${member}! Please complete your onboarding below.`,
      embeds: [buildWelcomeEmbed()],
      components: [buildRegisterButton()]
    });

    await member.send({
      embeds: [buildWelcomeEmbed()],
      components: [buildRegisterButton()]
    });
  } catch (error) {
    console.error('New member onboarding error:', error);
  }
});

client.on('interactionCreate', async interaction => {
if (interaction.isButton() && interaction.customId.startsWith('reject_onboarding_')) {

  if (!interaction.member.roles.cache.has(ADMIN_ROLE_ID)) {
    await interaction.reply({
      content: '❌ Admin only.',
      ephemeral: true
    });
    return;
  }

  const targetUserId = interaction.customId.replace('reject_onboarding_', '');

  const modal = new ModalBuilder()
    .setCustomId(`reject_reason_${targetUserId}`)
    .setTitle('Reject Onboarding');

  const reasonInput = new TextInputBuilder()
    .setCustomId('reject_reason')
    .setLabel('Reason for rejection')
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true);

  modal.addComponents(
    new ActionRowBuilder().addComponents(reasonInput)
  );

  await interaction.showModal(modal);

  return;
}

if (interaction.isButton() && interaction.customId.startsWith('needs_fixing_')) {

  if (!interaction.member.roles.cache.has(ADMIN_ROLE_ID)) {
    await interaction.reply({
      content: '❌ Admin only.',
      ephemeral: true
    });
    return;
  }

  const targetUserId = interaction.customId.replace('needs_fixing_', '');

  const modal = new ModalBuilder()
    .setCustomId(`needs_fixing_reason_${targetUserId}`)
    .setTitle('Onboarding Needs Fixing');

  const reasonInput = new TextInputBuilder()
    .setCustomId('needs_fixing_reason')
    .setLabel('What needs fixing?')
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true);

  modal.addComponents(
    new ActionRowBuilder().addComponents(reasonInput)
  );

  await interaction.showModal(modal);

  return;
}
  if (interaction.isButton() && interaction.customId === 'register_button') {
   await openRegisterModal(interaction);
return;
  }

  if (
  interaction.isButton() &&
  (
    interaction.customId === 'check_onboarding' ||
    interaction.customId === 'onboarded_button'
  )
) {

  await interaction.deferReply({ ephemeral: true });

  const player = await checkPlayerOnboarded(interaction.user.id);

  if (!player) {
    await interaction.editReply({
      content: `❌ **No onboarding record found**

We could not find your Discord ID in the TDR onboarding database.

Please complete onboarding below.`,
      embeds: [buildWelcomeEmbed()],
      components: [buildRegisterButton()]
    });

    return;
  }

  await interaction.editReply({
    content: `✅ **You are already onboarded with TDR**

**TDR Player Name:** ${player.playerName}
**DartCounter Username:** ${player.dartCounterUsername}
**3 Dart Average:** ${player.threeDartAverage}
**Country:** ${player.country}
**State / Location:** ${player.location}
**Status:** ${player.status}

If any of this information is incorrect, please use **Update My Details**.`
  });

  return;
}

  if (
  interaction.isButton() &&
  (
    interaction.customId === 'update_details' ||
    interaction.customId === 'update_details_button'
  )
) {
    await openUpdateDetailsModal(interaction);
    return;
  }
if (interaction.isModalSubmit() && interaction.customId.startsWith('reject_reason_')) {

  
  if (!interaction.member.roles.cache.has(ADMIN_ROLE_ID)) {
    await interaction.reply({
      content: '❌ Admin only.',
      ephemeral: true
    });
    return;
  }

  const targetUserId = interaction.customId.replace('reject_reason_', '');

  const rejectionReason = interaction.fields.getTextInputValue('reject_reason');

await interaction.reply({
  content: `❌ Registration rejected for <@${targetUserId}>`,
  ephemeral: true
});

  const player = await checkPlayerOnboarded(targetUserId);

  if (!player) {
    await interaction.reply({
      content: '❌ No onboarding record found for this player.',
      ephemeral: true
    });
    return;
  }

  await updatePlayerStatus(player.rowNumber, 'Rejected');

  const targetUser = await client.users.fetch(targetUserId);

  await targetUser.send(
`❌ **TDR Registration Rejected**

Your onboarding has been reviewed by TDR Admins and was not approved.

📋 **Reason Provided**
${rejectionReason}

Please contact the TDR ADMINs to discuss your registration.

Should you not hear back, please head to <#1502486705654206574> and use the **Update My Details** button to resubmit your onboarding information.`
  ).catch(() => {});



  await interaction.message.edit({
    content: `${interaction.message.content}

❌ **Rejected by:** ${interaction.user}

📋 **Reason:** ${rejectionReason}`,
    components: []
  }).catch(() => {});

  return;
}
if (interaction.isModalSubmit() && interaction.customId.startsWith('needs_fixing_reason_')) {

  if (!interaction.member.roles.cache.has(ADMIN_ROLE_ID)) {
    await interaction.reply({
      content: '❌ Admin only.',
      ephemeral: true
    });
    return;
  }

  const targetUserId = interaction.customId.replace('needs_fixing_reason_', '');
  const fixingReason = interaction.fields.getTextInputValue('needs_fixing_reason');

  const player = await checkPlayerOnboarded(targetUserId);

  if (!player) {
    await interaction.reply({
      content: '❌ No onboarding record found for this player.',
      ephemeral: true
    });
    return;
  }

  await updatePlayerStatus(player.rowNumber, 'Needs Fixing');

  const targetUser = await client.users.fetch(targetUserId);

  await targetUser.send(
`🔧 **TDR Onboarding Needs Fixing**

Your onboarding has been reviewed by TDR Admins and needs to be updated before approval.

📋 **What needs fixing**
${fixingReason}

Please head to <#1502486705654206574> and use the **Update My Details** button to update your onboarding information.

If you are unsure, please contact a TDR Admin.`
  ).catch(() => {});

  await interaction.reply({
    content: `🔧 Needs fixing message sent to <@${targetUserId}>`,
    ephemeral: true
  });

  await interaction.message.edit({
    content: `${interaction.message.content}

🔧 **Marked as Needs Fixing by:** ${interaction.user}

📋 **Reason:** ${fixingReason}`,
    components: []
  }).catch(() => {});

  return;
}
  if (interaction.isModalSubmit() && interaction.customId === 'tdr_update_details_modal') {
    const dartCounterUsername = interaction.fields.getTextInputValue('dartcounter_username');
    const threeDartAverage = interaction.fields.getTextInputValue('three_dart_average');

    pendingUpdates.set(interaction.user.id, {
      dartCounterUsername,
      threeDartAverage,
    });

    const countrySelect = new StringSelectMenuBuilder()
      .setCustomId('update_country_select')
      .setPlaceholder('Select your country')
      .addOptions(
        { label: 'Australia', value: 'Australia' },
        { label: 'New Zealand', value: 'New Zealand' }
      );

    await interaction.reply({
      content: '🌏 Select your country:',
      components: [new ActionRowBuilder().addComponents(countrySelect)],
      ephemeral: true,
    });

    return;
  }

  if (interaction.isModalSubmit() && interaction.customId === 'tdr_register_modal') {
    const existingPlayer = await checkPlayerOnboarded(interaction.user.id);

    if (existingPlayer || completedRegistrations.has(interaction.user.id)) {
      await interaction.reply({
        content: '✅ You have already submitted your TDR registration. If you need to change anything, please contact an Admin.',
        ephemeral: true
      });
      return;
    }

    const playerName = interaction.fields.getTextInputValue('player_name');
    const dartCounterUsername = interaction.fields.getTextInputValue('dartcounter_username');
    const threeDartAverage = interaction.fields.getTextInputValue('three_dart_average');

    pendingRegistrations.set(interaction.user.id, {
      playerName,
      dartCounterUsername,
      threeDartAverage
    });

    const countrySelect = new StringSelectMenuBuilder()
      .setCustomId('country_select')
      .setPlaceholder('Select your country')
      .addOptions(
        { label: 'Australia', value: 'Australia', emoji: '🇦🇺' },
        { label: 'New Zealand', value: 'New Zealand', emoji: '🇳🇿' }
      );

    await interaction.reply({
      content: '🌏 Please select your country:',
      components: [new ActionRowBuilder().addComponents(countrySelect)],
      ephemeral: true
    });

    return;
  }

  if (interaction.isStringSelectMenu() && interaction.customId === 'update_country_select') {
    const data = pendingUpdates.get(interaction.user.id) || {};
    data.country = interaction.values[0];
    pendingUpdates.set(interaction.user.id, data);

    const locationSelect = new StringSelectMenuBuilder()
      .setCustomId('update_location_select')
      .setPlaceholder('Select your state / location')
      .addOptions(
        { label: 'NZ North', value: 'NZ North' },
        { label: 'NZ South', value: 'NZ South' },
        { label: 'NSW', value: 'NSW' },
        { label: 'QLD', value: 'QLD' },
        { label: 'ACT', value: 'ACT' },
        { label: 'VIC', value: 'VIC' },
        { label: 'TAS', value: 'TAS' },
        { label: 'SA', value: 'SA' },
        { label: 'WA', value: 'WA' },
        { label: 'NT', value: 'NT' }
      );

    await interaction.update({
      content: '📍 Select your state / location:',
      components: [new ActionRowBuilder().addComponents(locationSelect)],
    });

    return;
  }

  if (interaction.isStringSelectMenu() && interaction.customId === 'country_select') {
    const data = pendingRegistrations.get(interaction.user.id) || {};
    data.country = interaction.values[0];
    pendingRegistrations.set(interaction.user.id, data);

    const locationSelect = new StringSelectMenuBuilder()
      .setCustomId('location_select')
      .setPlaceholder('Select your state / location')
      .addOptions(
        { label: 'NZ North', value: 'NZ North' },
        { label: 'NZ South', value: 'NZ South' },
        { label: 'NSW', value: 'NSW' },
        { label: 'QLD', value: 'QLD' },
        { label: 'ACT', value: 'ACT' },
        { label: 'VIC', value: 'VIC' },
        { label: 'TAS', value: 'TAS' },
        { label: 'SA', value: 'SA' },
        { label: 'WA', value: 'WA' },
        { label: 'NT', value: 'NT' }
      );

    await interaction.update({
      content: '📍 Please select your state / location:',
      components: [new ActionRowBuilder().addComponents(locationSelect)]
    });

    return;
  }

  if (interaction.isStringSelectMenu() && interaction.customId === 'update_location_select') {
    const data = pendingUpdates.get(interaction.user.id);

    if (!data) {
      await interaction.reply({
        content: '❌ Update session expired. Please run /updatedetails again.',
        ephemeral: true,
      });
      return;
    }

    data.location = interaction.values[0];
    pendingUpdates.set(interaction.user.id, data);

    await interaction.update({
      content: '⏳ Magee is updating your TDR profile and Discord roles...',
      components: [],
    });

    const updateResult = await updateExistingPlayerInPlayerList(interaction.user, data);

    const member = await interaction.guild.members.fetch(interaction.user.id);

    await member.roles.remove(PROFILE_ROLE_IDS).catch(console.error);

    if (data.country === 'Australia') {
      await member.roles.add(ROLE_IDS.australia).catch(console.error);
    }

    if (data.country === 'New Zealand') {
      await member.roles.add(ROLE_IDS.newZealand).catch(console.error);
    }

    const locationRoleMap = {
      'NZ North': ROLE_IDS.nzNorth,
      'NZ South': ROLE_IDS.nzSouth,
      'NSW': ROLE_IDS.nsw,
      'QLD': ROLE_IDS.qld,
      'ACT': ROLE_IDS.act,
      'VIC': ROLE_IDS.vic,
      'TAS': ROLE_IDS.tas,
      'SA': ROLE_IDS.sa,
      'WA': ROLE_IDS.wa,
      'NT': ROLE_IDS.nt,
    };

    const locationRoleId = locationRoleMap[data.location];

    if (locationRoleId) {
      await member.roles.add(locationRoleId).catch(console.error);
    }

    pendingUpdates.delete(interaction.user.id);

    await interaction.editReply({
      content: `✅ Update details complete.

**DartCounter Username:** ${data.dartCounterUsername}
**3 Dart Average:** ${data.threeDartAverage}
**Country:** ${data.country}
**Location:** ${data.location}

${updateResult.updated ? "Magee has updated your TDR profile and Discord country/location roles." : `Magee could not update your Player List record: ${updateResult.reason}`}`,
      components: [],
    });

    return;
  }

  if (interaction.isStringSelectMenu() && interaction.customId === 'location_select') {
    const data = pendingRegistrations.get(interaction.user.id) || {};
    data.location = interaction.values[0];
    pendingRegistrations.set(interaction.user.id, data);

    const reasonSelect = new StringSelectMenuBuilder()
      .setCustomId('reason_select')
      .setPlaceholder('What brings you to TDR?')
      .addOptions(
        {
          label: 'Leagues, Tournaments and OOM Ranking',
          value: 'Leagues, Tournaments and OOM Ranking',
          emoji: '🏆'
        },
        {
          label: 'Casual Darts play in our community',
          value: 'Casual Darts play in our community',
          emoji: '🎯'
        }
      );

    await interaction.update({
      content: '🔥 What brings you to TDR?',
      components: [new ActionRowBuilder().addComponents(reasonSelect)]
    });

    return;
  }

  if (interaction.isStringSelectMenu() && interaction.customId === 'reason_select') {
    const data = pendingRegistrations.get(interaction.user.id) || {};
    data.reason = interaction.values[0];

    await sendToAdminReview(interaction.user, data);
    await writePlayerToSheet(interaction.user, data);

    completedRegistrations.add(interaction.user.id);
    pendingRegistrations.delete(interaction.user.id);

    await interaction.update({
      content: `✅ **TDR Registration Received**

**TDR Player Name:** ${data.playerName}
**DartCounter Username:** ${data.dartCounterUsername}
**3 Dart Average:** ${data.threeDartAverage}
**Country:** ${data.country}
**State / Location:** ${data.location}
**What Brings You to TDR:** ${data.reason}
**Discord ID:** ${interaction.user.id}

Your registration has been submitted and is pending Admin review.`,
      components: []
    });

    return;
  }

  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'audit') {
    await interaction.reply({
      content: '🎯 Magee is running the TDR audit...',
      ephemeral: true,
    });

    await runAudit(client);

    return;
  }

  if (interaction.commandName === 'mageepanel') {
    const channel = await client.channels.fetch(MAGEE_SUPPORT_CHANNEL_ID);

    await channel.send({
      embeds: [
        new EmbedBuilder()
          .setTitle('🎯 Magee Support Centre')
          .setDescription(
`Welcome to Magee Support.

Use the buttons below for all player onboarding and profile actions.

✅ Register with TDR
✅ Check onboarding status
✅ Update your player details

Magee helps keep TDR player data, dashboards, rankings and registrations clean and organised.`
          )
          .setColor(0xff0000)
      ],
      components: [buildMageeSupportButtons()]
    });

    await interaction.reply({
      content: '✅ Magee Support panel posted.',
      ephemeral: true,
    });

    return;
  }

  if (interaction.commandName === 'register') {
    const existingPlayer = await checkPlayerOnboarded(interaction.user.id);

    if (existingPlayer || completedRegistrations.has(interaction.user.id)) {
      await interaction.reply({
        content: '✅ You have already submitted your TDR registration. If you need to change anything, please contact an Admin.',
        ephemeral: true
      });
      return;
    }

    await openRegisterModal(interaction);
    return;
  }

  if (interaction.commandName === 'onboarded') {
    const player = await findPlayerByDiscordId(interaction.user.id);

    if (!player) {
      await interaction.reply({
        content: `❌ **No onboarding record found**

We could not find your Discord ID in the TDR onboarding database.

Please complete onboarding below.`,
        embeds: [buildWelcomeEmbed()],
        components: [buildRegisterButton()],
        ephemeral: true
      });
      return;
    }

    await interaction.reply({
      content: `✅ **You are already onboarded with TDR**

**TDR Player Name:** ${player.playerName}
**DartCounter Username:** ${player.dartCounterUsername}
**3 Dart Average:** ${player.threeDartAverage}
**Country:** ${player.country}
**State / Location:** ${player.location}
**Status:** ${player.status}

If any of this information is incorrect, please contact a TDR Admin.`,
      ephemeral: true
    });

    return;
  }

  if (interaction.commandName === 'updatedetails') {
    await openUpdateDetailsModal(interaction);
    return;
  }

  if (interaction.commandName === 'approve') {
    await interaction.deferReply({ ephemeral: true });

    const targetUser = interaction.options.getUser('user');
    const player = await checkPlayerOnboarded(targetUser.id);

    if (!player) {
      await interaction.editReply({
        content: `❌ No onboarding record found for ${targetUser}. They need to complete registration first.`
      });
      return;
    }

    await updatePlayerStatus(player.rowNumber, 'Approved');

    const playerListResult = await appendApprovedPlayerToPlayerList(targetUser, player);

    await logApprovalDetails(
      player.rowNumber,
      playerListResult.playerId || 'Existing Player',
      interaction.user.username
    );

    const member = await interaction.guild.members.fetch(targetUser.id);

    await member.roles.add(ROLE_IDS.registeredPlayer);

    if (player.country === 'Australia') {
      await member.roles.add(ROLE_IDS.australia);
    }

    if (player.country === 'New Zealand') {
      await member.roles.add(ROLE_IDS.newZealand);
    }

    const locationRoleMap = {
      'NZ North': ROLE_IDS.nzNorth,
      'NZ South': ROLE_IDS.nzSouth,
      'NSW': ROLE_IDS.nsw,
      'QLD': ROLE_IDS.qld,
      'ACT': ROLE_IDS.act,
      'VIC': ROLE_IDS.vic,
      'TAS': ROLE_IDS.tas,
      'SA': ROLE_IDS.sa,
      'WA': ROLE_IDS.wa,
      'NT': ROLE_IDS.nt
    };

    if (locationRoleMap[player.location]) {
      await member.roles.add(locationRoleMap[player.location]);
    }

    if (player.reason === 'Leagues, Tournaments and OOM Ranking') {
      await member.roles.add(ROLE_IDS.tasmanSeriesPlayer);
      await member.roles.add(ROLE_IDS.weeklySeriesPlayer);
      await member.roles.add(ROLE_IDS.majorsPlayer);
    }

    if (player.reason === 'Casual Darts play in our community') {
      await member.roles.add(ROLE_IDS.casualPlayer);
    }

    await member.roles.remove(ROLE_IDS.pendingReview).catch(() => {});

    await targetUser.send(`✅ **TDR Registration Approved**

Welcome aboard!

Your TDR onboarding has been approved by the Admin team.

You now have access based on your registration details.

Please head to <#${DARTCOUNTER_SCREENSHOT_CHANNEL_ID}> and share:

🎯 Your DartCounter Username
📸 A screenshot of your DartCounter board/profile

This helps Admins verify player information and allows other players to find and add you for matches and community games.`).catch(() => {});

    await interaction.editReply({
      content: `✅ ${targetUser} has been approved.

**Player Name:** ${player.playerName}
**DartCounter Username:** ${player.dartCounterUsername}
**3 Dart Average:** ${player.threeDartAverage}
**Country:** ${player.country}
**State / Location:** ${player.location}
${playerListResult.added ? `**Player ID:** ${playerListResult.playerId}` : `**Player List:** ${playerListResult.reason}`}
**Status:** Approved`
    });

    return;
  }

  if (interaction.commandName === 'adminpending') {
    await interaction.deferReply({ ephemeral: true });

    const pendingPlayers = await getPendingPlayers();

    if (pendingPlayers.length === 0) {
      await interaction.editReply({
        content: '✅ No players are currently pending onboarding approval.'
      });

      return;
    }

    const pendingList = pendingPlayers
      .map((player, index) => {
        return `**${index + 1}. ${player.playerName}**
Discord: <@${player.discordId}>
DartCounter: ${player.dartCounterUsername}
3DA: ${player.threeDartAverage}
Country: ${player.country}
Location: ${player.location}
Reason: ${player.reason}
Status: ${player.status}`;
      })
      .join('\n\n');

    await interaction.editReply({
      content: `📋 **TDR Pending Onboarding Approvals**

${pendingList}

Use **/approve user:@player** to approve a player.`
    });

    return;
  }
});
client.login('MTUwMTQ5MTYxMTEwMjc0NDYwNg.GnMdYK.9M75NaiJ40NOVjZoR5hksJQCYHwHgh0LnA2ueU');