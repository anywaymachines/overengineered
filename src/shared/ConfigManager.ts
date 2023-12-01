import { HttpService } from "@rbxts/services";
import BlockRegistry from "shared/registry/BlocksRegistry";
import AbstractBlock from "shared/registry/abstract/AbstractBlock";
import Objects from "./Objects";

export default class ConfigManager {
	static loadDefaultConfigs(model: Model, inputType: InputType): void {
		const block = BlockRegistry.getBlockByID(model.GetAttribute("id") as string);

		if (!block) {
			throw "Block nil error in ConfigManager.ts";
		}

		if (this.isConfigurableBlock(block)) {
			const def = block.getConfigDefinitions();
			const configData: Record<string, ConfigDefinition["default"][InputType]> = {};

			Objects.values(def).forEach((element) => {
				configData[element.id] =
					inputType === "Gamepad" && element.default.Gamepad !== undefined
						? element.default.Gamepad
						: inputType === "Touch" && element.default.Touch !== undefined
						? element.default.Touch
						: element.default.Desktop;
			});

			model.SetAttribute("config", HttpService.JSONEncode(configData));
		}
	}

	static isConfigurableBlock(block: AbstractBlock): block is ConfigurableBlock & AbstractBlock {
		return "getConfigDefinitions" in block;
	}

	static updateProperty(model: Model) {
		const block = BlockRegistry.getBlockByID(model.GetAttribute("id") as string);

		if (!block) {
			throw "Block nil error in ConfigManager.ts";
		}

		function isConfigurableBlock(block: AbstractBlock): block is ConfigurableBlock & AbstractBlock {
			return "getConfigDefinitions" in block;
		}

		if (isConfigurableBlock(block)) {
			//
		}
	}
}
