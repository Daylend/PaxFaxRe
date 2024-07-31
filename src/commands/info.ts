// filename: ./src/commands/msg.ts

import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction, CacheType, TextBasedChannelFields } from 'discord.js';
import fs from 'fs';
import path from 'path';

interface Messages {
  [key: string]: string;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('info')
    .setDescription('Store or retrieve messages using a key')
    .addStringOption(option =>
      option.setName('key')
        .setDescription('The key for the message')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('message')
        .setDescription('The message to store')
        .setRequired(false)), // Optional, if not provided, the command retrieves the message
  async execute(interaction: CommandInteraction<CacheType>) {
    const key = interaction.options.get('key')?.value as string;
    const message = interaction.options.get('message')?.value as string;

    const messagesPath = path.join(__dirname, '..', 'data', 'messages.json');
    let messages: Messages = {};

    // Load existing messages or initialize if not present
    if (fs.existsSync(messagesPath)) {
      const data = fs.readFileSync(messagesPath, 'utf8');
      messages = JSON.parse(data) as Messages;
    }

    if (message) {
      // Save or update the message for the given key
      messages[key] = message;
      fs.writeFileSync(messagesPath, JSON.stringify(messages, null, 2));
      await interaction.reply({ content: `Saved message: ${key}`, ephemeral: true });
    } else {
      // Retrieve the message for the given key, if it exists
      if (messages[key]) {
        await interaction.reply({ content: messages[key] });
      } else {
        await interaction.reply({ content: `No message found for ${key}`, ephemeral: true });
      }
    }
  },
};
