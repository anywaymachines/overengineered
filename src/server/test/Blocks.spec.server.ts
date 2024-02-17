import { ReplicatedStorage, RunService } from "@rbxts/services";
import Logger from "shared/Logger";

if (RunService.IsStudio()) {
	ReplicatedStorage.WaitForChild("Assets").WaitForChild("Placeable");
	const blocks = ReplicatedStorage.Assets.Blocks.GetChildren();

	blocks.forEach((block) => {
		if (block.GetAttribute("name") === undefined) Logger.info(`Attribute 'name' is not set for '${block.Name}'!`);
		if (block.GetAttribute("info") === undefined) Logger.info(`Attribute 'info' is not set for '${block.Name}'!`);
		if ((block as Model).PrimaryPart === undefined)
			Logger.error(`PrimaryPart in Block '${block.Name}' is not set!`);

		for (block of block.GetDescendants()) {
			if (block.IsA("BasePart") && block.Anchored === false) {
				Logger.error(`Block '${block.Name}' is not anchored!`);
				break;
			}
		}
	});
}
