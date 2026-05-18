import { Page, Locator, expect } from "@playwright/test";
import { RatingSection } from "../../utils/selfRatingData";

/**
 * Page Object for the EmPortal self-rating flow (PERF Rating Sheet /
 * UserAppraisalForm), where an associate rates themselves for a given period.
 *
 * The form is organised into 5 sections (Capability, Creativity, Collaboration,
 * Compliance, Customer). Each section contains several criteria; every criterion
 * has a MUI star-rating (0.5 increments) and an "Enter your comments..." textbox.
 * Sections are navigated with the Next / Prev buttons; the form ends with Submit.
 */
export class SelfRatingPage {
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // --- Navigation ---------------------------------------------------------

  /** Open the Ratings (Appraisals) module from the left navigation. */
  async navigateToRatings(): Promise<void> {
    const ratings = this.page.getByRole("button", { name: "Ratings" });
    await expect(ratings).toBeVisible();
    await ratings.click();
    // Wait until the Appraisals list (period selector) is rendered.
    await expect(
      this.page.getByText("User Ratings", { exact: true })
    ).toBeVisible();
  }

  /**
   * Navigate the month selector until the period belonging to the requested
   * month/year is displayed, then open the self-appraisal form for the row
   * whose Start Date matches `rowDate` (e.g. "01-Jun-2026").
   */
  async openSelfAppraisal(
    rowDate: string,
    targetYear: number,
    targetMonth: number
  ): Promise<void> {
    await this.navigateToTargetMonth(targetYear, targetMonth);

    const row = this.page.getByRole("row", { name: new RegExp(rowDate) });
    await expect(
      row,
      `Could not find a rating period row with start date "${rowDate}".`
    ).toBeVisible();

    // The associate name cell is the link that opens the PERF form.
    await row.getByLabel("User Overview").click();

    await expect(this.page).toHaveURL(/UserAppraisalForm/);
    await expect(
      this.page.getByRole("heading", { name: "PERF Rating Sheet" })
    ).toBeVisible();
  }

  /** Step the month selector (prev/next) until it shows the target month/year. */
  private async navigateToTargetMonth(
    targetYear: number,
    targetMonth: number
  ): Promise<void> {
    const startDateBox = this.page.getByRole("textbox", { name: "Start Date" });
    await expect(startDateBox.first()).toBeVisible();

    for (let i = 0; i < 24; i++) {
      // Period selector Start Date is formatted DD-MM-YYYY (e.g. 01-06-2026).
      const value = (await startDateBox.first().inputValue()) || "";
      const match = value.match(/(\d{2})-(\d{2})-(\d{4})/);
      if (match) {
        const shownMonth = Number(match[2]);
        const shownYear = Number(match[3]);
        if (shownYear === targetYear && shownMonth === targetMonth) return;

        const goBack =
          shownYear > targetYear ||
          (shownYear === targetYear && shownMonth > targetMonth);
        await this.page
          .getByRole("button", {
            name: goBack
              ? "click to go to previous month"
              : "click to go to next month",
          })
          .click();
        await this.page.waitForTimeout(500); // allow the grid to refresh
      } else {
        break;
      }
    }
  }

  // --- Read-only guard ----------------------------------------------------

  /**
   * Returns true when the period has already been submitted and the ratings are
   * locked. Filling such a form is impossible, so callers should fail fast.
   */
  async isReadOnly(): Promise<boolean> {
    return (
      (await this.page.getByText(/Ratings are read-only/i).count()) > 0
    );
  }

  // --- Filling ------------------------------------------------------------

  /** Expand every criterion in the current section so comment boxes render. */
  async expandAll(): Promise<void> {
    const expand = this.page.getByRole("button", { name: "Expand All" });
    if (await expand.isVisible().catch(() => false)) {
      await expand.click();
    }
  }

  /**
   * Fill all criteria of the currently displayed section.
   *
   * Criteria appear top-to-bottom in the same order as `section.criteria`, so we
   * address the i-th star-rating widget and the i-th comment box. The order is
   * asserted against the data to fail fast if the UI ever changes.
   */
  async fillCurrentSection(section: RatingSection): Promise<void> {
    await this.expandAll();

    const ratingRoots = this.page.locator(".MuiRating-root");
    const commentBoxes = this.page.getByRole("textbox", {
      name: "Enter your comments...",
    });

    await expect(
      ratingRoots,
      `Section "${section.name}" should have ${section.criteria.length} rating widgets.`
    ).toHaveCount(section.criteria.length);
    await expect(
      commentBoxes,
      `Section "${section.name}" should have ${section.criteria.length} comment boxes.`
    ).toHaveCount(section.criteria.length);

    for (let i = 0; i < section.criteria.length; i++) {
      const criterion = section.criteria[i];

      // --- Set the star rating -------------------------------------------
      // The radio <input> is visually hidden and overlaid by a <label>, so we
      // resolve the input id for the desired value and click its label.
      const root = ratingRoots.nth(i);
      const input = root.locator(`input[type="radio"][value="${criterion.stars}"]`);
      const inputId = await input.getAttribute("id");
      if (!inputId) {
        throw new Error(
          `No ${criterion.stars}-star option for "${criterion.title}" in section "${section.name}".`
        );
      }
      // MUI rating labels overlap and some have zero width, which defeats a
      // coordinate-based Playwright click. Trigger the label's native click()
      // (which activates the associated radio and fires React's onChange).
      await root
        .locator(`label[for="${inputId}"]`)
        .evaluate((el) => (el as HTMLElement).click());

      // --- Fill the comment ----------------------------------------------
      // Clear first in case a value already exists, then type the new content.
      const comment = commentBoxes.nth(i);
      await comment.click();
      await comment.fill("");
      await comment.fill(criterion.comment);
    }

    // The form rejects comments that are too short for the chosen rating
    // ("Rating N requires at least M words"). Fail fast if any remain so the
    // form is guaranteed to be valid and submittable.
    const wordError = this.page.getByText(/requires at least \d+ words/i);
    await expect(
      wordError,
      `Section "${section.name}" still has a minimum-word-count validation error; ` +
        `lengthen the affected comment(s) in selfRatingData.`
    ).toHaveCount(0);
  }

  /** Advance to the next section. */
  async clickNext(): Promise<void> {
    const next = this.page.getByRole("button", { name: "Next", exact: true });
    await expect(next).toBeEnabled();
    await next.click();
  }

  /** Read the current section heading (Capability, Creativity, ...). */
  async getCurrentSectionName(): Promise<string> {
    return (
      (await this.page.locator("h5").first().textContent())?.trim() ?? ""
    );
  }

  /** The Submit button (only present on the rating form). */
  submitButton(): Locator {
    return this.page.getByRole("button", { name: "Submit", exact: true });
  }

  /** Submit the appraisal. Only call this when submission is intended. */
  async submit(): Promise<void> {
    const submit = this.submitButton();
    await expect(submit).toBeVisible();
    await submit.click();
  }
}
