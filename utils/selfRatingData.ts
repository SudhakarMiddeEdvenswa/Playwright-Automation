// Data for the EMPORTAL self-rating (PERF Rating Sheet) automation.
//
// NOTE on star values: the EmPortal rating widget only accepts ratings in
// 0.5-star increments (0.5, 1, 1.5, ... 4, 4.5, 5). The original prompt asked
// for values like 4.2 / 4.7 / 4.8 which are NOT selectable, so they are mapped
// to the nearest valid steps (4, 4.5, 5) while keeping realistic variation and
// avoiding the exact same rating everywhere (prompt requirement).
//
// NOTE on comment length: EmPortal enforces a minimum word count per comment
// based on the rating ("Rating N requires at least M words"):
//   - rating <= 4   -> at least 10 words
//   - rating 4.5/5  -> at least 20 words
// All comments below are written to comfortably exceed these minimums so the
// form is valid and submittable. `minWordsForStars` encodes the rule and is used
// by the spec to assert each comment is long enough before interacting.

/** Minimum words EmPortal requires for a comment given its star value. */
export function minWordsForStars(stars: string): number {
  return Number(stars) >= 4.5 ? 20 : 10;
}

/** Count whitespace-delimited words in a comment. */
export function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export interface RatingCriterion {
  /** Criterion title exactly as shown in the UI accordion header. */
  title: string;
  /** Star value as a string matching the radio input value: "4", "4.5", "5". */
  stars: string;
  /** Professional comment for this criterion. */
  comment: string;
}

export interface RatingSection {
  /** Section heading shown above the accordions (Capability, Creativity, ...). */
  name: string;
  criteria: RatingCriterion[];
}

// The self-appraisal period to target. EmPortal 2.0 lists periods on the
// /admin/my-ratings page; each row shows a "DD/MM/YYYY - DD/MM/YYYY" range and
// an action button (Start / Continue). `periodStart` matches the start of the
// range used to find and open the right row.
export const selfRatingPeriod = {
  // Start date of the period row to open, formatted DD/MM/YYYY as shown in the UI.
  periodStart: process.env.RATING_START_DATE || "01/06/2026",
};

// Whether to actually submit the rating. Submitting permanently records the
// self-appraisal, so it is OFF by default. Enable with SUBMIT_RATING=true.
export const submitRating =
  (process.env.SUBMIT_RATING || "").toLowerCase() === "true";

export const selfRatingSections: RatingSection[] = [
  {
    name: "Capability",
    criteria: [
      {
        title: "Execution Efficiency",
        stars: "4.5",
        comment:
          "Always executing and completing assigned tasks on time without delays or latency, while prioritizing work effectively based on changing requirements and sprint priorities to consistently meet committed delivery timelines.",
      },
      {
        title: "Quality of Output",
        stars: "5",
        comment:
          "Always delivering high-quality, well-tested work and ensuring that all assigned tasks are completed thoroughly within the sprint timelines, with strong attention to detail, accuracy, and maintainable, reusable automation.",
      },
      {
        title: "Accountability and Ownership",
        stars: "4.5",
        comment:
          "Maintaining proactive communication with stakeholders, providing regular updates and follow-ups, taking complete ownership of deliverables, and reaching out whenever requirements are unclear to ensure timely and reliable completion.",
      },
    ],
  },
  {
    name: "Creativity",
    criteria: [
      {
        title: "Originality",
        stars: "4",
        comment:
          "Demonstrates originality by applying creative thinking to solve problems and improve existing processes, while remaining open and adaptable to new ideas and approaches.",
      },
      {
        title: "Alignment",
        stars: "4.5",
        comment:
          "Sets quarterly goals aligned with client and project requirements in close coordination with onsite project managers, and consistently ensures that innovative ideas align with broader organizational objectives.",
      },
      {
        title: "Complexity and Effort",
        stars: "5",
        comment:
          "Plans effectively for new and complex tasks by carefully estimating resource requirements, dependencies, and realistic timelines, ensuring successful completion even for challenging and high-effort initiatives.",
      },
    ],
  },
  {
    name: "Collaboration",
    criteria: [
      {
        title: "Team Contribution",
        stars: "4.5",
        comment:
          "Actively supports team members through knowledge sharing, troubleshooting assistance, and hands-on guidance, especially in automation-related activities, helping the wider team progress smoothly and resolve blockers quickly.",
      },
      {
        title: "Adaptability & Flexibility",
        stars: "5",
        comment:
          "Remains flexible and composed while handling high-priority and time-sensitive tasks, readily adjusting to shifting schedules and workloads, and ensuring full accountability and ownership until each task is completed.",
      },
      {
        title: "Relationship Building",
        stars: "4.5",
        comment:
          "Maintains respectful and open communication, encourages constructive discussions, listens to differing perspectives, and helps resolve conflicts professionally and empathetically to foster a positive and collaborative work environment.",
      },
    ],
  },
  {
    name: "Compliance",
    criteria: [
      {
        title: "Awareness",
        stars: "4.5",
        comment:
          "Follows organizational policies, procedures, and compliance expectations diligently, maintains strong punctuality, and keeps proactive communication regarding any delays while encouraging compliance awareness among peers across the team.",
      },
      {
        title: "Adherence",
        stars: "4",
        comment:
          "Consistently follows established processes, timelines, and compliance standards, while identifying and resolving compliance-related issues promptly and proactively.",
      },
      {
        title: "Accuracy and Integrity of Records",
        stars: "5",
        comment:
          "Maintains accurate, complete, and up-to-date documentation and records aligned with audit, regulatory, and organizational standards, proactively monitoring for changes and making timely updates to support ongoing compliance.",
      },
    ],
  },
  {
    name: "Customer",
    criteria: [
      {
        title: "Convenience",
        stars: "4.5",
        comment:
          "Focuses on clearly understanding customer requirements and delivering efficiently with ease, while coordinating closely with the respective POCs to fulfill commitments and consistently exceed customer expectations.",
      },
      {
        title: "Value Creation",
        stars: "5",
        comment:
          "Continuously learning AI tools, prompt engineering, Selenium with Python, and Playwright, while also pursuing the Cribl Admin - Edge certification and having implemented EmPortal automation to support and accelerate the team.",
      },
      {
        title: "Cost Optimization",
        stars: "4.5",
        comment:
          "Contributed significantly toward cost optimization initiatives by improving automation efficiency and reducing manual effort, and continues actively supporting the organization's broader efficiency and cost-improvement goals.",
      },
      {
        title: "Brand Promotion",
        stars: "4.5",
        comment:
          "Actively contributed toward brand promotion initiatives through quality deliverables and professional engagement, and continues supporting the organization's brand-building efforts with consistent and reliable contributions.",
      },
    ],
  },
];

// AI usage details from the prompt. These are captured at the submit/confirmation
// step of the appraisal (which is gated behind `submitRating`), not within the
// five rating sections above.
export const aiUsageData = {
  usingAI: "Yes",
  toolsUsed:
    "Claude, Google Gemini, Microsoft Copilot, GitHub Copilot, Loom AI, Google Workspace AI, Grammarly AI, JetBrains AI, ChatGPT, NotebookLM by Google.",
  whereAndHow:
    "Using AI tools for Jira ticket analysis, summarization, manual test case preparation, PPT creation for client visits, demos, and productivity improvements.",
  role: "Senior QA",
};
