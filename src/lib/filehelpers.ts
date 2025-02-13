export function appropriateFileSize(fileSize: number): string {
	const sizeMultiple = 1024
	const decimalPlaces = 2
	const fileSizeUnits = ['KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
	const fileSizeUnitIndex = Math.floor(Math.log(fileSize) / Math.log(sizeMultiple))
	return (
		parseFloat((fileSize / Math.pow(sizeMultiple, fileSizeUnitIndex)).toFixed(decimalPlaces)) +
		' ' +
		fileSizeUnits[fileSizeUnitIndex]
	)
}

export function extension(file: string): string {
	return file.split('.').pop()!
}

export function fileName(url: string, withExt?: boolean): string {
	let fileNameString = url.split('/').pop()!
	if (!withExt) {
		fileNameString = fileNameString.split('.')[0]
	}
	return decodeURIComponent(fileNameString)
}

export function extensionAndSize(url: string, size: number): string {
	return `${extension(url)}, ${appropriateFileSize(size)}`
}
