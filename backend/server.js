const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');

require('dotenv').config({
  path: path.join(__dirname, '.env'),
});

const Student = require('./models/Student');
const Course = require('./models/Course');
const Enrollment = require('./models/Enrollment');

const app = express();

app.use(cors());
app.use(express.json());

// Serialize enrollment creation and parent deletion in this server process.
// This prevents enrollment/deletion requests from creating orphan records.
let relationshipQueue = Promise.resolve();

function withRelationshipLock(action) {
  const result = relationshipQueue.then(action);
  relationshipQueue = result.catch(() => {});
  return result;
}

function isValidRecordId(value) {
  return (
    typeof value === 'string' &&
    mongoose.isObjectIdOrHexString(value)
  );
}

// ---------- Student routes ----------

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

// Delete by MongoDB _id, so students with the same name remain distinct.
app.delete('/students/:id', async (req, res) => {
  if (!isValidRecordId(req.params.id)) {
    return res.status(400).json({
      error: 'Invalid student record ID',
    });
  }

  await withRelationshipLock(async () => {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        error: 'Student not found',
      });
    }

    // Remove enrollments before removing their parent record.
    await Enrollment.deleteMany({ student: student._id });
    await Student.deleteOne({ _id: student._id });

    res.json({
      message: 'Student and related enrollments deleted successfully',
      student,
    });
  });
});

// ---------- Course routes ----------

app.get('/courses', async (req, res) => {
  const courses = await Course.find().sort({ id: 1 });
  res.json(courses);
});

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

app.delete('/courses/:id', async (req, res) => {
  if (!isValidRecordId(req.params.id)) {
    return res.status(400).json({
      error: 'Invalid course record ID',
    });
  }

  await withRelationshipLock(async () => {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        error: 'Course not found',
      });
    }

    await Enrollment.deleteMany({ course: course._id });
    await Course.deleteOne({ _id: course._id });

    res.json({
      message: 'Course and related enrollments deleted successfully',
      course,
    });
  });
});

// ---------- Enrollment routes ----------

app.post('/enrollments', async (req, res) => {
  const { studentId, courseId } = req.body ?? {};

  if (!isValidRecordId(studentId) || !isValidRecordId(courseId)) {
    return res.status(400).json({
      error: 'Valid student and course record IDs are required',
    });
  }

  await withRelationshipLock(async () => {
    const [student, course] = await Promise.all([
      Student.findById(studentId),
      Course.findById(courseId),
    ]);

    if (!student || !course) {
      return res.status(404).json({
        error: 'Student or course not found',
      });
    }

    const enrollment = await Enrollment.create({
      student: student._id,
      course: course._id,
    });

    res.status(201).json({
      message: 'Student enrolled successfully',
      enrollment,
    });
  });
});

// Return the students enrolled in the selected course.
app.get('/courses/:id/students', async (req, res) => {
  if (!isValidRecordId(req.params.id)) {
    return res.status(400).json({
      error: 'Invalid course record ID',
    });
  }

  const course = await Course.findById(req.params.id);

  if (!course) {
    return res.status(404).json({
      error: 'Course not found',
    });
  }

  const enrollments = await Enrollment.find({
    course: course._id,
  }).populate('student');

  const students = enrollments
    .map((enrollment) => enrollment.student)
    .filter(Boolean)
    .sort((a, b) => a.name.localeCompare(b.name));

  res.json(students);
});

// ---------- Error handling ----------

app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
  });
});

// Express 5 forwards errors from async route handlers here.
app.use((error, req, res, next) => {
  if (error.code === 11000) {
    const isEnrollment =
      error.keyPattern?.student && error.keyPattern?.course;

    return res.status(409).json({
      error: isEnrollment
        ? 'This student is already enrolled in this course'
        : 'A record with that ID already exists',
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

    // Prepare all collections and unique indexes automatically.
    await Promise.all([
      Student.init(),
      Course.init(),
      Enrollment.init(),
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