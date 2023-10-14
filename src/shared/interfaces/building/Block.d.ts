interface ReplicatedStorage {
	Blocks: Folder;
}

interface Block {
	name: string;
	description: string | undefined;
	category: string | undefined;
	author: string | undefined;
	image: string;
	uri: Model;
}
