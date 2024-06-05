import { UserInputService } from "@rbxts/services";
import { SignalWrapper } from "client/event/SignalWrapper";

export namespace GlobalInputHandler {
	export const inputBegan = new SignalWrapper(UserInputService.InputBegan);
	export const inputChanged = new SignalWrapper(UserInputService.InputChanged);
	export const inputEnded = new SignalWrapper(UserInputService.InputEnded);
	export const touchTap = new SignalWrapper(UserInputService.TouchTap);
}
