import { UserInputService } from "@rbxts/services";

export class Controlling {
	private readonly keybinds = new Map<string, KeyCode>();

	constructor() {
		//
	}

	isDown(name: string) {
		const key = this.keybinds.get(name);
		if (key === undefined) {
			throw `Action ${name} is not registered`;
		}

		return UserInputService.IsKeyDown(key);
	}
}
