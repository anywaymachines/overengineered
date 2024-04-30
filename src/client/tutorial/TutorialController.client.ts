import { GameLoader } from "client/GameLoader";
import { Tutorial } from "client/tutorial/Tutorial";

GameLoader.waitForEverything();
const data = GameLoader.waitForDataStorage();

if (!data.slots.any((t) => t.blocks !== 0)) {
	Tutorial.Begin("Basics");
}
