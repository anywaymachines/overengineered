import Control from "client/base/Control";

export default interface GuiCreator {
	create(): Control;
}

/*type Store = {
	readonly press: () => void;
	readonly unpress: () => void;
	readonly isPressed: () => boolean;
	readonly switchmode: boolean;
};
export class TouchModeButtonControlCreator implements GuiCreator {
    private

	subscribe(press: () => void, unpress: () => void, isPressed: () => boolean, switchmode: boolean) {
		if (switchmode) {
			this.event.subscribe(this.pressed, () => (isPressed() ? unpress() : press()));
		} else {
			this.event.subscribe(this.pressed, press);
			this.event.subscribe(this.released, unpress);
		}
	}

	create(): Control<GuiObject, ComponentBase> {
		throw new Error("Method not implemented.");
	}
}
*/
