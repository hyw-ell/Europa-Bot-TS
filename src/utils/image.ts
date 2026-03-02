import axios from 'axios'
import { loadImage } from 'canvas'
import { Attachment } from 'discord.js'
import { database } from '../data/database.js'

/**
 * Fetches an image link from an Attachment image. If given an image URL, fetches an image link from that URL.
 * - Indirect Imgur links will return a direct image link.
 * - Imgur Albums, Galleries, and Topics links will return the link to the first image in the group.
 */
export async function getImageLink(image: string | Attachment){
    let imageLink = ''
    if (typeof image === 'string'){  
        const config = { headers: { Authorization: `Client-ID ${process.env.IMGUR_CLIENT_ID}` } }
        if (/(imgur\.com\/)(gallery|a|t)/i.test(image)) { // Handle imgur albums/galleries
            const albumHash = image.match(/\w+$/)
            const { data: { data } } = await axios.get(`https://api.imgur.com/3/album/${albumHash}/images`, config)
            imageLink = data[0].link
        } else if (/(?<=\/)imgur\.com/i.test(image)) { // Handle indirect imgur links
            const imageHash = image.match(/\w+$/)
            const { data: { data } } = await axios.get(`https://api.imgur.com/3/image/${imageHash}`, config)
            imageLink = data.link
        } else {
            imageLink = image
        }
    } else {
        if (!/image\/(jpeg|png|gif)/.test(image.contentType!)) {
            throw 'The image must either be a JPG, PNG, or GIF.'
        }
        imageLink = image.url
    }

    const validImage = await loadImage(imageLink).catch(() => undefined)
    if (!validImage) throw 'I could not access the image you provided.'

    return imageLink
}

/**
 * @param image - Binary file, base64 data, or url for an image/video (up to 10mb)
 * @param album - ID of the album you want to add the image/video to. Deletehash for anonymous albums
 * @param type - file, url, base64, or raw
 */
interface imgurImgInfo {
    image: string
    album?: string
    type?: string
    name?: string
    title?: string
    description?: string
}

interface imgurUploadResponse {
    id: string
    deletehash: string
    account_id: string
    account_url: string
    type: string
    link: string
}

/**
 * Upload an image to an Imgur account
 */
export async function uploadImage(imgInfo: imgurImgInfo) {
    const accessToken = database.variables.find(v => v.get('key') === 'IMGUR_ACCESS_TOKEN')?.get('value')
    const config = {
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    }

    const { data: { data }} = await axios.post<{data: imgurUploadResponse}>('https://api.imgur.com/3/image', imgInfo, config)
        .catch(() => ({ data: { data: undefined } }))
    if (!data) throw 'Failed to upload image. Please try again later.'

    return data
}

/**
 * Generates a new Imgur access token
 */
export async function getAccessToken() {
    const params = {
        refresh_token: process.env.IMGUR_REFRESH_TOKEN, 
        client_id: process.env.IMGUR_CLIENT_ID,
        client_secret: process.env.IMGUR_CLIENT_SECRET,
        grant_type: 'refresh_token'
    }

    const { data: { access_token } } = await axios.post<{access_token: string }>('https://api.imgur.com/oauth2/token', params)
        .catch(() => ({ data: { access_token: undefined } }))
    if (!access_token) throw 'Failed to retrieve Access Token'
    
    return access_token
}