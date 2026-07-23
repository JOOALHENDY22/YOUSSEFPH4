import { checkInteractionsAI } from './src/services/aiService';

async function run() {
  try {
    const res = await checkInteractionsAI(['Lisinopril', 'Ibuprofen']);
    console.log('SUCCESS:', res);
  } catch (err) {
    console.error('ERROR:', err);
  }
}
run();
