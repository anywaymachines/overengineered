import { BuildingMode } from "client/modes/build/BuildingMode";
import { ClientBuilding } from "client/modes/build/ClientBuilding";
import { Tutorial } from "client/tutorial/Tutorial";
import { BlockManager } from "shared/building/BlockManager";
import { EventHandler } from "shared/event/EventHandler";
import { Objects } from "shared/fixes/objects";
import { successResponse } from "shared/types/network/Responses";
import { VectorUtils } from "shared/utils/VectorUtils";

export type TutorialConfigBlockHighlight = {
	key: string;
	position: Vector3;
	value: unknown;
};

export class TutorialConfigTool {
	private readonly eventHandler = new EventHandler();

	constructor(private readonly tutorial: typeof Tutorial) {
		this.eventHandler.register(
			ClientBuilding.resetConfigOperation.addMiddleware((plot, _blocks, args2) => {
				if (this.get().blocksToConfigure.size() > 0) {
					return { success: false, message: "Config reset is disabled during tutorial" };
				}

				return successResponse;
			}),
		);
	}

	get() {
		return BuildingMode.instance.toolController.allTools.configTool;
	}

	cleanup() {
		this.eventHandler.unsubscribeAll();
		this.get().blocksToConfigure.clear();
	}

	/** Recursively checks for value equality, but only for keys of {@link checkTo}.
	 * @example
	 * tableEquals({ a: 1, b: 2 }, { b: 2 }) // returns true
	 * tableEquals({ a: 1, b: 2 }, { a: 2, b: 2 }) // returns false
	 */
	private sparseEquals(orig: unknown, checkTo: unknown): boolean {
		if (typeOf(orig) !== typeOf(checkTo)) {
			return false;
		}

		if (typeIs(orig, "table") && typeIs(checkTo, "table")) {
			for (const [key] of Objects.pairs_(checkTo)) {
				if (!(key in orig)) {
					return false;
				}

				if (!this.sparseEquals(orig[key], checkTo[key])) {
					return false;
				}
			}
		} else {
			return orig === checkTo;
		}

		return true;
	}

	async waitForBlocksConfigure(): Promise<boolean> {
		return new Promise((resolve) => {
			const eventHandler = new EventHandler();

			// Disabled due to not working alnd also not making much sense
			/*eventHandler.register(
				ClientBuilding.updateConfigOperation.addMiddleware((plot, configs) => {
					for (const config of configs) {
						if (
							!this.get().blocksToConfigure.find(
								(value) =>
									value.key === config.key &&
									this.tableEquals(value.value as object, JSON.deserialize(config.value)),
							)
						) {
							return {
								success: false,
								message: "Wrong value",
							};
						}
					}

					return successResponse;
				}),
			);*/

			eventHandler.subscribe(ClientBuilding.updateConfigOperation.executed, (plot) => {
				const configs = new Map(
					plot.getBlocks().map((block) => [block, BlockManager.manager.config.get(block)] as const),
				);
				const positions = this.get().blocksToConfigure.map((value) => VectorUtils.roundVector3(value.position));
				const configs_filtered = configs.filter((value) =>
					positions.includes(
						VectorUtils.roundVector3(
							plot.instance.BuildingArea.CFrame.PointToObjectSpace(value.GetPivot().Position),
						),
					),
				);

				for (const [blockModel, config] of configs_filtered) {
					const block = this.get().blocksToConfigure.find(
						(value) =>
							VectorUtils.roundVector3(
								plot.instance.BuildingArea.CFrame.PointToObjectSpace(blockModel.GetPivot().Position),
							) === VectorUtils.roundVector3(value.position),
					);
					if (!block) throw "what";

					if (!this.sparseEquals(config[block.key], block.value)) {
						return;
					}
				}

				eventHandler.unsubscribeAll();
				this.cleanup();
				resolve(true);
			});

			eventHandler.subscribeOnce(this.tutorial.Control.instance.Header.Cancel.MouseButton1Click, () => {
				eventHandler.unsubscribeAll();
				this.cleanup();
				resolve(false);
			});
		});
	}

	addBlockToConfigure(data: TutorialConfigBlockHighlight) {
		this.get().blocksToConfigure.push(data);
	}
}
