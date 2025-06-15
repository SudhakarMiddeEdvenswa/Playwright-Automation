import { Page } from "@playwright/test";
// This file defines the TasksPage class for interacting with the tasks page of the application.
export class TasksPage {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }
  // Navigate to Manage Tasks
  async navigateToManageTasks() {
    await this.page
      .getByRole("button", { name: "Manage Tasks Manage Tasks" })
      .isVisible();
    await this.page
      .getByRole("button", { name: "Manage Tasks Manage Tasks" })
      .click();
  }
  // Click the Add Tasks button
  async clickAddTasks() {
    await this.page.getByRole("button", { name: "Add Tasks" }).isVisible();
    await this.page.getByRole("button", { name: "Add Tasks" }).click();
  }

  // Fill in task details
  async fillTaskDetails(
    taskName: string,
    time: string,
    taskDescription: string,
    startDate: string,
    endDate: string,
    projectName: string,
    taskCategory: string
  ) {
    await this.page.getByRole("textbox", { name: "Task Name" }).fill(taskName);
    await this.page.getByRole("textbox", { name: "hh:mm" }).fill(time);
    await this.page
      .getByRole("textbox", { name: "Task Description" })
      .fill(taskDescription);
    await this.page
      .getByRole("textbox", { name: "Start Date" })
      .fill(startDate);
    await this.page.getByRole("textbox", { name: "End Date" }).fill(endDate);
    await this.page.getByRole("combobox", { name: "Projects" }).click();
    await this.page.getByRole("option", { name: projectName }).click();
    await this.page.getByRole("combobox", { name: "Task Categories" }).click();
    await this.page.getByRole("option", { name: taskCategory }).click();
  }
  // Save the task
  async saveTask() {
    await this.page.getByRole("button", { name: "Save" }).isVisible();
    await this.page.getByRole("button", { name: "Save" }).click();
  }
  // Verify task creation
  async verifyTaskCreation(taskName: string, taskDescription: string) {
    await this.page.getByText(taskName).isVisible();
    await this.page.getByText(taskDescription).isVisible();
  }
  // Delete the first task
  async deleteFirstTask(taskName: string) {
    await this.page
      .getByRole("row", { name: `EmPortal ${taskName}` })
      .getByRole("button", { name: "Click to Delete" })
      .isVisible();
    await this.page
      .getByRole("row", { name: `EmPortal ${taskName}` })
      .getByRole("button", { name: "Click to Delete" })
      .click();
    await this.page.getByRole("button", { name: "Delete" }).click();
  }
  //Delete the remaining tasks
  async deleteTaskByName(taskName: string) {
    await this.page
      .getByRole("row", { name: `EmPortal ${taskName}` })
      .getByLabel("Click to Delete")
      .waitFor({ state: "visible" });
    await this.page
      .getByRole("row", { name: `EmPortal ${taskName}` })
      .getByLabel("Click to Delete")
      .click();
    await this.page.getByRole("button", { name: "Delete" }).click();
  }
}
