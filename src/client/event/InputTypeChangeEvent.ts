import { UserInputService } from "@rbxts/services";

export default class InputTypeChangeEvent {
	static {
		UserInputService.LastInputTypeChanged.Connect((lastInputType) => {
			print(lastInputType);
		});
	}
}
