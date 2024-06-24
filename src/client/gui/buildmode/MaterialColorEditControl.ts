import { ColorChooser } from "client/gui/ColorChooser";
import { Colors } from "client/gui/Colors";
import { Control } from "client/gui/Control";
import { BlockPipetteButton } from "client/gui/controls/BlockPipetteButton";
import { TextButtonControl } from "client/gui/controls/Button";
import { MaterialChooser } from "client/gui/MaterialChooser";
import { ObjectOverlayStorage } from "shared/component/ObjectOverlayStorage";
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

	private readonly heightOverlays;

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

		type HeightOverlayState = "opened" | "closed" | "hidden";
		this.heightOverlays = asObject(
			(["Color", "Material"] as const).mapToMap((k) =>
				$tuple(k, {
					overlay: new ObjectOverlayStorage({ state: "opened" as HeightOverlayState }),
					heights: {
						opened: gui[k].Size.Y,
						closed: gui[k].Header.Size.Y,
						hidden: new UDim(),
					} as const satisfies { [k in HeightOverlayState]: UDim },
				}),
			),
		);
		const initVisibilityAnimation = (button: ButtonControl, name: keyof typeof this.heightOverlays) => {
			const setOverlayVisibility = (visible: boolean) =>
				(this.heightOverlays[name].overlay.get(0).state = visible ? undefined : "closed");

			const gui = this.gui[name];
			let isvisible = false;
			this.event.subscribe(button.activated, () => setOverlayVisibility((isvisible = !isvisible)));

			const defaultArrowSize = gui.Header.Arrow.Size;
			this.heightOverlays[name].overlay.value.subscribe(({ state }) => {
				TransformService.run(gui.Header.Arrow, (tr) => {
					if (state !== "hidden") {
						tr.transform(
							"Rotation",
							state === "closed" ? 180 : 0,
							TransformService.commonProps.quadOut02,
						).transform("Size", defaultArrowSize, TransformService.commonProps.quadOut02);
					} else {
						tr.transform("Rotation", 360, TransformService.commonProps.quadOut02).transform(
							"Size",
							new UDim2(),
							TransformService.commonProps.quadOut02,
						);
					}
				});

				TransformService.run(gui, (tr) => {
					if (state !== "hidden") {
						tr.func(() => (this.gui.Visible = true)).then();
					}

					tr.transform(
						"Size",
						new UDim2(gui.Size.X, this.heightOverlays[name].heights[state]),
						TransformService.commonProps.quadOut02,
					);

					if (state === "hidden") {
						tr.then().func(() => (this.gui.Visible = false));
					}
				});
			});

			this.heightOverlays[name].overlay.get(-1).state = "hidden";
			setOverlayVisibility((isvisible = defaultVisibility));
			TransformService.finish(gui);
			TransformService.finish(gui.Header.Arrow);
		};
		initVisibilityAnimation(materialbtn, "Material");
		initVisibilityAnimation(colorbtn, "Color");

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
	}

	protected setInstanceVisibilityFunction(visible: boolean): void {
		for (const [, overlay] of pairs(this.heightOverlays)) {
			overlay.overlay.get(-1).state = visible ? undefined : "hidden";
		}
	}
}
