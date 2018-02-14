const TIMEOUT = 15000

export async function wrappedBeforeAll(fn: () => void) {
	beforeAll(async () => {
		try {
			await fn()
		} catch (err) {
			console.log('Unexpected error in beforeAll:', err)
		}
	}, TIMEOUT)
}

export async function wrappedAfterAll(fn: () => void) {
	afterAll(async () => {
		try {
			await fn()
		} catch (err) {
			console.log('Unexpected error in afterAll:', err)
		}
	}, TIMEOUT)
}
