import { Players, UserInputService } from "@rbxts/services";
import { Colors } from "client/gui/Colors";
import { ButtonControl, ButtonDefinition } from "client/gui/controls/Button";
import { HoveredPartHighlighter } from "client/tools/selectors/HoveredPartHighlighter";
import { BlockManager } from "shared/building/BlockManager";
import { BuildingManager } from "shared/building/BuildingManager";
import { GameDefinitions } from "shared/data/GameDefinitions";
import { EventHandler } from "shared/event/EventHandler";
import { SlimFilter } from "shared/event/SlimFilter";
import { SlimSignal } from "shared/event/SlimSignal";

export class BlockPipetteButton extends ButtonControl {
	readonly onStart = new SlimSignal();
	readonly onEnd = new SlimSignal();
	readonly onSelect = new SlimSignal<(part: BasePart | BlockModel) => void>();
	readonly filter = new SlimFilter<(part: BasePart | BlockModel) => boolean>();

	constructor(gui: ButtonDefinition) {
		super(gui);

		const bg = this.gui.BackgroundColor3;
		let stop: (() => void) | undefined;

		this.event.onDisable(() => stop?.());
		this.activated.Connect(() => {
			if (stop) {
				stop?.();
				return;
			}

			this.onStart.Fire();
			this.gui.BackgroundColor3 = Colors.accentLight;

			const visualizer = this.add(
				new HoveredPartHighlighter((part) => {
					if (!this.filter.Fire(part)) return;

					if (BlockManager.isBlockPart(part)) {
						return part.Parent;
					}
					return part;
				}),
			);
			visualizer.enable();

			const eh = new EventHandler();
			stop = () => {
				this.gui.BackgroundColor3 = bg;
				this.remove(visualizer);
				eh.unsubscribeAll();
				this.onEnd.Fire();
				stop = undefined;
			};

			eh.subscribe(UserInputService.InputBegan, (input, gameProcessed) => {
				if (gameProcessed) return;
				if (input.UserInputType !== Enum.UserInputType.MouseButton1) return;

				const selected = visualizer.highlightedPart.get();
				if (!selected) return stop?.();

				this.onSelect.Fire(selected);
				stop?.();
			});
		});
	}

	static forMaterial(gui: ButtonDefinition, clicked: (material: Enum.Material) => void) {
		const pipette = new BlockPipetteButton(gui);

		const getMaterial = (part: BasePart | BlockModel) => {
			if (part.IsA("BasePart")) {
				return part.Material;
			}

			return BlockManager.manager.material.get(part);
		};
		pipette.onSelect.Connect((part) => clicked(getMaterial(part)));
		if (!GameDefinitions.isAdmin(Players.LocalPlayer)) {
			pipette.filter.add((part) => BuildingManager.AllowedMaterials.includes(getMaterial(part)));
		}

		return pipette;
	}
	static forColor(gui: ButtonDefinition, clicked: (material: Color3) => void) {
		const pipette = new BlockPipetteButton(gui);
		pipette.onSelect.Connect((part) => {
			if (part.IsA("BasePart")) {
				clicked(part.Color);
			} else {
				const data = BlockManager.manager.color.get(part);
				clicked(data);
			}
		});

		return pipette;
	}
	static forBlockId(gui: ButtonDefinition, clicked: (id: string) => void) {
		const pipette = new BlockPipetteButton(gui);
		pipette.onSelect.Connect((part) => {
			if (part.IsA("BasePart")) {
				throw "What.";
			}

			const data = BlockManager.manager.id.get(part);
			clicked(data);
		});
		pipette.filter.add((part) => BlockManager.isBlockPart(part));

		return pipette;
	}
}
