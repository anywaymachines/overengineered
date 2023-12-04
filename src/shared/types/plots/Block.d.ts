type Category = string;

type Block = {
	readonly id: string;
	readonly displayName: string;
	readonly model: Model;
	readonly category: string;
	readonly required: boolean;
	readonly limit: number;
};
