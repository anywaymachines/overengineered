import { ColorChooser } from "client/gui/ColorChooser";
import { Colors } from "client/gui/Colors";
import { Control } from "client/gui/Control";
import { BlockPipetteButton } from "client/gui/controls/BlockPipetteButton";
import { TextButtonControl } from "client/gui/controls/Button";
import { MaterialChooser } from "client/gui/MaterialChooser";
import { TransformService } from "shared/component/TransformService";
import type { ColorChooserDefinition } from "client/gui/ColorChooser";
import type { ButtonControl, TextButtonDefinition } from "client/gui/controls/Button";
import type { MaterialChooserDefinition } from "client/gui/MaterialChooser";

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

	readonly material;
	readonly color;

	constructor(gui: MaterialColorEditControlDefinition, defaultVisibility = false) {
		super(gui);

		const material = this.add(new MaterialChooser(gui.Material.Content));
		this.material = material;
		const color = this.add(new ColorChooser(gui.Color.Content));
		this.color = color;

		const materialbtn = this.add(new TextButtonControl(this.gui.Material.Header));
		this.event.subscribeObservable(
			material.value,
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
		this.event.subscribeObservable(color.value, (value) => colorbtn.text.set("#" + value.ToHex().upper()), true);
		this.event.subscribeObservable(
			color.value,
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
			BlockPipetteButton.forMaterial(this.gui.Material.Header.Pipette, (m) => material.value.set(m)),
		);
		this.colorPipette = this.add(BlockPipetteButton.forColor(this.gui.Color.Header.Pipette, (c) => color.set(c)));
	}
}
