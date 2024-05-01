type ReplicationClientBlockInitialize = {
	readonly uuid: string;
	readonly attributes: Readonly<Record<string, AttributeValue>> | undefined;
};

type ReplicationClientBasePartInitialize = {
	readonly prefab: BasePart;

	readonly uuid: string;
	readonly parentUUID: string | undefined;

	readonly cframe: CFrame;

	readonly owner: boolean;
};
