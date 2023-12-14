import Control from "client/base/Control";

export type WindowControlDefinition = Frame & {
	Title: Frame;
	HeadingLabel: TextLabel;
	Contents: Frame;
};
export default class WindowControl extends Control<WindowControlDefinition> {
	constructor(gui: WindowControlDefinition) {
		super(gui);
	}
}
