import { Page, Locator, expect } from "@playwright/test";
import dayjs from "dayjs";

/**
 * Page Object for the EmPortal 2.0 Holiday Calendar.
 *
 * The dashboard Home tab (/admin/dashboard?tab=home) has a "Holidays" widget
 * with a "View All" button that opens a "Holidays" modal. The modal has a year
 * navigator ("Previous year" / <year> / "Next year") and a list of holiday
 * cards. Each card renders as:
 *
 *   <div>                       <!-- card -->
 *     <div>                     <!-- date box -->
 *       <div>Sep</div>          <!-- month abbreviation (MMM) -->
 *       <div>14</div>           <!-- zero-padded day (DD) -->
 *     </div>
 *     <div>                     <!-- info -->
 *       <p>Ganesh Chaturthi</p> <!-- festival / occasion name -->
 *       <div><p>Monday</p><span>Hyderabad</span></div>
 *     </div>
 *   </div>
 *
 * `getHolidayName()` looks up the festival for a date so callers can build a
 * task description such as "On occasion of Ganesh Chaturthi".
 */
export class HolidaysPage {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /** The "Holidays" modal opened from the dashboard Home tab. */
  private dialog(): Locator {
    return this.page.getByRole("dialog").filter({ hasText: "Holidays" });
  }

  /** Open the Holidays modal (Home tab -> Holidays widget -> "View All"). */
  async openHolidaysDialog() {
    if (!/\/admin\/dashboard/.test(this.page.url())) {
      await this.page.goto("/admin/dashboard");
    }
    await this.page.getByRole("button", { name: "View All" }).click();
    await expect(this.dialog()).toBeVisible();
  }

  /**
   * Return the holiday/festival name for a given date from the Holiday Calendar,
   * or null if that date is not a listed holiday.
   * @param isoDate "YYYY-MM-DD", e.g. "2026-09-14".
   */
  async getHolidayName(isoDate: string): Promise<string | null> {
    const d = dayjs(isoDate);
    const monthAbbrev = d.format("MMM"); // "Sep"
    const day = d.format("DD"); // "14"
    const year = d.format("YYYY"); // "2026"

    await this.openHolidaysDialog();
    await this.selectYear(year);

    // The holiday cards load asynchronously; wait for at least one to render so
    // we don't read the dialog before its list has populated (which would make
    // the lookup spuriously return null).
    await this.dialog()
      .locator("xpath=.//p")
      .first()
      .waitFor({ state: "visible", timeout: 8000 })
      .catch(() => {});

    // Find the date box whose two child <div>s are this month + day, then read
    // the festival name: the first *direct child* <p> of the sibling info div.
    // Using a direct-child p ("/p[1]") avoids also matching the weekday <p>,
    // which is nested one level deeper.
    const festival = this.dialog().locator(
      `xpath=.//div[./div[normalize-space(.)="${monthAbbrev}"] and ` +
        `./div[normalize-space(.)="${day}"]]/following-sibling::div[1]/p[1]`
    );
    // Give the specific card a moment in case the list is still settling.
    await festival
      .first()
      .waitFor({ state: "visible", timeout: 5000 })
      .catch(() => {});

    const name = (await festival.count())
      ? ((await festival.first().textContent()) ?? "").trim()
      : null;

    await this.closeDialog();
    return name || null;
  }

  // --- Helpers ------------------------------------------------------------

  /** Step the year navigator until it shows the target year. */
  private async selectYear(year: string) {
    const yearLabel = this.dialog().getByText(/^\d{4}$/).first();
    for (let i = 0; i < 12; i++) {
      const current = ((await yearLabel.textContent()) ?? "").trim();
      if (current === year) return;
      const button =
        Number(current) < Number(year) ? "Next year" : "Previous year";
      await this.dialog().getByRole("button", { name: button }).click();
      await this.page.waitForTimeout(300);
    }
    await expect(yearLabel).toHaveText(year);
  }

  /** Close the Holidays modal. */
  private async closeDialog() {
    await this.dialog().getByRole("button", { name: "Close" }).click();
    await expect(this.dialog()).toBeHidden();
  }
}
