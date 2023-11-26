interface SlotsResponse extends Response {
	additionalSaveSlots?: number;
	slots: { name?: string; color?: SerializedColor; blocks: number }[];
}
