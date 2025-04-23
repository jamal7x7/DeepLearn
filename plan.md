
🧠 PHASE 1: Scaffold & Base Setup

🧩 Goal:

Set up the workspace, base app, layout, and dependencies.

✅ Actions:
	•	Init pnpm monorepo with apps/web, packages/ui, packages/db
	•	Set up Next.js 15 App Router in apps/web
	•	Install:
	•	tailwindcss@^4
	•	shadcn/ui
	•	betterauth@1.2.7
	•	zustand
	•	drizzle-orm, @pg
	•	Configure tailwind.config.ts with shadcn preset
	•	Create layout.tsx with:
	•	Sidebar (Dashboard, Classes, etc.)
	•	Topbar (theme toggle, profile menu, notifications)
	•	Add responsive <Sidebar /> and <Topbar /> components using shadcn/ui

📦 Output:
	•	Monorepo ready
	•	Authless shell app with sidebar/topbar layout

⸻

🔐 PHASE 2: Authentication

🧩 Goal:

Implement auth system with BetterAuth.

✅ Actions:
	•	Set up BetterAuth config for:
	•	Credentials login/signup
	•	Google, GitHub, Apple, Facebook providers
	•	Add routes /login, /register
	•	Create auth middleware to redirect guests
	•	Use auth() helper for route-level protection
	•	Seed users in DB (admin, student, teacher)

📦 Output:
	•	Fully functional login/signup w/ OAuth & credentials
	•	Protected pages (dashboard, classes, etc.)

⸻

📚 PHASE 3: Classes Module

🧩 Goal:

Build CRUD for class management

✅ Actions:
	•	Create classes table in Drizzle
	•	Scaffold /classes page
	•	Table: Name, Subject, Teacher, Schedule
	•	Add/EditClassModal w/ Zustand store
	•	Add useClassStore (Zustand)
	•	Implement server actions to create/update/delete classes

📦 Output:
	•	Admins/teachers can view and manage classes

⸻

👥 PHASE 4: Students

🧩 Goal:

Manage students and class assignment

✅ Actions:
	•	Create students table in Drizzle
	•	Build /students table with Name, Email, Class
	•	Add AssignClassModal to connect students to classes
	•	Sync Zustand store for student updates

📦 Output:
	•	View and assign students to classes

⸻

🧠 PHASE 5: MDX Courses

🧩 Goal:

Notion-style MDX editor and course management

✅ Actions:
	•	Create courses table (title, content: string)
	•	Build /courses page:
	•	Sidebar file tree (course folders/files)
	•	MDX editor: markdown input + preview
	•	Toolbar: headers, bold, italic, code, image, etc.
	•	Zustand: useCourseStore
	•	Server actions for saving MDX content

📦 Output:
	•	Markdown-based rich course creation and editing

⸻

📝 PHASE 6: Assignments

🧩 Goal:

CRUD for assignments per class

✅ Actions:
	•	Create assignments table (title, dueDate, classId)
	•	List assignments per class
	•	Modal for add/edit assignment
	•	Inline or modal editing

📦 Output:
	•	Assignments viewable/editable per class

⸻

🎓 PHASE 7: Grades System

🧩 Goal:

Manage student grades with grading types

✅ Actions:
	•	Create grades table with studentId, classId, assignmentId, grade, gradingType, status
	•	View: student, class, grade, status
	•	Inline editing w/ formatting logic
	•	Badge display: passed, late, incomplete
	•	Auto-percent calculator

📦 Output:
	•	Fully featured grading system with smart input

⸻

🗃 PHASE 8: Data Modeling & Seeding

🧩 Goal:

Setup all relations and mock data

✅ Actions:
	•	Define relations in Drizzle (relations() helper)
	•	Seed data: 2 teachers, 5 students, 3 classes, 2 courses, 5 assignments, 10 grades

📦 Output:
	•	App is populated with meaningful sample data

⸻

⚙️ PHASE 9: Final Polish

✅ Actions:
	•	Audit accessibility and responsive behavior
	•	Add loading/skeleton states where needed
	•	Polish UI consistency with shadcn tokens
	•	Add error boundaries and 404 pages

