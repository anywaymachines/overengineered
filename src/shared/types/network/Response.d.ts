type SuccessResponse = { success: true };
type ErrorResponse = { success: false; message: string };
type Response = SuccessResponse | ErrorResponse;
