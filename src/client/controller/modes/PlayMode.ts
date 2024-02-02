import ComponentContainer from "client/component/ComponentContainer";
import Control from "client/gui/Control";

export default abstract class PlayMode extends ComponentContainer {
	public abstract getName(): PlayModes;
	public abstract onSwitchToNext(mode: PlayModes | undefined): void;
	public abstract onSwitchFromPrev(prev: PlayModes | undefined): void;

	public enable() {
		for (const child of this.getChildren()) {
			if (child instanceof Control) {
				child.show();
			}
		}

		super.enable();
	}
	public disable() {
		for (const child of this.getChildren()) {
			if (child instanceof Control) {
				child.hide();
			}
		}

		super.disable();
	}
}
