type SlotMeta = {
	readonly name: string;
	readonly color: SerializedColor;
	readonly blocks: number;
	readonly size: number;
};
type SerializedSlotsMeta = readonly Readonly<SlotMeta & { index: number }>[];

type FetchSlotsResponse =
	| (SuccessResponse & {
			readonly purchasedSlots: number;
			readonly slots: SerializedSlotsMeta;
	  })
	| ErrorResponse;
