import * as puppeteer from 'puppeteer'

export const selectors: Record<string, string> = {
	feedbackPrompt: '.feedback-prompt',
	feedbackDetails: '.feedback-details',
	feedbackDoingField: '#whatDoing',
	feedbackWrongField: '#wentWrong',
	feedbackSubmitButton: 'button[name="commit"]',
}

export async function completeFeedback(page: puppeteer.Page) {
	await page.type(selectors.feedbackDoingField, 'What you were doing')
	await page.type(selectors.feedbackWrongField, 'What went wrong')
	await page.click(selectors.feedbackSubmitButton)
}
