# Playwright Automation Task: EMPortal Timesheet Submission with Paid Leave Support

## Objective

Enhance the existing Playwright automation spec, `emportal_TimeSheetSubmitE2E.spec.ts`, to support submitting a timesheet in the **PROD environment**, including an additional configuration for **Paid Leave on a user-specified date**.

The automation must read the paid-leave date and leave duration from the `.env` file, adjust the daily task entries accordingly, and ensure that the **total actual hours worked plus paid-leave hours equals 40 hours for the entire workweek**.

## 1. Review the Existing Implementation

- Inspect `emportal_TimeSheetSubmitE2E.spec.ts` and understand the existing login, navigation, task-entry, validation, and timesheet-submission workflow.
- Review the existing Page Object Model (POM), reusable utilities, environment configuration, and test-data structure.
- Reuse the current implementation wherever possible instead of duplicating existing logic.
- Identify how the application records:
  - Actual hours worked.
  - Task descriptions and task durations.
  - Paid Leave entries.
  - Daily and weekly timesheet totals.
- Preserve existing behavior when the paid-leave configuration is not provided.

## 2. Environment Configuration

Add the following configurable values to the existing `.env` file. Follow the repository's existing naming conventions if equivalent variables already exist.

```dotenv
ENV=prod

# Enable or disable paid-leave configuration
TIMESHEET_INCLUDE_PAID_LEAVE=true

# Date on which paid leave should be recorded
TIMESHEET_PAID_LEAVE_DATE=YYYY-MM-DD

# Number of paid-leave hours for the specified date
TIMESHEET_PAID_LEAVE_HOURS=8

# Expected total weekly hours
TIMESHEET_WEEKLY_TARGET_HOURS=40
```

Requirements:

- Read these values using the repository's existing environment-variable loading mechanism.
- Validate the date format, leave hours, and weekly target before modifying the timesheet.
- Ensure the leave date falls within the target workweek.
- Do not hardcode the leave date or leave duration in the spec.
- If paid leave is disabled, execute the existing timesheet workflow without introducing paid-leave entries.
- If paid leave is enabled but the required configuration is missing or invalid, fail with a clear, actionable error message.

## 3. Paid Leave Entry

When `TIMESHEET_INCLUDE_PAID_LEAVE=true`:

1. Navigate to the appropriate timesheet week in EMPortal.
2. Identify the configured paid-leave date from `.env`.
3. Add or select the appropriate **Paid Leave** task/activity for that date, following the application's existing workflow.
4. Enter the configured leave duration.
5. Ensure the paid-leave entry is associated with the correct date and task/activity type.
6. Avoid creating duplicate paid-leave entries if the task already exists.
7. Confirm that the application accepts and displays the leave entry correctly.

Do not assume that the paid-leave task can be created using the same UI controls as regular work tasks. Inspect the existing implementation and application behavior first.

## 4. Adjust Actual Work Hours

After recording paid leave, recalculate the remaining hours required to reach the weekly target.

Use the following rule:

**Required actual work hours = Weekly target hours − Paid-leave hours**

For example, if the weekly target is 40 hours and paid leave is 8 hours:

- Paid leave: 8 hours.
- Actual hours worked: 32 hours.
- Combined weekly total: 40 hours.

Requirements:

- Adjust task durations to account for the paid-leave hours.
- Distribute actual work hours across the applicable working days and tasks using the existing test-data structure and business rules.
- Preserve valid task descriptions and existing task-entry conventions.
- Do not assign work hours to the paid-leave period if the application does not allow overlapping entries.
- Ensure no daily or weekly task duration becomes negative.
- If the existing task distribution cannot be adjusted to meet the weekly target, stop with a descriptive error rather than submitting an invalid timesheet.

If the paid-leave date already contains work tasks, adjust those task durations according to the application's rules instead of blindly adding leave hours on top of the existing total.

## 5. Weekly Hours Validation

Before submitting the timesheet, calculate and validate the weekly totals.

Verify that:

```text
Total actual work hours + Total paid-leave hours = 40 hours
```

Also validate that:

- The paid-leave entry is recorded on the configured date.
- The paid-leave duration matches `TIMESHEET_PAID_LEAVE_HOURS`.
- Actual work hours have been adjusted correctly.
- The weekly total matches `TIMESHEET_WEEKLY_TARGET_HOURS`.
- No duplicate entries or unintended overlaps exist.
- The timesheet contains no invalid or missing task durations.

Use the application's displayed totals or reliable underlying data to confirm the final values. Do not rely only on the automation's internal calculations.

## 6. Production Environment Safety

Because this spec will execute in PROD:

- Reuse the existing production URL and authentication configuration.
- Do not hardcode credentials or expose secrets in logs.
- Confirm that the test user is authorized to create and submit timesheets.
- Validate the selected employee, workweek, paid-leave date, and hours before submission.
- Do not create duplicate timesheets or duplicate leave entries.
- Avoid changing previously submitted or approved timesheets unless the existing workflow explicitly supports that operation and it is authorized.
- Before the final submission, verify that the calculated weekly total is correct and that the intended week and leave date are selected.
- Do not bypass application validations or submit an invalid timesheet to make the test pass.

If the existing spec submits a timesheet automatically, retain that behavior only after all required validations pass. Otherwise, follow the repository's existing submission and confirmation process.

## 7. Assertions and Test Evidence

Add or update assertions to verify:

1. The EMPortal login and timesheet navigation succeed.
2. The intended workweek is selected.
3. Paid leave is recorded on the configured date.
4. The paid-leave hours match the `.env` configuration.
5. Actual work hours are adjusted correctly.
6. The total weekly hours equal 40, or the configured weekly target.
7. The application confirms successful timesheet submission.
8. The final timesheet summary reflects the expected work and leave hours.

Capture relevant screenshots or logs using the existing project conventions. Do not log credentials or other sensitive information.

## 8. Implementation and Code Quality

- Use TypeScript and the existing Playwright test framework.
- Follow the current Page Object Model and fixture patterns.
- Reuse existing login, task-entry, and submission helpers.
- Add reusable functions for reading configuration, validating leave settings, recalculating hours, and validating weekly totals where appropriate.
- Keep the implementation configurable and maintainable.
- Avoid unnecessary changes to unrelated specs or shared utilities.
- Do not invent UI selectors, task names, or API endpoints. Inspect the existing repository and application workflow before implementing them.
- Report any missing application functionality or unresolved assumptions rather than implementing speculative behavior.

## 9. Execution and Final Report

Execute the updated spec in the configured PROD environment using the repository's established Playwright command.

After execution, report:

- Files modified.
- Environment variables added or reused.
- Paid-leave date and configured duration, without exposing secrets.
- Actual work hours and paid-leave hours recorded.
- Final weekly total.
- Whether the timesheet submission succeeded.
- Assertions passed or failed.
- Any blockers or application-specific assumptions.

## Acceptance Criteria

The task is complete when:

- The existing `emportal_TimeSheetSubmitE2E.spec.ts` workflow remains functional.
- Paid leave can be configured through `.env` for a user-specified date.
- Work-task durations are adjusted to account for paid leave.
- Actual work hours plus paid-leave hours equal the configured weekly target of 40 hours.
- All relevant validations pass before submission.
- The spec runs successfully in the configured PROD environment without creating duplicate or unintended timesheet entries.