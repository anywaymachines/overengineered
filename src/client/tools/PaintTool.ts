import { MaterialColorEditControl } from "client/gui/buildmode/MaterialColorEditControl";
import { Control } from "client/gui/Control";
import { ButtonControl } from "client/gui/controls/Button";
import { ToggleControl } from "client/gui/controls/ToggleControl";
import { Gui } from "client/gui/Gui";
import { ClientBuilding } from "client/modes/build/ClientBuilding";
import { MultiBlockSelector } from "client/tools/highlighters/MultiBlockSelector";
import { ToolBase } from "client/tools/ToolBase";
import { BlockManager } from "shared/building/BlockManager";
import { SharedBuilding } from "shared/building/SharedBuilding";
import { TransformService } from "shared/component/TransformService";
import { ObservableValue } from "shared/event/ObservableValue";
import type { MaterialColorEditControlDefinition } from "client/gui/buildmode/MaterialColorEditControl";
import type { ButtonDefinition } from "client/gui/controls/Button";
import type { ToggleControlDefinition } from "client/gui/controls/ToggleControl";
import type { BuildingMode } from "client/modes/build/BuildingMode";

namespace Scene {
	export type PaintToolSceneDefinition = GuiObject & {
		readonly Bottom: MaterialColorEditControlDefinition & {
			readonly Material: {
				readonly Header: {
					readonly EnabledToggle: ToggleControlDefinition;
				};
			};
			readonly Color: {
				readonly Header: {
					readonly EnabledToggle: ToggleControlDefinition;
				};
			};
		};
		readonly Top: GuiObject & {
			readonly SetMaterialsButton: ButtonDefinition;
			readonly SetColorsButton: ButtonDefinition;
		};
	};

	export class PaintToolScene extends Control<PaintToolSceneDefinition> {
		readonly tool;

		constructor(gui: PaintToolSceneDefinition, tool: PaintTool) {
			super(gui);
			this.tool = tool;

			this.add(new ButtonControl(this.gui.Top.SetMaterialsButton, () => this.paintEverything(false, true)));
			this.add(new ButtonControl(this.gui.Top.SetColorsButton, () => this.paintEverything(true, false)));

			const enable = () => {
				// to not paint a block
				task.wait();

				this.tool.enable();
			};
			const disable = () => {
				this.tool.disable();
			};

			const materialColorEditor = this.add(new MaterialColorEditControl(this.gui.Bottom));
			materialColorEditor.material.set(tool.selectedMaterial.get());
			materialColorEditor.color.set(tool.selectedColor.get());
			materialColorEditor.material.submitted.Connect((v) => tool.selectedMaterial.set(v));
			materialColorEditor.color.submitted.Connect((v) => tool.selectedColor.set(v));
			materialColorEditor.materialPipette.onStart.Connect(disable);
			materialColorEditor.materialPipette.onEnd.Connect(enable);
			materialColorEditor.colorPipette.onStart.Connect(disable);
			materialColorEditor.colorPipette.onEnd.Connect(enable);

			const materialEnabler = this.add(new ToggleControl(this.gui.Bottom.Material.Header.EnabledToggle));
			materialEnabler.value.set(tool.enableMaterial.get());
			this.event.subscribeObservable(materialEnabler.value, (value) => tool.enableMaterial.set(value));
			const colorEnabler = this.add(new ToggleControl(this.gui.Bottom.Color.Header.EnabledToggle));
			colorEnabler.value.set(tool.enableColor.get());
			this.event.subscribeObservable(colorEnabler.value, (value) => tool.enableColor.set(value));
		}

		private paintEverything(enableColor?: boolean, enableMaterial?: boolean) {
			this.tool.paintEverything(enableColor, enableMaterial);
		}

		private readonly visibilityStateMachine = TransformService.multi(
			TransformService.boolStateMachine(
				this.gui.Top,
				TransformService.commonProps.quadOut02,
				{ AnchorPoint: this.gui.Top.AnchorPoint },
				{ AnchorPoint: new Vector2(0.5, 1) },
			),
			TransformService.boolStateMachine(
				this.gui.Bottom,
				TransformService.commonProps.quadOut02,
				{ Position: this.gui.Bottom.Position },
				{ Position: this.gui.Bottom.Position.add(new UDim2(0, 0, 0, 40)) },
				(tr, enabled) => (enabled ? tr.func(() => super.setInstanceVisibilityFunction(true)) : 0),
				(tr, enabled) => (enabled ? 0 : tr.func(() => super.setInstanceVisibilityFunction(false))),
			),
		);
		protected setInstanceVisibilityFunction(visible: boolean): void {
			this.visibilityStateMachine(visible);
		}
	}
}

export class PaintTool extends ToolBase {
	readonly selectedMaterial = new ObservableValue<Enum.Material>(Enum.Material.Plastic);
	readonly selectedColor = new ObservableValue<Color3>(Color3.fromRGB(255, 255, 255));
	readonly enableMaterial = new ObservableValue(true);
	readonly enableColor = new ObservableValue(true);

	constructor(mode: BuildingMode) {
		super(mode);

		this.parentGui(
			new Scene.PaintToolScene(ToolBase.getToolGui<"Paint", Scene.PaintToolSceneDefinition>().Paint, this),
		);

		const fireSelected = (blocks: readonly BlockModel[]) => {
			if (!blocks || blocks.size() === 0) return;

			this.paint(blocks);
		};
		const stuff = this.parent(new MultiBlockSelector(mode.targetPlot));
		stuff.submit.Connect(fireSelected);

		this.event.subInput((ih) => {
			ih.onMouse3Down(() => {
				if (Gui.isCursorOnVisibleGui()) return;
				this.pick();
			}, false);
		});
	}

	private pick() {
		const target = this.mouse.Target;
		if (!target) return;

		const block = BlockManager.getBlockDataByPart(target);
		if (!block) return;

		this.selectedMaterial.set(block.material);
		this.selectedColor.set(block.color);
	}

	private paintClientSide(block: BlockModel) {
		SharedBuilding.paint(
			[block],
			this.enableColor.get() ? this.selectedColor.get() : undefined,
			this.enableMaterial.get() ? this.selectedMaterial.get() : undefined,
		);
	}

	paintEverything(enableColor?: boolean, enableMaterial?: boolean) {
		return ClientBuilding.paintOperation.execute(
			this.targetPlot.get(),
			"all",
			enableMaterial ?? this.enableMaterial.get() ? this.selectedMaterial.get() : undefined,
			enableColor ?? this.enableColor.get() ? this.selectedColor.get() : undefined,
		);
	}
	paint(
		blocks: readonly BlockModel[],
		original?: ReadonlyMap<BlockModel, { readonly material: Enum.Material; readonly color: Color3 }>,
	) {
		return ClientBuilding.paintOperation.execute(
			this.targetPlot.get(),
			blocks,
			this.enableMaterial.get() ? this.selectedMaterial.get() : undefined,
			this.enableColor.get() ? this.selectedColor.get() : undefined,
			original,
		);
	}

	getDisplayName(): string {
		return "Paint";
	}
	getImageID(): string {
		return "http://www.roblox.com/asset/?id=15895846447";
	}
}
