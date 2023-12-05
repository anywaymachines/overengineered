import Remotes from "shared/Remotes";

let config: PlayerConfig = {};

(async () => {
	config = await Remotes.Client.GetNamespace("Player").Get("FetchSettings").CallServerAsync();
})();

export const getPlayerConfig = () => config;
