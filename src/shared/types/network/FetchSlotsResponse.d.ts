type SlotMeta = {
	readonly name: string;
	readonly color: SerializedColor;
	readonly blocks: number;
};
type SerializedSlotsMeta = readonly Readonly<SlotMeta & { index: number }>[];

interface FetchSlotsResponse extends Response {
	readonly purchasedSlots: number;
	readonly slots: SerializedSlotsMeta;
}
