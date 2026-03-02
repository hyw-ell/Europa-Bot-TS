import { AttachmentBuilder, ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js'
import { getEventDuration } from '../../commandHelpers/events.js'
import { eventData } from '../../data/events.js'
import { EnhancedCanvas } from '../../classes/EnhancedCanvas.js'

export const command = {
	data: new SlashCommandBuilder()
		.setName('events')
		.setDescription('Show current and upcoming events')
		.addBooleanOption(option => option.setName('embed').setDescription('Use the embedded message version of this command instead?'))
	,
	async execute(interaction: ChatInputCommandInteraction) {
		const { currentEvents, upcomingEvents, imgTemplate } = eventData
		if (!currentEvents || !upcomingEvents || !imgTemplate) return interaction.reply('Events information is currently unavailable. Please try again later.')

		await interaction.deferReply()

		if (interaction.options.getBoolean('embed')){ // If requested by the user, show the embedded message output instead
			const eventEmbed = new EmbedBuilder()
				.setTitle('Events')
				.setDescription('**__CURRENT AND UPCOMING EVENTS__**')
				.setURL('https://gbf.wiki/Main_Page')
				.setColor('Blue')
				.setFooter({ text: 'https://gbf.wiki/Main_Page', iconURL: 'https://i.imgur.com/MN6TIHj.png' })
			
			currentEvents.forEach(event => eventEmbed.addFields([{
				name: event.title + (event.elementAdvantage ? ` (${event.elementAdvantage})` : ''),
				value: getEventDuration(event) + (event.end ? `(<t:${event.end.valueOf()/1000}:f>)` : '')
			}]))

			upcomingEvents.forEach(event => eventEmbed.addFields([{
				name: event.title + (event.elementAdvantage ? ` (${event.elementAdvantage})` : ''), 
				value: event.duration
			}]))
			
			interaction.editReply({ embeds: [eventEmbed] })
		} else {
			const canvas = new EnhancedCanvas(imgTemplate.width, imgTemplate.height)
			const ctx = canvas.ctx
			ctx.drawImage(imgTemplate, 0, 0)

			let X = 25, Y = 110 // Starting position for event banners
			currentEvents.forEach((event, i) => {
				if (i % 2 === 0){ // Draw events in the left column
					const lastEvent = Boolean(i + 1 === currentEvents.length)
					X = lastEvent ? 185 : 25 // Center the event if it's the last one
					Y += i ? 110 : 0 // Only add to Y after the first event
					canvas.drawEvent(event, lastEvent ? 350 : 190, X, Y)
				} else { // Draw events in the right column
					X = 345
					canvas.drawEvent(event, 510, X, Y)
				}
			})

			const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: `Events.png` })
			interaction.editReply({ files: [attachment] })
		}
	}
}