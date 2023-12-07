type PlayerDataResponse = {
	readonly purchasedSlots: number | undefined;
	readonly settings: PlayerConfig | undefined;
	readonly slots: SerializedSlotsMeta | undefined;
};
