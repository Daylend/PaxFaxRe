import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction, TextChannel, PermissionFlagsBits } from 'discord.js';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Deletes a specified number of messages above the current command (limit 20).')
    .addIntegerOption(option =>
      option.setName('amount')
        .setDescription('Number of messages to delete (limit 20)')
        .setRequired(true)),
  async execute(interaction: CommandInteraction) {
    // Check if the member has administrative permissions
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      await interaction.reply({ content: 'You need to be an administrator to use this command.', ephemeral: true });
      return;
    }

    const amount = interaction.options.get('amount')?.value as number;

    if (!amount || amount < 1 || amount > 20) {
      await interaction.reply({ content: 'Please provide a number between 1 and 20.', ephemeral: true });
      return;
    }

    const channel = interaction.channel as TextChannel;

    if (!channel) {
      await interaction.reply({ content: 'This command can only be used in text channels.', ephemeral: true });
      return;
    }

    try {
      // Fetch messages
      const fetchedMessages = await channel.messages.fetch({ limit: amount + 1 });
      await channel.bulkDelete(fetchedMessages, true);

      await interaction.reply({ content: `Successfully deleted ${amount} messages.`, ephemeral: true });
    } catch (error) {
      console.error(error);
      await interaction.reply({ content: 'There was an error while trying to delete messages in this channel.', ephemeral: true });
    }
  },
};