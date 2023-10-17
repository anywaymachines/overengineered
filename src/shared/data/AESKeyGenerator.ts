import { AES } from "@rbxts/crypto";

export default class AESKeyGenerator {
	public static RANDOM_KEY = AES.GenerateKey();
}
