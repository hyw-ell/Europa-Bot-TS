import { Client, TextChannel } from 'discord.js'
import { inspect } from 'util'
import { client, HOME_SHARD_ID } from '../bot.js'
import { CHANNEL_IDS } from '../data/discord.js'

export function onError(err: Error) {
    const options = {
        shard: HOME_SHARD_ID,
        context: {
            errorChannelID: CHANNEL_IDS.ERROR,
            error: inspect(err, { depth: null })
        }
    }

    client.shard?.broadcastEval((client: Client, { errorChannelID, error } : typeof options.context ) => {
        const errorChannel = client.channels.cache.get(errorChannelID) as TextChannel
        errorChannel.send({
            files: [{ attachment: Buffer.from(error, 'utf-8'), name: 'error.ts' }]
        })
    }, options) 
}