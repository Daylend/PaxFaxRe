import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction, CacheType } from 'discord.js';
import fs from 'fs';
import path from 'path';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('add')
    .setDescription('Adds a response to the bot')
    .addStringOption(option =>
      option.setName('category')
        .setDescription('The category to add to')
        .setRequired(true)
        .addChoices(
          { name: 'blab', value: 'blab' },
          { name: 'insult', value: 'insult' }
        ))
    .addStringOption(option =>
      option.setName('message')
        .setDescription('The message to add')
        .setRequired(true)),
  async execute(interaction: CommandInteraction<CacheType>) {
    const ownerId = process.env.OWNER_ID;
    if (interaction.user.id !== ownerId) {
      await interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
      return;
    }

    const category = interaction.options.get('category')?.value as string;
    const message = interaction.options.get('message')?.value as string;

    const responsesPath = path.join(__dirname, '..', 'responses.json');
    const data = fs.existsSync(responsesPath) ? JSON.parse(fs.readFileSync(responsesPath, 'utf8')) : { insult: [], blab: [] };

    if (!data[category]) {
      await interaction.reply({ content: 'Invalid category provided.', ephemeral: true });
      return;
    }

    data[category].push(message);
    fs.writeFileSync(responsesPath, JSON.stringify(data, null, 2));

    await interaction.reply({ content: `Added your message to the ${category} category!`, ephemeral: true });
  },
};
