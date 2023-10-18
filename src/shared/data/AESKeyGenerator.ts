import { RunService } from "@rbxts/services";

export default class AESKeyGenerator {
	public static RANDOM_KEY: string;

	public static initialize(): void {
		this.RANDOM_KEY = this.generateRandomKey();
	}

	private static generateRandomKey(): string {
		let result = "";
		const key = RunService.IsStudio() ? "0" : game.JobId.gsub("%D", "")[0];
		while (result.size() < 128) {
			result += key;
		}
		return result.sub(0, 128);
	}
}
