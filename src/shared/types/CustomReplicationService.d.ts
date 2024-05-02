type ReplicationSpawnBlock = {
	readonly model: BlockModel;
	readonly instanceAddressMap: Map<Instance, string>;
	readonly cframe: CFrame;

	readonly isOwned: boolean;
};
