import { Players } from "@rbxts/services";
import { ClientComponent } from "client/component/ClientComponent";
import { InputController } from "client/controller/InputController";
import { Signals } from "client/event/Signals";

export class MovingSelector extends ClientComponent {
	constructor(hovered: (part: BasePart) => void, released: () => void) {
		super();

		const mouse = Players.LocalPlayer.GetMouse();
		let prevTarget: BasePart | undefined;

		const move = () => {
			const target = mouse.Target;
			if (!target || target === prevTarget) return;

			prevTarget = target;
			hovered(target);
		};
		const stop = () => {
			if (!this.isEnabled()) return;

			released();
			this.destroy();
		};

		this.onDestroy(stop);
		this.event.subscribe(mouse.Move, move);
		this.event.subscribe(Signals.CAMERA.MOVED, move);
		this.event.subInput((ih) => {
			ih.onMouse1Up(stop, false);
			ih.onTouchTap(move, false);
		});

		this.onEnable(() => {
			if (InputController.inputType.get() === "Desktop") {
				move();
			}
		});
	}
}
