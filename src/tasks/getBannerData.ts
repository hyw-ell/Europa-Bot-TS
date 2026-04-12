import axios from 'axios'
import { bannerData, bannerInfo } from '../data/banner.js'
import { sleep } from '../utils/time.js'

/**
 * Gets banner data from github.com/hyw-well/GBF-Banner-Data
 * @param delay Number of milliseconds to delay before executing the function. Defaults to 0
 */
export async function getBannerData(delay: number = 0) {
    await sleep(delay)

    const repoPath = 'https://hyw-ell.github.io/GBF-Banner-Data'
    const { data: bannerDirectory } = await axios.get<bannerInfo[]>(`${repoPath}/directory.json`)
    const { data: { info, items } } = await axios.get<typeof bannerData>(repoPath + bannerDirectory[0].path!)
    
    bannerData.info = info
    bannerData.items = items
}