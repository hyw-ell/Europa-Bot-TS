import axios from 'axios'
import { decode } from 'punycode'
import { itemData, database } from '../data/database.js'
import { rarityFullNames } from '../data/granblue.js'
import { MILLISECONDS } from '../data/time.js'
import { capFirstLetter } from '../utils/string.js'

/**
 * Fetches summon data from the Wiki's Cargo Tables and stores it in the database
 */
export async function getSummonData(retries: number = 1) {
    if (retries < 0) return

    const { data: summons } = await axios.get<itemData[]>(
        'https://gbf.wiki/index.php?title=Special:CargoExport',
        {
            headers: { 'User-Agent': process.env.GBF_WIKI_AGENT! },
            params: {
                tables: 'summons',
                fields: [
                    'name', 'id', 'rarity', 'element', 'series', 'obtain', 'evo_max=maxUncaps'
                ].map(field => `summons.${field}`).join(','),
                limit: 1000,
                format: 'json'
            }
        }
    ).catch(() => ({ data: null }))

    if (!summons) return setTimeout(() => getSummonData(--retries), MILLISECONDS.MINUTE)

    // Only update the database if new summons were added
    if (summons.length === database.summons.length) return

    await database.summonsTable.clearRows()
    await database.summonsTable.addRows(
        summons.map(({name, rarity, element, series, obtain, ...summonData}) => ({
            name: decode(name),
            rarity: rarityFullNames[rarity],
            element: capFirstLetter(element),
            series: decode(series),
            obtain: decode(obtain),
            ...summonData
        }))
    )

    console.log('Summon Data has been updated.')
}