require('dotenv').config();
const { fetchAndSave } = require('./cron/fetchArticles');

async function test() {
  console.log('--- STARTING CRON RUN 1 ---');
  const start1 = Date.now();
  await fetchAndSave();
  const end1 = Date.now();
  console.log(`--- CRON RUN 1 COMPLETED IN ${(end1 - start1) / 1000}s ---`);

  console.log('\n--- STARTING CRON RUN 2 (ALL SHOULD BE SKIPPED) ---');
  const start2 = Date.now();
  await fetchAndSave();
  const end2 = Date.now();
  console.log(`--- CRON RUN 2 COMPLETED IN ${(end2 - start2) / 1000}s ---`);
}

test().catch(err => {
  console.error('Test execution failed:', err);
});
