import md5 from 'md5'
import { loadImage } from 'canvas'
import { decode } from 'html-entities'
import { eventData, gbfEvent, rawEvent } from '../data/events.js'
import { MILLISECONDS } from '../data/time.js'
import { capFirstLetter } from '../utils/string.js'
import { parseOffset, getSimpleDate } from '../utils/time.js'
import { browser } from '../utils/browser.js'
import { images } from '../data/assets.js'

/**
 * Loads and processes event information.
 * @param retries - How many times to retry if events cannot be loaded
 */
export async function getEventsData(retries: number = 1) {
    if (retries < 0) return

    const page = await browser.newPage()
    await page.setExtraHTTPHeaders({ 'User-Agent': process.env.GBF_WIKI_AGENT! })

    const params = {
        title: 'Special:CargoExport',
        tables: 'event_history',
        fields: 'event_history.name, event_history._ID, event_history.time_known, event_history.utc_start,' + 
                'event_history.utc_end, event_history.wiki_page, event_history.image, event_history.element',
        'order by': 'event_history.utc_start DESC',
        limit: '20',
        format: 'json'
    }
    const url = new URL('https://gbf.wiki/index.php')
    url.search = new URLSearchParams(params).toString()

    const eventsResponse = await page.goto(url.href, { waitUntil: 'networkidle0' })
    if (!eventsResponse?.ok()) return setTimeout(() => getEventsData(--retries), MILLISECONDS.MINUTE)

    const rawEvents: rawEvent[] = await eventsResponse.json()
    rawEvents.sort((a, b) => a['utc start'] - b['utc start'])

    const maintResponse = await page.goto('https://gbf.wiki/Template:MainPage/Notice', { waitUntil: 'domcontentloaded' })
    const maintHTML = await maintResponse?.text()
    if (maintResponse?.ok() && maintHTML && /The game will undergo maintenance/i.test(maintHTML)) {
        const [ _, maintStart, maintEnd ] = maintHTML
            .match(/data-start="(\d+)" data-end="(\d+)" data-text-start="The game will undergo maintenance/)!
            .map((match: string) => parseInt(match))

        if (maintStart && maintEnd && (maintStart * MILLISECONDS.SECOND) > new Date().getTime()) {
            rawEvents.unshift({
                name: 'Maintenance',
                _ID: 0,
                'time known': 'yes',
                'utc start': maintStart,
                'utc end': maintEnd,
                'wiki page': null,
                image: null,
                element: null
            })
        }
    }

    await page.close()

    eventData.allEvents = await processEvents(rawEvents)
    eventData.currentEvents = eventData.allEvents.filter(event => event.type === 'Current')
    eventData.upcomingEvents = eventData.allEvents.filter(event => event.type === 'Upcoming')
}

/**
 * Processes events from the GBF wiki. 
 * - Events that are not ongoing, ended more than 3 hours ago, or end more than 90 days later are filtered out.
 * - Returns up to 10 events.
 */
async function processEvents(events: rawEvent[]): Promise<gbfEvent[]> {
    const now = new Date()
    const currentStart = (now.getTime() / 1000) - (3 * 60 * 60)
    const currentEnd = (now.getTime() / 1000) + (36 * 60 * 60)
    const filteredEvents = events.filter(event => {
        if (event['utc end'] === 0) return true
        return event['utc end'] > currentStart && event['utc end'] < (now.getTime() / 1000) + (90 * 24 * 60 * 60)
    })

    const processedEvents = filteredEvents.slice(0, 10).map(async event => {
        const eventStart = new Date(event['utc start'] * 1000)
        const eventEnd = new Date(event['utc end'] * 1000)
        const eventMonth = new Date((event['utc start'] + (now.getTimezoneOffset() + parseOffset('UTC +9')) * 60) * 1000).toLocaleDateString('en-US', {month: 'long'})
        let imgName, imgHash, imgURL = null

        if (event.name === 'Maintenance') {
            imgURL = 'https://raw.githubusercontent.com/hyw-ell/Europa-Bot-TS/main/assets/Events/Maintenance_Event.png'
        } else if (event.image) {
            imgName = decode(capFirstLetter(event.image).replace(/ /g, '_').replace(/__/g, '_'))
            imgHash = md5(imgName)
            imgURL = `https://gbf.wiki/images/${imgHash.charAt(0)}/${imgHash.slice(0,2)}/${encodeURI(imgName)}`
        }

        return {
            title: decode(event.name),
            id: String(event._ID),
            type: event['utc start'] < currentEnd ? 'Current' : 'Upcoming',
            start: eventStart,
            end: eventEnd,
            duration: event['time known'] === 'yes' ? `${getSimpleDate(eventStart)} - ${getSimpleDate(eventEnd)}` : `In ${eventMonth}`,
            wikiURL: event['wiki page'] && `https://gbf.wiki/${decode(event['wiki page'].replace(/ /g, '_'))}`,
            image: imgURL ? await loadImage(imgURL).catch(() => null) : null,
            imageURL: imgURL,
            elementAdvantage: getAdvantagedElement(event.element).description,
            elementAdvantageImg: getAdvantagedElement(event.element).image,
        }
    })

    return Promise.all(processedEvents)
}

/** Determines the element advantage and the element advantage image from the event data. */
function getAdvantagedElement(element: string | null) {
    switch (element) {
        case 'fire': return { description: `<:WaterAdvantage:1225922220157833277> Water Advantage`, image: images['Water_Advantage.png'] }
        case 'water': return { description: `<:EarthAdvantage:1225922224154742957> Earth Advantage`, image: images['Earth_Advantage.png'] }
        case 'earth': return { description: `<:WindAdvantage:1225922221617319976> Wind Advantage`, image: images['Wind_Advantage.png'] }
        case 'wind': return { description: `<:FireAdvantage:1225922225492856852> Fire Advantage`, image: images['Fire_Advantage.png'] }
        case 'light': return { description: `<:DarkAdvantage:1225922222871412887> Dark Advantage`, image: images['Dark_Advantage.png'] }
        case 'dark': return { description: `<:LightAdvantage:1225922226503811153> Light Advantage`, image: images['Light_Advantage.png'] }
        default: return { description: 'No Element Advantage', image: null }
    }
}