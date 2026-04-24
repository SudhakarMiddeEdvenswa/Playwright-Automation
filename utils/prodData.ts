import { time } from "console";
export const testData = {
  user: {
    username: "sudhakar.midde@edvenswatech.com",
    password: process.env.USER_PASSWORD || "",
  },
  greetingTimes: {
    morning: "Good Morning",
    afternoon: "Good Afternoon",
    evening: "Good Evening",
  },
};
export const timesheetData = {
  userName: "Midde Sudhakar",
  firstTaskHours: ["2", "2", "2", "2", "2"],
  secondTaskHours: [
    "1",
    "1",
    "1",
    "1",
    "1",
    "1",
    "1",
    "1",
    "1",
    "1",
    "1",
    "1",
    "1",
    "1",
    "1",
    "1",
    "1",
    "1",
    "1",
    "1",
    "1",
    "1",
    "1",
    "1",
    "1",
    "1",
    "1",
    "1",
    "1",
    "1",
    "1",
  ],
  expectedSubmissionMessage: "Timesheet submitted successfully",
};
export const taskAData = {
  taskName: "Offshore Standup Meeting",
  time: "5:00",
  taskDescription: "Daily Standup Meeting with Offshore Team.",
  projectName: "Stax Payments",
  taskCategory: "Meetings Internal",
};
export const taskBData = {
  taskName: "Onsite Standup Meeting",
  time: "5:00",
  taskDescription: "Attending standup meetings to give status on current work.",
  projectName: "Stax Payments",
  taskCategory: "Meetings Client",
};
export const taskCData = {
  taskName: "Preparing/scripting Automation scripts for Jira ticket",
  time: "10:00",
  taskDescription:
    "Created new automation scripts for Jira ticket which is assigned to me.",
  projectName: "Stax Payments",
  taskCategory: "Code Commit Push",
};
export const taskDData = {
  taskName: "Executing Scripts",
  time: "5:00",
  taskDescription: "Executed all the automation scripts as per Jira ticket.",
  projectName: "Stax Payments",
  taskCategory: "Monitoring",
};
export const taskEData = {
  taskName: "Review automation scripts with Business Leads",
  time: "5:00",
  taskDescription: "Reviewing all the automation scripts with team leads.",
  projectName: "Stax Payments",
  taskCategory: "Code Review",
};
export const taskFData = {
  taskName: "Stax payments PHO Dashboard",
  time: "5:00",
  taskDescription:
    "Phoenix Team PHO tickets Automation - Analyze the tickets to how to do automation if not possible just to help dev team for testing manually and create automation tickets under Quality Assurance.",
  projectName: "Stax Payments",
  taskCategory: "Quality Assurance",
};
export const taskGData = {
  taskName: "Doubts and clarifications on new tasks",
  time: "5:00",
  taskDescription:
    "Reaching out the required POC to get clarifications on new tasks.",
  projectName: "Stax Payments",
  taskCategory: "Requirement Gathering",
};
export const ratingData = {
  ratingName: "Code Quality",
  ratingDescription:
    "Writing clean, efficient, and maintainable code that adheres to coding standards and best practices. Regularly reviewing and refactoring code to improve its quality.",
  associateId: "2214",
  projectName: "EmPortal",
  ratingCategory: "Quarterly Review",
};
export const capabilityRatingData = {
  executionEfficiencyDescription:
    "Always be Executing and completing tasks in in-time, without having any delays and latency. Also prioritizing the task as per requirement.",
  qualityOfOutPutDescription:
    "Always giving my best on deliverables. Always be making sure that all the tasks should complete by the end of the sprint.",
  accountabilityAndOwnershipDescription:
    "Taking full responsibility for my tasks and ensuring timely completion with high quality.Always be communicating with stakeholders and also do proactive updates and follow-ups with them to complete tasks in-time. Reaching out the respective stakeholders when the requirement is not clear.",
};
export const creativityRatingData = {
  originalityDescription:
    "Always be keep Trying to help team members with different approaches and ideas.",
  alignmentDescription:
    "Make sure for every quarter setup the goals as per client and project requirements with the help of onsite project manager.",
  complexityAndEffortDescription:
    "Whenever any new tasks came that take some time to complete, will plan accordingly in the terms of resource requirement and time taken for each individual task completions.",
};
export const collaborationRatingData = {
  teamContributionDescription:
    "Consistently support team members in completing their tasks by offering assistance, sharing knowledge, and providing guidance. Additionally, actively help with automation-related questions, troubleshooting, and clarifications to ensure smooth progress and team collaboration.",
  adaptabilityAndFlexibilityDescription:
    "Always remain flexible and adaptable when handling high-priority or time-sensitive tasks, regardless of changing schedules or workloads. Committed to seeing tasks through to completion, ensuring no handoff or follow-up is missed, and maintaining accountability until the work is fully delivered.",
  relationshipBuildingDescription:
    "Always maintain mutual respect and open communication within the team, fostering a positive and collaborative work environment. Actively listen to others’ perspectives, encourage constructive dialogue, and help resolve conflicts professionally and empathetically to support team harmony and productivity.",
};
export const complianceRatingData = {
  awarenessDescription:
    "Always be ready to follow policies and procedures and the ability to promote compliance among peers. also strictly on time login and come to office. prior to inform if any delays.",
  adherenceDescription:
    "Always be following established rules, processes, timelines and the ability to resolve compliance-related issues by identifying and addressing them promptly.",
  accuracyAndIntegrityOfRecordsDescription:
    "Always stay prepared to maintain accurate and up-to-date compliance-related documentation and records. Ensure all relevant data is captured, organized, and regularly updated to meet audit, regulatory, and organizational standards. Proactively monitor for any changes and make timely updates to support ongoing compliance and accountability.",
};
export const customerRatingData = {
  convenienceDescription:
    "Always be commitment to understanding customer requirements and delivering with ease and efficiency to exceed their expectations. Also make sure to reach out the respected POC's to complete/fulfill the commitment.",
  valueCreationDescription:
    "Working on value creation by doing AWS - Solution Architecture Manager as a course(85% Completed) and also doing some additional value creation like learning Selenium with Python and Playwright. Started certification for Cribl Admin - Edge. Implemented Emportal automation to help team members.",
  costOptimizationDescription:
    "I have always made significant strides in cost optimization, and his efforts are highly valued. We look forward to his continued contributions to our cost efficiency goals.",
  brandPromotionDescription:
    "I have always made significant strides in brand promotion, and my efforts are highly valued. I'm looking forward to continued contributions to our brand-building goals.",
};
