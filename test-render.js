async function testMore() {
  console.log('Testing invalid body on login (validation test)...');
  try {
    const res = await fetch('https://spendwise-ai-yu7f.onrender.com/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'notanemail' })
    });
    console.log('Validation test status:', res.status, await res.text());
  } catch (e) {
    console.log('Error:', e.message);
  }

  console.log('\nTesting register...');
  try {
    const res = await fetch('https://spendwise-ai-yu7f.onrender.com/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Roshani Singh',
        email: 'test' + Date.now() + '@example.com',
        password: 'Password123!',
        preferredCurrency: 'INR'
      })
    });
    console.log('Register test status:', res.status, await res.text());
  } catch (e) {
    console.log('Error:', e.message);
  }
}
testMore().catch(console.error);
