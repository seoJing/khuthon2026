import * as admin from "firebase-admin";
import { CATEGORIES, STARS, CONTENTS } from "../src/seed";

if (!admin.apps.length) {
  admin.initializeApp({ projectId: "byeolzari-dev" });
}
const db = admin.firestore();
db.settings({ ignoreUndefinedProperties: true });

async function writeMany(
  coll: string,
  docs: Array<{ id: string | number } & Record<string, unknown>>,
) {
  const batchSize = 400;
  for (let i = 0; i < docs.length; i += batchSize) {
    const batch = db.batch();
    for (const d of docs.slice(i, i + batchSize)) {
      batch.set(db.collection(coll).doc(String(d.id)), d, { merge: true });
    }
    await batch.commit();
  }
}

async function main() {
  console.log("Seeding categories…");
  await writeMany(
    "categories",
    CATEGORIES as unknown as Array<
      { id: string | number } & Record<string, unknown>
    >,
  );
  console.log("Seeding stars…");
  await writeMany(
    "stars",
    STARS as unknown as Array<
      { id: string | number } & Record<string, unknown>
    >,
  );
  console.log("Seeding contents…");
  await writeMany(
    "contents",
    CONTENTS as unknown as Array<
      { id: string | number } & Record<string, unknown>
    >,
  );
  console.log(
    `✔ Seed complete. Categories: ${CATEGORIES.length}, Stars: ${STARS.length}, Contents: ${CONTENTS.length}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
