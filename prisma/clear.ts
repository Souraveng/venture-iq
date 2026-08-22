import { PrismaClient } from "../src/generated/client";
const prisma = new PrismaClient();

async function main() {
  await prisma.startup.deleteMany();
  await prisma.investor.deleteMany();
  await prisma.negotiation.deleteMany();
  await prisma.meeting.deleteMany();
  await prisma.founder.deleteMany();
  await prisma.dealInteraction.deleteMany();
  console.log("Cleared all default dummy data.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
