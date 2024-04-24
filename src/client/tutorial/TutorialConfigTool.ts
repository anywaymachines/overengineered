import { BuildingMode } from "client/modes/build/BuildingMode";
import { ClientBuilding } from "client/modes/build/ClientBuilding";
import { Tutorial } from "client/tutorial/Tutorial";
import { BlockManager } from "shared/building/BlockManager";
import { EventHandler } from "shared/event/EventHandler";
import { JSON } from "shared/fixes/Json";
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
		return BuildingMode.instance.toolController.configTool;
	}

	cleanup() {
		this.eventHandler.unsubscribeAll();
		this.get().blocksToConfigure.clear();
	}

	private tableEquals(table1: object, table2: object): boolean {
		for (const [key] of Objects.pairs_(table1)) {
			if (!(key in table2)) {
				return false;
			}

			if (typeIs(table1[key], "table")) {
				if (!this.tableEquals(table1[key], table2[key])) return false;
			} else {
				if (table1[key] !== table2[key]) {
					return false;
				}
			}
		}

		for (const [key] of Objects.pairs_(table2)) {
			if (!(key in table1)) {
				return false;
			}
		}

		return true;
	}

	async waitForBlocksConfigure(): Promise<boolean> {
		return new Promise((resolve) => {
			const eventHandler = new EventHandler();

			eventHandler.register(
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
			);

			eventHandler.subscribe(ClientBuilding.updateConfigOperation.executed, (plot) => {
				const configs = new Map(
					plot.getBlocks().map((block) => [block, BlockManager.manager.config.get(block)] as const),
				);
				const positions = this.get().blocksToConfigure.map((value) => VectorUtils.roundVector(value.position));
				const configs_filtered = configs.filter((value) =>
					positions.includes(
						VectorUtils.roundVector(
							plot.instance.BuildingArea.CFrame.PointToObjectSpace(value.GetPivot().Position),
						),
					),
				);

				for (const [blockModel, config] of configs_filtered) {
					const block = this.get().blocksToConfigure.find(
						(value) =>
							VectorUtils.roundVector(
								plot.instance.BuildingArea.CFrame.PointToObjectSpace(blockModel.GetPivot().Position),
							) === VectorUtils.roundVector(value.position),
					);
					if (!block) throw "what";

					// configs[number] = { rotationSpeed = { rotation = { add = "W" } } }
					// { rotation: { add: "W" } }

					// block.value.forEach((element) => {
					// 	block.value; // [{"key": value}]
					// });

					if (config[block.key] !== block.value) {
						return;
					}
				}

				eventHandler.unsubscribeAll();
				this.tutorial.Finish();
				resolve(true);
			});

			eventHandler.subscribeOnce(this.tutorial.Control.instance.Header.Cancel.MouseButton1Click, () => {
				eventHandler.unsubscribeAll();
				this.tutorial.Finish();
				resolve(false);
			});
		});
	}

	addBlockToConfigure(data: TutorialConfigBlockHighlight) {
		this.get().blocksToConfigure.push(data);
	}
}
