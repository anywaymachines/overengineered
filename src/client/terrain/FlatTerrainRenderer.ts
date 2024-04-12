import { Workspace } from "@rbxts/services";
import { ChunkRenderer } from "client/terrain/ChunkLoader";
import { Element } from "shared/Element";

const parent = Element.create("Folder", { Name: "Flaterra", Parent: Workspace.WaitForChild("Obstacles") });

export const FlatTerrainRenderer = (height: number, chunkSize: number = 1024): ChunkRenderer<Instance> => ({
	chunkSize,
	loadDistanceMultiplier: 4,

	renderChunk(chunkX, chunkZ) {
		const part = new Instance("Part");
		part.Anchored = true;
		part.CastShadow = false;

		part.Position = new Vector3(chunkX * this.chunkSize, height, chunkZ * this.chunkSize);
		part.Size = new Vector3(this.chunkSize, 2, this.chunkSize);

		part.Material = Enum.Material.Sand;
		part.Color = Color3.fromRGB(246, 215, 176);

		part.Parent = parent;
		return part;
	},
	destroyChunk(chunkX, chunkZ, chunk) {
		chunk.Destroy();
	},
	unloadAll(chunks) {
		for (const chunk of chunks) {
			chunk.Destroy();
		}
	},
	destroy() {},
});
