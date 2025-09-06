"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const index_1 = __importDefault(require("../../src/index"));
describe('POST /api/auth/login', () => {
    it('should return 200 and a token for valid credentials', async () => {
        const res = await (0, supertest_1.default)(index_1.default)
            .post('/api/auth/login')
            .send({ username: 'testuser', password: 'testpass' });
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('token');
        expect(res.body.user).toHaveProperty('username', 'testuser');
    });
    it('should return 401 for invalid credentials', async () => {
        const res = await (0, supertest_1.default)(index_1.default)
            .post('/api/auth/login')
            .send({ username: 'wronguser', password: 'wrongpass' });
        expect(res.status).toBe(401);
    });
});
