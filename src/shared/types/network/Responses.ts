declare global {
	type SuccessResponse<T extends object = {}> = T & { readonly success: true };
	type ErrorResponse = { readonly success: false; readonly message: string };
	type Response<T extends object = {}> = SuccessResponse<T> | ErrorResponse;

	type TouchControlInfo = Readonly<Record<string, { readonly pos: SerializedVector2 }>>;
	type SlotMeta = {
		readonly name: string;
		readonly color: SerializedColor;
		readonly blocks: number;
		readonly size: number;
		readonly touchControls: TouchControlInfo;
		readonly index: number;
		readonly saveTime: number | undefined;
	};

	type LoadSlotResponse = Response<{
		readonly isEmpty: boolean;
	}>;

	type FetchSlotsResponse = Response<{
		readonly purchasedSlots: number;
		readonly slots: readonly SlotMeta[];
	}>;

	type PlayerDataResponse = {
		readonly purchasedSlots: number | undefined;
		readonly settings: Partial<PlayerConfig> | undefined;
		readonly slots: readonly SlotMeta[] | undefined;
		readonly imported_slots: readonly SlotMeta[] | undefined;
	};

	type SaveSlotResponse = Response<{ readonly blocks: number | undefined; readonly size: number | undefined }>;
}

export const successResponse: SuccessResponse = { success: true };
const emptyErrorResponse: ErrorResponse = { success: false, message: "" };
export const errorResponse = (text?: string): ErrorResponse =>
	text === undefined ? emptyErrorResponse : { success: false, message: text };
