import { Browser, launch } from 'puppeteer'
import { THIS_SHARD_ID } from '../bot.js'

export let browser: Browser
export async function startPuppeteer() {
	browser = await launch({
		args: [
			'--single-process', // Do not use --single-process on Windows
			'--no-zygote',
			'--no-sandbox'
		]
	})
	console.log(`Puppeteer browser launched for Shard #${THIS_SHARD_ID}`)
}