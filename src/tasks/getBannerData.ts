import axios from "axios"
import { App } from "octokit"
import { IS_HOME_SHARD } from '../bot.js'
import { dateStringToUnix } from "../utils/time.js"
import { COOKIES } from "../data/granblue.js"
import { character, rawItem, bannerData, bannerInfo } from '../data/banner.js'

// Extra numbers are used as placeholders for future additions
const SPECIALTIES = ['?', 'Sabre', 'Dagger', 'Spear', 'Axe', 'Staff', 'Gun', 'Melee', 'Bow', 'Harp', 'Katana', '11', '12', '13', '14', '15']
const ATTRIBUTES = ['?', 'Fire', 'Water', 'Earth', 'Wind', 'Light', 'Dark', '7', '8', '9', '10']
const RARITIES = ['?', 'Normal', 'Rare', 'S Rare', 'SS Rare', '5', '6', '7', '8', '9', '10']
const STYLES = ['?', 'Balanced', 'Attack', 'Defense', 'Heal', 'Special', '7', '8', '9', '10'] // Internally called "Type", even though the game displays Race next to Type
const SERIES = ['?', 'Summer', 'Yukata', 'Valentine', 'Halloween', 'Holiday', '12 Generals', 'Grand', 'Fantasy', 'Tie-In', 'Eternals', 'Evokers', '4 Saints', 'Formal', '14', '15', '16', '17', '18', '19', '20']
const TRIBES = ['?', 'Human', 'Erune', 'Draph', 'Harvin', 'Unknown', 'Primal', '7', '8', '9', '10']

/**
 * Gets and parses banner data from Granblue Fantasy and uploads to github.com/hyw-ell/GBF-Banner-Data
 * 
 * Code here will no longer be executed by this bot. For reference only.
 */
export async function getBannerData() {
	const gameVersion = (await axios.get('http://game.granbluefantasy.jp/')).data.match(/(?<="version": ")\d+(?=")/i)?.[0]
	if (!gameVersion) return

	const headers = {
		Cookie: `midship=${COOKIES.MIDSHIP}; wing=${COOKIES.WING}; t=dummy; ln=2`,
        'X-Requested-With': 'XMLHttpRequest',
        'X-VERSION': gameVersion
    }
	
	const bannerInfo = await axios.get('http://game.granbluefantasy.jp/gacha/list', { headers: headers })
	const banner = bannerInfo.data.legend.lineup.find((banner: { name: string }) => banner.name === 'Premium 10-Part Draw')
	console.log(bannerInfo.data.legend.lineup)
	const [items1Info, items2Info, featured, { data: characters }] = await Promise.all([
		axios.get(`http://game.granbluefantasy.jp/gacha/provision_ratio/legend/${banner.id}/1`, { headers: headers }),
		axios.get(`http://game.granbluefantasy.jp/gacha/provision_ratio/legend/${banner.id}/2`, { headers: headers }),
		axios.get('https://game.granbluefantasy.jp/gacha/list', { headers: headers }),
		axios.get('https://hyw-ell.github.io/GBF-Banner-Data/characters.json') as unknown as { data: character[] }
	])
	
	let cumulativeDropRate1 = 0
	let cumulativeDropRate2 = 0
	const items1: rawItem[] = items1Info.data.appear.flatMap((data: { rarity_name: string, item: rawItem[] }) => data.item.map((item) => ({ ...item, rarity: data.rarity_name })))
	const items2: rawItem[] = items2Info.data.appear.flatMap((data: { rarity_name: string, item: rawItem[] }) => data.item.map((item) => ({ ...item, rarity: data.rarity_name })))

	bannerData.items = items1.map(item1 => {
		const item2 = items2.find(item2 => item1.reward_id === item2.reward_id)
		cumulativeDropRate1 += parseFloat(item1.drop_rate)
		cumulativeDropRate2 += parseFloat(item2?.drop_rate ?? '0')

		return {
			name: `${item1.name} ${item1.season_message}`.trim(),
			id: String(item1.reward_id),
			rarity: item1.rarity,
			element: ATTRIBUTES[parseInt(item1.attribute)],
			type: item1.kind ? SPECIALTIES[parseInt(item1.kind)] : 'Summon',
			rate1: parseFloat(item1.drop_rate),
			rate2: parseFloat(item2?.drop_rate ?? '0'),
			cum_rate1: parseFloat(cumulativeDropRate1.toFixed(3)),
			cum_rate2: parseFloat(cumulativeDropRate2.toFixed(3)),
			rate_up: Boolean(item1.incidence),
			character: item1.character_name
		}
	})

	const characterWeapons = bannerData.items.filter(item => item.character)
	const newChars = characterWeapons.filter(weapon => characters.map(char => char.weapon_id).indexOf(weapon.id) === -1)
	const newCharNumber = characters.length + 1
	for (let i = newCharNumber; i < newCharNumber + newChars.length; i++) {
		const {
            data: { option: { chara: { master } } },
            data: { option: { chara } }
        } = await axios.get(`https://game.granbluefantasy.jp/gacha/content/chara/legend/111111/${i}`, { headers: headers })

		characters.push({
			number: String(i),
			id: master.id,
			name: master.name,
			short_name: master.short_name,
			style: STYLES[master.type],
			rarity: RARITIES[master.rarity],
			element: ATTRIBUTES[master.attribute],
			uncaps: master.max_evolution_level,
			specialties: master.specialty.map((specialty: number) => SPECIALTIES[specialty]), 
			series: master.series_id.map((s: number) => SERIES[s]).filter((e: string) => e),
			races: [ TRIBES[master.tribe], TRIBES[master.tribe_2] ].filter(e => e),
			voice_actor: chara.voice_acter,
			weapon_name: chara.open_reward.name,
			weapon_id: chara.story.open_reward_id
		})
	}

	// Summer/Grand Zooey is the only Summer series character who can appear on non-summer banners, so she needs to be filtered out.
	const GRAND_ZOOEY_ID = '3040092000'
	const allSeries: string[] = characters
		.filter(char => char.id !== GRAND_ZOOEY_ID && bannerData.items.some(item => item.id === char.weapon_id))
		.flatMap(char => char.series)
	const uniqueSeries = [...new Set(allSeries)]
	const seasons = uniqueSeries.filter(series => ['Summer', 'Halloween', 'Valentine', 'Yukata', 'Holiday'].includes(series))

	bannerData.bannerInfo = {
		id: banner.id,
		key: bannerInfo.data.legend.random_key,
		start: banner.service_start,
		end: banner.service_end,
		featuredItemIDs: featured.data.header_images,
		seasons: seasons,
		series: uniqueSeries,
		totalRate1: parseFloat(cumulativeDropRate1.toFixed(3)),
		totalRate2: parseFloat(cumulativeDropRate2.toFixed(3)),
		drawRates: {
			'SS Rare': items1Info.data.ratio[0].ratio,
			'S Rare': items1Info.data.ratio[1].ratio,
			'Rare': items1Info.data.ratio[2].ratio,
		}
	}

	if (!IS_HOME_SHARD) return

	const bannerStart = new Date(dateStringToUnix(banner.service_start)!)
	const bannerMonth = bannerStart.toLocaleString('default', { month: 'long', timeZone: 'JST' })
	const bannerYear = bannerStart.toLocaleString('default', { year: 'numeric', timeZone: 'JST' })
	
	const app = new App({
		appId: process.env.GITHUB_APP_ID!,
		privateKey: process.env.GITHUB_PRIVATE_KEY!,
	})

	const octokit = await app.getInstallationOctokit(parseInt(process.env.GITHUB_INSTALLATION_ID!))

	const bannerDataPath = `/repos/hyw-ell/GBF-Banner-Data/contents/${bannerYear}/${bannerMonth}/${banner.id}.json`
	const { status } = await octokit.request(`GET ${bannerDataPath}`).catch((error: any) => error)

	if (status === 404){ // Upload only if the file does not already exist
		await octokit.request(`PUT ${bannerDataPath}`, {
			message: `Upload banner data for banner ${banner.id}`,
			content: Buffer.from(JSON.stringify(bannerData, null, '\t')).toString('base64'),
		})
	}

	const directoryPath = '/repos/hyw-ell/GBF-Banner-Data/contents/directory.json'
	const { data: { content: directoryEncoded }, data: { sha: directorySHA } } = await octokit.request(`GET ${directoryPath}`)
	const directory = JSON.parse(atob(directoryEncoded))
	const newBannerInfo = {path: `/${bannerYear}/${bannerMonth}/${banner.id}.json`, ...bannerData.bannerInfo}

	if (!directory.find((bannerInfo: bannerInfo) => bannerInfo.id === newBannerInfo.id)) {
		directory.unshift(newBannerInfo)
		await octokit.request(`PUT ${directoryPath}`, {
			message: `Add banner ${banner.id} to directory`,
			content: Buffer.from(JSON.stringify(directory, null, '\t')).toString('base64'),
			sha: directorySHA
		})
	}

	const characterPath = '/repos/hyw-ell/GBF-Banner-Data/contents/characters.json'
	const { data: { sha: characterSHA } } = await octokit.request(`GET ${characterPath}`)
	if (newChars.length) {
		await octokit.request(`PUT ${characterPath}`, {
			message: `Add new characters to characters list`,
			content: Buffer.from(JSON.stringify(characters, null, '\t')).toString('base64'),
			sha: characterSHA
		})
	}
}