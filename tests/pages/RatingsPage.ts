import { Page } from "@playwright/test";
// This file defines the RatingsPage class for interacting with the ratings page of the application.
export class RatingsPage {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }
  // Navigate to Ratings
  async navigateToRatings() {
    await this.page.getByRole("button", { name: "Ratings" }).isVisible();
    await this.page.getByRole("button", { name: "Ratings" }).click();
  }
  // Click the Associate Name link
  async clickAssociateName(associateId: string) {
    await this.page
      .getByRole("row", { name: `${associateId} User Overview Click on` })
      .getByLabel("User Overview")
      .isVisible();
    await this.page
      .getByRole("row", { name: `${associateId} User Overview Click on` })
      .getByLabel("User Overview")
      .click();
  }
  // Fill in Capability task details
  async fillCapabilityTaskDetails(
    eeDescription: string,
    eeStars: string,
    qoDescription: string,
    qoStars: string,
    accountAndOwnerDescription: string,
    accountAndOwnerStars: string
  ) {
    await this.page
      .getByRole("button", { name: "Execution Efficiency 0.5" })
      .click();
    // await this.page
    //   .getByRole("button", {
    //     name: `Execution Efficiency 0.5 Stars ${eeStars} Star ${
    //       eeStars === "1" ? "" : "s"
    //     }`,
    //   })
    //   .click();
    await this.page
      .getByRole("textbox", { name: "Enter your comments..." })
      .clear();
    await this.page
      .getByRole("textbox", { name: "Enter your comments..." })
      .fill(eeDescription);
    await this.page
      .getByRole("button", { name: "Quality of Output 0.5" })
      .click();
    // await this.page
    //   .getByRole("button", { name: "Quality of Output 0.5 Stars 1" })
    //   .click();
    await this.page
      .getByRole("button", {
        name: `Quality of Output 0.5 Stars ${qoStars} Star ${
          qoStars === "1" ? "" : "s"
        }`,
      })
      .click();
    await this.page
      .getByRole("textbox", { name: "Enter your comments..." })
      .clear();
    await this.page
      .getByRole("textbox", { name: "Enter your comments..." })
      .fill(qoDescription);
    // await this.page
    //   .getByRole("button", { name: "Accountability and Ownership" })
    //   .click();
    await this.page
      .getByRole("button", {
        name: `Accountability and Ownership 0.5 Star ${
          qoStars === "1" ? "" : "s"
        }`,
      })
      .click();
    await this.page
      .getByRole("button", {
        name: `Accountability and Ownership 0.5 Stars ${accountAndOwnerStars} Star ${
          accountAndOwnerStars === "1" ? "" : "s"
        }`,
      })
      .click();
    await this.page
      .getByRole("textbox", { name: "Enter your comments..." })
      .clear();
    await this.page
      .getByRole("textbox", { name: "Enter your comments..." })
      .fill(accountAndOwnerDescription);
    //await this.page.getByRole("button", { name: "Next" }).click();
  }
  // Fill in Creativity task details
  async fillCreativityTaskDetails(
    originalityDescription: string,
    orgStars: string,
    alignmentDescription: string,
    alignmentStars: string,
    complexityAndEffortDescription: string,
    complexityAndEffortStars: string
  ) {
    // await this.page
    //   .getByRole("button", { name: "Originality 0.5 Stars 1 Star" })
    //   .click();
    await this.page.getByRole("button", { name: "Originality 0.5" }).click();
    await this.page
      .getByRole("button", {
        name: `Originality 0.5 Stars ${orgStars} Star`,
      })
      .click();
    await this.page
      .getByRole("textbox", { name: "Enter your comments..." })
      .fill(originalityDescription);
    // await this.page
    //   .getByRole("button", { name: "Alignment 0.5 Stars 1 Star 1." })
    //   .click();
    //await this.page.getByRole("button", { name: "Alignment 0.5" }).click();
    await this.page
      .getByRole("button", {
        name: `Alignment 0.5 Stars ${alignmentStars} Star ${
          alignmentStars === "1." ? "" : "s"
        }`,
      })
      .click();
    await this.page
      .getByRole("textbox", { name: "Enter your comments..." })
      .fill(alignmentDescription);
    await this.page
      .getByRole("button", { name: "Complexity and Effort 0.5" })
      .click();
    // await this.page
    //   .getByRole("button", {
    //     name: `Complexity and Effort 0.5 Stars ${complexityAndEffortStars} Star ${
    //       complexityAndEffortStars === "1" ? "" : "s"
    //     }`,
    //   })
    //   .click();
    await this.page
      .getByRole("textbox", { name: "Enter your comments..." })
      .fill(complexityAndEffortDescription);
    //await this.page.getByRole("button", { name: "Next" }).click();
  }
  // Fill in Collaboration task details
  async fillCollaborationTaskDetails(
    teamContributionDescription: string,
    teamContribStars: string,
    adaptabilityAndFlexibilityDescription: string,
    adaptabilityAndFlexibilityStars: string,
    relationshipBuildingDescription: string,
    relationshipBuildingStars: string
  ) {
    // await this.page
    //   .getByRole("button", { name: "Team Contribution 0.5 Stars 1" })
    //   .click();
    // await this.page
    //   .getByRole("button", { name: "Team Contribution 0.5" })
    //   .click();
    await this.page
      .getByRole("button", {
        name: `Team Contribution 0.5 Stars ${teamContribStars} Star ${
          teamContribStars === "1" ? "" : "s"
        }`,
      })
      .click();
    await this.page
      .getByRole("textbox", { name: "Enter your comments..." })
      .fill(teamContributionDescription);
    await this.page
      .getByRole("button", { name: "Adaptability & Flexibility 0." })
      .click();
    // await this.page
    //   .getByRole("button", { name: "Adaptability and Flexibility 0.5" })
    //   .click();
    // await this.page
    //   .getByRole("button", {
    //     name: `Adaptability and Flexibility 0.5 Stars ${adaptabilityAndFlexibilityStars} Star ${
    //       adaptabilityAndFlexibilityStars === "1" ? "" : "s"
    //     }`,
    //   })
    //   .click();
    await this.page
      .getByRole("textbox", { name: "Enter your comments..." })
      .fill(adaptabilityAndFlexibilityDescription);
    await this.page
      .getByRole("button", { name: "Relationship Building 0.5" })
      .click();
    // await this.page
    //   .getByRole("button", {
    //     name: `Relationship Building 0.5 Stars ${relationshipBuildingStars} Star ${
    //       relationshipBuildingStars === "1" ? "" : "s"
    //     }`,
    //   })
    //   .click();
    await this.page
      .getByRole("textbox", { name: "Enter your comments..." })
      .fill(relationshipBuildingDescription);
    //await this.page.getByRole("button", { name: "Next" }).click();
  }
  // Fill in Compliance task details
  async fillComplianceTaskDetails(
    awarenessDescription: string,
    awarenessStars: string,
    adherenceDescription: string,
    adherenceStars: string,
    accuracyAndIntegrityOfRecordsDescription: string,
    accuracyAndIntegrityOfRecordsStars: string
  ) {
    // await this.page
    //   .getByRole("button", { name: "Awareness 0.5 Stars 1 Star 1." })
    //   .click();
    // await this.page.getByRole("button", { name: "Awareness 0.5" }).click();
    await this.page
      .getByRole("button", {
        name: `Awareness 0.5 Stars ${awarenessStars} Star ${
          awarenessStars === "1." ? "" : "s"
        }`,
      })
      .click();
    await this.page
      .getByRole("textbox", { name: "Enter your comments..." })
      .fill(awarenessDescription);
    // await this.page
    //   .getByRole("button", { name: "Adherence 0.5 Stars 1 Star 1." })
    //   .click();
    // await this.page.getByRole("button", { name: "Adherence 0.5" }).click();
    await this.page
      .getByRole("button", {
        name: `Adherence 0.5 Stars ${adherenceStars} Star ${
          adherenceStars === "1." ? "" : "s"
        }`,
      })
      .click();
    await this.page
      .getByRole("textbox", { name: "Enter your comments..." })
      .fill(adherenceDescription);
    await this.page
      .getByRole("button", { name: "Accuracy and Integrity of" })
      .click();
    // await this.page
    //   .getByRole("button", { name: "Accuracy and Integrity of Records 0.5" })
    //   .click();
    // await this.page
    //   .getByRole("button", {
    //     name: `Accuracy and Integrity of Records 0.5 Stars ${accuracyAndIntegrityOfRecordsStars} Star ${
    //       accuracyAndIntegrityOfRecordsStars === "1" ? "" : "s"
    //     }`,
    //   })
    //   .click();
    await this.page
      .getByRole("textbox", { name: "Enter your comments..." })
      .fill(accuracyAndIntegrityOfRecordsDescription);
    //await this.page.getByRole("button", { name: "Next" }).click();
  }
  // Fill in Customer task details
  async fillCustomerTaskDetails(
    convenienceDescription: string,
    convenienceStars: string,
    valueCreationDescription: string,
    valueCreationStars: string,
    costOptimizationDescription: string,
    costOptimizationStars: string,
    brandPromotionDescription: string,
    brandPromotionStars: string
  ) {
    // await this.page
    //   .getByRole("button", { name: "Convenience 0.5 Stars 1 Star" })
    //   .click();
    // await this.page.getByRole("button", { name: "Convenience 0.5" }).click();
    await this.page
      .getByRole("button", {
        name: `Convenience 0.5 Stars ${convenienceStars} Star`,
      })
      .click();
    await this.page
      .getByRole("textbox", { name: "Enter your comments..." })
      .fill(convenienceDescription);
    // await this.page
    //   .getByRole("button", { name: "Value Creation 0.5 Stars 1" })
    //   .click();
    // await this.page.getByRole("button", { name: "Value Creation 0.5" }).click();
    await this.page
      .getByRole("button", {
        name: `Value Creation 0.5 Stars ${valueCreationStars} Star ${
          valueCreationStars === "1" ? "" : "s"
        }`,
      })
      .click();
    await this.page
      .getByRole("textbox", { name: "Enter your comments..." })
      .fill(valueCreationDescription);
    // await this.page
    //   .getByRole("button", { name: "Cost Optimization 0.5 Stars 1" })
    //   .click();
    // await this.page
    //   .getByRole("button", { name: "Cost Optimization 0.5" })
    //   .click();
    await this.page
      .getByRole("button", {
        name: `Cost Optimization 0.5 Stars ${costOptimizationStars} Star ${
          costOptimizationStars === "1" ? "" : "s"
        }`,
      })
      .click();
    await this.page
      .getByRole("textbox", { name: "Enter your comments..." })
      .fill(costOptimizationDescription);
    // await this.page
    //   .getByRole("button", { name: "Brand Promotion 0.5 Stars 1" })
    //   .click();
    // await this.page
    //   .getByRole("button", { name: "Brand Promotion 0.5" })
    //   .click();
    await this.page
      .getByRole("button", {
        name: `Brand Promotion 0.5 Stars ${brandPromotionStars}`,
      })
      .click();
    await this.page
      .getByRole("textbox", { name: "Enter your comments..." })
      .fill(brandPromotionDescription);
  }

  //Assert the Rated value
  async assertRatedValue(ratedValue: string) {
    //Capture the rated value from the page
    const actualValue = await this.page.getByText("Rating :").textContent();
    //Check if the ratedValue is not same as expected value then update the tasks stars values until it matches
    const expectedValue = `${ratedValue}`; // Example expected value
    // Verify that the actual value is displayed on the page
    await this.page
      .getByText(`The total rating given is${actualValue}.`)
      .isVisible();
    if (actualValue !== expectedValue) {
      // You can add logic here to update the task stars values as needed
      await this.page
        .locator("div")
        .filter({ hasText: /^Prev$/ })
        .dblclick();
      //apply a logic to click prev until the Capability task page is visible
      while (
        !(await this.page
          .getByRole("heading", { name: "Capability" })
          .isVisible())
      ) {
        await this.page
          .locator("div")
          .filter({ hasText: /^Prev$/ })
          .click();
      }
      await this.page
        .getByRole("button", { name: "Execution Efficiency 0.5" })
        .click();
      await this.page
        .getByRole("button", { name: "Quality of Output 0.5 Stars 1" })
        .click();
      await this.page
        .getByRole("button", { name: "Accountability and Ownership" })
        .click();
      await this.page.getByRole("button", { name: "Next" }).click();
      await this.page
        .getByRole("button", { name: "Originality 0.5 Stars 1 Star" })
        .click();
      await this.page
        .getByRole("button", { name: "Alignment 0.5 Stars 1 Star 1." })
        .click();
      await this.page
        .getByRole("button", { name: "Complexity and Effort 0.5" })
        .click();
      await this.page.getByRole("button", { name: "Next" }).click();
      await this.page
        .getByRole("button", { name: "Team Contribution 0.5 Stars 1" })
        .click();
      await this.page
        .getByRole("button", { name: "Adaptability & Flexibility 0." })
        .click();
      await this.page
        .getByRole("button", { name: "Relationship Building 0.5" })
        .click();
      await this.page.getByRole("button", { name: "Next" }).click();
      await this.page
        .getByRole("button", { name: "Awareness 0.5 Stars 1 Star 1." })
        .click();
      await this.page
        .getByRole("button", { name: "Adherence 0.5 Stars 1 Star 1." })
        .click();
      await this.page
        .getByRole("button", { name: "Accuracy and Integrity of" })
        .click();
      await this.page.getByRole("button", { name: "Next" }).click();
      await this.page
        .getByRole("button", { name: "Convenience 0.5 Stars 1 Star" })
        .click();
      await this.page
        .getByRole("button", { name: "Value Creation 0.5 Stars 1" })
        .click();
      await this.page
        .getByRole("button", { name: "Cost Optimization 0.5 Stars 1" })
        .click();
      await this.page
        .getByRole("button", { name: "Brand Promotion 0.5 Stars 1" })
        .click();
    }
    await this.page.getByRole("heading", { name: ratedValue }).isVisible();
    //Apply a condition that if ratedValue is not visible throw an error
    const isVisible = await this.page
      .getByRole("heading", { name: ratedValue })
      .isVisible();
    if (!isVisible) {
      throw new Error(`Rated value ${ratedValue} is not visible on the page`);
    }
  }
  //Click Next button
  async clickNextButton() {
    await this.page.getByRole("button", { name: "Next" }).isVisible();
    await this.page.getByRole("button", { name: "Next" }).click();
  }
  // Submit the task
  async submitTask() {
    await this.page.getByRole("button", { name: "Submit" }).isVisible();
    await this.page.getByRole("button", { name: "Submit" }).click();
  }
}
