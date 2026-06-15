import { test } from "@playwright/test";

/**
 * Manager/appraiser rating flow (rating another associate, e.g. associate ID
 * 2214) for EmPortal 2.0.
 *
 * SKIPPED: in EmPortal 2.0 the legacy "Ratings -> User Ratings -> associate row"
 * navigation no longer exists, and rating another associate requires a
 * manager/appraiser account. The current automation account (role "User") only
 * has access to its own self-appraisal at /admin/my-ratings, which is covered by
 * `emportal_SelfRatingSubmitTest.spec.ts` (see SelfRatingPage).
 *
 * To re-enable: run with a manager account, capture the EmPortal 2.0 team/
 * appraisal-rating locators, update RatingsPage.ts accordingly, then implement
 * the flow here mirroring the self-rating page object.
 */
test.skip("Manager rates an associate (EmPortal 2.0 - needs appraiser account)", async () => {
  // Intentionally skipped - see file header.
});
