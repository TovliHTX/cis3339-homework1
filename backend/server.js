const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');

require('dotenv').config({
  path: path.join(__dirname, '.env'),
});

const Student = require('./models/Student');

const app = express();

app.use(cors());
app.use(express.json());

// Search by exact student name, preserving the starter's behavior.
app.post('/find-student', async (req, res) => {
  const { name } = req.body ?? {};

  if (typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({
      error: 'Student name is required',
    });
  }

  const student = await Student.findOne({ name: name.trim() });

  if (!student) {
    return res.status(404).json({
      error: 'Student not found',
    });
  }

  res.json(student);
});

// Provide student data for future enrollment selection controls.
app.get('/students', async (req, res) => {
  const students = await Student.find().sort({ name: 1, id: 1 });
  res.json(students);
});

app.post('/add-student', async (req, res) => {
  const { name, id, phone, zip } = req.body ?? {};
  const fields = { name, id, phone, zip };

  const invalidFields = Object.entries(fields)
    .filter(([, value]) => typeof value !== 'string' || !value.trim())
    .map(([field]) => field);

  if (invalidFields.length > 0) {
    return res.status(400).json({
      error: `Required fields must contain text: ${invalidFields.join(', ')}`,
    });
  }

  const student = await Student.create({
    name: name.trim(),
    id: id.trim(),
    phone: phone.trim(),
    zip: zip.trim(),
  });

  res.status(201).json({
    message: 'Student added successfully',
    student,
  });
});

// Preserve the starter's deletion endpoint during the migration.
// We will add enrollment cleanup when enrollment storage is introduced.
app.post('/delete-student', async (req, res) => {
  const { name } = req.body ?? {};

  if (typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({
      error: 'Student name is required',
    });
  }

  const student = await Student.findOneAndDelete({
    name: name.trim(),
  });

  if (!student) {
    return res.status(404).json({
      error: 'Student not found',
    });
  }

  res.json({
    message: 'Student deleted successfully',
    student,
  });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Express 5 forwards errors from async route handlers here.
app.use((error, req, res, next) => {
  if (error.code === 11000) {
    return res.status(409).json({
      error: 'A student with that student ID already exists',
    });
  }

  if (error.name === 'ValidationError') {
    return res.status(400).json({
      error: Object.values(error.errors)
        .map((issue) => issue.message)
        .join('; '),
    });
  }

  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: 'Request body must contain valid JSON',
    });
  }

  console.error('Request failed:', error);

  res.status(500).json({
    error: 'Internal server error',
  });
});

async function startServer() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is missing from backend/.env');
    }

    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });

    // Create the collection and unique index before accepting requests.
    await Student.init();

    console.log(`MongoDB connected: ${mongoose.connection.name}`);

    const port = process.env.PORT || 3000;

    const server = app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });

    server.on('error', async (error) => {
      console.error('Server failed:', error.message);
      process.exitCode = 1;
      await mongoose.disconnect();
    });
  } catch (error) {
    console.error('Startup failed:', error.message);
    process.exitCode = 1;
    await mongoose.disconnect();
  }
}

startServer();