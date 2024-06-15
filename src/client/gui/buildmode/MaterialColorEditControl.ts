import { ColorChooser } from "client/gui/ColorChooser";
import { Colors } from "client/gui/Colors";
import { Control } from "client/gui/Control";
import { BlockPipetteButton } from "client/gui/controls/BlockPipetteButton";
import { TextButtonControl } from "client/gui/controls/Button";
import { MaterialChooser } from "client/gui/MaterialChooser";
import { TransformService } from "shared/component/TransformService";
import { SubmittableValue } from "shared/event/SubmittableValue";
import type { ColorChooserDefinition } from "client/gui/ColorChooser";
import type { ButtonControl, TextButtonDefinition } from "client/gui/controls/Button";
import type { MaterialChooserDefinition } from "client/gui/MaterialChooser";
import type { ObservableValue } from "shared/event/ObservableValue";

export type MaterialColorEditControlDefinition = GuiObject & {
	readonly Color: GuiObject & {
		readonly Content: ColorChooserDefinition;
		readonly Header: TextButtonDefinition & {
			readonly Pipette: GuiButton & {
				readonly ImageLabel: ImageLabel;
			};
			readonly Arrow: GuiObject;
		};
	};
	readonly Material: GuiObject & {
		readonly Content: MaterialChooserDefinition;
		readonly Header: TextButtonDefinition & {
			readonly Pipette: ImageButton & {
				readonly ImageLabel: ImageLabel;
			};
			readonly Arrow: GuiObject;
		};
	};
};

/** Material preview with an edit button */
export class MaterialColorEditControl extends Control<MaterialColorEditControlDefinition> {
	readonly materialPipette;
	readonly colorPipette;

	readonly materialv;
	readonly colorv;

	constructor(gui: MaterialColorEditControlDefinition, defaultVisibility = false) {
		super(gui);

		const materialv = SubmittableValue.from<Enum.Material>(Enum.Material.Plastic);
		this.materialv = materialv.asHalfReadonly();

		const colorv = SubmittableValue.from<Color3>(Color3.fromRGB(255, 255, 255));
		this.colorv = colorv.asHalfReadonly();

		const material = this.add(new MaterialChooser(gui.Material.Content, materialv));
		const color = this.add(new ColorChooser(gui.Color.Content, colorv));

		const materialbtn = this.add(new TextButtonControl(this.gui.Material.Header));
		this.event.subscribeObservable(
			material.value.value,
			(value) => {
				const imgl = this.gui.Material.Content.FindFirstChild(value.Name) as ImageLabel & {
					readonly TextLabel: TextLabel;
				};
				this.gui.Material.Header.Pipette.Image = imgl.Image;
				materialbtn.text.set(imgl.TextLabel.Text);
			},
			true,
		);

		const colorbtn = this.add(new TextButtonControl(this.gui.Color.Header));
		this.event.subscribeObservable(
			color.value.value,
			(value) => colorbtn.text.set("#" + value.ToHex().upper()),
			true,
		);
		this.event.subscribeObservable(
			color.value.value,
			(value) => {
				this.gui.Color.Header.Pipette.BackgroundColor3 = value;

				const imgColor = value.ToHSV()[2] > 0.5 ? Colors.black : Colors.white;
				if (this.gui.Color.Header.Pipette.ImageLabel.ImageColor3 !== imgColor) {
					TransformService.cancel(this.gui.Color.Header.Pipette.ImageLabel);
					TransformService.run(this.gui.Color.Header.Pipette.ImageLabel, (tr) =>
						tr.transform("ImageColor3", imgColor, TransformService.commonProps.quadOut02),
					);
				}
			},
			true,
		);

		const initVisibilityAnimation = (
			button: ButtonControl,
			gui: GuiObject & { readonly Header: { readonly Arrow: GuiObject } },
		) => {
			const materialVisibleTransform = TransformService.multi(
				TransformService.boolStateMachine(
					gui,
					TransformService.commonProps.quadOut02,
					{ Size: gui.Size },
					{ Size: new UDim2(gui.Size.X, new UDim(0, 40)) },
				),
				TransformService.boolStateMachine(
					gui.Header.Arrow,
					TransformService.commonProps.quadOut02,
					{ Rotation: 180 },
					{ Rotation: 0 },
				),
			);

			{
				materialVisibleTransform(false);
				TransformService.finish(gui);
				TransformService.finish(gui.Header.Arrow);
			}

			let isvisible = false;
			let wasvisible = defaultVisibility;
			this.event.subscribe(button.activated, () => materialVisibleTransform((isvisible = !isvisible)));

			this.onDisable(() => {
				wasvisible = isvisible;
				isvisible = false;
				materialVisibleTransform(false);
			});
			this.onEnable(() => {
				if (wasvisible) {
					isvisible = true;
					materialVisibleTransform(true);
				}
			});
		};
		initVisibilityAnimation(materialbtn, gui.Material);
		initVisibilityAnimation(colorbtn, gui.Color);

		this.materialPipette = this.add(
			BlockPipetteButton.forMaterial(this.gui.Material.Header.Pipette, (m) => materialv.submit(m)),
		);
		this.colorPipette = this.add(
			BlockPipetteButton.forColor(this.gui.Color.Header.Pipette, (c) => colorv.submit(c)),
		);
	}

	autoSubscribe(material: ObservableValue<Enum.Material>, color: ObservableValue<Color3>) {
		this.event.subscribeObservable(material, (m) => this.materialv.set(m), true, true);
		this.event.subscribe(this.materialv.submitted, (v) => material.set(v));

		this.event.subscribeObservable(color, (m) => this.colorv.set(m), true, true);
		this.event.subscribe(this.colorv.submitted, (v) => color.set(v));
		this.event.subscribe(this.colorv.submitted, (v) => {
			print("Setting color", v);
		});
	}
}
