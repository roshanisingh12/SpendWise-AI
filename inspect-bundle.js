async function test() {
  const res = await fetch('https://spend-wise-ai-sooty.vercel.app/assets/index-UVs2VA-x.js');
  const text = await res.text();
  const urls = text.match(/https?:\/\/[^\s"'`;)]+/g) || [];
  console.log('URLs:', [...new Set(urls)].filter(u => !u.includes('w3.org') && !u.includes('react')));
  
  // Also look for /auth/login or API_BASE
  const idx = text.indexOf('/auth/login');
  if (idx !== -1) {
    console.log('Surrounding /auth/login:', text.slice(Math.max(0, idx - 100), idx + 100));
  }
}
test().catch(console.error);
