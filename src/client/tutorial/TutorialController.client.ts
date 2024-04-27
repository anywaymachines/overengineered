import { PlayerDataStorage } from "client/PlayerDataStorage";
import { Tutorial } from "client/tutorial/Tutorial";

while (!PlayerDataStorage.data.get()) {
	task.wait();
}

if (!PlayerDataStorage.data.get()!.slots.any((t) => t.blocks !== 0)) {
	Tutorial.Begin("Basics");
}
