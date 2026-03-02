import axios from 'axios'
import { decode } from 'punycode'
import { characterData, database } from '../data/database.js'
import { rarityFullNames } from '../data/granblue.js'
import { MILLISECONDS } from '../data/time.js'

/**
 * Fetches character data from the Wiki's Cargo Tables and stores it in the database
 */
export async function getCharacterData(retries: number = 1) {
    if (retries < 0) return

    const {data: characters} = await axios.get<characterData[]>(
        'https://gbf.wiki/index.php?title=Special:CargoExport',
        {
            headers: { 'User-Agent': process.env.GBF_WIKI_AGENT! },
            params: {
                tables: 'weapons, characters',
                "join on": 'weapons.name=characters.join_weapon',
                fields: [
                    'name', 'id', 'rarity', 'element', 'series', 'obtain', 'max_evo=maxUncaps', 'join_weapon=weaponName'
                ].map(field => `characters.${field}`).join(',') + 'weapons.name=weaponName, weapons.id=weaponID',
                where: 'characters.id != ""',
                limit: 2000,
                format: 'json'
            }
        }
    ).catch(() => ({data: null}))

    if (!characters) return setTimeout(() => getCharacterData(--retries), MILLISECONDS.MINUTE)

    // Only update the database if new characters were added
    if (characters.length === database.characters.length) return

    await database.charactersTable.clearRows()
    await database.charactersTable.addRows(
        characters.map(({name, rarity, series, obtain, weaponName, ...characterData}) => ({
            name: decode(name),
            rarity: rarityFullNames[rarity],
            series: decode(series),
            obtain: decode(obtain[0]),
            weaponName: decode(weaponName),
            ...characterData
        }))
    )

    console.log('Character Data has been updated.')
}