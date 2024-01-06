type Category = string;

type Block = {
	readonly id: string;
	readonly displayName: string;
	readonly model: BlockModel;
	readonly category: string;
	readonly required: boolean;
	readonly limit: number;
};
