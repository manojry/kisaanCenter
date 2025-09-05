import express from 'express';
import userRoutes from './routes/userRoutes';

const app = express();

app.use(express.json());
app.use('/api/users', userRoutes);
// Import and use auth routes
import authRoutes from './routes/authRoutes';
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
  res.send('Kisaan Center Node.js Backend API');
});

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;
