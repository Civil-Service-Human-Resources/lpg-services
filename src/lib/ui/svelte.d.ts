declare module 'svelte' {
	export interface CompileOptions {
		format?: ModuleFormat
		name?: string
		filename?: string
		generate?: string
		globals?: ((id: string) => string) | object
		amd?: {
			id?: string
		}

		outputFilename?: string
		cssOutputFilename?: string

		dev?: boolean
		shared?: boolean | string
		cascade?: boolean
		hydratable?: boolean
		legacy?: boolean
		customElement?: CustomElementOptions | true
		css?: boolean
		store?: boolean

		onerror?: (error: Error) => void
		onwarn?: (warning: Warning) => void
	}

	export interface CompiledOutput {
		ast: {
			html: Node
		}
		stats: any
		js: any
		css: any
	}

	export interface CustomElementOptions {
		tag?: string
		props?: string[]
	}

	export type ModuleFormat = 'es' | 'amd' | 'cjs' | 'iife' | 'umd' | 'eval'

	interface Node {
		children: Node[]
		name: string
		type: string
	}

	export interface PreprocessOptions {
		markup?: (
			options: {content: string; filename: string}
		) => {code: string; map?: SourceMap | string}
		style?: Preprocessor
		script?: Preprocessor
		filename?: string
	}

	export type Preprocessor = (
		options: {
			content: string
			attributes: Record<string, string | boolean>
			filename?: string
		}
	) => {code: string; map?: SourceMap | string}

	export interface SourceMap {
		file: string
		sources: string[]
		sourcesContent: string
		names: string[]
		mappings: string[]

		toString(): string
		toUrl(): string
	}

	export interface Warning {
		loc?: {line: number; column: number; pos?: number}
		pos?: number
		message: string
		filename?: string
		frame?: string
		toString: () => string
	}

	export function compile(source: string, opts: CompileOptions): CompiledOutput

	export function preprocess(source: string, handlers: PreprocessOptions): void
}
