import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const instructorEmail = process.env.INSTRUCTOR_EMAIL || "instruktor@autoskola-stastny.cz";
  const instructorPassword = process.env.INSTRUCTOR_PASSWORD || "heslo123";

  const existing = await prisma.user.findUnique({
    where: { email: instructorEmail },
  });

  if (!existing) {
    const hashedPassword = await bcrypt.hash(instructorPassword, 12);
    await prisma.user.create({
      data: {
        name: "Autoškola Šťastný",
        email: instructorEmail,
        password: hashedPassword,
        role: "INSTRUCTOR",
      },
    });
    console.log("Instructor account created:", instructorEmail);
  } else {
    console.log("Instructor account already exists");
  }

  const instructor = await prisma.user.findFirst({ where: { role: "INSTRUCTOR" } });
  if (!instructor) return;

  const existingAvailability = await prisma.availability.count({
    where: { instructorId: instructor.id },
  });

  if (existingAvailability === 0) {
    await prisma.availability.createMany({
      data: [
        { instructorId: instructor.id, dayOfWeek: 1, startTime: "08:00", endTime: "16:00" },
        { instructorId: instructor.id, dayOfWeek: 2, startTime: "08:00", endTime: "16:00" },
        { instructorId: instructor.id, dayOfWeek: 3, startTime: "08:00", endTime: "16:00" },
        { instructorId: instructor.id, dayOfWeek: 4, startTime: "08:00", endTime: "16:00" },
        { instructorId: instructor.id, dayOfWeek: 5, startTime: "08:00", endTime: "14:00" },
      ],
    });
    console.log("Default availability created (Mon-Fri)");
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
