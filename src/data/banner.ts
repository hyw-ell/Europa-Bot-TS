export type rawItem = {
    name: string
    drop_rate: string
    rarity: string
    attribute: string
    kind: string | null
    incidence: string | null
    reward_id: number
    character_name: string | null
    is_season: boolean
    season_message: string
}
export type item = {
    name: string
    id: string
    rarity: string
    element: string
    type: string
    rate1: number
    rate2: number
    cum_rate1: number
    cum_rate2: number
    rate_up: boolean
    character: string | null
}
export type bannerInfo = {
    id: string
    key: string
    start: string
    end: string
    featuredItemIDs: string[]
    seasons: string[]
    series: string[]
    totalRate1: number
    totalRate2: number
    drawRates: {
        'SS Rare': string
        'S Rare': string
        'Rare': string
    }
}
export type character = {
    number: string
    id: string
    name: string
    short_name: string
    style: string
    rarity: string
    element: string
    uncaps: number
    specialties: string[]
    series: string[]
    races: string[]
    voice_actor: string
    weapon_name: string
    weapon_id: string
}

export const bannerData = {
    bannerInfo: {} as bannerInfo,
    items: [] as item[]
}