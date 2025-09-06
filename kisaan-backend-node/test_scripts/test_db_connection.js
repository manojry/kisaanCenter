"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("../src/config/database"));
async function testConnection() {
    try {
        await database_1.default.authenticate();
        console.log('Database connection successful!');
        process.exit(0);
    }
    catch (err) {
        console.error('Database connection failed:', err);
        process.exit(1);
    }
}
testConnection();
