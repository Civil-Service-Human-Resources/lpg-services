export const fakeCache = {
	get: async (id: string) => Promise.resolve(undefined),
	setObject: async <T>(object: T) => Promise.resolve(undefined),
}
