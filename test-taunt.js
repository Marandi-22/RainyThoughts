// Simple test for the taunt system
import TauntService from './services/tauntService';

// Test the taunt service
async function testTaunt() {
  console.log('Testing taunt service...');

  try {
    const taunt = await TauntService.getTaunt();
    console.log('Generated taunt:', taunt);
  } catch (error) {
    console.error('Error testing taunt:', error);
  }
}

// Test getting a random problem
async function testProblem() {
  console.log('Testing problem retrieval...');

  try {
    const problem = await TauntService.getRandomProblem();
    console.log('Random problem:', problem || 'No problems found');
  } catch (error) {
    console.error('Error getting problem:', error);
  }
}

testProblem();
testTaunt();