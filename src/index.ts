import { Client, GatewayIntentBits, Events, Message, Collection, ApplicationCommandData } from 'discord.js';
import { REST } from '@discordjs/rest';
import { SlashCommandBuilder } from '@discordjs/builders';
import { Routes } from 'discord-api-types/v9';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import chokidar from 'chokidar';
import { readdirSync, statSync } from 'fs';
import { join } from 'path';

dotenv.config();

interface ExtendedClient extends Client {
  commands: Collection<string, any>;
  responses: { insult: string[]; blab: string[] };
}

const client: ExtendedClient = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
}) as ExtendedClient;

interface Command {
  data: SlashCommandBuilder;
  execute: (interaction: any) => Promise<void>;
}

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

if (!TOKEN || !CLIENT_ID) {
  console.error('Missing DISCORD_TOKEN or CLIENT_ID in .env file');
  process.exit(1);
}

client.commands = new Collection();

const loadCommands = (directory: string): ApplicationCommandData[] => {
  let commands: ApplicationCommandData[] = [];
  const files = readdirSync(directory);

  for (const file of files) {
    const filePath = join(directory, file);
    if (statSync(filePath).isDirectory()) {
      commands = commands.concat(loadCommands(filePath)); // Recursively load commands
    } else if (file.endsWith('.ts')) {
      const command: Command = require(filePath);
      if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
        commands.push(command.data.toJSON() as ApplicationCommandData);
        console.log(`Loaded command: ${command.data.name}`);
      } else {
        console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
      }
    }
  }

  return commands;
};

// Initialize command loading and deployment
const deployCommands = async () => {
  const commandsPath = join(__dirname, 'commands');
  const commands = loadCommands(commandsPath);
  const rest = new REST({ version: '9' }).setToken(TOKEN);

  try {
    console.log('Started refreshing application (/) commands.');

    await rest.put(
      Routes.applicationCommands(CLIENT_ID),
      { body: commands },
    );

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
};

// Automatically deploy commands on startup
deployCommands();

// Watch for changes in the commands directory
const commandsWatcher = chokidar.watch(path.join(__dirname, 'commands'), {
  ignored: /(^|[\/\\])\../, // ignore dotfiles
  persistent: true,
  usePolling: true, // use polling instead of native file watchers
  interval: 1000, // check for changes every 100 milliseconds
});


commandsWatcher
  .on('change', path => {
    console.log(`Detected change in file ${path}. Redeploying commands...`);
    deployCommands();
  });

client.on(Events.ClientReady, () => {
  console.log(`Logged in as ${client.user?.tag}!`);
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
    } else {
      await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
  }
});

const responsesPath = path.join(__dirname, 'data', 'responses.json');

// Load or initialize the responses JSON file
const loadResponses = () => {
  try {
    if (fs.existsSync(responsesPath)) {
      const data = fs.readFileSync(responsesPath, 'utf8');
      client.responses = JSON.parse(data);
    } else {
      // Initialize with empty arrays if the file does not exist
      fs.writeFileSync(responsesPath, JSON.stringify({ insult: [], blab: [] }, null, 2));
      client.responses = { insult: [], blab: [] };
    }
  } catch (error) {
    console.error('Failed to load or initialize the responses file:', error);
    process.exit(1);
  }
};

loadResponses();

client.on(Events.MessageCreate, (message: Message) => {
  if (message.mentions.has(client.user!.id)) {
    // Randomly choose to insult or blab
    const responseType = Math.random() < 0.9 ? 'insult' : 'blab';
    const responses = client.responses[responseType];
    const response = responses[Math.floor(Math.random() * responses.length)] || "I'm at a loss for words!";
    message.reply(response);
  }
});

client.login(TOKEN);
