import { eventData } from '../data/events.js'
import { images } from '../data/assets.js'
import { EnhancedCanvas } from '../classes/EnhancedCanvas.js'

/**
 * Makes an event template that includes upcoming events and leaves a blank space for current events.
 */
export async function makeEventsTemplate() {
    const numCurrentEvents = eventData.currentEvents.length
    const numUpcomingEvents = eventData.upcomingEvents.length
    if (!numCurrentEvents || !numUpcomingEvents) return

    const canvasHeight = Math.ceil(numCurrentEvents / 2) * 110 + Math.ceil(numUpcomingEvents / 2) * 110 + 200
    const canvas = new EnhancedCanvas(700, canvasHeight)
    const ctx = canvas.ctx

    ctx.drawImage(images['Events_Background_Top.png'], 0, 0)
    ctx.drawImage(images['Events_Background_Middle.png'], 0, 100, 700, canvasHeight - 150)
    ctx.drawImage(images['Events_Background_Bottom.png'], 0, canvasHeight - 50)

    let X = 25
    let Y = Math.ceil(numCurrentEvents / 2) * 110 + 110 + 5
    ctx.drawImage(images['Upcoming_Events_Text.png'], 155, Y)
    Y += 45

    eventData.upcomingEvents.forEach((event, i) => {
        if (i % 2 === 0) { // Draw events in the left column
            const lastEvent = Boolean(i + 1 === numUpcomingEvents)
            X = lastEvent ? 185 : 25 // Center the event if it's the last one
            Y += i ? 110 : 0 // Only add to Y after the first event
            canvas.drawEvent(event, lastEvent ? 350 : 190, X, Y)
        } else { // Draw events in the right column
            X = 345
            canvas.drawEvent(event, 510, X, Y)
        }
    })

    eventData.imgTemplate = canvas
}