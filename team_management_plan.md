# Plan: Improve Team Management and Invitation Codes UI/UX

This plan outlines the steps to enhance the user experience for managing teams and invitation codes, based on user feedback.

**Goals:**

1.  Provide a dedicated page for teachers to view their teams and create new ones.
2.  Allow teachers to select a specific team context when managing invitation codes.
3.  Retain the ability to create a team implicitly when generating an invitation code for a new team name.

**Revised Plan Details:**

1.  **Create New Team Management Page (`/dashboard/teams/page.tsx`):**
    *   **Purpose:** A central location for teachers to view and add teams.
    *   **Functionality:**
        *   Fetch and display a list of all teams the teacher belongs to (using the `/api/manage-users/teams` endpoint).
        *   Include an "Add New Team" section:
            *   Input field for "New Team Name".
            *   "Create Team" button.
    *   **Backend:**
        *   Implement a new server action (`createTeamAction` likely in `app/actions/team.ts` or similar).
        *   This action will take the team name and user ID, create the team, and add the user as a "teacher".
    *   **UI Updates:** Refresh the team list upon successful creation.

2.  **Refactor Invitation Codes Page (`/dashboard/invitation-codes/page.tsx`):**
    *   **Purpose:** Manage invitation codes within the context of a specific team, while still allowing implicit team creation.
    *   **Functionality:**
        *   Add a `Select` component (Team Selector) near the top of the page.
        *   Populate the selector by fetching the teacher's teams (`/api/manage-users/teams`).
        *   Filter the "Active Invitation Codes" list based on the `selectedTeam.id` from the selector.
        *   Keep the "Generate New Invitation Code" form as is (with the "Team Name" input). The existing backend action handles finding or creating the team.
    *   **UI Updates:** Ensure the Team Selector is updated if a new team is created via the "Generate Code" form.

**Visual Plan (Mermaid Diagram):**

```mermaid
graph TD
    subgraph "Invitation Codes Page (`/dashboard/invitation-codes`)"
        direction TB
        S[Team Selector (Select Component)] --> G["Generate Code (Finds/Creates Team by Name)"];
        S --> V["View/Manage Active Codes (for Selected Team)"];
    end

    subgraph "New Teams Page (`/dashboard/teams`)"
        direction TB
        L[List of Teacher's Teams]
        A[Add New Team Form] --> B[Create Team Button];
    end

    S -- Fetches --> D(Teacher's Teams API);
    L -- Fetches --> D;
    G -- Calls --> GA(generateInvitationCode Action - Creates Team if needed);
    V -- Fetches --> CA(Invitation Codes API - Filtered);
    B -- Calls --> TA(createTeamAction);
    TA -- Updates --> DB[(Database: teams, teamMembers)];
    GA -- Updates --> DB;
    TA -- Success --> L; # Refresh List
    GA -- Success --> S; # Refresh Selector
```

**Next Steps:**

*   Implement the changes outlined above, starting with the new `/dashboard/teams` page and the necessary server action.
*   Refactor the `/dashboard/invitation-codes` page to include the team selector and filtering logic.