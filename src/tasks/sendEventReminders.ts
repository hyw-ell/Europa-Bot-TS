import { EmbedBuilder } from 'discord.js'
import { client } from '../bot.js'
import { database } from '../data/database.js'
import { eventData, eventReminder, recurringEvents } from '../data/events.js'
import { MILLISECONDS } from '../data/time.js'
import { sendToChannel } from '../utils/discord.js'
import { gbfEvent } from '../data/events.js'

/**
 * Sends reminders to subscribed servers and users when GBF events are ending soon
 */
export async function sendEventReminders(retries: number = 2) {
    if (retries < 0) return

    if (!eventData.allEvents.length) return setTimeout(() => sendEventReminders(--retries), MILLISECONDS.MINUTE)
    const servers = database.servers.filter(server => server.get('reminders') && server.get('reminders') !== '[]')
    const users = database.users.filter(user => user.get('reminders') && user.get('reminders') !== '[]')

    for (const server of servers) {
        const reminders: eventReminder[] = JSON.parse(server.get('reminders') || '[]')
        const receivedReminders: {title: string, end: string}[] = JSON.parse(server.get('receivedReminders') || '[]')
        const filteredEvents = eventData.allEvents.filter(event =>
            receivedReminders.every(e => e.title !== event.title) && event.end > new Date()
        )

        for (const event of filteredEvents) {
            const reminder = findReminder(reminders, event)
            
            if (reminder && (new Date()).getTime() >= event.end.getTime() - reminder.time) {
                sendToChannel(reminder.channelID!, {
                    content: reminder.roleID && `## <@&${reminder.roleID}>`, 
                    allowedMentions: reminder.roleID ? {roles: [reminder.roleID]} : undefined,
                    embeds: [makeReminderEmbed(event)]
                })

                receivedReminders.push({title: event.title, end: event.end.getTime().toString()})
            }
        }
        
        server.set(
            'receivedReminders',
            JSON.stringify(receivedReminders.filter(({end}) => new Date().getTime() < parseInt(end)))
        )
        server.save()
    }

    for (const user of users) {
        const reminders: eventReminder[] = JSON.parse(user.get('reminders') || '[]')
        const receivedReminders: {title: string, end: string}[] = JSON.parse(user.get('receivedReminders') || '[]')
        const filteredEvents = eventData.allEvents.filter(event => 
            receivedReminders.every(e => e.title !== event.title) && event.end > new Date()
        )

        for (const event of filteredEvents) {
            const reminder = findReminder(reminders, event)

            if (reminder && (new Date()).getTime() >= event.end.getTime() - reminder.time) {
                const targetUser = await client.users.fetch(user.get('userID'))
                await targetUser.send({embeds: [makeReminderEmbed(event)]})

                receivedReminders.push({title: event.title, end: event.end.getTime().toString()})
            }
        }
        
        user.set(
            'receivedReminders',
            JSON.stringify(receivedReminders.filter(({end}) => new Date().getTime() < parseInt(end)))
        )
        user.save()
    }
}

function findReminder(reminders: eventReminder[], event: gbfEvent) {
    const isRecurringEvent = recurringEvents.some(eventName => event.title.includes(eventName))
    switch (reminders[0].eventName) {
        case 'All':             return reminders[0]
        case 'All Recurring':   return isRecurringEvent ? reminders[0] : undefined
        default:                return reminders.find(({eventName}) => event.title.includes(eventName))
    }
}

function makeReminderEmbed(event: gbfEvent) {
    const reminderEmbed = new EmbedBuilder()
        .setAuthor({name: 'Event Reminder'})
        .setTitle(`${event.title} is Ending Soon!`)
        .setDescription(`Event Ends <t:${event.end.getTime() / 1000}:R>`)
        .setImage(event.imageURL)
        .setURL(event.wikiURL)
        .setColor('Blue')

    return reminderEmbed
}