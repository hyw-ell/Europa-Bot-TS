import { loadImage } from 'canvas'
import { getAllFilePaths } from '../utils/filesystem.js'
import path from 'path'

const imageFilePaths = getAllFilePaths('./assets', 'png')
const imagePromises = imageFilePaths.map(f => loadImage(f))
const resolvedImages = await Promise.all(imagePromises)

export const IMAGES = Object.fromEntries(
    imageFilePaths.map((filePath, index) => [path.basename(filePath), resolvedImages[index]])
)

const BASE_URL = 'https://raw.githubusercontent.com/hyw-ell/Europa-Bot-TS/refs/heads/main/'
export const IMAGE_URLS = Object.fromEntries(
    imageFilePaths.map(filePath => [path.basename(filePath), BASE_URL + filePath.match(/assets.+/)])
)