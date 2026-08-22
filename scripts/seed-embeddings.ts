import { PrismaClient } from "../src/generated/client";

const prisma = new PrismaClient();

async function seedEmbeddings() {
  console.log("Fetching mock startups from DB...");
  const startups = await prisma.startup.findMany();
  
  if (startups.length === 0) {
    console.log("No startups found to index.");
    return;
  }

  for (const startup of startups) {
    console.log(`Indexing startup: ${startup.name} (${startup.id})`);
    try {
      const res = await fetch("http://localhost:8787/index", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          startupId: startup.id,
          tagline: startup.tagline,
          category: startup.category,
          stage: startup.stage,
        }),
      });
      
      const data = await res.json();
      console.log(`Result:`, data);
    } catch (err) {
      console.error(`Failed to index ${startup.name}:`, err);
    }
  }
  
  console.log("Finished seeding embeddings.");
}

seedEmbeddings()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
