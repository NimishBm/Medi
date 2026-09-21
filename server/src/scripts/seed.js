import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Doctor from '../models/Doctor.js';
import User from '../models/User.js';
import Appointment from '../models/Appointment.js';
import Queue from '../models/Queue.js';
import Consultation from '../models/Consultation.js';
import Prescription from '../models/Prescription.js';
import Payment from '../models/Payment.js';

dotenv.config();

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/clinicflow');
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Doctor.deleteMany({});
    await Appointment.deleteMany({});
    await Queue.deleteMany({});
    await Consultation.deleteMany({});
    await Prescription.deleteMany({});
    await Payment.deleteMany({});

    // Create doctors
    const doctors = await Doctor.create([
      {
        name: 'Dr. Sarah Sharma',
        email: 'dr.sarah@clinic.com',
        phone: '9876543210',
        password: 'Password123!',
        specialization: 'General Physician',
        consultationFee: 500,
        roomNumber: '1',
        qualifications: ['MBBS', 'MD'],
        experience: 10,
        verificationStatus: 'APPROVED',
        licenseVerified: true,
        availability: {
          monday: { start: '09:00', end: '18:00' },
          tuesday: { start: '09:00', end: '18:00' },
          wednesday: { start: '09:00', end: '18:00' },
          thursday: { start: '09:00', end: '18:00' },
          friday: { start: '09:00', end: '18:00' },
          saturday: { start: '10:00', end: '14:00' },
        },
        averageConsultationTime: 10,
        isActive: true,
      },
      {
        name: 'Dr. Priya Patel',
        email: 'dr.priya@clinic.com',
        phone: '9876543211',
        password: 'Password123!',
        specialization: 'Dermatologist',
        consultationFee: 600,
        roomNumber: '2',
        qualifications: ['MBBS', 'MD', 'DNB'],
        experience: 8,
        verificationStatus: 'APPROVED',
        licenseVerified: true,
        availability: {
          monday: { start: '10:00', end: '17:00' },
          tuesday: { start: '10:00', end: '17:00' },
          wednesday: { start: '10:00', end: '17:00' },
          thursday: { start: '10:00', end: '17:00' },
          friday: { start: '10:00', end: '17:00' },
        },
        averageConsultationTime: 12,
        isActive: true,
      },
      {
        name: 'Dr. Rajesh Kumar',
        email: 'dr.rajesh@clinic.com',
        phone: '9876543212',
        password: 'Password123!',
        specialization: 'Cardiologist',
        consultationFee: 800,
        roomNumber: '3',
        qualifications: ['MBBS', 'MD', 'DM'],
        experience: 15,
        verificationStatus: 'APPROVED',
        licenseVerified: true,
        availability: {
          monday: { start: '09:00', end: '16:00' },
          tuesday: { start: '09:00', end: '16:00' },
          wednesday: { start: '09:00', end: '16:00' },
          thursday: { start: '09:00', end: '16:00' },
          friday: { start: '09:00', end: '16:00' },
          saturday: { start: '09:00', end: '12:00' },
        },
        averageConsultationTime: 15,
        isActive: true,
      },
    ]);

    console.log('Doctors created:', doctors.length);

    // Create patients
    const patients = await User.create([
      {
        name: 'Rahul Kumar',
        email: 'rahul@example.com',
        phone: '9988776655',
        password: 'Password123!',
        role: 'PATIENT',
        dateOfBirth: new Date('1990-05-15'),
        gender: 'M',
        allergies: ['Penicillin'],
      },
      {
        name: 'Priya Gupta',
        email: 'priya@example.com',
        phone: '9988776654',
        password: 'Password123!',
        role: 'PATIENT',
        dateOfBirth: new Date('1992-08-20'),
        gender: 'F',
        allergies: [],
      },
      {
        name: 'Arjun Singh',
        email: 'arjun@example.com',
        phone: '9988776653',
        password: 'Password123!',
        role: 'PATIENT',
        dateOfBirth: new Date('1988-03-10'),
        gender: 'M',
        allergies: ['Aspirin'],
      },
      {
        name: 'Ananya Sharma',
        email: 'ananya@example.com',
        phone: '9988776652',
        password: 'Password123!',
        role: 'PATIENT',
        dateOfBirth: new Date('1995-11-25'),
        gender: 'F',
        allergies: [],
      },
      {
        name: 'Rakesh Patel',
        email: 'rakesh@example.com',
        phone: '9988776651',
        password: 'Password123!',
        role: 'PATIENT',
        dateOfBirth: new Date('1985-07-12'),
        gender: 'M',
        allergies: [],
      },
      {
        name: 'Sneha Desai',
        email: 'sneha@example.com',
        phone: '9988776650',
        password: 'Password123!',
        role: 'PATIENT',
        dateOfBirth: new Date('1993-02-18'),
        gender: 'F',
        allergies: ['Ibuprofen'],
      },
      {
        name: 'Greeshma Sathvika',
        email: 'greeshma@example.com',
        phone: '9988776649',
        password: 'Password123!',
        role: 'PATIENT',
        dateOfBirth: new Date('1998-09-22'),
        gender: 'F',
        allergies: [],
      },
      {
        name: 'Vikram Nair',
        email: 'vikram@example.com',
        phone: '9988776648',
        password: 'Password123!',
        role: 'PATIENT',
        dateOfBirth: new Date('1987-01-30'),
        gender: 'M',
        allergies: [],
      },
      {
        name: 'Divya Menon',
        email: 'divya@example.com',
        phone: '9988776647',
        password: 'Password123!',
        role: 'PATIENT',
        dateOfBirth: new Date('1991-06-14'),
        gender: 'F',
        allergies: [],
      },
      {
        name: 'Sanjay Agarwal',
        email: 'sanjay@example.com',
        phone: '9988776646',
        password: 'Password123!',
        role: 'PATIENT',
        dateOfBirth: new Date('1980-12-08'),
        gender: 'M',
        allergies: ['Latex'],
      },
    ]);

    console.log('Patients created:', patients.length);

    // Create appointments for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const appointmentTimes = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30'];
    const appointmentTypes = [
      'General Consultation',
      'New Patient',
      'Follow-up',
      'Specialist Consultation',
      'Emergency',
      'Vaccination',
      'Teleconsultation',
      'Routine Check-up',
      'General Consultation',
      'Follow-up',
    ];

    const appointments = [];
    for (let i = 0; i < patients.length; i++) {
      appointments.push({
        patientId: patients[i]._id,
        doctorId: doctors[i % 3]._id,
        appointmentDate: today,
        appointmentTime: appointmentTimes[i],
        reason: 'Regular checkup',
        appointmentType: appointmentTypes[i],
        tokenNumber: i + 1,
        status: i < 3 ? 'COMPLETED' : i < 5 ? 'CONSULTING' : i < 7 ? 'CALLED' : 'WAITING',
        checkInTime: i < 3 ? new Date() : null,
      });
    }

    const createdAppointments = await Appointment.create(appointments);
    console.log('Appointments created:', createdAppointments.length);

    // Create queue entries
    const queueEntries = [];
    for (let i = 0; i < createdAppointments.length; i++) {
      queueEntries.push({
        doctorId: createdAppointments[i].doctorId,
        appointmentId: createdAppointments[i]._id,
        patientId: createdAppointments[i].patientId,
        tokenNumber: createdAppointments[i].tokenNumber,
        queueDate: today,
        status: createdAppointments[i].status,
      });
    }

    await Queue.create(queueEntries);
    console.log('Queue entries created:', queueEntries.length);

    // Create sample consultations
    const consultation = await Consultation.create({
      appointmentId: createdAppointments[0]._id,
      patientId: createdAppointments[0].patientId,
      doctorId: createdAppointments[0].doctorId,
      symptoms: ['Fever', 'Cough'],
      diagnosis: 'Common Cold',
      notes: 'Patient has mild fever. Prescribed rest and fluids.',
      treatmentPlan: 'Rest, fluids, and over-the-counter medications',
    });

    console.log('Consultation created');

    // Create sample prescription
    await Prescription.create({
      consultationId: consultation._id,
      patientId: consultation.patientId,
      doctorId: consultation.doctorId,
      medicines: [
        {
          name: 'Paracetamol',
          dosage: '500mg',
          frequency: '2 times/day',
          duration: '3 days',
          instructions: 'After meals',
        },
        {
          name: 'Cough Syrup',
          dosage: '10ml',
          frequency: '3 times/day',
          duration: '5 days',
          instructions: 'Before meals',
        },
      ],
      additionalNotes: 'Drink plenty of fluids',
    });

    console.log('Prescription created');

    // Create sample payments
    await Payment.create([
      {
        appointmentId: createdAppointments[0]._id,
        patientId: createdAppointments[0].patientId,
        doctorId: createdAppointments[0].doctorId,
        consultationFee: doctors[0].consultationFee,
        totalAmount: doctors[0].consultationFee,
        paymentMethod: 'CASH',
        status: 'PAID',
        paymentDate: new Date(),
        processedBy: createdAppointments[0].doctorId,
      },
    ]);

    console.log('Payments created');

    console.log('\n✅ Database seeded successfully!\n');
    console.log('Demo Accounts:');
    console.log('----------------------------------');
    console.log('PATIENT:');
    console.log('  Email: rahul@example.com');
    console.log('  Password: Password123!');
    console.log('\nDOCTOR:');
    console.log('  Email: dr.sarah@clinic.com');
    console.log('  Password: Password123!');
    console.log('----------------------------------\n');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
