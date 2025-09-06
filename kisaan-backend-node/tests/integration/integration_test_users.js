"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const users = [
    { username: 'superadmin', password: 'superadminpass', role: 'superadmin' },
    { username: 'OWN123', password: 'ownerpass', role: 'owner' },
    { username: 'ram_OWN123', password: 'farmerpass', role: 'farmer' },
    { username: 'shyam_OWN123', password: 'buyerpass', role: 'buyer' },
];
const loginUrl = 'http://localhost:8000/api/v1/auth/login';
const testEndpoint = 'http://localhost:8000/api/v1/shops/2/dashboard'; // Example protected endpoint
async function testLogin(user) {
    try {
        const response = await axios_1.default.post(loginUrl, {
            username: user.username,
            password: user.password,
        });
        console.log(`\n[${user.role}] Login status: ${response.status}`);
        if (response.data && response.data.success) {
            const token = response.data.data?.access_token;
            console.log(`[${user.role}] Login successful! Token: ${token?.slice(0, 20)}...`);
            // Test authenticated endpoint
            if (token) {
                try {
                    const dashResp = await axios_1.default.get(testEndpoint, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    console.log(`[${user.role}] Dashboard status: ${dashResp.status}`);
                }
                catch (err) {
                    console.log(`[${user.role}] Dashboard error:`, err.response?.status, err.response?.data);
                }
            }
        }
        else {
            console.log(`[${user.role}] Login failed:`, response.data?.message);
        }
    }
    catch (err) {
        console.log(`[${user.role}] Login error:`, err.response?.status, err.response?.data);
    }
}
(async () => {
    for (const user of users) {
        await testLogin(user);
    }
})();
