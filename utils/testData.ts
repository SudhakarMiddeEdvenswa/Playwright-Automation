import { time } from "console";

export const testData = {
  user: {
    username: "srikanth.mallela@edvenswatech.com",
    password: "Sreekanth@1997",
  },
  greetingTimes: {
    morning: "Good Morning",
    afternoon: "Good Afternoon",
    evening: "Good Evening",
  },
};
export const timesheetData = {
  userName: "Mallela Srikanth",
  firstTaskHours: ["01:00", "02:00", "01:30", "00:30"],
  secondTaskHours: ["02:00", "01:00", "01:30", "00:30"],
  expectedSubmissionMessage: "Timesheet submitted successfully",
};
export const taskAData = {
  taskName: "Offshore Standup Meeting",
  time: "5:00",
  taskDescription: "Daily Standup Meeting with Offshore Team.",
  projectName: "EmPortal", //Stax Payments
  taskCategory: "Meetings Internal",
};
export const taskBData = {
  taskName: "Onsite Standup Meeting",
  time: "5:00",
  taskDescription: "Attending standup meetings to give status on current work.",
  projectName: "EmPortal", //Stax Payments
  taskCategory: "Meetings Client",
};
export const taskCData = {
  taskName: "Preparing/scripting Automation scripts for Jira ticket",
  time: "10:00",
  taskDescription:
    "Created new automation scripts for Jira ticket which is assigned to me.",
  projectName: "EmPortal", //Stax Payments
  taskCategory: "Code Commit Push",
};
export const taskDData = {
  taskName: "Executing Scripts",
  time: "5:00",
  taskDescription: "Executed all the automation scripts as per Jira ticket.",
  projectName: "EmPortal", //Stax Payments
  taskCategory: "Monitoring",
};
export const taskEData = {
  taskName: "Review automation scripts with Business Leads",
  time: "5:00",
  taskDescription: "Reviewing all the automation scripts with team leads.",
  projectName: "EmPortal", //Stax Payments
  taskCategory: "Code Review",
};
export const taskFData = {
  taskName: "Stax payments PHO Dashboard",
  time: "5:00",
  taskDescription:
    "Phoenix Team PHO tickets Manual Testing - Analyze the ticket to how to do manual testing and update the comments same in ticket.",
  projectName: "EmPortal", //Stax Payments
  taskCategory: "Quality Assurance",
};
export const taskGData = {
  taskName: "Doubts and clarifications on new tasks",
  time: "5:00",
  taskDescription:
    "Reaching out the required POC to get clarifications on new tasks.",
  projectName: "EmPortal", //Stax Payments
  taskCategory: "Requirement Gathering",
};
