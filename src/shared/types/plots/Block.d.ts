type CategoryName = string & { readonly ___nominal: "CategoryName" };
type BlockConnectionName = string & { readonly ___nominal: "ConnectionName" };
type BlockUuid = string & { readonly ___nominal: "BlockUuid" };

type Block = {
	readonly id: string;
	readonly displayName: string;
	readonly info: string;
	readonly model: BlockModel;
	readonly category: string;
	readonly required: boolean;
	readonly limit: number;
};
