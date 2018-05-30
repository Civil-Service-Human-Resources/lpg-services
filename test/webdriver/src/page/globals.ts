export const selectors: Record<string, string> = {
	author: 'a[href="#"]',
	cookies: 'a[href="https://www.gov.uk/help/cookies"]',
	copyright: '.copyright > a',
	feedbackDetails: '.feedback-details',
	feedbackDoingField: '#whatDoing',
	feedbackPrompt: '.feedback-prompt',
	feedbackSubmitButton: 'button[name="commit"]',
	feedbackWrongField: '#wentWrong',
	homeMenuButton: 'a[href="/home"]',
	learningRecordMenuButton: 'a[href="/learning-record"]',
	license: 'a[rel="license"]',
	privacy: 'a[href="https://lpg.cshr.digital/privacy"]',
	profileMenuButton: 'a[href="/profile"]',
	searchMenuButton: 'a[href="/search"]',
	signoutMenuButton: 'a[href="/sign-out"]',
	suggestionsMenuButton: 'a[href="suggestions-for-you"]',
}

export function completeFeedback() {
	browser.setValue(selectors.feedbackDoingField, 'What you were doing')
	browser.setValue(selectors.feedbackWrongField, 'What went wrong')
	browser.click(selectors.feedbackSubmitButton)
}

export function genUserEmail() {
	return `test${Date.now()}@c.gov.uk`
}
