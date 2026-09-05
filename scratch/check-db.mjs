import { PrismaClient } from '../src/generated/client/index.js';

const prisma = new PrismaClient();

try {
  const cols = await prisma.$queryRawUnsafe(
    `SELECT column_name FROM information_schema.columns WHERE table_name = 'ChatMessage' ORDER BY ordinal_position`
  );
  console.log('ChatMessage columns:', cols.map(c => c.column_name));

  // Also add missing columns if they don't exist
  const colNames = cols.map(c => c.column_name);
  const missing = [];
  if (!colNames.includes('reactions')) missing.push(`ALTER TABLE "ChatMessage" ADD COLUMN "reactions" JSONB DEFAULT '{}'`);
  if (!colNames.includes('readAt')) missing.push(`ALTER TABLE "ChatMessage" ADD COLUMN "readAt" TIMESTAMP`);
  if (!colNames.includes('replyToId')) missing.push(`ALTER TABLE "ChatMessage" ADD COLUMN "replyToId" TEXT`);
  if (!colNames.includes('isPinned')) missing.push(`ALTER TABLE "ChatMessage" ADD COLUMN "isPinned" BOOLEAN NOT NULL DEFAULT false`);

  if (missing.length === 0) {
    console.log('All columns exist!');
  } else {
    console.log('Missing columns, adding them...');
    for (const sql of missing) {
      console.log('Running:', sql);
      await prisma.$queryRawUnsafe(sql);
      console.log('Done.');
    }
    console.log('All missing columns added successfully!');
  }
} catch (e) {
  console.error('Error:', e.message);
} finally {
  await prisma.$disconnect();
}
