import * as svelte from 'ui/svelte'

export interface SignIn {
	loginFailed: boolean
	sessionDataKey: string
}

export function signIn(props: SignIn) {
	return svelte.render('sign-in', props)
}

export interface Profile {
	department: string
	emailAddress: string
	grade: string
	profession: string
}

export function profile(props: Profile) {
	return svelte.render('profile', props)
}

export function homepage() {
	return svelte.render('index')
}
