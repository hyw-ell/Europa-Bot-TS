import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js'

export const command = {
	data: new SlashCommandBuilder()
		.setName('time')
		.setDescription('Show the current time in Japan')
	,
	async execute(interaction: ChatInputCommandInteraction) {
		const now = new Date()
		const options: Intl.DateTimeFormatOptions = {
			dateStyle: 'full',
			timeStyle: 'medium',
			timeZone: 'Japan',
		}
		const japanDateTime = new Intl.DateTimeFormat('en-US', options).format(now)

		interaction.reply(`It is currently \`${japanDateTime}\` in Japan.`)
	}
}