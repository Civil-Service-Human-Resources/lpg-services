import * as puppeteer from 'puppeteer'

export const selectors: Record<string, string> = {
	feedbackDetails: '.feedback-details',
	feedbackDoingField: '#whatDoing',
	feedbackPrompt: '.feedback-prompt',
	feedbackSubmitButton: 'button[name="commit"]',
	feedbackWrongField: '#wentWrong',
	signoutButton: 'a[href="/sign-out"]',
}

export async function completeFeedback(page: puppeteer.Page) {
	await page.type(selectors.feedbackDoingField, 'What you were doing')
	await page.type(selectors.feedbackWrongField, 'What went wrong')
	await page.click(selectors.feedbackSubmitButton)
}
