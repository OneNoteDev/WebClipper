export class ExtensionUtils {
	/*
	 * Returns the relative path to the images directory.
	 */
	public static getImageResourceUrl(imageName: string) {
		// Since Chromebook has case-sensitive urls, we always go with lowercase image names.
		// See the use of "lowerCasePathName" in gulpfile.js where the images names are lower-cased
		// when copied)
		return ("images/" + imageName).toLowerCase();
	}
}
