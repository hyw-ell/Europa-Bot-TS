import { ShardClientUtil } from 'discord.js'
import { schedule } from 'node-cron'
import { registerFont } from 'canvas'

import { onGuildCreate, onGuildMemberAdd, onGuildMemberRemove } from './events/guild.js'
import { onRoleDelete } from './events/roleDelete.js'
import { onInteractionCreate } from './events/onInteractionCreate.js'
import { onError } from './events/onError.js'
import { runStartupTasks } from './tasks/index.js'

import { BOT_TOKEN, HOME_SERVER_ID } from './data/discord.js'
import { BotClient } from './classes/BotClient.js'

export const client = new BotClient()
export const HOME_SHARD_ID = ShardClientUtil.shardIdForGuildId(HOME_SERVER_ID, client.shard?.count!)
export const THIS_SHARD_ID = client.shard?.ids[0]
export const IS_HOME_SHARD = THIS_SHARD_ID === HOME_SHARD_ID

export const fontFallBacks = ['Noto Serif SC', 'Noto Serif TC', 'Noto Serif JP', 'Code2000'].join(' ')
registerFont('assets/Arial.ttf', { family: 'Default' })
registerFont('assets/Arial Bold.ttf', { family: 'Default Bold' })
registerFont('assets/NotoSerifSC.otf', { family: 'Noto Serif SC' })
registerFont('assets/NotoSerifTC.otf', { family: 'Noto Serif TC' })
registerFont('assets/NotoSerifJP.otf', { family: 'Noto Serif JP' })
registerFont('assets/Code2000.ttf', { family: 'Code2000' })

client.on('clientReady', runStartupTasks)
client.on('interactionCreate', onInteractionCreate)
client.on('guildCreate', onGuildCreate)
client.on('guildMemberAdd', onGuildMemberAdd)
client.on('guildMemberRemove', onGuildMemberRemove)
client.on('roleDelete', onRoleDelete)

client.login(BOT_TOKEN)

// Check every hour - if memory exceeds 500MB, force the shard to respawn
schedule('0 * * * *', () => {
	if (process.memoryUsage().heapUsed / 1024 / 1024 > 500){
		client.shard?.broadcastEval(() => process.exit())
	}
})

process.on('uncaughtException', onError)