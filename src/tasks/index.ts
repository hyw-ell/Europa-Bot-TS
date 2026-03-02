import { schedule } from 'node-cron'
import { connectDatabase, database } from '../data/database.js'
import { getEventsData } from './getEventsData.js'
import { getBannerData } from './getBannerData.js'
import { makeEventsTemplate } from './makeEventsTemplate.js'
import { relayEvents } from './relayEvents.js'
import { sendEventReminders } from './sendEventReminders.js'
import { registerCommands, sendToChannel } from '../utils/discord.js'
import { startPuppeteer } from '../utils/browser.js'
import { client, IS_HOME_SHARD, THIS_SHARD_ID } from '../bot.js'
import { getAccessToken } from '../utils/image.js'
import { CHANNEL_IDS } from '../data/discord.js'
import { updateCounter } from './updateCounter.js'
import { getCharacterData } from './getCharacterData.js'
import { getSummonData } from './getSummonData.js'

export async function runStartupTasks() {
    console.log(`Shard #${THIS_SHARD_ID} is now online`)
    client.user?.setActivity('Granblue Fantasy')

    await Promise.all([
        startPuppeteer(),
        connectDatabase(),
    ])

    getBannerData()
    registerCommands()
    await getEventsData()
    makeEventsTemplate()

    schedule('0 * * * *', async () => {
        getBannerData()
        connectDatabase()
        
        await getEventsData()
        makeEventsTemplate()
        if (IS_HOME_SHARD) {
            relayEvents()
            sendEventReminders()
        }
    })

    if (IS_HOME_SHARD) {
        sendToChannel(CHANNEL_IDS.COMMAND_LOG, `:white_check_mark:  **${client.user?.displayName} is now online**`)

        // Runs at 23:55 every day. The 5 minutes is to allow time to fetch the data before the database connection is refreshed
        schedule('55 23 * * *', () => {
            // getCharacterData()
            // getSummonData()
            updateCounter()
        })

        // Regenerate a new Imgur access token every week
        schedule('0 0 * * 0', async () => {
            const newAccessToken = await getAccessToken().catch(() => undefined)
            if (newAccessToken) {
                const imgurAccessToken = database.variables.find(v => v.get('key') === 'IMGUR_ACCESS_TOKEN')!
                imgurAccessToken.set('value', newAccessToken)
                imgurAccessToken.save()
            }
        })
    }
}