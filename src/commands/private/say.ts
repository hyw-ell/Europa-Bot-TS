import { ChannelType, ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js'
import { sendToChannel } from '../../utils/discord.js'
import { BOT_OWNER_ID } from '../../data/discord.js'

export const command = {
	data: new SlashCommandBuilder()
		.setName('say')
		.setDescription('Send a message to a channel')
		.addChannelOption(option =>
			option
				.setName('channel')
				.setDescription('The channel to send a message to')
				.addChannelTypes([
					ChannelType.GuildText,
					ChannelType.GuildAnnouncement,
					ChannelType.PublicThread,
					ChannelType.AnnouncementThread,
				])
				.setRequired(true)
		)
		.addStringOption(option => option.setName('message').setDescription('The message to send').setRequired(true))
	,
	async execute(interaction: ChatInputCommandInteraction) {
		if (interaction.user.id !== BOT_OWNER_ID) {
			return interaction.reply('This command is reserved for my creator.')
		}
        
        const channelID = interaction.options.getChannel('channel', true).id
		const message = interaction.options.getString('message', true)
		await sendToChannel(channelID, message)
        interaction.reply(`Message sent to <#${channelID}>.`)
	}
}