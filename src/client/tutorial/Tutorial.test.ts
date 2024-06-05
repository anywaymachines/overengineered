import { TestTutorial } from "client/tutorial/TestTutorial";
import { TutorialBasics } from "client/tutorial/TutorialBasics";
import type { Tutorial } from "client/tutorial/Tutorial";

export namespace _Tests {
	export namespace TutorialTests {
		export function test(di: DIContainer) {
			TestTutorial(di.resolve<Tutorial>());
		}
		export function basics(di: DIContainer) {
			TutorialBasics(di.resolve<Tutorial>());
		}
	}
}
