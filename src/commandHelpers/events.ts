import { dateDiff } from '../utils/time.js'
import { gbfEvent } from '../data/events.js'

/**
 * Takes an event and outputs the correct duration string for the event.
 */
export function getEventDuration(event: gbfEvent) {
    if (event.type === 'Current') {
        const now = new Date()
        
        if (!event.start) return 'Starts in ?'
        if (now < event.start) return `Starts in ${dateDiff(now, event.start, true)}`
        
        if (!event.end) return 'Ends in ?'
        if (now < event.end) return `Ends in ${dateDiff(now, event.end, true)}`
        return 'Event has ended.'
    }
    return event.duration
}