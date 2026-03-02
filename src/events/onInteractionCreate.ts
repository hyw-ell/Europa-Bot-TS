import { CacheType, ChannelType, Interaction, MessageFlags } from 'discord.js'
import { findBestCIMatch } from '../utils/string.js'
import { sendToLogChannel } from '../utils/discord.js'
import { raids } from '../data/raids.js'
import { client } from '../bot.js'

export function onInteractionCreate(interaction: Interaction<CacheType>) {
	if (!interaction.channel || interaction.channel.type === ChannelType.DM) return
	
	if (interaction.isCommand()) {
		const command = client.commands.get(interaction.commandName)
		if (command) {
			const logMessage = `:scroll:  **${interaction.user.username}** (${interaction.user.id}) ran the command \`${interaction.commandName}\` in **${interaction.guild?.name ?? 'Direct Messages'}** (${interaction.guildId ?? interaction.channelId})`
			const commandData = interaction.isChatInputCommand() ? JSON.stringify(interaction.options, null, "\t") : undefined
			sendToLogChannel(logMessage, commandData)
			
			command.execute(interaction)
		} else {
			interaction.reply({
				content: 'Failed to load command. Please try again later.',
				flags: MessageFlags.Ephemeral
			})
		}
	}

	if (interaction.isAutocomplete()) {
		switch (interaction.commandName) {
			case 'rolelist':
				const focusedOption = interaction.options.getFocused(true)
				if (focusedOption.name !== 'raid') return
				
				const ratedChoices = findBestCIMatch(focusedOption.value, raids.map(({name}) => name)).ratings
				const bestChoices = ratedChoices.sort((a, b) => b.rating - a.rating)
				const results = bestChoices.slice(0, 10).map(({target}) => ({
					name: target, 
					value: raids.find(({name}) => name === target)!.value
				}))
		
				return interaction.respond(results).catch(() => {})
		}
	}
}