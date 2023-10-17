export default abstract class Block {
	id: string;

	/**
	 * @param id The id of the block `ExampleBlock`
	 */
	constructor(id: string) {
		this.id = id;
	}

	/** Must return the **displayed** name of the block */
	public abstract getDisplayName(): string;

	/** Should return a **number** of the block image */
	public abstract getAssetID(): number;

	/** Must return the **block model** object that will be used for construction */
	public abstract getModel(): Model;
}
