import { test, expect } from "@playwright/test";

test("test", async ({ page }) => {
  await page.getByRole("textbox", { name: "Email" }).dblclick();
  await page.getByRole("textbox", { name: "Email" }).click();
  await page
    .getByRole("textbox", { name: "Email" })
    .fill("sudhakar.midde@edvenswatech.com");
  await page.getByRole("textbox", { name: "Password" }).click();
  await page.getByRole("textbox", { name: "Password" }).fill("Mar09@2024");
  await page.getByRole("textbox", { name: "Captcha" }).click();
  await page.getByRole("textbox", { name: "Captcha" }).fill("mUJ5TZ");
  await page.getByRole("button", { name: "Login", exact: true }).click();
  await page.getByRole("button", { name: "Ratings" }).click();
  await page.getByText("User Ratings").click();
  await page
    .getByRole("row", { name: "2214 User Overview Click on" })
    .getByLabel("User Overview")
    .click();
  await page.getByRole("button", { name: "Execution Efficiency 0.5" }).click();
  await page.getByRole("textbox", { name: "Enter your comments..." }).click();
  await page
    .getByRole("textbox", { name: "Enter your comments..." })
    .fill("fcaascsacsacscsa");
  await page.getByRole("button", { name: "Execution Efficiency 0.5" }).click();
  await page
    .getByRole("button", { name: "Quality of Output 0.5 Stars 1" })
    .click();
  await page.getByRole("textbox", { name: "Enter your comments..." }).click();
  await page.getByRole("textbox", { name: "Enter your comments..." }).click();
  await page
    .getByRole("textbox", { name: "Enter your comments..." })
    .fill("dsfgswgdsfgbdf");
  await page
    .getByRole("button", { name: "Quality of Output 0.5 Stars 1" })
    .click();
  await page
    .getByRole("button", { name: "Accountability and Ownership" })
    .click();
  await page.getByRole("textbox", { name: "Enter your comments..." }).click();
  await page
    .getByRole("textbox", { name: "Enter your comments..." })
    .fill("gsgdsvsdvds");
  await page
    .getByRole("button", { name: "Accountability and Ownership" })
    .click();
  await page.getByRole("button", { name: "Execution Efficiency 0.5" }).click({
    modifiers: ["Alt"],
  });
  await page.getByRole("button", { name: "Execution Efficiency 0.5" }).click();
  await page.getByRole("button", { name: "Next" }).click();
  await page
    .getByRole("button", { name: "Originality 0.5 Stars 1 Star" })
    .click();
  await page
    .getByRole("button", { name: "Originality 0.5 Stars 1 Star" })
    .click();
  await page
    .getByRole("button", { name: "Originality 0.5 Stars 1 Star" })
    .click();
  await page.getByRole("textbox", { name: "Enter your comments..." }).click();
  await page.getByRole("textbox", { name: "Enter your comments..." }).click();
  await page
    .getByRole("textbox", { name: "Enter your comments..." })
    .dblclick();
  await page.getByRole("textbox", { name: "Enter your comments..." }).click();
  await page
    .getByRole("textbox", { name: "Enter your comments..." })
    .fill("gsdgsgsdg");
  await page
    .getByRole("button", { name: "Originality 0.5 Stars 1 Star" })
    .click();
  await page
    .getByRole("button", { name: "Alignment 0.5 Stars 1 Star 1." })
    .click();
  await page
    .getByRole("button", { name: "Alignment 0.5 Stars 1 Star 1." })
    .click();
  await page
    .getByRole("button", { name: "Alignment 0.5 Stars 1 Star 1." })
    .click();
  await page.getByRole("textbox", { name: "Enter your comments..." }).click();
  await page
    .getByRole("textbox", { name: "Enter your comments..." })
    .fill("dgsdgsdgdsgsgds");
  await page
    .getByRole("button", { name: "Alignment 0.5 Stars 1 Star 1." })
    .click();
  await page.getByRole("button", { name: "Complexity and Effort 0.5" }).click();
  await page
    .getByRole("textbox", { name: "Enter your comments..." })
    .dblclick();
  await page
    .getByRole("textbox", { name: "Enter your comments..." })
    .fill("rgdfgfdgdfdfdfb");
  await page.getByRole("button", { name: "Complexity and Effort 0.5" }).click();
  await page.getByRole("button", { name: "Next" }).click();
  await page
    .getByRole("button", { name: "Team Contribution 0.5 Stars 1" })
    .click();
  await page.getByRole("textbox", { name: "Enter your comments..." }).click();
  await page
    .getByRole("textbox", { name: "Enter your comments..." })
    .fill("xvsdvsdvsdsdfbfsb");
  await page
    .getByRole("button", { name: "Team Contribution 0.5 Stars 1" })
    .click();
  await page
    .getByRole("button", { name: "Adaptability & Flexibility 0." })
    .click();
  await page
    .locator(
      ".MuiCollapse-root.MuiCollapse-vertical.MuiCollapse-entered > div > div > div > div > .MuiGrid-root.MuiGrid-container.MuiGrid-spacing-xs-1.css-m43vlk > .MuiGrid-root.MuiGrid-item.MuiGrid-grid-xs-12.css-19m32cg > span > .MuiFormControl-root > .MuiInputBase-root"
    )
    .click();
  await page
    .getByRole("textbox", { name: "Enter your comments..." })
    .fill("gsbdfhdfhnddtnfd");
  await page
    .getByRole("button", { name: "Adaptability & Flexibility 0." })
    .click();
  await page.getByRole("button", { name: "Relationship Building 0.5" }).click();
  await page
    .locator(
      ".MuiCollapse-root.MuiCollapse-vertical.MuiCollapse-entered > div > div > div > div > .MuiGrid-root.MuiGrid-container.MuiGrid-spacing-xs-1.css-m43vlk > .MuiGrid-root.MuiGrid-item.MuiGrid-grid-xs-12.css-19m32cg > span > .MuiFormControl-root > .MuiInputBase-root"
    )
    .click();
  await page
    .getByRole("textbox", { name: "Enter your comments..." })
    .fill("vdfgfhfdhdjngnj");
  await page.getByRole("button", { name: "Relationship Building 0.5" }).click();
  await page.getByRole("button", { name: "Next" }).click();
  await page
    .getByRole("button", { name: "Awareness 0.5 Stars 1 Star 1." })
    .click();
  await page
    .getByRole("textbox", { name: "Enter your comments..." })
    .dblclick();
  await page
    .getByRole("textbox", { name: "Enter your comments..." })
    .fill("vsdgsfsfhwrhrwh");
  await page
    .getByRole("button", { name: "Awareness 0.5 Stars 1 Star 1." })
    .click();
  await page
    .getByRole("button", { name: "Adherence 0.5 Stars 1 Star 1." })
    .click();
  await page
    .getByRole("button", { name: "Adherence 0.5 Stars 1 Star 1." })
    .click();
  await page
    .getByRole("button", { name: "Adherence 0.5 Stars 1 Star 1." })
    .click();
  await page
    .getByRole("textbox", { name: "Enter your comments..." })
    .dblclick();
  await page
    .getByRole("textbox", { name: "Enter your comments..." })
    .fill("fgsgbsfbsfbsfbsfbsfb");
  await page
    .getByRole("button", { name: "Adherence 0.5 Stars 1 Star 1." })
    .click();
  await page.getByRole("button", { name: "Accuracy and Integrity of" }).click();
  await page
    .getByRole("textbox", { name: "Enter your comments..." })
    .dblclick();
  await page
    .getByRole("textbox", { name: "Enter your comments..." })
    .fill("dghshwghwegwetgwefw");
  await page.getByRole("button", { name: "Accuracy and Integrity of" }).click();
  await page.getByRole("button", { name: "Next" }).click();
  await page
    .getByRole("button", { name: "Convenience 0.5 Stars 1 Star" })
    .click();
  await page
    .getByRole("textbox", { name: "Enter your comments..." })
    .dblclick();
  await page
    .getByRole("textbox", { name: "Enter your comments..." })
    .fill("dfhreherherherherger");
  await page
    .getByRole("button", { name: "Convenience 0.5 Stars 1 Star" })
    .click();
  await page
    .getByRole("button", { name: "Value Creation 0.5 Stars 1" })
    .click();
  await page.getByRole("textbox", { name: "Enter your comments..." }).click();
  await page
    .getByRole("textbox", { name: "Enter your comments..." })
    .fill("fgshsfndfnfgngnfg");
  await page
    .getByRole("button", { name: "Value Creation 0.5 Stars 1" })
    .click();
  await page
    .getByRole("button", { name: "Cost Optimization 0.5 Stars 1" })
    .click();
  await page.getByRole("textbox", { name: "Enter your comments..." }).click();
  await page
    .getByRole("textbox", { name: "Enter your comments..." })
    .fill("fhfhdhrthjrthrthrth");
  await page
    .getByRole("button", { name: "Cost Optimization 0.5 Stars 1" })
    .click();
  await page
    .getByRole("button", { name: "Brand Promotion 0.5 Stars 1" })
    .click();
  await page
    .getByRole("textbox", { name: "Enter your comments..." })
    .dblclick();
  await page
    .getByRole("textbox", { name: "Enter your comments..." })
    .fill("bdherherherhergerge");
  await page
    .getByRole("button", { name: "Brand Promotion 0.5 Stars 1" })
    .click();
  await page.getByRole("button", { name: "Submit" }).click();

  await page.getByText("Rating :").click();
  await page.getByRole("button", { name: "Submit" }).click();
  await page.getByRole("button", { name: "cancel" }).click();
  await page.getByRole("button", { name: "Submit" }).click();
  await page.getByRole("button", { name: "Ok" }).click();
  await page.getByText("The total rating given is4.").click();
  await page.getByRole("heading", { name: "4.72" }).click();
  await page.getByRole("button", { name: "cancel" }).click();
  await page.getByText("Rating :").click();
  await page
    .locator("div")
    .filter({ hasText: /^Prev$/ })
    .click();
  await page
    .locator("div")
    .filter({ hasText: /^Prev$/ })
    .click();
  await page.getByRole("heading", { name: "Capability" }).click();

  await page.getByRole("button", { name: "Next" }).click();
  await page.getByRole("button", { name: "Next" }).click();
  await page.getByRole("button", { name: "Next" }).click();
  await page.getByText("Rating :").click();
  await page
    .getByRole("button", { name: "Convenience 0.5 Stars 1 Star" })
    .click();
  await page
    .getByRole("button", { name: "Value Creation 0.5 Stars 1" })
    .click();

  await page
    .getByRole("button", { name: "Cost Optimization 0.5 Stars 1" })
    .click();
  await page
    .getByRole("button", { name: "Brand Promotion 0.5 Stars 1" })
    .click();
  await page.getByRole("button", { name: "Prev", exact: true }).click();
  await page.getByRole("button", { name: "Prev" }).click();
  await page.getByRole("button", { name: "Prev" }).click();
  await page.getByRole("button", { name: "Prev" }).click();
  await page.getByRole("button", { name: "Prev" }).click();

  await page.getByRole("button", { name: "Execution Efficiency 0.5" }).click();
  await page
    .getByRole("button", { name: "Quality of Output 0.5 Stars 1" })
    .click();
  await page
    .getByRole("button", { name: "Accountability and Ownership" })
    .click();
  await page.getByRole("button", { name: "Next" }).click();
  await page
    .getByRole("button", { name: "Originality 0.5 Stars 1 Star" })
    .click();
  await page
    .getByRole("button", { name: "Alignment 0.5 Stars 1 Star 1." })
    .click();
  await page.getByRole("button", { name: "Complexity and Effort 0.5" }).click();
  await page.getByRole("button", { name: "Next" }).click();
  await page
    .getByRole("button", { name: "Team Contribution 0.5 Stars 1" })
    .click();
  await page
    .getByRole("button", { name: "Adaptability & Flexibility 0." })
    .click();
  await page.getByRole("button", { name: "Relationship Building 0.5" }).click();
  await page.getByRole("button", { name: "Next" }).click();
  await page
    .getByRole("button", { name: "Awareness 0.5 Stars 1 Star 1." })
    .click();
  await page
    .getByRole("button", { name: "Adherence 0.5 Stars 1 Star 1." })
    .click();
  await page.getByRole("button", { name: "Accuracy and Integrity of" }).click();
  await page.getByRole("button", { name: "Next" }).click();
  await page
    .getByRole("button", { name: "Convenience 0.5 Stars 1 Star" })
    .click();
  await page
    .getByRole("button", { name: "Value Creation 0.5 Stars 1" })
    .click();
  await page
    .getByRole("button", { name: "Cost Optimization 0.5 Stars 1" })
    .click();
  await page
    .getByRole("button", { name: "Brand Promotion 0.5 Stars 1" })
    .click();
});
