import BlockModels from "shared/building/BlockModels";
import CategoriesBehavior from "shared/building/CategoriesBehavior";

export default class GameDefinitions {
	static DefaultAuthor: string = "MGC Creators";

	/** Variable where all registered categories in the game are listed */
	static NativeCategories: Category[] = [
		{
			name: "Blocks",
			id: "blocks",
			icon: "rbxasset://textures/icon.png", // TODO: Add icon
		},
	];

	/** Variable where all registered blocks in the game are listed */
	static NativeBlocks: Block[] = [
		{
			name: "testblock",
			description: undefined,
			category: CategoriesBehavior.getCategoryByID("blocks"),
			author: GameDefinitions.DefaultAuthor,
			image: "rbxasset://textures/icon.png", // TODO: Add icon
			uri: BlockModels.__getNativeBlockModelByID("TestBlock") as Model,
		},
	];
}
