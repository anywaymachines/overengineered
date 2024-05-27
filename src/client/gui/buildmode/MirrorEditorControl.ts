import { Players } from "@rbxts/services";
import { Control } from "client/gui/Control";
import { ButtonControl } from "client/gui/controls/Button";
import { NumberTextBoxControl } from "client/gui/controls/NumberTextBoxControl";
import { ToggleControl } from "client/gui/controls/ToggleControl";
import { SharedPlots } from "shared/building/SharedPlots";
import { ObservableValue } from "shared/event/ObservableValue";
import { ArgsSignal } from "shared/event/Signal";
import type { NumberTextBoxControlDefinition } from "client/gui/controls/NumberTextBoxControl";
import type { ToggleControlDefinition } from "client/gui/controls/ToggleControl";

export type MirrorEditorSingleControlDefinition = GuiObject & {
	readonly Toggle: ToggleControlDefinition;
	readonly TextBox: NumberTextBoxControlDefinition;
	readonly Add: GuiButton;
	readonly Sub: GuiButton;
};
export class MirrorEditorSingleControl extends Control<MirrorEditorSingleControlDefinition> {
	readonly submitted = new ArgsSignal<[number | undefined]>();
	readonly value = new ObservableValue<number | undefined>(undefined);

	private readonly enabled;
	private readonly position;

	constructor(gui: MirrorEditorSingleControlDefinition, min: number, max: number, defval: number) {
		super(gui);

		this.enabled = this.add(new ToggleControl(this.gui.Toggle));

		this.add(
			new ButtonControl(this.gui.Add, () => {
				this.position.value.set(this.position.value.get() + 1);
				submit();
			}),
		);
		this.add(
			new ButtonControl(this.gui.Sub, () => {
				this.position.value.set(this.position.value.get() - 1);
				submit();
			}),
		);

		this.position = this.add(new NumberTextBoxControl(this.gui.TextBox, min, max, 0.5));
		this.position.value.set(defval);

		let selfsetting = false;
		const submit = () => {
			selfsetting = true;
			this.value.set(this.enabled.value.get() ? this.position.value.get() : undefined);
			this.submitted.Fire(this.value.get());
			selfsetting = false;
		};
		this.event.subscribeObservable(
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
		this.event.subscribe(this.enabled.submitted, submit);
		this.event.subscribe(this.position.submitted, submit);
	}
}

export type MirrorEditorControlDefinition = GuiObject & {
	readonly X: MirrorEditorSingleControlDefinition;
	readonly Y: MirrorEditorSingleControlDefinition;
	readonly Z: MirrorEditorSingleControlDefinition;
};

export class MirrorEditorControl extends Control<MirrorEditorControlDefinition> {
	readonly submitted = new ArgsSignal<[MirrorMode]>();
	readonly value = new ObservableValue<MirrorMode>({});

	private readonly x;
	private readonly y;
	private readonly z;

	constructor(gui: MirrorEditorControlDefinition) {
		super(gui);

		const plot = SharedPlots.getPlotBuildingRegion(SharedPlots.getPlotByOwnerID(Players.LocalPlayer.UserId));
		this.x = this.add(
			new MirrorEditorSingleControl(
				this.gui.X,
				math.round(-plot.getSize().Z / 2),
				math.round(plot.getSize().Z / 2),
				0,
			),
		);
		this.y = this.add(new MirrorEditorSingleControl(this.gui.Y, 2, math.floor(plot.getSize().Y), 4));
		this.z = this.add(
			new MirrorEditorSingleControl(
				this.gui.Z,
				math.round(-plot.getSize().X / 2),
				math.round(plot.getSize().X / 2),
				0,
			),
		);

		this.event.subscribeObservable(
			this.value,
			(val) => {
				this.x.value.set(val.x);
				this.y.value.set(val.y);
				this.z.value.set(val.z);
			},
			true,
		);

		const submit = () => {
			const x = this.x.value.get();
			const y = this.y.value.get();
			const z = this.z.value.get();

			this.value.set({ x, y, z });
			this.submitted.Fire(this.value.get());
		};

		this.x.submitted.Connect(submit);
		this.y.submitted.Connect(submit);
		this.z.submitted.Connect(submit);
	}
}
