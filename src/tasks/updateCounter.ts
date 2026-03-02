import { VoiceChannel } from 'discord.js'
import { IS_HOME_SHARD, client } from '../bot.js'
import { CHANNEL_IDS } from '../data/discord.js'

export async function updateCounter() {
    if (!IS_HOME_SHARD) return

    const serverCounts = await client.shard?.fetchClientValues('guilds.cache.size')
    const serverCount = serverCounts?.reduce((a: any, b: any) => a + b, 0)
    const serverCountChannel = await client.channels.fetch(CHANNEL_IDS.SERVER_COUNT) as VoiceChannel

    serverCountChannel.edit({ name: `Server Count: ${serverCount}` })
}