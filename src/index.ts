import 'dotenv/config'

import { ShardingManager } from 'discord.js'
import { BOT_TOKEN } from './data/discord.js'

const manager = new ShardingManager('./prod/bot.js', { token: BOT_TOKEN })

manager.on('shardCreate', shard => {
    console.log(`[${new Date().toString().split(' ', 5).join(' ')}] Launched Shard #${shard.id}`)
})

manager.spawn().catch(() => {})