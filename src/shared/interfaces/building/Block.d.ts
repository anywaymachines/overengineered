interface ReplicatedStorage {
	Blocks: Folder;
}

interface Block {
	name: string;
	description: string | undefined;
	category: Category | undefined;
	author: string | undefined;
	image: string;
	uri: Model;
}
