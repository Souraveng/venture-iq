import { prisma } from "../src/lib/prisma";
import { PrismaClient } from "@prisma/client";

console.log("Resolved path of generated client in script:", require.resolve("@prisma/client"));
console.log("Prisma keys from imported instance:", Object.keys(prisma));

const localPrisma = new PrismaClient();
console.log("Local Prisma instance keys:", Object.keys(localPrisma));
console.log("ventureCollaborator exists on localPrisma:", "ventureCollaborator" in localPrisma);

