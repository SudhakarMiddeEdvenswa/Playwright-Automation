import { test, expect } from "@playwright/test";
import dayjs from "dayjs";
import path from "path";
import dotenv from "dotenv";
dotenv.config();

import {
  timesheetData,
  taskAData,
  taskBData,
  taskCData,
  taskDData,
  taskEData,
  taskFData,
  taskGData,
  holidayData,
  paidLeaveData,
} from "../utils/prodData";
import { LoginPage } from "./pages/LoginPage";
import { TasksPage } from "./pages/TasksPage";
import { TimeSheetsPage } from "./pages/TimeSheetsPage";
import { HolidaysPage } from "./pages/HolidaysPage";

// Environment configuration (.env). EmPortal 2.0 prod: https://edvenswatech.emportal.me/
const baseURL = process.env.BASE_URL ?? "https://edvenswatech.emportal.me/";
const username = process.env.USER ?? "";
const password = process.env.PASSWORD ?? "";

// Submitting permanently records the weekly timesheet, so it is OFF by default.
// Run with SUBMIT_TIMESHEET=true to actually submit instead of just saving.
const submitTimesheet = process.env.SUBMIT_TIMESHEET === "true";

const dateFormat = "YYYY-MM-DD";
// The grid is a Mon-Fri week. Anchor tasks to the current week so they line up
// with the editable weekday columns.
const monday = dayjs().startOf("week").add(1, "day"); // startOf('week') is Sunday
const friday = monday.add(4, "day");
// Anchor to the CURRENT week so task creation and the per-week cleanup
// (weekStartDisplay, derived from `monday`) target the same week.
const taskStartDate = monday.format(dateFormat); // Monday of the current week
const taskEndDate = friday.format(dateFormat); // Friday of the current week
const userName = timesheetData.userName; // "Midde Sudhakar"

// Company holiday: the 14th of the current month by default (override with
// HOLIDAY_DATE=YYYY-MM-DD). If that day falls on a weekday inside the week under
// test, a single-day "Holiday" task is created and logged (8h) on that day, and
// the regular tasks skip that day so the day is not double-counted.
const holidayDate = process.env.HOLIDAY_DATE ?? dayjs().date(14).format(dateFormat);
const holidayDisplay = dayjs(holidayDate).format("DD/MM/YYYY");
// Weekday index within this Mon-Fri week (0=Mon .. 4=Fri); -1 if the holiday is
// not a weekday of this week.
const holidayIndex = dayjs(holidayDate).diff(monday, "day");
const holidayInWeek = holidayIndex >= 0 && holidayIndex <= 4;
const holidayHours = holidayData.time.split(":")[0]; // "8" from "8:00"

// ── Paid-leave configuration (disabled by default) ────────────────────────────
// Activate with TIMESHEET_INCLUDE_PAID_LEAVE=true. Requires:
//   TIMESHEET_PAID_LEAVE_DATE   — YYYY-MM-DD, must be a Mon-Fri of the current week
//   TIMESHEET_PAID_LEAVE_HOURS  — whole number 1-8 (default: 8)
//   TIMESHEET_WEEKLY_TARGET_HOURS — (default: 40)
//
// Hour-balance rule (enforced by assertPaidLeaveConfig before the test starts):
//   (5 - skippedDays) × 8h + leaveHours [+ holidayHours] = weeklyTarget
//
// With the current 7-task distribution (2h/day taskC + 1h/day × 6 others = 8h/day):
//   Full-day leave (8h) on one weekday → 4 days × 8h + 8h leave = 40h ✓
// ─────────────────────────────────────────────────────────────────────────────
const includePaidLeave = process.env.TIMESHEET_INCLUDE_PAID_LEAVE === "true";
const paidLeaveDate = (process.env.TIMESHEET_PAID_LEAVE_DATE ?? "").trim();
const paidLeaveHours = parseInt(process.env.TIMESHEET_PAID_LEAVE_HOURS ?? "8", 10);
const weeklyTarget = parseInt(process.env.TIMESHEET_WEEKLY_TARGET_HOURS ?? "40", 10);
const paidLeaveDisplay = paidLeaveDate
  ? dayjs(paidLeaveDate).format("DD/MM/YYYY")
  : "";
// Weekday index of the leave date in the Mon-Fri grid (0=Mon..4=Fri), -1 if outside.
const paidLeaveIndex =
  includePaidLeave && paidLeaveDate
    ? dayjs(paidLeaveDate).diff(monday, "day")
    : -1;
const paidLeaveInWeek = paidLeaveIndex >= 0 && paidLeaveIndex <= 4;

// All seven tasks for the week. The heavy task (Code Commit Push, 10h estimate)
// gets 2h/day; the rest get 1h/day -> 8h/day, 40h/week.
const allTasks = [
  taskCData,
  taskAData,
  taskBData,
  taskDData,
  taskEData,
  taskFData,
  taskGData,
];

/**
 * Validate paid-leave env-var configuration before the test body runs.
 * Throws with a clear, actionable message on any misconfiguration so the spec
 * fails fast with diagnostic output rather than a cryptic mid-test error.
 *
 * Skipped day accounting:
 *   Regular tasks run on (5 - uniqueSkippedCount) days at 8h/day.
 *   uniqueSkippedCount = 1 (paid leave) + 1 if a holiday also falls that week
 *                        on a DIFFERENT day than the leave day.
 *   The validation asserts: regularDays × 8 + leaveHours [+ holidayHours] = weeklyTarget.
 */
function assertPaidLeaveConfig() {
  if (!includePaidLeave) return;

  if (!paidLeaveDate) {
    throw new Error(
      "TIMESHEET_INCLUDE_PAID_LEAVE=true but TIMESHEET_PAID_LEAVE_DATE is not set. " +
        "Provide a YYYY-MM-DD date that falls on a Mon-Fri of the current workweek " +
        `(${taskStartDate} → ${taskEndDate}).`
    );
  }
  if (!dayjs(paidLeaveDate).isValid()) {
    throw new Error(
      `TIMESHEET_PAID_LEAVE_DATE="${paidLeaveDate}" is not a valid date. ` +
        "Use YYYY-MM-DD format (e.g. 2026-10-20)."
    );
  }
  if (isNaN(paidLeaveHours) || paidLeaveHours < 1 || paidLeaveHours > 8) {
    throw new Error(
      `TIMESHEET_PAID_LEAVE_HOURS="${process.env.TIMESHEET_PAID_LEAVE_HOURS}" is invalid. ` +
        "Must be a whole number from 1 to 8."
    );
  }
  if (isNaN(weeklyTarget) || weeklyTarget <= 0) {
    throw new Error(
      `TIMESHEET_WEEKLY_TARGET_HOURS="${process.env.TIMESHEET_WEEKLY_TARGET_HOURS}" is invalid. ` +
        "Must be a positive whole number (standard: 40)."
    );
  }
  if (!paidLeaveInWeek) {
    throw new Error(
      `TIMESHEET_PAID_LEAVE_DATE="${paidLeaveDate}" (day index ${paidLeaveIndex}) does not fall ` +
        `on a Mon-Fri weekday of the current week (${taskStartDate} → ${taskEndDate}). ` +
        "Update TIMESHEET_PAID_LEAVE_DATE or run the spec in the correct week."
    );
  }
  if (holidayInWeek && holidayIndex === paidLeaveIndex) {
    throw new Error(
      `TIMESHEET_PAID_LEAVE_DATE (${paidLeaveDate}) coincides with the company holiday ` +
        `(${holidayDate}). A paid leave day and a company holiday cannot share the same date. ` +
        "Adjust TIMESHEET_PAID_LEAVE_DATE or HOLIDAY_DATE."
    );
  }

  // Hours-balance check: count unique skipped days (paid leave + any holiday on a different day).
  const uniqueSkipped = new Set([
    paidLeaveIndex,
    ...(holidayInWeek ? [holidayIndex] : []),
  ]);
  const regularDays = 5 - uniqueSkipped.size;
  const regularHours = regularDays * 8; // 8h/day: 2h (taskC) + 1h × 6 others
  const specialHours =
    paidLeaveHours + (holidayInWeek ? parseInt(holidayHours, 10) : 0);
  const projectedTotal = regularHours + specialHours;

  if (projectedTotal !== weeklyTarget) {
    const holidayLine = holidayInWeek ? `\n  Holiday      : ${holidayHours}h` : "";
    throw new Error(
      `Paid-leave configuration will not reach the ${weeklyTarget}h weekly target.\n` +
        `  Regular work : ${regularDays} days × 8h = ${regularHours}h\n` +
        `  Paid leave   : ${paidLeaveHours}h` +
        holidayLine +
        `\n  Projected    : ${projectedTotal}h  (need ${weeklyTarget}h)\n` +
        "Fix: adjust TIMESHEET_PAID_LEAVE_HOURS or TIMESHEET_WEEKLY_TARGET_HOURS to balance."
    );
  }
}

test.describe("EmPortal 2.0 - weekly timesheet submission E2E", () => {
  test.use({ viewport: { width: 1920, height: 1080 } });
  // Seven regular tasks + optional Holiday + optional Paid Leave, each with
  // robust description entry and potential "Holiday Warning" confirmations.
  test.setTimeout(300_000);

  test("Create tasks, fill the weekly timesheet and save/submit", async ({
    page,
  }) => {
    if (!username || !password) {
      throw new Error("USER and PASSWORD environment variables must be set.");
    }

    // Validate paid-leave configuration before touching the application, so any
    // misconfiguration surfaces as a clear error rather than a mid-test failure.
    assertPaidLeaveConfig();

    console.log(`Week under test : ${taskStartDate} → ${taskEndDate}`);
    if (includePaidLeave && paidLeaveInWeek) {
      const actualWorkHours = weeklyTarget - paidLeaveHours;
      console.log(
        `Paid leave      : ${paidLeaveDisplay} (${paidLeaveHours}h) — ` +
          `actual work reduced to ${actualWorkHours}h over ${5 - (holidayInWeek ? 2 : 1)} day(s)`
      );
    }

    // 1. Login (EmPortal 2.0 has no CAPTCHA).
    const loginPage = new LoginPage(page);
    await loginPage.navigate(baseURL);
    await loginPage.login(username, password);
    await loginPage.submitLogin();
    await loginPage.waitForLogin();
    expect(await loginPage.isLoggedIn(userName)).toBeTruthy();

    // 1a. If a company holiday falls on a weekday of this week, look up the
    //     festival/occasion from EmPortal's Holiday Calendar and build the
    //     Holiday task's description from it (e.g. "On occasion of Ganesh
    //     Chaturthi"). Falls back to the static description if not listed.
    let holidayDescription = holidayData.taskDescription;
    if (holidayInWeek) {
      const holidaysPage = new HolidaysPage(page);
      const festival = await holidaysPage.getHolidayName(holidayDate);
      if (festival) {
        holidayDescription = `On occasion of ${festival}`;
        console.log(
          `Holiday on ${holidayDisplay} (day ${holidayIndex}): ${festival}`
        );
      } else {
        console.log(
          `No holiday listed on ${holidayDisplay}; using default description.`
        );
      }
    }

    // 2. Create the week's tasks on the Task Management page.
    const tasksPage = new TasksPage(page);
    await tasksPage.navigateToManageTasks();

    // EmPortal rejects duplicate tasks (same name + week), which leaves the
    // "Add New Task" drawer open and fails the save. Clear this week's tasks
    // first so the flow is idempotent and safe to re-run. No-op when nothing
    // matches. (Rows with an already-submitted timesheet cannot be deleted.)
    const weekStartDisplay = monday.format("DD/MM/YYYY"); // e.g. "13/10/2026"
    const weekEndDisplay = friday.format("DD/MM/YYYY"); // e.g. "17/10/2026"

    // The task list defaults to a current-month date filter and its search only
    // matches rows inside that range. Widen it to this week so cleanup can find
    // tasks even when the week straddles a month boundary.
    await tasksPage.setWeekDateFilter(weekStartDisplay, weekEndDisplay);

    for (const task of allTasks) {
      const removed = await tasksPage.deleteTasksForWeek(
        task.taskName,
        weekStartDisplay
      );
      if (removed > 0) {
        console.log(
          `Removed ${removed} existing "${task.taskName}" task(s) for the week.`
        );
      }
    }

    // Also clear any existing Holiday task (its start date is the holiday day,
    // which may differ from the week's Monday).
    if (holidayInWeek) {
      await tasksPage.deleteTasksForWeek(holidayData.taskName, holidayDisplay);
    }

    // Clear any existing Paid Leave task on the configured leave day.
    if (includePaidLeave && paidLeaveInWeek) {
      const removed = await tasksPage.deleteTasksForWeek(
        paidLeaveData.taskName,
        paidLeaveDisplay
      );
      if (removed > 0) {
        console.log(
          `Removed ${removed} existing "${paidLeaveData.taskName}" task(s) for ${paidLeaveDisplay}.`
        );
      }
    }

    // Create regular Mon-Fri tasks.
    for (const task of allTasks) {
      await tasksPage.clickAddTasks();
      await tasksPage.fillTaskDetails(
        task.taskName,
        task.time,
        task.taskDescription,
        taskStartDate,
        taskEndDate,
        task.projectName,
        task.taskCategory
      );
      await tasksPage.saveTask();
      console.log(`Created task: ${task.taskName}`);
    }

    // Create the single-day Holiday task for the holiday itself. saveTask()
    // accepts EmPortal's "Holiday Warning" confirmation automatically.
    if (holidayInWeek) {
      await tasksPage.clickAddTasks();
      await tasksPage.fillTaskDetails(
        holidayData.taskName,
        holidayData.time,
        holidayDescription,
        holidayDate,
        holidayDate,
        holidayData.projectName,
        holidayData.taskCategory
      );
      await tasksPage.saveTask();
      console.log(
        `Created Holiday task for ${holidayDisplay}: "${holidayDescription}"`
      );
    }

    // Create the single-day Paid Leave task on the configured leave date.
    // The estimated time is set from TIMESHEET_PAID_LEAVE_HOURS so the task
    // record matches the hours that will be logged in the timesheet grid.
    if (includePaidLeave && paidLeaveInWeek) {
      await tasksPage.clickAddTasks();
      await tasksPage.fillTaskDetails(
        paidLeaveData.taskName,
        `${paidLeaveHours}:00`,
        paidLeaveData.taskDescription,
        paidLeaveDate,
        paidLeaveDate,
        paidLeaveData.projectName,
        paidLeaveData.taskCategory
      );
      await tasksPage.saveTask();
      console.log(
        `Created Paid Leave task for ${paidLeaveDisplay} (${paidLeaveHours}h).`
      );
    }

    // 3. Open the weekly timesheet grid for the same week.
    const timeSheetsPage = new TimeSheetsPage(page);
    await timeSheetsPage.navigateToManageTimeSheets();
    await timeSheetsPage.assertTimesheetPageVisible(userName);
    await timeSheetsPage.selectWeekByDate(taskStartDate);

    const expectedTasks =
      allTasks.length +
      (holidayInWeek ? 1 : 0) +
      (includePaidLeave && paidLeaveInWeek ? 1 : 0);
    const tasksFound = await timeSheetsPage.getTotalTasksFound();
    console.log(`Tasks found in timesheet for the week: ${tasksFound}`);
    expect(tasksFound).toBeGreaterThanOrEqual(expectedTasks);

    // 4. Fill Mon-Fri hours for every regular task row.
    //    Both the company holiday and the paid-leave day are skipped so their
    //    dedicated tasks carry the full hours for those days without double-counting.
    //    Regular tasks: 2h/day (taskC) + 1h/day × 6 others = 8h/day on work days.
    const skipDays = Array.from(
      new Set([
        ...(holidayInWeek ? [holidayIndex] : []),
        ...(includePaidLeave && paidLeaveInWeek ? [paidLeaveIndex] : []),
      ])
    );
    for (const task of allTasks) {
      const hoursPerDay = task.taskName === taskCData.taskName ? "2" : "1";
      await timeSheetsPage.fillTaskRowDaily(task.taskName, hoursPerDay, skipDays);
      const total = await timeSheetsPage.getTaskRowTotal(task.taskName);
      console.log(`Filled "${task.taskName}" -> weekly total ${total}`);
    }

    // 4a. Log the holiday's full-day hours on the holiday itself. The Holiday
    //     task spans only that single day, so only that column is editable.
    if (holidayInWeek) {
      await timeSheetsPage.fillTaskRowDaily(
        holidayData.taskName,
        holidayHours,
        [],
        true // accept the "Holiday Entry" confirmation on the holiday day
      );
      const total = await timeSheetsPage.getTaskRowTotal(holidayData.taskName);
      console.log(
        `Filled "${holidayData.taskName}" (${holidayDisplay}) -> weekly total ${total}`
      );
    }

    // 4b. Log paid-leave hours on the configured leave date. The task spans only
    //     that single day so only that day's column is editable in the grid.
    if (includePaidLeave && paidLeaveInWeek) {
      await timeSheetsPage.fillTaskRowDaily(
        paidLeaveData.taskName,
        String(paidLeaveHours),
        [] // no further days to skip — the task covers only the leave date
      );
      const total = await timeSheetsPage.getTaskRowTotal(paidLeaveData.taskName);
      console.log(
        `Filled "${paidLeaveData.taskName}" (${paidLeaveDisplay}) -> weekly total ${total}`
      );
    }

    // 5. Capture proof of the filled grid before saving.
    await page.screenshot({
      path: path.join(__dirname, "timesheet-filled.png"),
      fullPage: true,
    });

    // 5a. Validate the weekly total against the configured target by reading
    //     the application's own displayed row-total cells. This confirms that
    //     actual work hours + paid-leave hours (+ holiday hours) = weeklyTarget,
    //     using the grid's values rather than the automation's internal counters.
    let computedWeeklyHours = 0;
    for (const task of allTasks) {
      const rowTotal = await timeSheetsPage.getTaskRowTotal(task.taskName);
      computedWeeklyHours += parseInt(rowTotal.split(":")[0] ?? "0", 10);
    }
    if (holidayInWeek) {
      const rowTotal = await timeSheetsPage.getTaskRowTotal(holidayData.taskName);
      computedWeeklyHours += parseInt(rowTotal.split(":")[0] ?? "0", 10);
    }
    if (includePaidLeave && paidLeaveInWeek) {
      const rowTotal = await timeSheetsPage.getTaskRowTotal(paidLeaveData.taskName);
      computedWeeklyHours += parseInt(rowTotal.split(":")[0] ?? "0", 10);
    }
    console.log(
      `Weekly total (from grid): ${computedWeeklyHours}h  |  target: ${weeklyTarget}h`
    );
    expect(
      computedWeeklyHours,
      `Weekly hours ${computedWeeklyHours}h do not match the ${weeklyTarget}h target. ` +
        "Review task-row totals in the screenshot before submitting."
    ).toBe(weeklyTarget);

    // 6. Save the draft (reversible). Submit only when explicitly requested.
    await timeSheetsPage.saveTimesheet();
    console.log("Timesheet saved as draft.");

    if (submitTimesheet) {
      await timeSheetsPage.submitTimesheet();
      await page.screenshot({
        path: path.join(__dirname, "timesheet-submitted.png"),
        fullPage: true,
      });
      console.log("Timesheet submitted.");
    } else {
      console.log(
        "SUBMIT_TIMESHEET not set — timesheet filled & saved but NOT submitted (safe mode)."
      );
    }
  });
});

/**
 * Cleanup helper (not run by default): remove all tasks created for the week.
 * Useful when re-running the E2E so the grid does not accumulate duplicates.
 */
export async function deleteAllTasks(tasksPage: TasksPage, page: any) {
  for (const task of allTasks) {
    await tasksPage.deleteTaskByName(task.taskName);
    await expect(page.getByText(task.taskName).first()).toBeHidden();
  }
}
