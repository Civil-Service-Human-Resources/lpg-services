export const fakeCache = {
	get: async (id: string) => Promise.resolve(undefined),
	setObject: async (object: T) => Promise.resolve(undefined),
}
