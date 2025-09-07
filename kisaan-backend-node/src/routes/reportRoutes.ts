import { Router } from 'express';
import { generateReport, downloadReport } from '../controllers/reportController';
import { authenticateToken } from '../middlewares/auth';

const router = Router();

// Generate report (JSON or HTML)
router.get('/generate', authenticateToken, generateReport);

// Download report as file
router.get('/download', authenticateToken, downloadReport);

export default router;