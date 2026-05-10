const { REST, Routes } = require('discord.js');

const commands = [
  {
    name: 'register',
    description: 'Register for the TDR platform'
  },
  {
    name: 'onboarded',
    description: 'Check if you are already onboarded with TDR'
  },
  {
    name: 'approve',
    description: 'Approve a TDR onboarding registration',
    options: [
      {
        name: 'user',
        description: 'The Discord user to approve',
        type: 6,
        required: true
      }
    ]
  },
  {
    name: 'adminpending',
    description: 'Show all TDR players pending onboarding approval'
  },
  {
  name: 'mageepanel',
  description: 'Post the Magee Support Centre button panel'
},
  {
  name: 'audit',
  description: 'Run TDR player audit'
},
{
  name: 'updatedetails',
  description: 'Update existing TDR player details'
}
];

const rest = new REST({ version: '10' }).setToken('MTUwMTQ5MTYxMTEwMjc0NDYwNg.GnMdYK.9M75NaiJ40NOVjZoR5hksJQCYHwHgh0LnA2ueU');

(async () => {
  try {
    console.log('Registering commands...');

    await rest.put(
      Routes.applicationGuildCommands(
        '1501491611102744606',
        '1443050733200212012'
      ),
      { body: commands }
    );

    console.log('Commands registered!');
  } catch (error) {
    console.error(error);
  }
})();