const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');

require('dotenv').config({
  path: path.join(__dirname, '.env'),
});

const Student = require('./models/Student');
const Course = require('./models/Course');

const app = express();

app.use(cors());
app.use(express.json());

// ---------- Student routes ----------

// Search by exact student name.
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

// List students for the student view and future enrollment controls.
app.get('/students', async (req, res) => {
  const students = await Student.find().sort({ name: 1, id: 1 });
  res.json(students);
});

// Add a student.
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

// Preserve the existing frontend's deletion endpoint.
// Enrollment cleanup will be added when enrollments are implemented.
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

// ---------- Course routes ----------

// List all courses.
app.get('/courses', async (req, res) => {
  const courses = await Course.find().sort({ id: 1 });
  res.json(courses);
});

// Add a course.
app.post('/courses', async (req, res) => {
  const { id, name } = req.body ?? {};

  if (
    typeof id !== 'string' ||
    !id.trim() ||
    typeof name !== 'string' ||
    !name.trim()
  ) {
    return res.status(400).json({
      error: 'Course ID and course name are required',
    });
  }

  const course = await Course.create({
    id: id.trim(),
    name: name.trim(),
  });

  res.status(201).json({
    message: 'Course added successfully',
    course,
  });
});

// Delete using the course's MongoDB _id, not its displayed course ID.
// Enrollment cleanup will be added when enrollments are implemented.
app.delete('/courses/:id', async (req, res) => {
  if (!mongoose.isObjectIdOrHexString(req.params.id)) {
    return res.status(400).json({
      error: 'Invalid course record ID',
    });
  }

  const course = await Course.findByIdAndDelete(req.params.id);

  if (!course) {
    return res.status(404).json({
      error: 'Course not found',
    });
  }

  res.json({
    message: 'Course deleted successfully',
    course,
  });
});

// ---------- Error handling ----------

// Keep this after all API routes.
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
  });
});

// Express 5 forwards errors from async route handlers here.
app.use((error, req, res, next) => {
  if (error.code === 11000) {
    return res.status(409).json({
      error: 'A record with that ID already exists',
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

// ---------- Startup ----------

async function startServer() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is missing from backend/.env');
    }

    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });

    // Prepare collections and unique indexes before accepting requests.
    await Promise.all([
      Student.init(),
      Course.init(),
    ]);

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