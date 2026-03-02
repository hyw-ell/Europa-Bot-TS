import { GuildMember, Guild, PartialGuildMember } from "discord.js"
import { greetingConfig, makeGreetingImage } from "../commandHelpers/greeting.js"
import { database } from "../data/database.js"
import { sendToChannel, sendToLogChannel } from '../utils/discord.js'

/**
 * Adds new servers to the database and logs the server in the log channel
 */
export async function onGuildCreate(guild: Guild) {
	if (!database?.servers) return

	const server = database.servers.find(server => server.get('guildID') === guild.id)
	if (!server){
		const newServer = await database.serversTable.addRow({ guildName: guild.name, guildID: `'${guild.id}` })
		database.servers.push(newServer)
	}

	sendToLogChannel(`:man_raising_hand:  Joined server **${guild.name}**`)
}

/**
 * Handles auto-roles and sends a join message (if enabled) when a member joins the server
 */
export async function onGuildMemberAdd(member: GuildMember) {
	const server = database?.servers.find(server => server.get('guildID') === member.guild.id)
	if (!server?.get('greeting')) return

	const clientUser = member.guild.members.me! as GuildMember
	const greetingSettings: greetingConfig = JSON.parse(server.get('greeting'))
    const { channelID, useAutoRole, autoRoles, sendJoinMessage, joinMessage, showJoinImage } = greetingSettings

	if (useAutoRole && autoRoles.length > 0){
		autoRoles.forEach(roleID => {
			const role = member.guild.roles.cache.find(role => role.id === roleID)
            const roleIsAssignable = role && clientUser.roles.highest.position > role.position
			if (roleIsAssignable) member.roles.add(role)
		})
	}
	
	if (sendJoinMessage) {
		sendToChannel(channelID, {
			content: joinMessage.replace('[member]', String(member)),
			files: showJoinImage ? [await makeGreetingImage(greetingSettings, member.user)] : []
		})
	}
}

/**
 * Sends a leave or ban message when a member leaves the server
 */
export async function onGuildMemberRemove(member: GuildMember | PartialGuildMember) {
	const server = database?.servers.find(server => server.get('guildID') === member.guild.id)
	if (!server?.get('greeting')) return

	const greetingSettings: greetingConfig = JSON.parse(server.get('greeting'))
    const { channelID, leaveMessage, banMessage, sendLeaveMessage, sendBanMessage } = greetingSettings
	const userIsBanned = await member.guild.bans.fetch(member.user).catch(() => false)
	
	if (userIsBanned) {
        if (sendBanMessage) sendToChannel(channelID, banMessage.replace('[member]', member.user.username))
    } else {
        if (sendLeaveMessage) sendToChannel(channelID, leaveMessage.replace('[member]', member.user.username))
    }
}