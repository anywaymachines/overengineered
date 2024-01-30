import { Players } from "@rbxts/services";
import ComponentBase from "client/base/ComponentBase";
import InputController from "client/controller/InputController";
import Signals from "client/event/Signals";
import EventHandler from "shared/event/EventHandler";

export default class MovingSelector extends ComponentBase {
	constructor(hovered: (part: BasePart) => void, released: () => void) {
		super();

		const mouse = Players.LocalPlayer.GetMouse();
		const eh = new EventHandler();

		let prevTarget: BasePart | undefined;

		const start = () => {
			if (InputController.inputType.get() === "Desktop") {
				eh.subscribe(mouse.Move, move);
				eh.subscribe(Signals.CAMERA.MOVED, move);
				move();
			}
		};
		const move = () => {
			const target = mouse.Target;
			if (!target || target === prevTarget) return;

			prevTarget = target;
			hovered(target);
		};
		const stop = () => {
			released();
			eh.unsubscribeAll();
			prevTarget = undefined;
		};

		this.event.onDisable(stop);
		this.event.subscribe(mouse.Button1Down, start);
		this.event.subscribe(mouse.Button1Up, stop);
	}
}
