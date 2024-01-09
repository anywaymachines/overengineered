type Category = string;

type BlockConnectionName = string & { readonly ___nominal: "ConnectionName" };
type BlockUuid = string & { readonly ___nominal: "BlockUuid" };

type Block = {
	readonly id: string;
	readonly displayName: string;
	readonly model: BlockModel;
	readonly category: string;
	readonly required: boolean;
	readonly limit: number;
};
