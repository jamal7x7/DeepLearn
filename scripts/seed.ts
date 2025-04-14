import { db } from '../lib/db/drizzle'; // Adjust path if needed
import { users, teams, teamMembers } from '../lib/db/schema'; // Adjust path if needed
// Import all relevant tables for deletion
import { announcements, announcementRecipients, activityLogs } from '../lib/db/schema';
import { faker as baseFaker } from '@faker-js/faker';
import { Faker } from '@faker-js/faker';
// Try to import Arabic locale, fallback to hardcoded names if not available
// (removed ar_MA import)
let arabicFaker: Faker | null = null;
try {
  // @ts-ignore
  const { ar } = require('@faker-js/faker/locale/ar');
  arabicFaker = new Faker({ locale: [ar] });
} catch (e) {
  arabicFaker = null;
}
const arabicNames = [
  "Mohamed Alaoui", "Said Benani", "Fatima Zahra", "Khadija Idrissi", "Youssef Amine",
  "Hicham Bouzid", "Salma Chafai", "Abdellah Naciri", "Meryem El Aaroui", "Yassine Barada",
  "Amina Benjelloun", "Hassan Tazi", "Leila Saadi", "Hamza Belmekki", "Zineb El Aaroui",
  "Omar El Fassi", "Nadia Bennis", "Karim El Mansouri", "Samira El Ghazali", "Rachid El Idrissi",
  "Imane El Khatib", "Younes El Amrani", "Sara El Yacoubi", "Mounir El Hachimi", "Latifa El Fadili",
  "Nabil El Malki", "Rania El Gharbi", "Tarik El Moutawakkil", "Soukaina El Fassi", "Jalil El Amrani"
];

import bcrypt from 'bcryptjs'; // Use bcryptjs

const SALT_ROUNDS = 10; // For bcrypt hashing

async function seedDatabase() {
  console.log('Seeding database...');

  try {
    // Wipe all data in correct order (child tables first)
    console.log('Wiping all existing data...');
    await db.delete(announcementRecipients);
    await db.delete(announcements);
    await db.delete(teamMembers);
    await db.delete(activityLogs); // Delete activity logs before users
    await db.delete(users);
    await db.delete(teams);
    console.log('All data wiped. Proceeding with seeding...');
    // Clear existing data (optional, use with caution!)
    // console.log('Clearing existing data...');
    // await db.delete(teamMembers);
    // await db.delete(users);
    // await db.delete(teams);

    // --- Create Teams (skip if exists) ---
    console.log('Creating teams...');
    const teamNames = ['Math Wizards', 'Science Explorers', 'History Buffs'];
    const createdTeams = [];
    for (const name of teamNames) {
      const { eq } = await import('drizzle-orm');
      const existing = await db.select().from(teams).where(eq(teams.name, name)).limit(1);
      if (existing.length > 0) {
        createdTeams.push({ id: existing[0].id, name: existing[0].name });
      } else {
        const [inserted] = await db.insert(teams).values({ name }).returning({ id: teams.id, name: teams.name });
        createdTeams.push(inserted);
      }
    }
    console.log(`Teams in DB: ${createdTeams.map(t => t.name).join(', ')}`);

    // --- Create Users (Teachers & Students) ---
    console.log('Creating users...');
    const usersToCreate = [];
    const hashedPassword = await bcrypt.hash('password123', SALT_ROUNDS); // Use a common password for simplicity

    // Helper to check if user exists by email
    async function userExists(email: string) {
      const { eq } = await import('drizzle-orm');
      const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
      return existing.length > 0 ? existing[0] : null;
    }

    // Teachers
    const teacherEmails = [`teacher1@example.com`, `teacher2@example.com`];
    for (const email of teacherEmails) {
      const existing = await userExists(email);
      if (!existing) {
        usersToCreate.push({
          name: baseFaker.person.fullName(),
          email,
          passwordHash: hashedPassword,
          role: 'teacher',
        });
      }
    }

    // Students
    // Use Arabic (Moroccan) names for students
    const totalStudents = 90;
    for (let i = 1; i <= totalStudents; i++) {
      const email = `student${i}@example.com`;
      const existing = await userExists(email);
      if (!existing) {
        usersToCreate.push({
          name: arabicNames[(i - 1) % arabicNames.length],
          email,
          passwordHash: hashedPassword,
          role: 'student',
        });
      }
    }

    let createdUsers: { id: number; email: string; role: string }[] = [];
    if (usersToCreate.length > 0) {
      createdUsers = await db.insert(users).values(usersToCreate).returning({
        id: users.id,
        email: users.email,
        role: users.role
      });
      console.log(`Created ${createdUsers.length} new users.`);
    } else {
      console.log('No new users to create (all exist).');
    }

    // Fetch all users (existing + newly created)
    const allUsers = await db.select().from(users);

    // --- Assign Users to Teams ---
    console.log('Assigning users to teams...');
    const teamMembersToCreate: { userId: number; teamId: number; role: string }[] = [];
    const teacher1 = allUsers.find(u => u.email === 'teacher1@example.com');
    const teacher2 = allUsers.find(u => u.email === 'teacher2@example.com');
    const mathTeam = createdTeams.find(t => t.name === 'Math Wizards');
    const scienceTeam = createdTeams.find(t => t.name === 'Science Explorers');
    const historyTeam = createdTeams.find(t => t.name === 'History Buffs'); // Teacherless team for testing

    if (!teacher1 || !teacher2 || !mathTeam || !scienceTeam || !historyTeam) {
        throw new Error("Failed to find required teachers or teams after creation.");
    }

    // Assign Teacher 1 to Math Wizards
    teamMembersToCreate.push({ userId: teacher1.id, teamId: mathTeam.id, role: 'teacher' });
    // Assign Teacher 2 to Science Explorers
    teamMembersToCreate.push({ userId: teacher2.id, teamId: scienceTeam.id, role: 'teacher' });

    // Assign Students
    let studentIndex = 0;
    for (const user of createdUsers) {
      if (user.role === 'student') {
        studentIndex++;
        if (studentIndex <= 30) { // First 30 students in Math
          teamMembersToCreate.push({ userId: user.id, teamId: mathTeam.id, role: 'student' });
        } else if (studentIndex <= 60) { // Next 30 students in Science
          teamMembersToCreate.push({ userId: user.id, teamId: scienceTeam.id, role: 'student' });
        } else { // Last 30 students in History
          teamMembersToCreate.push({ userId: user.id, teamId: historyTeam.id, role: 'student' });
        }
      }
    }

    await db.insert(teamMembers).values(teamMembersToCreate);
    console.log(`Created ${teamMembersToCreate.length} team memberships.`);

    console.log('Database seeding completed successfully!');

    // --- Create Example Announcements ---
    console.log('Creating example announcements...');
    // Use statically imported announcements, announcementRecipients
    const announcementInserts = [];
    const recipientInserts = [];

    // Helper: get teacher for a team
    function getTeacherForTeam(teamId: number) {
      return teamMembersToCreate.find(tm => tm.teamId === teamId && tm.role === 'teacher');
    }

    // Example announcement content
    const exampleAnnouncements = [
      // English
      {
        content: "Welcome to the new semester! Let's make it a great one.",
        type: "plain"
      },
      {
        content: "# Homework Reminder\n\nDon't forget to submit your assignments by **Friday**.\n\n- Math: Chapter 2\n- Science: Lab report\n\nGood luck!",
        type: "mdx"
      },
      {
        content: "Congratulations to our top students this week! :trophy:",
        type: "plain"
      },
      {
        content: "## Upcoming Exam\n\nThe next exam will cover:\n\n- Algebra\n- Geometry\n- Trigonometry\n\nStudy hard!",
        type: "mdx"
      },
      // French
      {
        content: "Bienvenue au nouveau semestre ! Faisons-en une réussite.",
        type: "plain"
      },
      {
        content: "# Rappel de devoirs\n\nN'oubliez pas de rendre vos devoirs avant **vendredi**.\n\n- Mathématiques : Chapitre 2\n- Sciences : Rapport de laboratoire\n\nBonne chance !",
        type: "mdx"
      },
      {
        content: "Félicitations à nos meilleurs élèves de la semaine ! 🏆",
        type: "plain"
      },
      {
        content: "## Examen à venir\n\nLe prochain examen portera sur :\n\n- Algèbre\n- Géométrie\n- Trigonométrie\n\nBon courage !",
        type: "mdx"
      },
      // Arabic
      {
        content: "مرحبًا بكم في الفصل الدراسي الجديد! لنجعله فصلًا رائعًا.",
        type: "plain"
      },
      {
        content: "# تذكير بالواجبات\n\nلا تنسوا تسليم الواجبات قبل **يوم الجمعة**.\n\n- الرياضيات: الفصل الثاني\n- العلوم: تقرير المختبر\n\nحظًا سعيدًا!",
        type: "mdx"
      },
      {
        content: "تهانينا لأفضل الطلاب هذا الأسبوع! 🏆",
        type: "plain"
      },
      {
        content: "## الامتحان القادم\n\nسيشمل الامتحان القادم:\n\n- الجبر\n- الهندسة\n- حساب المثلثات\n\nبالتوفيق!",
        type: "mdx"
      }
    ];

    // For each team, create 2-3 announcements
    for (const team of createdTeams) {
      const teacher = getTeacherForTeam(team.id);
      if (!teacher) continue;
      for (let i = 0; i < 3; i++) {
        const ann = exampleAnnouncements[i % exampleAnnouncements.length];
        announcementInserts.push({
          senderId: teacher.userId,
          content: ann.content,
          type: ann.type,
        });
      }
    }

    // Insert announcements and get their IDs
    const createdAnnouncements = await db.insert(announcements).values(announcementInserts).returning({
      id: announcements.id,
      senderId: announcements.senderId,
      content: announcements.content,
      type: announcements.type,
    });

    // Link each announcement to its team
    let annIdx = 0;
    for (const team of createdTeams) {
      for (let i = 0; i < 3; i++) {
        const ann = createdAnnouncements[annIdx++];
        if (ann) {
          recipientInserts.push({
            announcementId: ann.id,
            teamId: team.id,
          });
        }
      }
    }
    await db.insert(announcementRecipients).values(recipientInserts);
    console.log(`Created ${createdAnnouncements.length} announcements and ${recipientInserts.length} announcement recipients.`);

  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1); // Exit with error code
  } finally {
    // Drizzle doesn't usually require explicit disconnection with Neon/Vercel Postgres
    // If using standard node-postgres, you might need client.end() here
    console.log('Seeding process finished.');
  }
}

seedDatabase();