import { getDb } from "../src/client";
import { seedCancerResearchCenters } from "./seed-cancer-centers";

const db = getDb();

seedCancerResearchCenters(db)
  .then((result) => {
    console.log(
      `Seeded cancer research center directory: ${result.organizations} organizations, ${result.laboratories} labs.`,
    );
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
