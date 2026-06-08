import { checkDatabaseConsistency, disconnectMongo } from '../src/lib/mongodb';

async function main() {
  console.log('Checking database consistency...\n');

  try {
    const report = await checkDatabaseConsistency();

    console.log('=== DATABASE CONSISTENCY REPORT ===\n');
    console.log('Expected collections (from code):');
    console.dir(report.expected, { depth: null });

    console.log('\nActual collections in DB:');
    console.dir(report.actual, { depth: null });

    console.log('\nExact matches:', report.exactMatch.length ? report.exactMatch : '(none)');
    console.log('Missing (will auto-create on write):', report.missing.length ? report.missing : '(none)');
    console.log('Unknown / extra:', report.unknown.length ? report.unknown : '(none)');

    if (report.possibleOldDuplicates.length > 0) {
      console.log('\nPOSSIBLE OLD / DUPLICATE COLLECTIONS:');
      for (const d of report.possibleOldDuplicates) {
        console.log(`  - ${d.actual}  (expected: ${d.expected ?? 'n/a'}) — ${d.reason}`);
      }
    }

    console.log('\nIs clean?', report.isClean ? 'YES' : 'NO');
    console.log('\nRecommendation:', report.recommendation);

    if (!report.isClean) {
      console.log('\nTo clean from the admin panel:');
      console.log('   - Click "Check DB Consistency" (already ran)');
      console.log('   - Use "Xóa trắng Database" or call webhook events: db.dropUnknown, db.hardReset');
      console.log('\nOr from code:');
      console.log('   import { dropUnknownCollections, hardResetDatabase } from "@/lib/mongodb";');
    }
  } catch (err) {
    console.error('Failed to check DB:', err);
    process.exitCode = 1;
  } finally {
    await disconnectMongo();
  }
}

main();
