import { TestTutorial } from "client/tutorial/TestTutorial";
import { Tutorial } from "client/tutorial/Tutorial";
import { TutorialBasics } from "client/tutorial/TutorialBasics";

export namespace _Tests {
	export namespace TutorialTests {
		export function test() {
			TestTutorial(Tutorial);
		}
		export function basics() {
			TutorialBasics(Tutorial);
		}
	}
}
