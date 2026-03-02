// export let playerTemplate: Image
// export let summonsTemplate: Image
// export let privateSummon: Image
// export let openSummon: Image
// export let regularStar: Image
// export let blankRegularStar: Image
// export let blueStar: Image
// export let blankBlueStar: Image
// export let transcendenceStars: Image[]
// export let perpetuityRingIcon: Image

// export let eventsBackgroundTop: Image
// export let eventsBackgroundMiddle: Image
// export let eventsBackgroundBottom: Image
// export let upcomingEventsText: Image

// export let fireAdvantage: Image
// export let waterAdvantage: Image
// export let earthAdvantage: Image
// export let windAdvantage: Image
// export let lightAdvantage: Image
// export let darkAdvantage: Image

// export let sparkBGMask: Image
// export let clearSparkBG: Image
// export let clearMBSparkBG: Image
// export let defaultSparkBG: Image
// export let defaultMBSparkBG: Image
// export let developerTitle: Image
// export let VIPTitle: Image
// export let progressBars: Image[]

// export let skydomWallpaper: Image
// export async function loadAssets(){
//     const assetPaths = readdirSync('assets/').filter(asset => /.png/i.test(asset))
//     const loadedAssets = await Promise.all(assetPaths.map(asset => loadImage(`assets/${asset}`)))
//     const assets = Object.fromEntries(loadedAssets.map((asset, i) => [String(assetPaths[i].match(/[^.]+/)), asset]));

//     playerTemplate = images['Player_Template.png']
//     summonsTemplate = images['Support_Summmons_Template.png']
//     privateSummon = images['Private_Support_Summon.png']
//     openSummon = images['Open_Support_Summon.png']
//     regularStar = images['Uncap_Star.png']
//     blankRegularStar = images['Uncap_Star_Blank.png']
//     blueStar = images['Blue_Uncap_Star.png']
//     blankBlueStar = images['Blue_Uncap_Star_Blank.png']
//     transcendenceStars = [
//         images['Transcendence_Star_0.png'],
//         images['Transcendence_Star_1.png'],
//         images['Transcendence_Star_2.png'],
//         images['Transcendence_Star_3.png'],
//         images['Transcendence_Star_4.png'],
//         images['Transcendence_Star_5.png'],
//         images['Transcendence_Star_Blank.png']
//     ]
//     perpetuityRingIcon = images['Perpetuity_Ring_Icon.png']
//     eventsBackgroundTop = images['Events_Background_Top.png']
//     eventsBackgroundMiddle = images['Events_Background_Middle.png']
//     eventsBackgroundBottom = images['Events_Background_Bottom.png']
//     upcomingEventsText = images['Upcoming_Events_Text.png']
//     fireAdvantage = images['Fire_Advantage.png']
//     waterAdvantage = images['Water_Advantage.png']
//     earthAdvantage = images['Earth_Advantage.png']
//     windAdvantage = images['Wind_Advantage.png']
//     lightAdvantage = images['Light_Advantage.png']
//     darkAdvantage = images['Dark_Advantage.png']
//     sparkBGMask = images['Spark_Template_Background_Mask.png']
//     clearSparkBG = images['Spark_Template_Translucent_BG.png']
//     clearMBSparkBG = images['Spark_Template_Translucent_BG_with_MobaCoin.png']
//     defaultSparkBG = images['Spark_Template.png']
//     defaultMBSparkBG = images['Spark_Template_with_MobaCoin.png']
//     developerTitle = images['Developer_Title.png']
//     VIPTitle = images['VIP_Title.png']
//     progressBars = [
//         images['Progress_Bar_1.png'],
//         images['Progress_Bar_2.png'],
//         images['Progress_Bar_3.png'],
//         images['Progress_Bar_4.png'],
//         images['Progress_Bar_5.png'],
//         images['Progress_Bar_6.png'],
//     ]
//     skydomWallpaper = images['Skydom_Wallpaper.png']
// }

import { loadImage } from 'canvas'
import { AttachmentBuilder } from 'discord.js'
import { getAllFilePaths } from '../utils/filesystem.js'
import path from 'path'

const pngFilePaths = getAllFilePaths('./assets', 'png')

// const attachmentFilePaths = pngFilePaths.filter(f => /Misc_Icons|Infographics|Difficulty_Icons|Shard_Icons/.test(f))
const imageFilePaths = pngFilePaths.filter(f => /Misc|Events|Icons|Player|Spark/.test(f))

const imagePromises = imageFilePaths.map(f => loadImage(f))
const resolvedImages = await Promise.all(imagePromises)

// export const attachments = Object.fromEntries(
//     attachmentFilePaths.map(filePath => {
//         const fileName = path.basename(filePath)
//         return [fileName, new AttachmentBuilder(filePath, { name: fileName })]
//     })
// )

export const images = Object.fromEntries(
    imageFilePaths.map((filePath, index) => [path.basename(filePath), resolvedImages[index]])
)
