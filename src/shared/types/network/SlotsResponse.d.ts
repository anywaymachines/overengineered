interface SlotsResponse extends Response {
	purchasedSlots: number;
	slots: { name: string; color: SerializedColor; blocks: number }[];
}
