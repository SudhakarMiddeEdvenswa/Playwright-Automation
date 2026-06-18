You are a Playwright automation assistant. Create a complete Playwright script for validating the EMPORTAL employee Dashboard.

Requirements:

1. Open the application URL from the environment configuration:
   BASE_URL (e.g. https://edvenswatech.emportal.me/admin)

2. Login using credentials read from the environment (never hardcode them):
   Username: ${USER}      // from the .env file
   Password: ${PASSWORD}  // from the .env file
  - Enter the username and password in the respective fields.
  - Click the login button to access the dashboard.

3. After login:

- Navigate to the "Dashboard" menu/navigation link.

4. Validate the following details on the dashboard:

- Select the "Overview" tab/module.
- Validate the Total tasks count and Completed tasks count displayed on the dashboard.
- Validate the Task distribution chart is displayed correctly with appropriate labels and values.

- Select the "Tasks" tab/module.
- Validate the Allocated and Worked bar chart displayed with correct details.
- Validate the filtering and sorting functionality of the tasks list.

- Select the "Ratings" tab/module.
- Validate the self-rating period selection functionality and ensure the correct period is displayed.
- Validate the overall layout and responsiveness of the dashboard across different screen sizes.
- Validate the Total Ratings count and Average Rating displayed on the dashboard along with Completed and Pending ratings count.
- Validate the Search box functionality for searching specific tasks or ratings on the dashboard.
- Validate the Export functionality for exporting dashboard data in CSV or Excel format.
- Validate the presence of any error messages or alerts when there are issues with loading or displaying dashboard data.
- Validate All Status dropdown options and their functionality in the dashboard.
- Also Validate Apply Date ranges functionality like Start Date and End Date in the dashboard.

- Select the "Timesheets" tab/module.
- Validate the timesheet entries displayed with correct details and formatting like Project Worked Hours by applying Filters and sorting options and Search Filter by Project.
- Validate the Total Worked Hours count, Avg/Week hours count, Project Worked Hours count and Active Days Count in Project displayed on the dashboard.
- Validate the Bar chart displaying Worked Hours by Project and Worked Hours by Week with correct details and labels.
- Validate the Scroll to explore functionality for Daily & Weekly views.
- Validate the Project Table with Project breakdown, Week, Total Hours & Status columns and their details.

- Select the "Worked Hours" tab/module.
- Validate the Total Worked Hours count, Avg/Week hours count, Project Worked Hours count and Active Days Count in Project displayed on the dashboard.
- Validate the Bar chart displaying Worked Hours by Project and Worked Hours by Week with correct details and labels.
- Validate the Scroll to explore functionality for Daily & Weekly views.
- Validate the Search box functionality for searching specific Project worked hours entries on the dashboard by applying filters and sorting options like ACTIVE and INACTIVE.
- Validate the Export functionality for exporting worked hours data in CSV or Excel format.

5. Validate Profile tab on Dashboard with following details:
-  Select the "UserInfo" tab/button.
- Validate the user details displayed with correct information and formatting like Email, Name, Role, Member since, etc

-  Select the "Employee Time" tab/button.
- Validate the Employee Time details displayed with correct information and formatting like Total Worked Hours, Avg/Week hours, Project Worked Hours, Active Days Count in Project, etc.

-  Select the "Projects" tab/button.
- Validate the Projects details displayed with correct information and formatting like Project Active/Inactive status dropdown options, also Assigned Project and Resumed Project details by Clicking Adding External Project details.
- Validate the functionality of Adding External Project details by entering Project Name, Client Name, Role,Start Date, End Date, and clicking the Add button and Cancel button.
- Validate the Resume Projects section and the presence of the Resume button for inactive projects WITHOUT triggering it (clicking Resume mutates production data). Only perform the actual Resume action (and assert the status change to active) in a non-production environment that is safe to mutate.


Additional Requirements:

- Use Playwright best practices.
- Use robust locators.
- Add proper waits where required.
- Handle dropdowns, textareas, date pickers, and save/submit actions.
- Add comments throughout the code.
- Take screenshots after submission.
- Use async/await syntax.
- If any field already contains values, clear and replace them.
- Add try/catch blocks for better debugging.
- Do not hardcode fragile selectors if avoidable.
- Generate production-quality automation code.
- Ensure the script can be easily maintained and updated for future changes in the application.
