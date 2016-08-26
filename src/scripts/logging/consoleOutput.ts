export interface ConsoleOutput {
	warn(message: string, object: any): void;
	error(message: string, object: any): void;
	info(message: string, object: any): void;
	log(message: string, object: any): void;
}
