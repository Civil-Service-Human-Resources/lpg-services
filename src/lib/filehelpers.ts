export function appropriateFileSize(fileSize: number): string {
	const c = 1024
	const dp = 2 //number of decimal places
	const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
	const i = Math.floor(Math.log(fileSize) / Math.log(c))
	return parseFloat((fileSize / Math.pow(c, i)).toFixed(dp)) + ' ' + sizes[i]
}

export function extension(file: string): string {
	return file.split('.').pop()!
}

export function fileName(url: string, withExt?: boolean): string {
	if (withExt) {
		return decodeURIComponent(url.split('/').pop()!)
	} else {
		return decodeURIComponent(url.split('/').pop()!.split('.')[0])
	}
}
