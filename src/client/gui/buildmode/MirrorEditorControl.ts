import { Players } from "@rbxts/services";
import Control from "client/gui/Control";
import { ButtonControl } from "client/gui/controls/Button";
import NumberTextBoxControl, { NumberTextBoxControlDefinition } from "client/gui/controls/NumberTextBoxControl";
import ToggleControl, { ToggleControlDefinition } from "client/gui/controls/ToggleControl";
import SharedPlots from "shared/building/SharedPlots";
import ObservableValue from "shared/event/ObservableValue";

export type MirrorEditorSingleControlDefinition = GuiObject & {
	readonly Toggle: ToggleControlDefinition;
	readonly TextBox: NumberTextBoxControlDefinition;
	readonly Add: GuiButton;
	readonly Sub: GuiButton;
};
export class MirrorEditorSingleControl extends Control<MirrorEditorSingleControlDefinition> {
	readonly value = new ObservableValue<number | undefined>(undefined);

	private readonly enabled;
	private readonly position;

	constructor(gui: MirrorEditorSingleControlDefinition, min: number, max: number, defval: number) {
		super(gui);

		this.enabled = this.add(new ToggleControl(this.gui.Toggle));

		this.add(
			new ButtonControl(this.gui.Add, () => {
				this.position.value.set(this.position.value.get() + 1);
				update();
			}),
		);
		this.add(
			new ButtonControl(this.gui.Sub, () => {
				this.position.value.set(this.position.value.get() - 1);
				update();
			}),
		);

		this.position = this.add(new NumberTextBoxControl(this.gui.TextBox, min, max, 1));
		this.position.value.set(defval);

		let selfsetting = false;
		const update = () => {
			selfsetting = true;
			this.value.set(this.enabled.value.get() ? this.position.value.get() : undefined);
			selfsetting = false;
		};
		this.event.subscribeObservable2(
			this.value,
			(val) => {
				if (selfsetting) return;

				if (val !== undefined) {
					this.position.value.set(val);
				}
				this.enabled.value.set(val !== undefined);
			},
			true,
		);
		this.event.subscribe(this.enabled.submitted, update);
		this.event.subscribe(this.position.submitted, update);
	}
}

export type MirrorEditorControlDefinition = GuiObject & {
	readonly X: MirrorEditorSingleControlDefinition;
	readonly Y: MirrorEditorSingleControlDefinition;
	readonly Z: MirrorEditorSingleControlDefinition;
};

export default class MirrorEditorControl extends Control<MirrorEditorControlDefinition> {
	readonly value = new ObservableValue<MirrorMode>({});

	private readonly x;
	private readonly y;
	private readonly z;

	constructor(gui: MirrorEditorControlDefinition) {
		super(gui);

		const plot = SharedPlots.getPlotBuildingRegion(SharedPlots.getPlotByOwnerID(Players.LocalPlayer.UserId));
		this.x = this.add(new MirrorEditorSingleControl(this.gui.X, -plot.getSize().X / 2, plot.getSize().X / 2, 0));
		this.y = this.add(new MirrorEditorSingleControl(this.gui.Y, 2, math.floor(plot.getSize().Y), 4));
		this.z = this.add(new MirrorEditorSingleControl(this.gui.Z, -plot.getSize().Z / 2, plot.getSize().Z / 2, 0));

		this.event.subscribeObservable2(
			this.value,
			(val) => {
				this.x.value.set(val.x?.Z);
				this.y.value.set(val.y?.Y);
				this.z.value.set(val.z?.X);
			},
			true,
		);

		const update = () => {
			const x = this.x.value.get();
			const y = this.y.value.get();
			const z = this.z.value.get();

			const frames: Writable<MirrorMode> = {};

			if (x !== undefined) {
				frames.x = new Vector3(0, 0, x);
			}
			if (y !== undefined) {
				frames.y = new Vector3(0, y, 0);
			}
			if (z !== undefined) {
				frames.z = new Vector3(z, 0, 0);
			}

			this.value.set(frames);
		};

		this.x.value.subscribe(update);
		this.y.value.subscribe(update);
		this.z.value.subscribe(update);
	}
}
