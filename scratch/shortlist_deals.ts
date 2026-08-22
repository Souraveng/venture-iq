import { PrismaClient } from '../src/generated/client';

const prisma = new PrismaClient();

async function main() {
  const emails = ["sarah@apexhorizon.com", "david@nexuscap.com", "himanshu25b@gmail.com"];
  const startups = await prisma.startup.findMany({ take: 8 });

  for (const email of emails) {
    const investor = await prisma.investor.findUnique({ where: { email } });
    if (!investor) {
      console.log(`Investor ${email} not found`);
      continue;
    }

    let count = 0;
    for (const s of startups) {
      await prisma.dealInteraction.upsert({
        where: {
          investorId_startupId: {
            investorId: investor.id,
            startupId: s.id
          }
        },
        update: { state: 'SHORTLISTED' },
        create: {
          investorId: investor.id,
          startupId: s.id,
          state: 'SHORTLISTED'
        }
      });
      count++;
    }
    console.log(`Shortlisted ${count} deals for ${email}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
