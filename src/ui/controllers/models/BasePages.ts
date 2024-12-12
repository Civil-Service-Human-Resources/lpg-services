export interface TemplatedPage {
	template: string
}

export interface PageWithBackLink extends TemplatedPage {
	backLink?: string
}
