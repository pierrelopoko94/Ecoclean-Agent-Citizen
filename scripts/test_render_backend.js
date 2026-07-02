import fetch from 'node-fetch';

const BACKEND_URL = 'https://ecoclean-backend-7hn0.onrender.com/api';
const API_KEY = 'AIzaSyD_0hyZ8t4vtNWVM4-Scv14ZZoUg3BZc-0';

async function runTests() {
  console.log("=== ECOCLEAN RENDER BACKEND DIRECT VERIFICATION ===");
  
  // 1. Health check
  try {
    const res = await fetch(`${BACKEND_URL}/health`);
    console.log(`GET /health: Status ${res.status}`);
    const text = await res.text();
    console.log(`Response: ${text}\n`);
  } catch (err) {
    console.log(`GET /health error: ${err.message}\n`);
  }

  // 2. Test endpoints without auth or with test token
  const testEndpoints = [
    { method: 'GET', url: '/reports' },
    { method: 'GET', url: '/missions' },
    { method: 'GET', url: '/users/me' },
    { method: 'GET', url: '/satellite/detections' },
  ];

  for (const ep of testEndpoints) {
    try {
      const res = await fetch(`${BACKEND_URL}${ep.url}`, { method: ep.method });
      console.log(`${ep.method} ${ep.url}: Status ${res.status}`);
      const text = await res.text();
      console.log(`Response: ${text.substring(0, 300)}\n`);
    } catch (err) {
      console.log(`${ep.method} ${ep.url} error: ${err.message}\n`);
    }
  }
}

runTests();
