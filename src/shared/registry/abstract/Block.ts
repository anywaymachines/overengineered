export default class Block {
	constructor(
		public readonly id: string,
		public readonly displayName: string,
		public readonly model: Model,
		public readonly category: string,
		public readonly required: boolean,
		public readonly limit: number,
	) {}
}
