declare type WikiTag = "block" | "logic";

declare type WikiEntry = {
	readonly title: string;
	readonly tags: ReadonlySet<WikiTag>;
	readonly content: readonly WikiEntryContent[];
};

declare type WikiEntryContent = string;
