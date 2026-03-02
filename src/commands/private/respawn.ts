import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js'
import { client } from '../../bot.js'
import { BOT_OWNER_ID } from '../../data/discord.js'

export const command = {
	data: new SlashCommandBuilder()
		.setName('respawn')
		.setDescription('Force a Europa shard to respawn (Developer Only)')
		.addNumberOption(option => option.setName('number').setDescription('The number for the shard to respawn').setRequired(true))
	,
	async execute(interaction: ChatInputCommandInteraction) {
		if (interaction.user.id !== BOT_OWNER_ID) {
			return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true })
		}
		
		const shardNumber = interaction.options.getNumber('number')!
		client.shard?.broadcastEval(client => { process.exit() }, { shard: shardNumber })
		interaction.reply(`Shard #${shardNumber} is now respawning.`)
	}
}