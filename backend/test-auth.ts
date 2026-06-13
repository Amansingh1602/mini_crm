import axios from 'axios';

async function test() {
  try {
    console.log('Testing guest login...');
    const loginRes = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'guest@xeno.com',
      password: 'guest123'
    });
    console.log('Login Response:', JSON.stringify(loginRes.data, null, 2));

    const token = loginRes.data.data.token;
    console.log('\nTesting /auth/me with token:', token);
    const meRes = await axios.get('http://localhost:3001/api/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log('Me Response:', JSON.stringify(meRes.data, null, 2));
  } catch (err: any) {
    console.error('Error during test:', err.response?.data || err.message);
  }
}

test();
