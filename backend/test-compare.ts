import { compareDrugsAI } from './src/services/aiService';

async function run() {
  try {
    const res = await compareDrugsAI('Panadol', 'Congestal');
    console.log('SUCCESS:', JSON.stringify(res, null, 2));
  } catch (err) {
    console.error('ERROR:', err);
  }
}
run();
