interface SlotsResponse extends Response {
	purchasedSlots: number;
	slots: readonly { index: number; name: string; color: SerializedColor; blocks: number }[];
}
