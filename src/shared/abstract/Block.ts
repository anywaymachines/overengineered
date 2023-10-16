export default abstract class Block {
	id: string;

	constructor(id: string) {
		this.id = id;
	}

	public abstract getDisplayName(): string;

	public abstract getModel(): Model;

	public getScript(): LocalScript | undefined {
		return undefined;
	}
}
