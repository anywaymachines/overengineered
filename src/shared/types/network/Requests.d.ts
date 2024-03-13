type PlayerSaveSlotRequest = {
	readonly index: number;
	readonly name?: string;
	readonly color?: SerializedColor;
	readonly touchControls?: TouchControlInfo;
	readonly save: boolean;
};
