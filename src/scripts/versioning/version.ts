export class Version {
	private major: number;
	private minor: number;
	private patch: number;
	private stringRepresentation: string;

	constructor(version: string) {
		if (!version || !/^\d+\.\d+\.\d+$/.test(version)) {
			throw new Error("version must match 'int.int.int' pattern, but was: " + version);
		}

		let parts = version.split(".");
		this.major = parseInt(parts[0], 10);
		this.minor = parseInt(parts[1], 10);
		this.patch = parseInt(parts[2], 10);

		this.stringRepresentation = this.major + "." + this.minor + "." + this.patch;
	}

	public isEqualTo(other: Version): boolean {
		return this.major === other.major && this.minor === other.minor && this.patch === other.patch;
	}

	public isGreaterThan(other: Version): boolean {
		if (this.major !== other.major) {
			return this.major > other.major;
		}
		if (this.minor !== other.minor) {
			return this.minor > other.minor;
		}
		return this.patch > other.patch;
	}

	public isGreaterThanOrEqualTo(other: Version): boolean {
		return this.isEqualTo(other) || this.isGreaterThan(other);
	}

	public isLesserThan(other: Version): boolean {
		if (this.major !== other.major) {
			return this.major < other.major;
		}
		if (this.minor !== other.minor) {
			return this.minor < other.minor;
		}
		return this.patch < other.patch;
	}

	public isLesserThanOrEqualTo(other: Version): boolean {
		return this.isEqualTo(other) || this.isLesserThan(other);
	}

	public toString(): string {
		return this.stringRepresentation;
	}
}
