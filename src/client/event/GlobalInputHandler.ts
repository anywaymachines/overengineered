import { UserInputService } from "@rbxts/services";
import { SignalWrapper } from "./SignalWrapper";

const GlobalInputHandler = {
	inputBegan: new SignalWrapper(UserInputService.InputBegan),
	inputChanged: new SignalWrapper(UserInputService.InputChanged),
	inputEnded: new SignalWrapper(UserInputService.InputEnded),
	touchTap: new SignalWrapper(UserInputService.TouchTap),
} as const;

export default GlobalInputHandler;
