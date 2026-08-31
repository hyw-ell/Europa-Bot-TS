export const languageCookie = { name: 'ln', value: '2', domain: 'game.granbluefantasy.jp' }
export const accessCookie = { name: 'wing', value: process.env.GBF_WING!, domain: 'game.granbluefantasy.jp' }

export const rarityFullNames = {
    'SSR': 'SS Rare',
    'SR': 'S Rare',
    'R': 'Rare',
    'N': 'Normal'
} as const

export const rarityEmotes = {
    'SS Rare': '<:SSR:1543809314349908059> ',
    'S Rare': '<:SR:1543809315197165578> ',
    'Rare': '<:R_:1543809313204740096> ',
    'Normal': '<:Normal:1543817674600091728>'
} as const

export const weaponEmotes = {
    'Sabre': '<:Sabre:1543809331714195556> ',
    'Dagger': '<:Dagger:1543809318921441382> ',
    'Spear': '<:Spear:1543809323128328233> ',
    'Axe': '<:Axe:1543809316954447943> ',
    'Staff': '<:Staff:1543809322058907759> ',
    'Gun': '<:Gun:1543809316128297010> ',
    'Melee': '<:Melee:1543809317856350308> ',
    'Bow': '<:Bow:1543809319877746741> ',
    'Harp': '<:Harp:1543809321018851420> ',
    'Katana': '<:Katana:1543809324114251816> '
} as const