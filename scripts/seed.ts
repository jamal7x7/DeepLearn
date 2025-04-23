import { faker as baseFaker } from '@faker-js/faker';
import { Faker } from '@faker-js/faker';

import { db } from '../lib/db/drizzle'; // Adjust path if needed
import { users, teams, teamMembers } from '../lib/db/schema'; // Adjust path if needed
// Import all relevant tables for deletion
import { announcements, announcementRecipients, activityLogs } from '../lib/db/schema';
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
  "Nabil El Malki", "Rania El Gharbi", "Tarik El Moutawakkil", "Soukaina El Fassi", "Jalil El Amrani",
  "Mouad El Idrissi", "Hajar Boukhris", "Ayoub El Mahdi", "Ilham Bennis", "Zakaria El Khatib",
  "Najib El Ghazali", "Malak Benjelloun", "Yassir Tazi", "Siham El Aaroui", "Othmane Belmekki",
  "Rim El Fassi", "Houda Saadi", "Reda Barada", "Asmae Chafai", "Walid Bouzid",
  "Souad Belmekki", "Fouad El Mansouri", "Samia Idrissi", "Khalid Naciri", "Laila Benani",
  "Ayman Amine", "Ikram El Ghazali", "Yassine El Malki", "Kenza Saadi", "Soukaina El Aaroui",
  "Badr El Amrani", "Sanae El Fadili", "Meryem El Mahdi", "Noureddine Alaoui", "Imane Benjelloun",
  "Omar Bouzid", "Nadia El Fassi", "Hicham El Ghazali", "Salma El Aaroui", "Karim Barada",
  "Amina El Khatib", "Tarik Boukhris", "Latifa El Mansouri", "Hamza El Malki", "Rania El Fadili",
  "Abdelhak El Ghazali", "Mounir Benjelloun", "Loubna El Amrani", "Youssef El Fassi", "Samira El Aaroui",
  "Nabil El Khatib", "Imane Bouzid", "Younes Belmekki", "Sara Benani", "Mohamed El Ghazali",
  "Khadija El Aaroui", "Hassan El Fadili", "Leila El Mahdi", "Hamza Benjelloun", "Zineb El Ghazali",
  "Omar El Mansouri", "Nadia Benani", "Karim El Fadili", "Samira El Mahdi", "Rachid El Amrani",
  "Imane El Ghazali", "Younes Benjelloun", "Sara El Mahdi", "Mounir El Khatib", "Latifa El Aaroui",
  "Nabil El Amrani", "Rania El Mansouri", "Tarik El Ghazali", "Soukaina El Mahdi", "Jalil El Fadili"
];

import { hashPassword } from '../lib/auth/session'; // Use PBKDF2 hashing for compatibility

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
    const teamNames = [
      'Math Wizards', 'Science Explorers', 'History Buffs',
      'Literature Legends', 'Robotics Club', 'Art Masters',
      'Debate Society', 'Chess Champions', 'Coding Ninjas',
      'Eco Warriors', 'Music Ensemble', 'Drama Troupe'
    ];
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

    // Helper to check if user exists by email
    async function userExists(email: string) {
      const { eq } = await import('drizzle-orm');
      const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
      return existing.length > 0 ? existing[0] : null;
    }

    // Teachers
    const teacherEmails = [
      `teacher1@example.com`, `teacher2@example.com`,
      `teacher3@example.com`, `teacher4@example.com`,
      `teacher5@example.com`, `teacher6@example.com`,
      `teacher7@example.com`, `teacher8@example.com`,
      `teacher9@example.com`, `teacher10@example.com`,
      `teacher11@example.com`, `teacher12@example.com`,
      `teacher13@example.com`, `teacher14@example.com`,
      `teacher15@example.com`
    ];
    for (let i = 0; i < teacherEmails.length; i++) {
      const email = teacherEmails[i];
      const existing = await userExists(email);
      if (!existing) {
        usersToCreate.push({
          name: arabicNames[i % arabicNames.length],
          email,
          passwordHash: await hashPassword('password123'),
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
          passwordHash: await hashPassword('password123'),
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

    // --- Create Admin User (if not exists) ---
    const adminEmail = 'admin1@example.com';
    let adminUser = await userExists(adminEmail);
    if (!adminUser) {
      await db.insert(users).values({
        name: 'Admin',
        email: adminEmail,
        passwordHash: await hashPassword('password123'),
        role: 'admin',
      });
      // Fetch the full admin user object after insert
      adminUser = await userExists(adminEmail);
      console.log('Created admin user.');
    } else {
      console.log('Admin user already exists.');
    }
    if (!adminUser) {
      throw new Error('Failed to create or fetch admin user.');
    }

    // --- Create 10 Global Announcements from admin1 ---
    if (adminUser) {
      const globalAnnouncements = Array.from({ length: 10 }).map((_, i) => ({
        senderId: adminUser.id,
        content: `Global Announcement #${i + 1} from admin1 - This is a message for all users.`,
        type: 'plain',
      }));
      const createdGlobalAnnouncements = await db.insert(announcements).values(globalAnnouncements).returning({ id: announcements.id });
      // Make each announcement visible to all teams
      const recipientInserts = [];
      for (const ann of createdGlobalAnnouncements) {
        for (const team of createdTeams) {
          recipientInserts.push({
            announcementId: ann.id,
            teamId: team.id,
            readAt: null, // seed as unread by default
          });
        }
      }
      await db.insert(announcementRecipients).values(recipientInserts);
      console.log(`Created ${createdGlobalAnnouncements.length} global announcements from admin1.`);
    } else {
      console.warn('admin1 user not found; skipping global announcements.');
    }

    // --- Assign Users to Teams ---
    console.log('Assigning users to teams...');
    const teamMembersToCreate: { userId: number; teamId: number; role: string }[] = [];

    // Assign teachers to teams (round-robin)
    const teachers = allUsers.filter(u => u.role === 'teacher');
    let teacherIdx = 0;
    for (const team of createdTeams) {
      if (teachers.length > 0) {
        const teacher = teachers[teacherIdx % teachers.length];
        teamMembersToCreate.push({ userId: teacher.id, teamId: team.id, role: 'teacher' });
        teacherIdx++;
      }
    }

    // Assign students to teams (ensure at least 4 members per team)
    const students = allUsers.filter(u => u.role === 'student');
    let studentIdx = 0;
    for (const team of createdTeams) {
      let teamStudentCount = 0;
      // Assign at least 3 students to each team (since 1 teacher already assigned)
      while (teamStudentCount < 20 && studentIdx < students.length) {
        teamMembersToCreate.push({ userId: students[studentIdx].id, teamId: team.id, role: 'student' });
        teamStudentCount++;
        studentIdx++;
      }
    }
    // Distribute remaining students evenly
    while (studentIdx < students.length) {
      const team = createdTeams[studentIdx % createdTeams.length];
      teamMembersToCreate.push({ userId: students[studentIdx].id, teamId: team.id, role: 'student' });
      studentIdx++;
    }

    await db.insert(teamMembers).values(teamMembersToCreate);
    console.log(`Created ${teamMembersToCreate.length} team memberships.`);

    console.log('Database seeding completed successfully!');

    // --- Create Example Announcements ---
    console.log('Creating example announcements...');
    // Use statically imported announcements, announcementRecipients
    const announcementInserts = [];
    const recipientInserts = [];
    const teachersForAnnouncements = allUsers.filter(u => u.role === 'teacher');

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

    // Each teacher gets at least 10 announcements
    for (const teacher of teachersForAnnouncements) {
      for (let i = 0; i < 10; i++) {
        const ann = exampleAnnouncements[i % exampleAnnouncements.length];
        // Optionally, tweak content to make each announcement unique
        const uniqueContent = ann.content + `\n\n[Announcement #${i + 1} by ${teacher.email}]`;
        announcementInserts.push({
          senderId: teacher.id,
          content: uniqueContent,
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

    // Optionally, link each announcement to a team (e.g., round-robin or by teacher's assigned team)
    let annIdx = 0;
    for (const teacher of teachersForAnnouncements) {
      // Find a team this teacher is assigned to
      const teacherTeam = createdTeams.find(team => teamMembersToCreate.some(tm => tm.userId === teacher.id && tm.teamId === team.id && tm.role === 'teacher'));
      for (let i = 0; i < 10; i++) {
        const ann = createdAnnouncements[annIdx++];
        if (ann && teacherTeam) {
          recipientInserts.push({
            announcementId: ann.id,
            teamId: teacherTeam.id,
            readAt: null, // seed as unread by default
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