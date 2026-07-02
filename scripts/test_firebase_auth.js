import fetch from 'node-fetch';

const BACKEND_URL = 'https://ecoclean-backend-7hn0.onrender.com/api';
const FIREBASE_API_KEY = 'AIzaSyD_0hyZ8t4vtNWVM4-Scv14ZZoUg3BZc-0';

async function testWithFirebase() {
  console.log("=== FIREBASE AUTH & BACKEND TEST ===");

  // 1. SignUp or SignIn with email/password via Firebase REST API
  const email = "pierrelopoko94@gmail.com";
  // Try to sign in or sign up with a test password if existing user
  let idToken = null;
  let uid = null;

  const passwordsToTry = ["Password123!", "Kinshasa2026!", "EcoClean2026!", "12345678"];

  for (const pwd of passwordsToTry) {
    try {
      const signInRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pwd, returnSecureToken: true })
      });
      const data = await signInRes.json();
      if (data.idToken) {
        idToken = data.idToken;
        uid = data.localId;
        console.log(`✅ Connection réussie sur Firebase avec l'email ${email} ! UID: ${uid}`);
        break;
      }
    } catch (e) {
      // ignore and try next
    }
  }

  if (!idToken) {
    // Try signUp
    try {
      const signUpRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: "EcoClean2026!", returnSecureToken: true })
      });
      const data = await signUpRes.json();
      if (data.idToken) {
        idToken = data.idToken;
        uid = data.localId;
        console.log(`✅ Inscription réussie sur Firebase avec l'email ${email} ! UID: ${uid}`);
      } else {
        console.log("Response on signUp:", data);
      }
    } catch (e) {
      console.log("Error during signUp:", e);
    }
  }

  if (!idToken) {
    // Create a temporary test user
    const testEmail = `test.citizen.${Date.now()}@ecoclean.cd`;
    const signUpRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: "EcoClean2026!", returnSecureToken: true })
    });
    const data = await signUpRes.json();
    if (data.idToken) {
      idToken = data.idToken;
      uid = data.localId;
      console.log(`✅ Création de compte test réussie (${testEmail}) ! UID: ${uid}`);
    } else {
      console.error("❌ Impossible de créer un utilisateur test:", data);
      return;
    }
  }

  // 2. Call GET /api/users/me
  console.log("\n--- TEST 1: GET /api/users/me ---");
  const userMeRes = await fetch(`${BACKEND_URL}/users/me`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${idToken}`,
      'Content-Type': 'application/json'
    }
  });
  console.log(`HTTP Status: ${userMeRes.status}`);
  const userMeData = await userMeRes.json();
  console.log("JSON Body:", JSON.stringify(userMeData, null, 2));

  // 3. Call POST /api/reports
  console.log("\n--- TEST 2: POST /api/reports ---");
  const reportPayload = {
    type: "PLASTIC",
    description: "Dépôt sauvage de plastique bloquant le caniveau",
    commune: "Gombe",
    avenue: "des Huileries",
    address: "Avenue des Huileries, Gombe",
    adresseComplete: "Avenue des Huileries, Gombe",
    latitude: -4.312,
    longitude: 15.308,
    photo: "data:image/png;base64,iVBORw0KGgoAAAANSU5EUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
  };
  const reportRes = await fetch(`${BACKEND_URL}/reports`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${idToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(reportPayload)
  });
  console.log(`HTTP Status: ${reportRes.status}`);
  const reportData = await reportRes.json();
  console.log("JSON Body:", JSON.stringify(reportData, null, 2));

  // 4. Call POST /api/users/me/request-agent
  console.log("\n--- TEST 3: POST /api/users/me/request-agent ---");
  const agentReqRes = await fetch(`${BACKEND_URL}/users/me/request-agent`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${idToken}`,
      'Content-Type': 'application/json'
    }
  });
  console.log(`HTTP Status: ${agentReqRes.status}`);
  const agentReqData = await agentReqRes.json();
  console.log("JSON Body:", JSON.stringify(agentReqData, null, 2));

  // 5. Call GET /api/users/me again to check updated status
  console.log("\n--- TEST 4: GET /api/users/me (Après demande agent) ---");
  const userMeRes2 = await fetch(`${BACKEND_URL}/users/me`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${idToken}`,
      'Content-Type': 'application/json'
    }
  });
  console.log(`HTTP Status: ${userMeRes2.status}`);
  const userMeData2 = await userMeRes2.json();
  console.log("JSON Body:", JSON.stringify(userMeData2, null, 2));
}

testWithFirebase();
