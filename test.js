// test-prisma.js
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Prisma models:", Object.keys(prisma));
  console.log("Category model:", typeof prisma.category); // should log 'object'
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
