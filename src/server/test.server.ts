import { Players } from "@rbxts/services";
import Remotes from "shared/Remotes";

Remotes.Server.GetNamespace("Player")
	.Get("ResetCharacter")
	.Connect((plr) => {
		task.wait(Players.RespawnTime);
		plr.LoadCharacter();
	});
