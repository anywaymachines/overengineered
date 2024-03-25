import Control from "client/gui/Control";

export interface ControlTest {
	createTests(): readonly (readonly [name: string, test: Control])[];
}
