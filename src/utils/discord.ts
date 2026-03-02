import { MessagePayload, MessageCreateOptions, TextChannel, PermissionFlagsBits, REST, Routes, Client } from 'discord.js'
import { client, HOME_SHARD_ID } from '../bot.js'
import { readdirSync } from 'fs'
import { Command } from '../classes/BotClient.js'
import { BOT_TOKEN, BOT_ID, HOME_SERVER_ID, CHANNEL_IDS } from '../data/discord.js'

export async function sendToChannel(channelID: string, message: string | MessagePayload | MessageCreateOptions) {
    const channel = await client.channels.fetch(channelID) as TextChannel
    if (channel) channel.send(message)
}

export async function sendToLogChannel(logMessage: string) {
    const options = {
        shard: HOME_SHARD_ID,
        context: {
            logChannelID: CHANNEL_IDS.COMMAND_LOG,
            message: logMessage
        }
    }

    client.shard?.broadcastEval((client: Client, { logChannelID, message } : typeof options.context ) => {
        (client.channels.cache.get(logChannelID) as TextChannel).send(message)
    }, options)
}

export async function registerCommands() {
    const commands = []
    const privateCommands = []  // Commands only available on the home server
    const commandCategories = readdirSync('./prod/commands')
    
    for (const category of commandCategories) {
        const commandFiles = readdirSync(`./prod/commands/${category}`)

        for (const file of commandFiles) {
            const { command } : { command: Command } = await import(`../../prod/commands/${category}/${file}`)

            if (category === 'admin') {
                command.data.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
            }

            category === 'private'
                ? privateCommands.push(command.data.toJSON())
                : commands.push(command.data.toJSON())

            client.commands.set(command.data.name, command)
        }
    }

    const rest = new REST({ version: '9' }).setToken(BOT_TOKEN)
    rest.put(Routes.applicationCommands(BOT_ID), { body: commands })
    rest.put(Routes.applicationGuildCommands(BOT_ID, HOME_SERVER_ID), { body: privateCommands })
}