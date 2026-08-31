import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js'
import { CanvasRenderingContext2D, Image, loadImage } from 'canvas'
import { compareTwoStrings } from 'string-similarity'
import axios from 'axios'
import urlencode from 'urlencode'
import { database } from '../data/database.js'
import { showMenu } from './menu.js'
import { IMAGE_URLS, IMAGES } from '../data/assets.js'
import { isNumber } from '../utils/number.js'

/**
 * Parses raw HTML and returns an array containing information for each support summon the player has set.
 * @param rawHtml - Raw HTML containing summon information taken from the player profile page.
 */
export async function getAllSummonInfo(rawHtml: string){
    interface summonInfo {image: Image, level: number, uncaps: number, maxUncaps: number}
    const summons: Array<summonInfo> = []
    const summonIDs = [
        '10', '11', // Fire summon IDs
        '20', '21', // Water summon IDs
        '30', '31', // Earth summon IDs
        '40', '41', // Wind summon IDs
        '50', '51', // Light summon IDs
        '60', '61', // Dark summon IDs
        '00', '01', '02', '03' // Misc summon IDs
    ]

    const summonPrivate = /Support Summons<\/div>\n\n.+<div class="txt-private">Private/.test(rawHtml)
    if (summonPrivate) return []

    const summonImageLinks: string[] = []
    summonIDs.forEach(ID => {
        const nameRegex = new RegExp(`(?<=summon${ID}-name" class="prt-fix-name" name=").+?(?=">)`)
        const uncapRegex = new RegExp(`(?<=summon${ID}-info" class="prt-fix-info bless-rank)\\d`)
        const levelRegex = new RegExp(`summon${ID}-name".+?(\\d+)`)
        const summonURLRegex = new RegExp(`Support Summons.+${ID.replace(/(\d)(\d)/, '$1/$2')}".+?src="(.+?)"`, 's')

        const summon = database.summons.find(summon => summon.get('name') === String(rawHtml.match(nameRegex)))
        const level = parseInt(String(rawHtml.match(levelRegex)?.[1]))
        const uncapRank = parseInt(String(rawHtml.match(uncapRegex)))
        let uncaps = uncapRank
        let maxUncaps = isNaN(uncapRank) ? NaN : Math.min(parseInt(summon?.get('maxUncaps') ?? 3), 5)
        summonImageLinks.push(rawHtml.match(summonURLRegex)![1])

        if (uncapRank === 0 || level > 200 || isNaN(uncapRank)) { // Guess the summon uncap status based on level
            if (1   <= level && level <= 40)  uncaps = 0
            if (41  <= level && level <= 60)  uncaps = 1
            if (61  <= level && level <= 80)  uncaps = 2
            if (81  <= level && level <= 100) uncaps = 3
            if (101 <= level && level <= 150) uncaps = 4
            if (151 <= level && level <= 200) uncaps = 5

            if (level > 200) {
                uncaps = Math.ceil((level - 200) / 10)
                maxUncaps = 6
            }
        } else {
            uncaps += 2
        }

        summons.push({
            image: IMAGES['Private_Support_Summon.png'],
            level: level,
            uncaps: uncaps,
            maxUncaps: maxUncaps
        })
    })

    const summonImages = await Promise.all(summonImageLinks.map(link => loadImage(link)))
    summons.forEach((summon, i) => summon.image = summonImages[i])

    return summons
}


/**
 * Draws uncap stars for summons.
 * @param ctx - The canvas context to draw the stars onto.
 * @param spacing - How far apart the stars should be spaced in pixels.
 * @param size - The width and height when drawing the stars
 * @param uncaps - The number of times the summon has been uncapped.
 * @param maxUncaps - The maximum number of times the summon can be uncapped.
 * @param x - The x coordinate from which to start drawing the uncap stars.
 * @param y - The y coordinate from which to start drawing the uncap stars.
 */
export function drawStars(ctx: CanvasRenderingContext2D, spacing: number, size: number, uncaps: number, maxUncaps: number, x: number, y: number) {
    ctx.save()
    ctx.shadowColor = 'black'
    ctx.shadowOffsetX = 2
    ctx.shadowOffsetY = 2

    // Move the cursor to the right (increase the x value) if fewer stars need to be drawn
    const maxStars = Math.min(maxUncaps, 5)
    x += (5 - maxStars) * spacing

    for (let i = 1; i <= maxStars; i++) {
        const xPos = x + spacing * (i - 1), yPos = y
        let star: Image

        if (maxUncaps === 6) {
            star = i <= uncaps ? IMAGES['Transcendence_Star_5.png'] : IMAGES['Transcendence_Star_Blank.png']
        } else {
            if (i <= 3) {
                star = i <= uncaps ? IMAGES['Uncap_Star.png'] : IMAGES['Uncap_Star_Blank.png']
            } else {
                star = i <= uncaps ? IMAGES['Blue_Uncap_Star.png'] : IMAGES['Blue_Uncap_Star_Blank.png']
            }
        }

        ctx.drawImage(star, xPos, yPos, size, size)
    }
    ctx.restore()
}

/**
 * Searches for a player by name via https://gbfdata.com and returns their player ID. 
 * 
 * - Displays a menu allowing the user to pick from multiple options if necessary.
 * - Replies to the original interaction with an error message if no players were found or if gbfdata is unavailable.
 */
export async function findPlayer(interaction: ChatInputCommandInteraction, playerName: string) {
    const searchEmbed = new EmbedBuilder()
        .setTitle(`Searching for "${playerName}" <a:loading:1543822841953128549>`)
        .setColor('Blue')
        .setAuthor({
            name: 'Player Search',
            iconURL: IMAGE_URLS['Granblue_Fantasy_Logo.png']
        })
        .setFooter({
            text: 'https://gbfdata.com/',
            iconURL: IMAGE_URLS['gbfdata_Icon.png']
        })

    await interaction.editReply({ embeds: [searchEmbed] })
    
    // Search https://gbfdata.com for players
    type playerData = { user_id: number, name: string, level: number, ranking: null | { rank: number, point: number } }
    const { data: { data: playerData } } = await axios.get<{ data: playerData[] }>(
        `https://gbfdata.com/api/users/search?q=${urlencode(playerName)}&is_fulltext=1`,
        { headers: { 'User-Agent': 'Europa Bot' } }
    ).catch(() => ({ data: { data: undefined } }))

    if (!playerData || playerData.length === 0) {
        interaction.editReply({
            content: playerData
                ? `I could not find any players named "${playerName}". Please adjust your spelling or capitalization and try again.`
                : 'Player search is currently unavailable. Please try again later.',
            embeds: []
        })
        return
    }
    
    if (playerData.length === 1) { return String(playerData[0].user_id) }

    playerData.sort((a, b) => b.level - a.level)
    playerData.sort((a, b) => compareTwoStrings(b.name, playerName) - compareTwoStrings(a.name, playerName))
    const formattedPlayers = playerData.map(player => `${player.name} Rank ${player.level} (${player.user_id})`)

    const userChoice = await showMenu(interaction, playerName, formattedPlayers)
    return isNumber(userChoice) ? String(playerData[userChoice].user_id) : undefined
}