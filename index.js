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
  StringSelectMenuBuilder,
  AttachmentBuilder,
  UserSelectMenuBuilder,
} = require('discord.js');
require('dotenv').config();

const { google } = require('googleapis');
const { getSheetValues } = require('./sheets');
const path = require('path');
const fs = require('fs');
const { createCanvas, loadImage } = require('canvas');
const { syncOOMRoles, startOOMRoleSyncTimer } = require('./roles/oomRoleSync');
const { syncAchievementRoles } = require('./roles/achievementRoleSync');
const { handleMyTdrStats } = require('./myStats');
const { handleTasmanFixtures} = require('./features/tasmanFixtures/handleTasmanFixtures');
const { startFixtureMonitoring} = require('./features/fixtureMonitoring/startFixtureMonitoring');
const {
  handleDivisionFixtureStatus
} = require('./features/divisionFixtureStatus/handleDivisionFixtureStatus');
/*const {  runSingleFixtureTest} = require('./features/fixtureMonitoring/runSingleFixtureTest');*/
const OOM_LOGO = 'https://cdn.discordapp.com/attachments/1520754478301581403/1520754608715337888/TDR_OOM_Logo_Discord.png?ex=6a425898&is=6a410718&hm=4d5cdcef9f112a221c9c051460f222c2a216e4939605915986ec2b2bfe4e4b56&';
const WELCOME_CHANNEL_ID = '1443050734051524850';
const REVIEW_CHANNEL_ID = '1501604626464641086';
const HALL_OF_FAME_CHANNEL_ID = '1521152465158930565';
const ADMIN_TOOLS_CHANNEL_ID = '1516440448309268561';
const ADMIN_ROLE_ID = '1460063602353635419';
const DARTCOUNTER_SCREENSHOT_CHANNEL_ID = '1477822351616905327';
const MAGEE_SUPPORT_CHANNEL_ID = '1502486705654206574';
const PLAYER_LIST_SHEET_ID = '1oEAHCMdi66bxEOOx9ULrhK_XGWSSxynEYm356bH1Slg';
const PLAYER_LIST_RANGE = "'Player List'!A:I";
const SHEET_ID = '1oEAHCMdi66bxEOOx9ULrhK_XGWSSxynEYm356bH1Slg';
const OOM_SPREADSHEET_ID = '1EOZMcXUcLNTV6caA9quUOx5W5qH8C4WP7KFSKwWYRvs';
const OOM_RANGE = 'OOM Leaderboard2.0!A:Z';
const DIVISION_CONFIG = {
  '1500028164737335306': {
    divisionName: 'ANZAC Premier #1',
    seasonName: 'Season 3 | 2026',
    sheetId: '14ISPfrS8sZf5iEjze1gYQKJV-X9h1fGhTnGxqk-G0O4',
    range: 'Table!h19:P26',
     sf1WinnerRange: 'Table!F33',
      sf2WinnerRange: 'Table!F34',
      Winner:'Table!J31',
    logo: '1500028164737335306.png',
    sponsorLogo: "Avid Darts Capitals White.png",
    poweredByLogo: 'powered-by.png',
    topBannerLogo: 'sponsored-top-banner.png',

  },

  '1500028427351363646': {
    divisionName: 'ANZAC Premier #2',
    seasonName: 'Season 3 | 2026',
    sheetId: '1IvC-mb51FhvVwjAoWbwae8Ev19Wr8suO3RhZeJ357c8',
     range: 'Table!h19:P26',
      sf1WinnerRange: 'Table!F33',
      sf2WinnerRange: 'Table!F34',
      Winner:'Table!J31',
     logo:'1500028427351363646.png',
     sponsorLogo: "Avid Darts Capitals White.png",
     poweredByLogo: 'powered-by.png',
     topBannerLogo: 'sponsored-top-banner.png',
  },

  '1500028709002940527': {
    divisionName: 'ANZAC Premier #3',
    seasonName: 'Season 3 | 2026',
    sheetId: '1q_7IQ9EBWk8vqllgI73jujQgUDBXM90U00vjcpWyC90',
      range: 'Table!h19:P26',
      sf1WinnerRange: 'Table!F33',
      sf2WinnerRange: 'Table!F34',
      Winner:'Table!J31',
      logo: '1500028709002940527.png',
      sponsorLogo: null,
      poweredByLogo: null,
      topBannerLogo: 'standard-top-banner.png',
  },

  '1500029161564016650': {
    divisionName: 'Trans-Tasman Elite #1',
    seasonName: 'Season 3 | 2026',
    sheetId: '1CBxZCWxs3xOf6So9EMPp4ekL3dIlfODCFvTNs9kPRQk',
      range: 'Table!h19:P26',
      sf1WinnerRange: 'Table!F33',
      sf2WinnerRange: 'Table!F34',
      Winner:'Table!J31',
      logo:'1500029161564016650.png',
      sponsorLogo: "Avid Darts Capitals White.png",
      poweredByLogo: 'powered-by.png',
      topBannerLogo: 'sponsored-top-banner.png',
  },

  '1500029306942918666': {
    divisionName: 'Trans-Tasman Elite #2',
    seasonName: 'Season 3 | 2026',
    sheetId: '1LQUfq2r9jbtAm4aK4etlpA8PSWmrPS8EGzRl35EebLM',
      range: 'Table!h19:P26',
      sf1WinnerRange: 'Table!F33',
      sf2WinnerRange: 'Table!F34',
      Winner:'Table!J31',
      logo:'1500029306942918666.png', 
      sponsorLogo: "Avid Darts Capitals White.png",
      poweredByLogo: 'powered-by.png', 
      topBannerLogo: 'sponsored-top-banner.png',
  },

  '1500031279989657610': {
    divisionName: 'Trans-Tasman Elite #3',
    seasonName: 'Season 3 | 2026',
    sheetId: '1ut1ZnzCMft2UWR_tFauH_zRA5L1uZcoAh3VJz8hnJZQ',
      range: 'Table!h19:P26',
      sf1WinnerRange: 'Table!F33',
      sf2WinnerRange: 'Table!F34',
      Winner:'Table!J31',
      logo: '1500031279989657610.png',
      sponsorLogo: null,
      poweredByLogo: null,
      topBannerLogo: 'standard-top-banner.png',
  },

  '1500031389536620596': {
    divisionName: 'Southern Cross Championship #1',
    seasonName: 'Season 3 | 2026',
    sheetId: '1UJi_CfhXD7LR1Penqi6w5hrd07P4XlDTWI1XTispvvE',
      range: 'Table!h19:P26',
      sf1WinnerRange: 'Table!F33',
      sf2WinnerRange: 'Table!F34',
      Winner:'Table!J31',
      logo: '1500031389536620596.png',
      sponsorLogo: "Avid Darts Capitals White.png",
      poweredByLogo: 'powered-by.png', 
      topBannerLogo: 'sponsored-top-banner.png',    
  },

  '1500031490279604265': {
    divisionName: 'Southern Cross Championship #2',
    seasonName: 'Season 3 | 2026',
    sheetId: '1rMS8LnHyZTOQ5k5vENTXIWQ4hxfQ3LOaS5ARQUVdJo8',
      range: 'Table!h19:P26',
       sf1WinnerRange: 'Table!F33',
      sf2WinnerRange: 'Table!F34',
      Winner:'Table!J31',
      logo: '1500031490279604265.png',
      sponsorLogo: "Avid Darts Capitals White.png",
      poweredByLogo: 'powered-by.png',
      topBannerLogo: 'sponsored-top-banner.png',
  },

  '1500031576996581396': {
    divisionName: 'Southern Cross Championship #3',
    seasonName: 'Season 3 | 2026',
    sheetId: '1viMlo077vfOnOvRFgIC9aAWH7mNHrHBliQ7NT3WubTs',
      range: 'Table!h19:P26',
       sf1WinnerRange: 'Table!F33',
      sf2WinnerRange: 'Table!F34',
      Winner:'Table!J31',
      logo: '1500031576996581396.png',
      sponsorLogo: null,
      poweredByLogo: null,
      topBannerLogo: 'standard-top-banner.png',
  },

  '1500031675277512744': {
    divisionName: 'Tasman Trophy #1',
    seasonName: 'Season 3 | 2026',
    sheetId: '1W6UrqVsGPtUCGpAhkYrAJfySctcUANgdttrT2bgxU7s',
      range: 'Table!h19:P26',
       sf1WinnerRange: 'Table!F33',
      sf2WinnerRange: 'Table!F34',
      Winner:'Table!J31',
      logo:'1500031675277512744.png',
      sponsorLogo: "Avid Darts Capitals White.png",
      poweredByLogo: 'powered-by.png',
      topBannerLogo: 'sponsored-top-banner.png',
  },

  '1500031881486532662': {
    divisionName: 'Tasman Trophy #2',
    seasonName: 'Season 3 | 2026',
    sheetId: '1CqzI23SMiDid_jrWFqLmSZhij_kjkI_6la1u0dnQSWQ',
      range: 'Table!h19:P26',
       sf1WinnerRange: 'Table!F33',
      sf2WinnerRange: 'Table!F34',
      Winner:'Table!J31',
      logo: '1500031881486532662.png',
      sponsorLogo: "Avid Darts Capitals White.png",
      poweredByLogo: 'powered-by.png',
      topBannerLogo: 'sponsored-top-banner.png',
  },

  '1500031951250395176': {
    divisionName: 'Tasman Trophy #3',
    seasonName: 'Season 3 | 2026',
    sheetId: '1MALrN2aY2lYx53Q-hMTkeWNlS9iCDLI_3a26eDBRV94',
      range: 'Table!h19:P26',
       sf1WinnerRange: 'Table!F33',
      sf2WinnerRange: 'Table!F34',
      Winner:'Table!J31',
      logo: '1500031951250395176.png',
      sponsorLogo: null,
      poweredByLogo: null,
      topBannerLogo: 'standard-top-banner.png',
  },

  '1530737297018982451': {
    divisionName: 'Tasman Trophy #4',
    seasonName: 'Season 3 | 2026',
    sheetId: '1ju9zpyR-Cj3Ht9r9-cll4ca3bet8kb2VISZyouYYWR0',
    channelId: '1530735763094900826',
    range: 'Table!h19:P26',
    sf1WinnerRange: 'Table!F33',
    sf2WinnerRange: 'Table!F34',
    Winner: 'Table!J31',
    logo: '1530737297018982451.png',
    sponsorLogo: null,
    poweredByLogo: null,
    topBannerLogo: 'standard-top-banner.png',
  }
};
const SHEET_RANGE = 'TDR-Player registration!A:J';
const { runAudit } = require("./discordAudit");
const Anzac_Premier_1 = '14ISPfrS8sZf5iEjze1gYQKJV-X9h1fGhTnGxqk-G0O4';
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
  oomTop10: '1521133387488821399',
  oomNumber1: '1521133297546297437',
};

const ACHIEVEMENT_ROLES = {
  divisionChampion: '1521132839012139008',
  majorChampion: '1521132643117432863',
  weeklyWinner: '1521133216629788712',
  weeklySeriesChampion: '1521133033430843553',
};

const SEASONS = [
  'Season 1',
  'Season 2',
  'Season 3',
  'Season 4',
  'Season 5',
];

const DIVISIONS = [
  'Anzac Premier 1',
  'Anzac Premier 2',
  'Anzac Premier 3',
  'Trans Tasman Elite 1',
  'Trans Tasman Elite 2',
  'Trans Tasman Elite 3',
  'Southern Cross Championship 1',
  'Southern Cross Championship 2',
  'Southern Cross Championship 3',
  'Tasman Trophy 1',
  'Tasman Trophy 2',
  'Tasman Trophy 3',
  'Tasman Trophy 4',
];

const MAJORS = [
  'ANZAC Cup',
  'Oceania Masters',
];

const WEEKLY_SERIES = [
  'Dart Depot Weekly Series',
];

const WEEKS = [
  'Week 1',
  'Week 2',
  'Week 3',
  'Week 4',
  'Week 5',
  'Week 6',
  'Week 7',
  'Finals Week',
];

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
async function sendMageeLeagueHubMessage() {
    const channel = await client.channels.fetch(MAGEE_SUPPORT_CHANNEL_ID);

    const embed = new EmbedBuilder()
        .setColor('#ffcc00')
        .setTitle('🎯 My TDR Hub')
        .setDescription(
`Welcome to your **TDR Player Hub**!

Use the buttons below to access your TDR profile, league standings, fixtures and Order of Merit.

🎯 **My TDR Stats**
View your complete TDR player profile including career statistics, achievements and milestones.

📊 **My League Standing**
Check your current Tasman Series ladder and division standings.

📅 **My Tasman Series Fixtures**
View your completed Tasman Series matches, results and upcoming fixtures organised by week.

🏆 **OOM Ranking**
See your live position on the TDR Order of Merit.

Need a hand?
Hit **Admin Support** and one of the TDR Admin team will be happy to help.

**Compete • Respect • Unite**`
)

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('my_tdr_stats')
            .setLabel('My TDR Stats')
            .setEmoji('🎯')
            .setStyle(ButtonStyle.Primary),

        new ButtonBuilder()
            .setCustomId('my_league_table')
            .setLabel('My League Standing')
            .setEmoji('📊')
            .setStyle(ButtonStyle.Primary),

        new ButtonBuilder()
            .setCustomId('oom_ranking')
            .setLabel('OOM Ranking')
            .setEmoji('🏆')
            .setStyle(ButtonStyle.Secondary),

        new ButtonBuilder()
            .setCustomId('admin_support')
            .setLabel('Admin Support')
            .setEmoji('🛠')
            .setStyle(ButtonStyle.Danger)
    );

    const row2 = new ActionRowBuilder().addComponents(
  new ButtonBuilder()
    .setCustomId('my_tasman_fixtures')
    .setLabel('My Tasman Series Fixtures')
    .setEmoji('📅')
    .setStyle(ButtonStyle.Primary)
);
    await channel.send({
  embeds: [embed],
  components: [row, row2]
});

    console.log('Magee League Hub message sent.');
}
client.once('clientReady', async () => {
 //await sendMageeAdminToolsMessage();
  console.log(`Logged in as ${client.user.tag}`);
  startFixtureMonitoring(client, sheets, DIVISION_CONFIG);

  /*
=========================================
TEMPORARY FIXTURE MONITORING TEST
Used during development to test a single
fixture reminder before enabling the
scheduled Thursday scan.
=========================================


  try {
  await runSingleFixtureTest(
    client,
    sheets,
    DIVISION_CONFIG,
    'Trans-Tasman Elite #3',
    'W7-M4'
  );
} catch (error) {
  console.error('[Fixture Monitoring Test] FAILED:', error.message);
}
  */
  console.log('Magee pending approval check timer started.');
  //await sendMageeLeagueHubMessage();

    await syncOOMRoles(client, sheets, OOM_SPREADSHEET_ID, OOM_RANGE);
  startOOMRoleSyncTimer(client, sheets, OOM_SPREADSHEET_ID, OOM_RANGE);

  await syncAchievementRoles(
    client,
    sheets,
    OOM_SPREADSHEET_ID,
    'Player Data!A:AC'
);

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

function getAchievementMessage(selectedRole, member) {
  const mention = `<@${member.id}>`;

  const messages = {
    divisionChampion: `# 🏆 DIVISION CHAMPION 🏆

Congratulations ${mention}! 🎉

After a fantastic season, you have officially been crowned a **🏆 TDR Division Champion!**

This achievement represents consistency, determination and quality darts across an entire season.

**Welcome to the TDR Hall of Champions!**

*Compete • Respect • Unite*`,

    majorChampion: `# 🏅 MAJOR CHAMPION 🏅

Congratulations ${mention}! 🎉

You've conquered one of TDR's biggest stages and officially become a **🏅 TDR Major Champion!**

Winning a major is one of the highest honours in TDR and your achievement will forever be part of TDR history.

**Welcome to the TDR Hall of Champions!**

*Compete • Respect • Unite*`,

    weeklyWinner: `# ⭐ WEEKLY WINNER ⭐

Congratulations ${mention}! 🎉

Another fantastic tournament, another title!

You have officially been recognised as a **⭐ TDR Weekly Winner!**

Every tournament victory adds to your growing TDR career.

*Compete • Respect • Unite*`,

    weeklySeriesChampion: `# 🎯 WEEKLY SERIES CHAMPION 🎯

Congratulations ${mention}! 🎉

After an outstanding series of performances, you have claimed the **🎯 TDR Weekly Series Championship!**

A brilliant achievement that showcases your consistency throughout the competition.

*Compete • Respect • Unite*`,

    oomTop32: `# 🎯 TOP 32 ACHIEVED 🎯

Congratulations ${mention}! 🎉

You have officially broken into the **TDR Order of Merit Top 32!**

Keep climbing!

*Compete • Respect • Unite*`,

    oomTop10: `# ⭐ TOP 10 IN THE ORDER OF MERIT ⭐

Congratulations ${mention}! 🎉

You have officially earned a place inside the **TDR Order of Merit Top 10!**

The race to Number One continues...

*Compete • Respect • Unite*`,

    oomNumber1: `# 🥇 OOM NUMBER ONE 🥇

Congratulations ${mention}! 👑

You have reached the summit of TDR!

You are officially the **#1 ranked player in the TDR Order of Merit!**

Enjoy the top spot... everyone else is coming for you! 🎯

*Compete • Respect • Unite*`
  };

  return messages[selectedRole] || `🏆 Congratulations ${mention}! You have unlocked a new TDR achievement.`;
}

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

async function sendMageeAdminToolsMessage() {
    const channel = await client.channels.fetch(ADMIN_TOOLS_CHANNEL_ID);

    const embed = new EmbedBuilder()
        .setColor('#ffcc00')
        .setTitle('🛠️ Magee Admin Tools')
        .setDescription(
            `TDR Admin control panel.\n\n` +
            `Use the buttons below to generate admin-only TDR media assets.\n\n` +
            `⚠️ Admin role required.`
        );

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('generate_all_league_tables')
            .setLabel('Generate All League Tables')
            .setEmoji('📊')
            .setStyle(ButtonStyle.Primary),

             new ButtonBuilder()
        .setCustomId('admin_award_role')
        .setLabel('Award Achievement')
        .setEmoji('🏆')
        .setStyle(ButtonStyle.Success),

        new ButtonBuilder()
        .setCustomId('division_fixtures_status')
        .setLabel('Division Fixtures Status')
        .setEmoji('📋')
        .setStyle(ButtonStyle.Secondary)
    );

    await channel.send({
        embeds: [embed],
        components: [row]
    });

    console.log('Magee Admin Tools message sent.');
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
async function getFinalsData(divisionConfig) {
    if (!divisionConfig.finalsRange) return [];

    const rows = await getSheetValues(
        divisionConfig.sheetId,
        divisionConfig.finalsRange
    );

    return rows.flat();
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

const approveButton = new ButtonBuilder()
  .setCustomId(`approve_onboarding_${user.id}`)
  .setLabel('Approve')
  .setStyle(ButtonStyle.Success)
  .setEmoji('✅');

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
    approveButton,
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

async function getPlayerOOMByDiscordId(discordId) {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: OOM_SPREADSHEET_ID,
    range: OOM_RANGE,
  });

  const rows = response.data.values || [];
  const headers = rows[0];
  const data = rows.slice(1);

  const rankCol = headers.indexOf('Rank');
  const playerCol = headers.indexOf('Player');
  const pointsCol = headers.indexOf('Total OOM Points');
  const discordCol = headers.indexOf('Discord ID');
  

  if ([rankCol, playerCol, discordCol, pointsCol].includes(-1)) {
    throw new Error('OOM sheet headers missing. Check Rank, Player, Discord ID, Total OOM Points.');
  }

  const row = data.find(r => String(r[discordCol]).trim() === String(discordId));

  if (!row) return null;

  return {
    rank: row[rankCol],
    playerName: row[playerCol],
    discordId: row[discordCol],
    points: row[pointsCol],
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

  console.log('Interaction received:', interaction.customId);

if (
  interaction.isButton() &&
  interaction.customId === 'division_fixtures_status'
) {
  await handleDivisionFixtureStatus(
    interaction,
    sheets,
    DIVISION_CONFIG,
    ADMIN_ROLE_ID
  );

  return;
}

if (
    interaction.isButton() &&
    interaction.customId === 'generate_all_league_tables'
) {
    console.log('Generate all league tables button pressed');

    await interaction.deferReply({ ephemeral: true });

    try {
        const targetChannel = interaction.channel;

         console.log('Division count:', Object.keys(DIVISION_CONFIG).length);
    console.log('Division IDs:', Object.keys(DIVISION_CONFIG));

        for (const divisionId of Object.keys(DIVISION_CONFIG)) {
            const divisionConfig = DIVISION_CONFIG[divisionId];

            console.log(`Generating ${divisionConfig.divisionName}...`);

            const imagePath = await generateLeagueTableImage(divisionConfig);

            await targetChannel.send({
                content: `📊 ${divisionConfig.divisionName}`,
                files: [imagePath]
            });
        }

        await interaction.editReply({
            content: '✅ All league tables generated successfully.'
        });

    } catch (error) {
        console.error('Generate all league tables error:', error);

        await interaction.editReply({
            content: '❌ Error generating league tables. Check console.'
        });
    }

    

    return;
}

if (interaction.isButton() && interaction.customId === 'admin_award_role') {
  const roleMenu = new StringSelectMenuBuilder()
    .setCustomId('select_achievement_role')
    .setPlaceholder('Select achievement role to award')
    .addOptions([
      { label: 'Division Champion', value: 'divisionChampion', emoji: '🏆' },
      { label: 'Major Champion', value: 'majorChampion', emoji: '🏅' },
      { label: 'Weekly Winner', value: 'weeklyWinner', emoji: '⭐' },
    ]);

  const row = new ActionRowBuilder().addComponents(roleMenu);

  return interaction.reply({
    content: '🏆 **Award Achievement Role**\n\nSelect the achievement role:',
    components: [row],
    ephemeral: true
  });
}

if (interaction.isStringSelectMenu() && interaction.customId === 'select_achievement_role') {
  const selectedRole = interaction.values[0];

  if (selectedRole === 'divisionChampion') {
    const seasonMenu = new StringSelectMenuBuilder()
      .setCustomId(`select_achievement_season_${selectedRole}`)
      .setPlaceholder('Select the season')
      .addOptions(
        SEASONS.map(season => ({
          label: season,
          value: season
        }))
      );

    const row = new ActionRowBuilder().addComponents(seasonMenu);

    return interaction.update({
      content: '🏆 **Division Champion**\n\nSelect the season:',
      components: [row]
    });
  }

  if (selectedRole === 'weeklyWinner') {
    const seasonMenu = new StringSelectMenuBuilder()
      .setCustomId('select_weekly_season')
      .setPlaceholder('Select the season')
      .addOptions(
        SEASONS.map(season => ({
          label: season,
          value: season
        }))
      );

    const row = new ActionRowBuilder().addComponents(seasonMenu);

    return interaction.update({
      content: '⭐ **Weekly Winner**\n\nSelect the season:',
      components: [row]
    });
  }

  if (selectedRole === 'majorChampion') {
    const majorMenu = new StringSelectMenuBuilder()
      .setCustomId('select_major')
      .setPlaceholder('Select the major')
      .addOptions(
        MAJORS.map(major => ({
          label: major,
          value: major
        }))
      );

    const row = new ActionRowBuilder().addComponents(majorMenu);

    return interaction.update({
      content: '🏅 **Major Champion**\n\nSelect the major:',
      components: [row]
    });
  }

  const userMenu = new UserSelectMenuBuilder()
    .setCustomId(`select_achievement_player_${selectedRole}`)
    .setPlaceholder('Select the player to award')
    .setMinValues(1)
    .setMaxValues(1);

  const row = new ActionRowBuilder().addComponents(userMenu);

  return interaction.update({
    content: '👤 **Select Player**\n\nNow select the player to receive this achievement:',
    components: [row]
  });
}

if (interaction.isStringSelectMenu() && interaction.customId === 'select_major') {
  const selectedMajor = interaction.values[0];

  const yearMenu = new StringSelectMenuBuilder()
    .setCustomId(`select_major_year_${encodeURIComponent(selectedMajor)}`)
    .setPlaceholder('Select the year')
    .addOptions([
      { label: '2026', value: '2026' },
      { label: '2027', value: '2027' },
      { label: '2028', value: '2028' }
    ]);

  const row = new ActionRowBuilder().addComponents(yearMenu);

  return interaction.update({
    content:
      `🏅 **Major Champion**\n\n` +
      `Major: **${selectedMajor}**\n\n` +
      `Now select the year:`,
    components: [row]
  });
}

if (
  interaction.isStringSelectMenu() &&
  interaction.customId.startsWith('select_major_year_')
) {
  const selectedMajor = decodeURIComponent(
    interaction.customId.replace('select_major_year_', '')
  );

  const selectedYear = interaction.values[0];

  const userMenu = new UserSelectMenuBuilder()
    .setCustomId(
      `select_achievement_player_majorChampion_${encodeURIComponent(selectedMajor)}_${encodeURIComponent(selectedYear)}`
    )
    .setPlaceholder('Select the Champion')
    .setMinValues(1)
    .setMaxValues(1);

  const row = new ActionRowBuilder().addComponents(userMenu);

  return interaction.update({
    content:
      `🏅 **Major Champion**\n\n` +
      `Major: **${selectedMajor}**\n` +
      `Year: **${selectedYear}**\n\n` +
      `Now select the Champion:`,
    components: [row]
  });
}

if (
  interaction.isStringSelectMenu() &&
  interaction.customId.startsWith('select_achievement_season_')
) {
  const selectedRole = interaction.customId.replace('select_achievement_season_', '');
  const selectedSeason = interaction.values[0];

  const divisionMenu = new StringSelectMenuBuilder()
    .setCustomId(`select_achievement_division_${selectedRole}_${encodeURIComponent(selectedSeason)}`)
    .setPlaceholder('Select the Division')
    .addOptions(
      DIVISIONS.map(division => ({
        label: division,
        value: division
      }))
    );

  const row = new ActionRowBuilder().addComponents(divisionMenu);

  return interaction.update({
    content:
      `🏆 **Division Champion**\n\n` +
      `Season: **${selectedSeason}**\n\n` +
      `Now select the Division:`,
    components: [row]
  });
}

if (
  interaction.isStringSelectMenu() &&
  interaction.customId.startsWith('select_achievement_division_')
) {
  const parts = interaction.customId
    .replace('select_achievement_division_', '')
    .split('_');

  const selectedRole = parts[0];
  const selectedSeason = decodeURIComponent(parts.slice(1).join('_'));
  const selectedDivision = interaction.values[0];

  const userMenu = new UserSelectMenuBuilder()
    .setCustomId(
      `select_achievement_player_${selectedRole}_${encodeURIComponent(selectedSeason)}_${encodeURIComponent(selectedDivision)}`
    )
    .setPlaceholder('Select the Champion')
    .setMinValues(1)
    .setMaxValues(1);

  const row = new ActionRowBuilder().addComponents(userMenu);

  return interaction.update({
    content:
      `🏆 **Division Champion**\n\n` +
      `Season: **${selectedSeason}**\n` +
      `Division: **${selectedDivision}**\n\n` +
      `Now select the Champion:`,
    components: [row]
  });
}

if (interaction.isStringSelectMenu() && interaction.customId === 'select_weekly_season') {
  const selectedSeason = interaction.values[0];

  const weekMenu = new StringSelectMenuBuilder()
    .setCustomId(`select_weekly_week_${encodeURIComponent(selectedSeason)}`)
    .setPlaceholder('Select the Week')
    .addOptions(
      WEEKS.map(week => ({
        label: week,
        value: week
      }))
    );

  const row = new ActionRowBuilder().addComponents(weekMenu);

  return interaction.update({
    content:
      `⭐ **Weekly Winner**\n\n` +
      `Season: **${selectedSeason}**\n\n` +
      `Select the week:`,
    components: [row]
  });
}

if (
  interaction.isStringSelectMenu() &&
  interaction.customId.startsWith('select_weekly_week_')
) {
  const selectedSeason = decodeURIComponent(
    interaction.customId.replace('select_weekly_week_', '')
  );

  const selectedWeek = interaction.values[0];

  const achievementRole =
    selectedWeek === 'Finals Week'
      ? 'weeklySeriesChampion'
      : 'weeklyWinner';

  const userMenu = new UserSelectMenuBuilder()
    .setCustomId(
      `select_achievement_player_${achievementRole}_${encodeURIComponent(selectedSeason)}_${encodeURIComponent(selectedWeek)}`
    )
    .setPlaceholder('Select the Winner')
    .setMinValues(1)
    .setMaxValues(1);

  const row = new ActionRowBuilder().addComponents(userMenu);

  return interaction.update({
    content:
      `⭐ **Weekly Winner**\n\n` +
      `Season: **${selectedSeason}**\n` +
      `Week: **${selectedWeek}**\n\n` +
      `Now select the Winner:`,
    components: [row]
  });
}

if (
  interaction.isUserSelectMenu() &&
  interaction.customId.startsWith('select_achievement_player_')
) {
  try {
    const data = interaction.customId.replace('select_achievement_player_', '');
    const parts = data.split('_');

    const selectedRole = parts[0];
    const selectedSeason = parts[1] ? decodeURIComponent(parts[1]) : '';
    const selectedDivision = parts.length > 2
      ? decodeURIComponent(parts.slice(2).join('_'))
      : '';
    const selectedWeek = selectedDivision;
    const selectedMajor = selectedSeason;
    const selectedYear = selectedDivision;

    const playerId = interaction.values[0];

    const roleId = ACHIEVEMENT_ROLES[selectedRole];

    if (!roleId) {
      return interaction.update({
        content: '❌ Unknown achievement role.',
        components: []
      });
    }

    const member = await interaction.guild.members.fetch(playerId).catch(() => null);

    if (!member) {
      return interaction.update({
        content: '❌ Could not find that player.',
        components: []
      });
    }

    const role = interaction.guild.roles.cache.get(roleId);

    if (!role) {
      return interaction.update({
        content: '❌ Could not find that Discord role. Check the Role ID.',
        components: []
      });
    }

    const alreadyHadRole = member.roles.cache.has(roleId);

    if (!alreadyHadRole) {
      await member.roles.add(role);
    }

    const hallOfFameChannel = interaction.guild.channels.cache.get(HALL_OF_FAME_CHANNEL_ID);

    let awardMessage = '';

    if (selectedRole === 'divisionChampion') {
      awardMessage = `# 🏆 ${selectedSeason.toUpperCase()} DIVISION CHAMPION 🏆

Congratulations ${member}! 🎉

━━━━━━━━━━━━━━━━━━

👤 **Champion**
${member}

🏆 **Division**
${selectedDivision}

📅 **Season**
${selectedSeason}

━━━━━━━━━━━━━━━━━━

🏅 Your name has been permanently added to the
**TDR Hall of Champions**

*Compete • Respect • Unite*`;
    }

    if (selectedRole === 'majorChampion') {
      awardMessage = `# 🏅 ${selectedYear} ${selectedMajor.toUpperCase()} CHAMPION 🏅

Congratulations ${member}! 🎉

━━━━━━━━━━━━━━━━━━

👤 **Champion**
${member}

🏆 **Major**
${selectedMajor}

📅 **Year**
${selectedYear}

━━━━━━━━━━━━━━━━━━

🏅 Your name has been permanently added to the
**TDR Hall of Champions**

*Compete • Respect • Unite*`;
    }

    if (selectedRole === 'weeklyWinner') {
      awardMessage = `# 🎯 ${selectedSeason.toUpperCase()} • ${selectedWeek.toUpperCase()} WINNER 🎯

Congratulations ${member}! 🎉

━━━━━━━━━━━━━━━━━━

👤 **Winner**
${member}

📅 **Season**
${selectedSeason}

⭐ **Week**
${selectedWeek}

━━━━━━━━━━━━━━━━━━

🏅 Your name has been permanently added to the
**TDR Hall of Champions**

*Compete • Respect • Unite*`;
    }

    if (selectedRole === 'weeklySeriesChampion') {
      awardMessage = `# ⭐ ${selectedSeason.toUpperCase()} THE DART DEPOT WEEKLY SERIES CHAMPION ⭐

Congratulations ${member}! 🎉

━━━━━━━━━━━━━━━━━━

👤 **Champion**
${member}

🏆 **Competition**
The Dart Depot Weekly Series

📅 **Season**
${selectedSeason}

━━━━━━━━━━━━━━━━━━

🏅 Your name has been permanently added to the
**TDR Hall of Champions**

*Compete • Respect • Unite*`;
    }

    if (selectedRole === 'oomTop32') {
      awardMessage = `# 🎯 OOM TOP 32 🎯

Congratulations ${member}! 🎉

You have officially earned your place inside the **TDR OOM Top 32**.

**Welcome to the TDR Hall of Champions!**

*Compete • Respect • Unite*`;
    }

    if (selectedRole === 'oomTop10') {
      awardMessage = `# ⭐ OOM TOP 10 ⭐

Congratulations ${member}! 🎉

You have officially earned your place inside the **TDR OOM Top 10**.

**Welcome to the TDR Hall of Champions!**

*Compete • Respect • Unite*`;
    }

       if (selectedRole === 'oomNumber1') {
      awardMessage = `# 🥇 OOM #1 🥇

Congratulations ${member}! 🎉

You have officially reached **#1 on the TDR Order of Merit**.

**Welcome to the TDR Hall of Champions!**

*Compete • Respect • Unite*`;
    }

    if (!awardMessage) {
      awardMessage = `# 🏆 ACHIEVEMENT UNLOCKED 🏆

Congratulations ${member}! 🎉

You have unlocked **${role.name}**.

**Welcome to the TDR Hall of Champions!**

*Compete • Respect • Unite*`;
    }

    if (hallOfFameChannel) {
      await hallOfFameChannel.send({
        content: awardMessage
      });
    }

    return interaction.update({
      content: `✅ **Achievement Recorded**

👤 **Player:** ${member}
🎖️ **Achievement:** **${role.name}**
${alreadyHadRole ? 'ℹ️ Player already had this role.' : '✅ Role added successfully.'}

📢 Posted to **TDR Hall Of Champions**.`,
      components: []
    });

  } catch (error) {
    console.error('Achievement Player Select Error:', error);

    return interaction.update({
      content: '❌ Error awarding achievement role. Check terminal.',
      components: []
    });
  }
}
if (
  interaction.isButton() &&
  interaction.customId === 'my_tasman_fixtures'
) {
  await handleTasmanFixtures(
    interaction,
    sheets,
    DIVISION_CONFIG
  );

  return;
}
if (interaction.isButton() && interaction.customId === 'oom_ranking') {
  await interaction.deferReply({ ephemeral: true });

  try {
    const oom = await getPlayerOOMByDiscordId(interaction.user.id);

    if (!oom) {
      await interaction.editReply({
        content: `⚠️ **OOM Ranking Not Found**

I couldn't find your OOM ranking yet.

This usually means:
• Your Discord ID is not listed in **OOM Leaderboard 2.0**
• You have not played an OOM eligible match yet
• Your player name needs to be checked by Admin

Please hit **Admin Support** if this doesn't look right.`
      });
      return;
    }

    const oomEmbed = {
      color: 0xF1C40F,
      title: '🏆 TDR ORDER OF MERIT',
      description: 'Your current position in the official TDR Order of Merit.',
      fields: [
        {
          name: '👤 Player',
          value: `**${oom.playerName}**`,
          inline: true,
        },
        {
          name: '🥇 Current Rank',
          value: `**#${oom.rank}**`,
          inline: true,
        },
        {
          name: '⭐ OOM Points',
          value: `**${oom.points}**`,
          inline: true,
        },
        {
          name: '📈 What is the OOM?',
          value:
            'The Order of Merit rewards your performances across **Tasman Series**, **Weekly Series**, and **Major Events**. Every match contributes towards your overall ranking.',
          inline: false,
        },
        {
          name: '🎯 Keep Climbing',
          value:
            'Play league fixtures, weekly events and majors to continue earning OOM points and climb the rankings!',
          inline: false,
        },
      ],
      thumbnail: {
        url: 'https://cdn.discordapp.com/attachments/1520754478301581403/1520754608715337888/TDR_OOM_Logo_Discord.png?ex=6a43aa18&is=6a425898&hm=6723e75e7b0bcc78ae1d758313717e0e121ca0c99401f3e08d051e9755cbf87a&'
      },
      footer: {
        text: 'TDR Online Darts • Compete • Respect • Unite',
      },
      timestamp: new Date().toISOString(),
    };

    await interaction.editReply({
      embeds: [oomEmbed],
    });

  } catch (error) {
    console.error('OOM Ranking Error:', error);

    await interaction.editReply({
      content: `❌ Something went wrong while pulling your OOM ranking.

Please tag Admin and let them know Magee had an OOM error.`,
    });
  }

  return;
}
if (interaction.isButton() && interaction.customId.startsWith('approve_onboarding_')) {

  if (!interaction.member.roles.cache.has(ADMIN_ROLE_ID)) {
    await interaction.reply({
      content: '❌ Admin only.',
      ephemeral: true
    });
    return;
  }

  const targetUserId = interaction.customId.replace('approve_onboarding_', '');

  await interaction.reply({
    content: `✅ Registration approved for <@${targetUserId}>`,
    ephemeral: true
  });

  const player = await checkPlayerOnboarded(targetUserId);

  if (!player) {
    return;
  }

  await updatePlayerStatus(player.rowNumber, 'Approved');

  const targetUser = await client.users.fetch(targetUserId);

  const playerListResult = await appendApprovedPlayerToPlayerList(targetUser, player);

  await logApprovalDetails(
    player.rowNumber,
    playerListResult.playerId || 'Existing Player',
    interaction.user.username
  );

  const member = await interaction.guild.members.fetch(targetUserId);

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

  await interaction.message.edit({
    content: `${interaction.message.content}

✅ Approved by: ${interaction.user}`,
    components: []
  }).catch(() => {});

  return;
}

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
if (interaction.isButton() && interaction.customId === 'my_league_table') {
    await interaction.deferReply({ ephemeral: true });

    try {
        const memberRoles = interaction.member.roles.cache.map(role => role.id);

        console.log('USER ROLE IDS:');
        console.log(memberRoles);

        const divisionRoleId = Object.keys(DIVISION_CONFIG).find(roleId =>
            interaction.member.roles.cache.has(roleId)
        );

        if (!divisionRoleId) {
            await interaction.editReply({
                content: '❌ I could not find a Tasman Series division role on your Discord profile. Please press Admin Support so the team can check your roles.'
            });
            return;
        }

        const divisionConfig = DIVISION_CONFIG[divisionRoleId];

        console.log(`Generating league table for ${interaction.user.username}: ${divisionConfig.divisionName}`);

        const imagePath = await generateLeagueTableImage(divisionConfig);
        const attachment = new AttachmentBuilder(imagePath);

        await interaction.editReply({
            content: `📊 Here is your current league table: **${divisionConfig.divisionName}**`,
            files: [attachment]
        });

    } catch (error) {
        console.error('League table button failed:', error);

        await interaction.editReply({
            content: '❌ Magee had trouble generating your league table. Admins will need to check the render logs.'
        });
    }

    return;
}

if (interaction.isButton() && interaction.customId === 'my_tdr_stats') {
  return handleMyTdrStats(
    interaction,
    sheets,
    OOM_SPREADSHEET_ID,
    OOM_RANGE,
    'Player Data!A:AC'
  );
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
  }}
);
async function generateLeagueTableImage(divisionConfig) {

    const templatePath = path.join(__dirname, 'assets', 'templates', 'league-table-template.png');

    const image = await loadImage(templatePath);

    const tdrLogo = await loadImage(
    path.join(__dirname, 'assets', 'logos', 'tdr-logo.png')
);

const divisionLogo = await loadImage(
    path.join(__dirname, 'assets', 'logos', 'divisions', divisionConfig.logo)
);

let topBannerLogo = null;

if (divisionConfig.topBannerLogo) {
    topBannerLogo = await loadImage(
        path.join(
            __dirname,
            'assets',
            'logos',
            'banners',
            divisionConfig.topBannerLogo
        )
    );
}

let sponsorLogo = null;

if (divisionConfig.sponsorLogo) {
    sponsorLogo = await loadImage(
        path.join(__dirname, 'assets', 'logos', 'sponsors', divisionConfig.sponsorLogo)
    );
}

let poweredByLogo = null;

if (divisionConfig.poweredByLogo) {
    poweredByLogo = await loadImage(
        path.join(__dirname, 'assets', 'logos', 'Banners', divisionConfig.poweredByLogo)
    );
}

    const canvas = createCanvas(image.width, image.height);
    const ctx = canvas.getContext('2d');

    // Draw template
    ctx.drawImage(image, 0, 0);

    // GOLD TEXT
    ctx.fillStyle = '#ebb812';
    ctx.shadowColor = '#ebb812';
ctx.shadowBlur = 2;

    // TITLE
ctx.font = 'bold 38px Arial';
ctx.fillStyle = '#f0b907';
ctx.fillText("SEASON 3 | 2026", 520, 120);

ctx.font = 'bold 32px Arial';
ctx.fillText("TDR TASMAN SERIES", 520, 160);

// Division Name
if (divisionConfig.divisionName.includes('Southern Cross Championship')) {
    ctx.font = 'bold 22px Arial';
} else {
    ctx.font = 'bold 28px Arial';
}

ctx.fillStyle = '#ebb812';
ctx.fillText(divisionConfig.divisionName, 520, 200);

ctx.fillStyle = '#f0b907';

// TURN OFF GLOW FOR LOGOS
ctx.shadowColor = 'transparent';
ctx.shadowBlur = 0;
ctx.shadowOffsetX = 0;
ctx.shadowOffsetY = 0;
  

    // LOGOS
    //ctx.drawImage(tdrLogo, 20, 20, 320, 320);

ctx.drawImage(divisionLogo, 110, 20, 300, 380);

if (poweredByLogo) {
    ctx.drawImage(poweredByLogo, 890, 810, 110, 40);
}
if (sponsorLogo) {
    ctx.drawImage(sponsorLogo, 815, 900, 250, 120);
}
if (topBannerLogo) {
    ctx.drawImage(topBannerLogo, 890, 5, 860, 205);
}

    // TABLE DATA
const rows = await getSheetValues(
    divisionConfig.sheetId,
    divisionConfig.range
);

console.log(`League table data pulled for ${divisionConfig.divisionName}`);
console.log(rows);

const players = rows
    .filter(row => row && row[0])
    .map((row, index) => [
        (index + 1).toString(),
        row[0] || '',
        row[1] || '0',
        row[2] || '0',
        row[3] || '0',
        row[4] || '0',
        row[5] || '0',
        row[6] || '0',
        row[7] || '0',
        row[8] || '0'
    ]);

const top4 = players.slice(0, 4);

const sf1WinnerRows = await getSheetValues(divisionConfig.sheetId, divisionConfig.sf1WinnerRange);
const sf2WinnerRows = await getSheetValues(divisionConfig.sheetId, divisionConfig.sf2WinnerRange);

const sf1Winner = sf1WinnerRows?.[0]?.[0] || 'TBC';
const sf2Winner = sf2WinnerRows?.[0]?.[0] || 'TBC';

const winnerRows = await getSheetValues(
    divisionConfig.sheetId,
    divisionConfig.Winner
);

const champion = winnerRows?.[0]?.[0] || 'TBC';

const TABLE = {
    startY: 322,
    rowHeight: 55,

    posX: 580,
    playerX: 687,

    playedX: 922,
    winsX: 1032,
    drawsX: 1135,
    lossesX: 1250,
    legsWonX: 1365,
    legsLostX: 1483,
    legDiffX: 1595,
    pointsX: 1710
};

ctx.shadowColor = 'transparent';
ctx.shadowBlur = 0;
ctx.font = 'bold 21px Arial';

players.forEach((player, index) => {
    const y = TABLE.startY + (index * TABLE.rowHeight);

    ctx.fillStyle = '#FFFFFF';

    ctx.textAlign = 'center';
    ctx.fillText(player[0], TABLE.posX, y);

    ctx.textAlign = 'left';
    ctx.fillText(player[1], TABLE.playerX, y);

    ctx.textAlign = 'right';
    ctx.fillText(player[2], TABLE.playedX, y);
    ctx.fillText(player[3], TABLE.winsX, y);
    ctx.fillText(player[4], TABLE.drawsX, y);
    ctx.fillText(player[5], TABLE.lossesX, y);
    ctx.fillText(player[6], TABLE.legsWonX, y);
    ctx.fillText(player[7], TABLE.legsLostX, y);
    ctx.fillText(player[8], TABLE.legDiffX, y);

    ctx.fillStyle = '#f5c400';
    ctx.fillText(player[9], TABLE.pointsX, y);
});

// FINALS BRACKET DATA
const BRACKET = {
    sf1Player1X: 260,
    sf1Player1Y: 740,

    sf1Player2X: 260,
    sf1Player2Y: 785,

    sf2Player1X: 260,
    sf2Player1Y: 915,

    sf2Player2X: 260,
    sf2Player2Y: 965,
};

ctx.shadowColor = 'transparent';
ctx.shadowBlur = 0;
ctx.fillStyle = 'hsl(0, 0%, 100%)';
ctx.font = 'bold 22px Arial';
ctx.textAlign = 'left';

// SF1 = 1st v 4th
ctx.fillText(top4[0]?.[1] || 'TBC', BRACKET.sf1Player1X, BRACKET.sf1Player1Y);
ctx.fillText(top4[3]?.[1] || 'TBC', BRACKET.sf1Player2X, BRACKET.sf1Player2Y);

// SF2 = 2nd v 3rd
ctx.fillText(top4[1]?.[1] || 'TBC', BRACKET.sf2Player1X, BRACKET.sf2Player1Y);
ctx.fillText(top4[2]?.[1] || 'TBC', BRACKET.sf2Player2X, BRACKET.sf2Player2Y);

// Final SF1 Winner VS SF2 Winner

ctx.fillStyle = '#FFFFFF';
ctx.font = 'bold 18px Arial';
ctx.textAlign = 'left';

ctx.fillText(sf1Winner, 640, 820);
ctx.fillText(sf2Winner, 638, 865);

// WINNER 

ctx.shadowColor = '#f5c400';
ctx.shadowBlur = 12;

ctx.fillStyle = '#f5c400';
ctx.font = 'bold 50px Arial';
ctx.textAlign = 'center';

ctx.fillText(champion, 1395, 895);

// SAVE IMAGE
const buffer = canvas.toBuffer('image/png');

// Create safe file name from division name
const safeDivisionName = divisionConfig.divisionName.replace(/[^a-z0-9]/gi, '_');

const outputPath = path.join(
    __dirname,
    'generated',
    `${safeDivisionName}-league-table.png`
);

if (!fs.existsSync(path.join(__dirname, 'generated'))) {
    fs.mkdirSync(path.join(__dirname, 'generated'));
}

fs.writeFileSync(outputPath, buffer);

console.log('League table image generated:', outputPath);

return outputPath;
}
client.login(process.env.DISCORD_TOKEN);
