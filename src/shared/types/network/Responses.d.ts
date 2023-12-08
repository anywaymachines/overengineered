type SuccessResponse<T extends {} = {}> = T & { readonly success: true };
type ErrorResponse = { readonly success: false; readonly message: string };
type Response<T extends {} = {}> = SuccessResponse<T> | ErrorResponse;

type BuildResponse = Response<{ readonly model: Model }>;

type TouchControlInfo = Readonly<Record<string, { readonly pos: SerializedVector2 }>>;
type SlotMeta = {
	readonly name: string;
	readonly color: SerializedColor;
	readonly blocks: number;
	readonly size: number;
	readonly touchControls: TouchControlInfo;
};
type SerializedSlotsMeta = readonly (SlotMeta & { readonly index: number })[];

type FetchSlotsResponse = Response<{
	readonly purchasedSlots: number;
	readonly slots: SerializedSlotsMeta;
}>;

type PlayerDataResponse = {
	readonly purchasedSlots: number | undefined;
	readonly settings: PlayerConfig | undefined;
	readonly slots: SerializedSlotsMeta | undefined;
};

type SaveSlotResponse = Response<{ readonly blocks: number | undefined; readonly size: number | undefined }>;
