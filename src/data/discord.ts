export const BOT_OWNER_ID = '251458435554607114'
const DEV_ID = '631961435051917362'
const PROD_ID = '521180443958181889'

const devMode = process.env.DEV_MODE === 'true'
export const BOT_ID = devMode ? DEV_ID : PROD_ID
export const BOT_TOKEN = devMode ? process.env.DEV_TOKEN! : process.env.PROD_TOKEN!

export const HOME_SERVER_ID = '379501550097399810'

export const CHANNEL_IDS = {
    ERROR: '672715578347094026',
    COMMAND_LOG: '577636091834662915',
    SERVER_COUNT: '657766651441315840',
}
