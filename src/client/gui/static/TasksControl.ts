import { Control } from "client/gui/Control";
import { Gui } from "client/gui/Gui";
import { GuiAnimator } from "client/gui/GuiAnimator";

export type TasksControlDefinition = Frame & {
	TaskList: TextLabel & {
		Task: Frame & {
			NumLabel: TextLabel;
			TextLabel: TextLabel;
		};
	};
};

export class TasksControl extends Control<TasksControlDefinition> {
	static readonly instance = new TasksControl();

	private readonly taskTemplate;
	private readonly tasks: Instance[] = [];

	private constructor() {
		super(Gui.getGameUI().FindFirstChild("Tasks") as TasksControlDefinition);

		this.taskTemplate = this.asTemplate(this.gui.TaskList.Task);
	}

	/** @deprecated Do not use outside */
	show(): void {
		this.gui.Visible = true;
		GuiAnimator.transition(this.gui, 0.2, "left");
	}

	/** @deprecated Do not use outside */
	hide(): void {
		GuiAnimator.hide(this.gui, 0.2, "left");
	}

	addTask(task: string) {
		if (this.tasks.size() === 0) {
			this.show();
		}

		const line = this.taskTemplate();
		line.NumLabel.Text = `${this.tasks.size() + 1}.`;
		line.TextLabel.Text = task;
		line.Parent = this.gui.TaskList;

		this.tasks.push(line);
	}

	finish() {
		this.tasks.forEach((task) => {
			task.Destroy();
		});
		this.tasks.clear();

		this.hide();
	}
}
