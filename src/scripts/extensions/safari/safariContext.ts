export enum ContextType {
	Img,
	Selection
}

export interface ContextItemParameter {
	type: ContextType;
	parameters: any;
}
