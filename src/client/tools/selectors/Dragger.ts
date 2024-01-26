import { RunService, UserInputService } from "@rbxts/services";
import EventHandler from "shared/event/EventHandler";

export default class Dragger {
	static initialize<TCallbackData extends readonly unknown[]>(
		eventHandler: EventHandler,
		instance: Instance & { MouseButton1Down: RBXScriptSignal<(...rest: TCallbackData) => void> },
		moved: (delta: Vector2, mousePos: Vector2) => void,
		starting?: (...rest: TCallbackData) => void,
		stopping?: () => void,
	) {
		const eh = new EventHandler();
		let prevLocation: Vector2 | undefined = undefined;

		const startmove = (...data: TCallbackData) => {
			prevLocation = UserInputService.GetMouseLocation();
			starting?.(...data);

			eh.subscribe(RunService.Heartbeat, () => {
				if (!prevLocation) return;

				const mousePos = UserInputService.GetMouseLocation();
				if (mousePos === prevLocation) return;

				const delta = prevLocation.sub(mousePos);
				moved(delta, mousePos);
				prevLocation = mousePos;
			});
			eh.subscribe(UserInputService.InputEnded, (input) => {
				if (input.UserInputType !== Enum.UserInputType.MouseButton1) return;
				stop();
			});
		};
		const stop = () => {
			stopping?.();
			prevLocation = undefined;
			eh.unsubscribeAll();
		};

		eventHandler.subscribe(instance.MouseButton1Down, startmove);
		eventHandler.allUnsibscribed.Once(stop);
	}
}
