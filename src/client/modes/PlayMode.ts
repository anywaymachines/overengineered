import { ClientContainerComponent } from "client/component/ClientContainerComponent";
import { Control } from "client/gui/Control";

export abstract class PlayMode extends ClientContainerComponent {
	abstract getName(): PlayModes;
	abstract onSwitchToNext(mode: PlayModes | undefined): void;
	abstract onSwitchFromPrev(prev: PlayModes | undefined): void;
	onImmediateSwitchToNext(mode: PlayModes | undefined): void {}
	onImmediateSwitchFromPrev(prev: PlayModes | undefined): void {}

	enable() {
		for (const child of this.getChildren()) {
			if (child instanceof Control) {
				child.show();
			}
		}

		super.enable();
	}
	disable() {
		for (const child of this.getChildren()) {
			if (child instanceof Control) {
				child.hide();
			}
		}

		super.disable();
	}
}
