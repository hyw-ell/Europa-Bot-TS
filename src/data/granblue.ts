export const languageCookie = { name: 'ln', value: '2', domain: 'game.granbluefantasy.jp' }
export const accessCookie = { name: 'wing', value: process.env.GBF_WING!, domain: 'game.granbluefantasy.jp' }

export const rarityFullNames: {[key: string]: 'SS Rare' | 'S Rare' | 'Rare' | 'Normal'} = {
    'SSR': 'SS Rare',
    'SR': 'S Rare',
    'R': 'Rare',
    'N': 'Normal'
}

export const rarityEmotes: {[key: string]: string} = {
    'SS Rare': '<:SSR:755671138624864266> ',
    'S Rare': '<:SR:755671130882179113> ',
    'Rare': '<:R_:755671123588546623> '
}

export const weaponEmotes: {[key: string]: string} = {
    'Sabre': '<:Sabre:755661280332742699> ',
    'Dagger': '<:Dagger:755667404784140348> ',
    'Spear': '<:Spear:755662079846776933> ',
    'Axe': '<:Axe:755668293632917564> ',
    'Staff': '<:Staff:755662292254851093> ',
    'Gun': '<:Gun:755668506300776520> ',
    'Melee': '<:Melee:755668026023477339> ',
    'Bow': '<:Bow:755662696745009194> ',
    'Harp': '<:Harp:755662500250386433> ',
    'Katana': '<:Katana:755661824925499442> '
}