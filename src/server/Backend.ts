import { AES, Base64 } from "@rbxts/crypto";
import { HttpService } from "@rbxts/services";

type RequestType = "get" | "post" | "patch" | "delete";

export default class Backend {
	private static readonly endpoint = "https://api.mgcode.ru";

	/** AES key with a mandatory length of 128 characters */
	private static readonly key =
		"ae7ac78373d9fb5b295f3e8b5b0dd8cbec55d3986af5a0e3ce7490d8d771b366792bb9b8138b3f6cdb4fb36b730e0de64c24a9983deb92012ad1bb2bbe4aa27f";

	/** Signing data with a key to protect it from unauthorized access */
	private static getSignature(data: string): string {
		return Base64.Encode(AES.Encrypt(data, this.key));
	}

	/** External server to bypass Roblox protection with authorized access on behalf of the group owner */
	static requestRoblox(data: { address: string; data: object }, requestType: RequestType) {
		const endpoint = `${this.endpoint}/roblox/${requestType}`;

		const encodedData = this.getSignature(HttpService.JSONEncode(data));
		return HttpService.PostAsync(endpoint, encodedData);
	}
}
