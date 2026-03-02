import { GoogleSpreadsheet, GoogleSpreadsheetRow, GoogleSpreadsheetWorksheet } from "google-spreadsheet"
import { JWT } from "google-auth-library"
import { decode } from "html-entities"
import axios from "axios"
import { capFirstLetter } from "../utils/string.js"
import { rarityFullNames } from "./granblue.js"
import { MILLISECONDS } from './time.js'
import { THIS_SHARD_ID } from '../bot.js'

export interface serverData { 
    guildName: string,  guildID: string,    greeting: string,   roles: string,  events: string,
    reminders: string,  receivedReminders: string
}
export interface userData {
	username: string,	userID: string,
	crystals: string,	mobaCoin: string,   tickets: string,    tenParts: string,   rolls: string,
    background: string, sparkTitle: string, reminders: string,  receivedReminders: string
}
export interface itemData {
    name: string
    id: string
    rarity: "SS Rare" | "S Rare" | "Rare" | "Normal"
    element: "Fire" | "Water" | "Earth" | "Wind" | "Light" | "Dark"
    series: string
    obtain: string
    maxUncaps: 3 | 4 | 5 | 6
}
export interface characterData extends itemData { weaponName: string, weaponID: string }

export const database = {} as {
    serversTable: GoogleSpreadsheetWorksheet
    usersTable: GoogleSpreadsheetWorksheet
    charactersTable: GoogleSpreadsheetWorksheet
    summonsTable: GoogleSpreadsheetWorksheet
    variablesTable: GoogleSpreadsheetWorksheet
    
    servers: Array<GoogleSpreadsheetRow<serverData>>
    users: Array<GoogleSpreadsheetRow<userData>>
    characters: Array<GoogleSpreadsheetRow<characterData>>
    summons: Array<GoogleSpreadsheetRow<itemData>>
    variables: Array<GoogleSpreadsheetRow<{key: string, value: string}>>
}

const serviceAccountAuth = new JWT({
	email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
	key: process.env.GOOGLE_PRIVATE_KEY,
	scopes: ['https://www.googleapis.com/auth/spreadsheets']
})

export async function connectDatabase() {
    const gsheetsDB = new GoogleSpreadsheet(process.env.PRIVATE_DB_ID!, serviceAccountAuth)
    await gsheetsDB.loadInfo()

    database.serversTable    = gsheetsDB.sheetsByTitle['Servers']
    database.usersTable      = gsheetsDB.sheetsByTitle['Users']
    database.charactersTable = gsheetsDB.sheetsByTitle['Characters']
    database.summonsTable    = gsheetsDB.sheetsByTitle['Summons']
    database.variablesTable  = gsheetsDB.sheetsByTitle['Variables']

	;[
        database.servers,
        database.users,
        database.characters,
        database.summons,
        database.variables
    ] = await Promise.all([
		database.serversTable.getRows(),
		database.usersTable.getRows(),
        database.charactersTable.getRows(),
        database.summonsTable.getRows(),
        database.variablesTable.getRows()
	])

	console.log(`Database connection successful for Shard #${THIS_SHARD_ID}`)
}