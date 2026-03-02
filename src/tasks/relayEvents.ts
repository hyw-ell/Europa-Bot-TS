import { GuildScheduledEventCreateOptions, GuildScheduledEvent, GuildScheduledEventStatus, GuildScheduledEventEditOptions } from 'discord.js'
import { client } from '../bot.js'
import { database } from '../data/database.js'
import { BOT_ID } from '../data/discord.js'
import { eventData, recurringEvents } from '../data/events.js'
import { MILLISECONDS } from '../data/time.js'
import { EnhancedCanvas } from '../classes/EnhancedCanvas.js'

/**
 * Relays scheduled GBF events to each subscribed server
 */
export async function relayEvents(retries: number = 2) {
    if (retries < 0) return

    const scheduledEvents = await makeScheduledEvents()
    if (!scheduledEvents) return setTimeout(() => relayEvents(--retries), MILLISECONDS.MINUTE)

    const subscribedServers = database.servers.filter(server => server.get('events') && server.get('events') !== '[]')
    subscribedServers.forEach(async server => {
        const eventsManager = (await client.guilds.fetch(server.get('guildID'))).scheduledEvents
        const serverEvents = await eventsManager.fetch()

        const relayEvents: string[] = JSON.parse(server.get('events') || '[]')
        
        let filteredEvents: GuildScheduledEventCreateOptions[]
        switch (relayEvents[0]) {
            case 'All': filteredEvents = [...scheduledEvents]; break
            case 'All Recurring': 
                filteredEvents = scheduledEvents.filter(({name}) => {
                    return recurringEvents.some(eventName => name.includes(eventName))
                })
                break
            default:
                filteredEvents = scheduledEvents.filter(({name}) => {
                    return relayEvents.some(eventName => name.includes(eventName))
                })
        }

        const maintEvent = scheduledEvents.find(({name}) => name === 'Maintenance')
        if (maintEvent && !filteredEvents.includes(maintEvent)) filteredEvents.unshift(maintEvent)

        const filteredEventNames = filteredEvents.map(e => e.name)
        const existingEvents: GuildScheduledEvent<GuildScheduledEventStatus>[] = []
        const obsoleteEvents: GuildScheduledEvent<GuildScheduledEventStatus>[] = []

        serverEvents.filter(({ creatorId, scheduledEndAt }) => {
            return (creatorId === BOT_ID) && (new Date() < (scheduledEndAt ?? new Date(0)))
        }).forEach(event => {
            filteredEventNames.includes(event.name)
                ? existingEvents.push(event)
                : obsoleteEvents.push(event)
        })

        filteredEvents.forEach(event => {
            let existingEvent = existingEvents.find(({name}) => name === event.name)

            // Prefer editing an obsolete event over creating a new one
            if (existingEvent) {
                // Remove event from array for future loops, prevents editing the same event twice (mostly for recurring events)
                existingEvents.splice(existingEvents.findIndex(({name}) => name == existingEvent!.name), 1)
            } else if (obsoleteEvents.length && !recurringEvents.includes(event.name)) { // Don't overwrite recurring events
                existingEvent = obsoleteEvents.shift()!
            } else {
                return eventsManager.create(event)
            }

            const editOptions: GuildScheduledEventEditOptions<GuildScheduledEventStatus, any> = {}
            const eventTimeChanged = Boolean(
                existingEvent.scheduledStartTimestamp !== new Date(event.scheduledStartTime).getTime() ||
                existingEvent.scheduledEndTimestamp !== new Date(event.scheduledEndTime!).getTime()
            )

            if (existingEvent.name !== event.name) editOptions.name = event.name
            if (existingEvent.entityMetadata !== event.entityMetadata) editOptions.entityMetadata = event.entityMetadata
            if (existingEvent.description !== event.description) {
                editOptions.description = event.description
                editOptions.image = event.image
            }
            if (eventTimeChanged && existingEvent.scheduledStartAt! > new Date()) {
                editOptions.scheduledStartTime = event.scheduledStartTime
                editOptions.scheduledEndTime = event.scheduledEndTime
            }

            if (Object.keys(editOptions).length) existingEvent.edit(editOptions)
        })

        // Delete any remaining obsolete events
        obsoleteEvents.filter(event => event.name !== 'Maintenance').forEach(event => event.delete())
    })
}

/**
 * Creates a list of Discord scheduled events according to the in-game events
 */
async function makeScheduledEvents() {
    if (!eventData.allEvents.length) return

    const threeMinsLater = new Date(new Date().valueOf() + 3 * MILLISECONDS.MINUTE)
    const scheduledEvents: GuildScheduledEventCreateOptions[] = eventData.allEvents.map(event => {
        if (!event.start || !event.end || new Date() >= event.end || event.duration.startsWith('In')) return {} as GuildScheduledEventCreateOptions
        
        // Resize the image to better fit Discord's event image frame
        let canvas
        if (event.image) {
            canvas = new EnhancedCanvas(event.image.width, event.image.width * 320 / 800) // 800x320 is the recommended dimensions by Discord
            const ctx = canvas.ctx
            ctx.drawImage(event.image, 0, (canvas.height - event.image.height) / 2)
        }

        return {
            name: event.title,
            description: `\`Starts:\` <t:${event.start.getTime() / 1000}:f>` +
                         `\n\` Ends: \` <t:${event.end.getTime() / 1000}:f>` + 
                         '\n\n' +
                         [
                            `Event #${event.id}`,
                            event.wikiURL && `[Event Page](${event.wikiURL})`,
                            event.imageURL && `[Event Image](${event.imageURL})`
                         ].filter(e => e).join(' | '),
            image: canvas?.toBuffer(),
            scheduledStartTime: event.start < new Date() ? threeMinsLater : event.start, // If the in-game event already started, set the discord event to start in 3 minutes
            scheduledEndTime: event.end,
            privacyLevel: 2, // Only Guild Members can see the event (this is currently the only valid value)
            entityType: 3, // 3 = External event
            entityMetadata: { location: event.elementAdvantage }
        }
    }).filter(event => event.name)

    return scheduledEvents
}