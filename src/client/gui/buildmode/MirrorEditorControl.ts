import { Players } from "@rbxts/services";
import Control from "client/gui/Control";
import SharedPlots from "shared/building/SharedPlots";
import ObservableValue from "shared/event/ObservableValue";
import NumberTextBoxControl, { NumberTextBoxControlDefinition } from "client/gui/controls/NumberTextBoxControl";
import ToggleControl, { ToggleControlDefinition } from "client/gui/controls/ToggleControl";

export type MirrorEditorSingleControlDefinition = GuiObject & {
	Checkbox: ToggleControlDefinition;
	TextBox: NumberTextBoxControlDefinition;
};
export class MirrorEditorSingleControl extends Control<MirrorEditorSingleControlDefinition> {
	readonly value = new ObservableValue<number | undefined>(undefined);

	private readonly enabled;
	private readonly position;

	constructor(gui: MirrorEditorSingleControlDefinition) {
		super(gui);

		this.enabled = this.added(new ToggleControl(this.gui.Checkbox));

		const plot = SharedPlots.getPlotByOwnerID(Players.LocalPlayer.UserId).GetBoundingBox()[1];
		this.position = this.added(new NumberTextBoxControl(this.gui.TextBox, -plot.X / 2, plot.X / 2, 1));

		const update = () => this.value.set(this.enabled.value.get() ? this.position.value.get() : undefined);
		this.event.subscribe(this.enabled.submitted, update);
		this.event.subscribe(this.position.submitted, update);
	}
}

export type MirrorEditorControlDefinition = GuiObject & {
	X: MirrorEditorSingleControlDefinition;
	Y: MirrorEditorSingleControlDefinition;
	Z: MirrorEditorSingleControlDefinition;
};

export default class MirrorEditorControl extends Control<MirrorEditorControlDefinition> {
	readonly value = new ObservableValue<readonly CFrame[]>([]);

	private readonly x;
	private readonly y;
	private readonly z;

	constructor(gui: MirrorEditorControlDefinition) {
		super(gui);

		this.x = this.added(new MirrorEditorSingleControl(this.gui.X));
		this.y = this.added(new MirrorEditorSingleControl(this.gui.Y));
		this.z = this.added(new MirrorEditorSingleControl(this.gui.Z));

		const update = () => {
			const x = this.x.value.get();
			const y = this.y.value.get();
			const z = this.z.value.get();

			const frames: CFrame[] = [];

			if (x !== undefined) {
				frames.push(new CFrame(0, 0, x));
			}
			if (y !== undefined) {
				frames.push(CFrame.fromAxisAngle(Vector3.xAxis, math.pi / 2).add(new Vector3(0, y, 0)));
			}
			if (z !== undefined) {
				frames.push(CFrame.fromAxisAngle(Vector3.yAxis, math.pi / 2).add(new Vector3(z, 0, 0)));
			}

			this.value.set(frames);
		};

		this.x.value.subscribe(update);
		this.y.value.subscribe(update);
		this.z.value.subscribe(update);
	}
}
