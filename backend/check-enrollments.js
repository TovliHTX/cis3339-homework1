const path = require('path');
const mongoose = require('mongoose');

require('dotenv').config({
  path: path.join(__dirname, '.env'),
});

const Student = require('./models/Student');
const Course = require('./models/Course');
const Enrollment = require('./models/Enrollment');

async function checkEnrollments() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is missing from backend/.env');
    }

    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });

    const [students, courses, enrollments] = await Promise.all([
      Student.countDocuments(),
      Course.countDocuments(),
      Enrollment.find().populate('student').populate('course'),
    ]);

    const orphans = enrollments.filter(
      (enrollment) => !enrollment.student || !enrollment.course
    );

    console.log(`Students: ${students}`);
    console.log(`Courses: ${courses}`);
    console.log(`Enrollments: ${enrollments.length}`);
    console.log(`Orphan enrollments: ${orphans.length}`);

    if (orphans.length > 0) {
      process.exitCode = 1;
    }
  } catch (error) {
    console.error('Verification failed:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

checkEnrollments();