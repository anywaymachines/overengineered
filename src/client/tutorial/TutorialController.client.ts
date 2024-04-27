import { Workspace } from "@rbxts/services";
import { PlayerDataStorage } from "client/PlayerDataStorage";
import { Tutorial } from "client/tutorial/Tutorial";

while (!PlayerDataStorage.data.get()) {
	task.wait();
}

while (!(Workspace.GetAttribute("loaded") as boolean | undefined)) {
	task.wait();
}

if (!PlayerDataStorage.data.get()!.slots.any((t) => t.blocks !== 0)) {
	Tutorial.Begin("Basics");
}
