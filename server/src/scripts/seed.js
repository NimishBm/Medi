import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Doctor from '../models/Doctor.js';
import Patient from '../models/Patient.js';
import Receptionist from '../models/Receptionist.js';
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
    await Doctor.deleteMany({});
    await Patient.deleteMany({});
    await Receptionist.deleteMany({});
    await Appointment.deleteMany({});
    await Queue.deleteMany({});
    await Consultation.deleteMany({});
    await Prescription.deleteMany({});
    await Payment.deleteMany({});

    // ── Doctors ────────────────────────────────────────────────────────────────
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
        availabilityStart: '09:00',
        availabilityEnd: '18:00',
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
        availabilityStart: '10:00',
        availabilityEnd: '17:00',
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
        availabilityStart: '09:00',
        availabilityEnd: '16:00',
        averageConsultationTime: 15,
        isActive: true,
      },
    ]);
    console.log('Doctors created:', doctors.length);

    // ── Receptionist ───────────────────────────────────────────────────────────
    const receptionist = await Receptionist.create({
      name: 'Priya Singh',
      email: 'receptionist@clinic.com',
      phone: '9876543220',
      password: 'Password123!',
    });
    console.log('Receptionist created');

    // ── Patients ───────────────────────────────────────────────────────────────
    const patients = await Patient.create([
      {
        name: 'Rahul Kumar',
        email: 'rahul@example.com',
        phone: '9988776655',
        password: 'Password123!',
        dateOfBirth: new Date('1990-05-15'),
        gender: 'M',
        bloodGroup: 'O+',
        allergies: ['Penicillin'],
        medicalHistory: [{ condition: 'Hypertension', diagnosis: 'Stage 1 HTN', date: new Date('2018-01-01') }],
      },
      {
        name: 'Priya Gupta',
        email: 'priya@example.com',
        phone: '9988776654',
        password: 'Password123!',
        dateOfBirth: new Date('1992-08-20'),
        gender: 'F',
        bloodGroup: 'A+',
        allergies: [],
      },
      {
        name: 'Arjun Singh',
        email: 'arjun@example.com',
        phone: '9988776653',
        password: 'Password123!',
        dateOfBirth: new Date('1988-03-10'),
        gender: 'M',
        bloodGroup: 'B+',
        allergies: ['Aspirin'],
        medicalHistory: [{ condition: 'Asthma', diagnosis: 'Mild persistent asthma', date: new Date('2015-06-15') }],
      },
      {
        name: 'Ananya Sharma',
        email: 'ananya@example.com',
        phone: '9988776652',
        password: 'Password123!',
        dateOfBirth: new Date('1995-11-25'),
        gender: 'F',
        bloodGroup: 'AB+',
        allergies: [],
      },
      {
        name: 'Rakesh Patel',
        email: 'rakesh@example.com',
        phone: '9988776651',
        password: 'Password123!',
        dateOfBirth: new Date('1985-07-12'),
        gender: 'M',
        bloodGroup: 'O-',
        allergies: [],
      },
      {
        name: 'Sneha Desai',
        email: 'sneha@example.com',
        phone: '9988776650',
        password: 'Password123!',
        dateOfBirth: new Date('1993-02-18'),
        gender: 'F',
        bloodGroup: 'B-',
        allergies: ['Ibuprofen'],
      },
      {
        name: 'Greeshma Sathvika',
        email: 'greeshma@example.com',
        phone: '9988776649',
        password: 'Password123!',
        dateOfBirth: new Date('1998-09-22'),
        gender: 'F',
        bloodGroup: 'A-',
        allergies: [],
      },
      {
        name: 'Vikram Nair',
        email: 'vikram@example.com',
        phone: '9988776648',
        password: 'Password123!',
        dateOfBirth: new Date('1987-01-30'),
        gender: 'M',
        bloodGroup: 'AB-',
        allergies: [],
      },
      {
        name: 'Divya Menon',
        email: 'divya@example.com',
        phone: '9988776647',
        password: 'Password123!',
        dateOfBirth: new Date('1991-06-14'),
        gender: 'F',
        bloodGroup: 'O+',
        allergies: [],
      },
      {
        name: 'Sanjay Agarwal',
        email: 'sanjay@example.com',
        phone: '9988776646',
        password: 'Password123!',
        dateOfBirth: new Date('1980-12-08'),
        gender: 'M',
        bloodGroup: 'A+',
        allergies: ['Latex'],
        medicalHistory: [{ condition: 'Type 2 Diabetes', diagnosis: 'T2DM', date: new Date('2015-03-20') }],
      },
    ]);
    console.log('Patients created:', patients.length);

    // ── Appointments & Queue for TODAY ────────────────────────────────────────
    // Use UTC midnight so the queue filter (setUTCHours 0,0,0,0) always matches
    const todayUTC = new Date();
    todayUTC.setUTCHours(0, 0, 0, 0);

    const appointmentTimes = [
      '09:00', '09:30', '10:00', '10:30', '11:00',
      '11:30', '14:00', '14:30', '15:00', '15:30',
    ];
    const appointmentTypes = [
      'General Consultation', 'New Patient', 'Follow-up',
      'Specialist Consultation', 'Emergency', 'Vaccination',
      'Teleconsultation', 'Routine Check-up', 'General Consultation', 'Follow-up',
    ];

    const appointmentDocs = [];
    for (let i = 0; i < patients.length; i++) {
      appointmentDocs.push({
        patientId: patients[i]._id,
        doctorId: doctors[i % 3]._id,
        appointmentDate: todayUTC,
        appointmentTime: appointmentTimes[i],
        reason: 'Regular checkup',
        appointmentType: appointmentTypes[i],
        tokenNumber: i + 1,
        // All set to WAITING so they show up in the live queue immediately
        status: 'WAITING',
      });
    }

    const createdAppointments = await Appointment.create(appointmentDocs);
    console.log('Appointments created:', createdAppointments.length);

    // ── Queue entries ─────────────────────────────────────────────────────────
    const queueEntries = createdAppointments.map((appt) => ({
      doctorId: appt.doctorId,
      appointmentId: appt._id,
      patientId: appt.patientId,
      tokenNumber: appt.tokenNumber,
      queueDate: todayUTC,   // UTC midnight — matches the GET /doctor/:id filter
      status: 'WAITING',
    }));

    await Queue.create(queueEntries);
    console.log('Queue entries created:', queueEntries.length);

    // ── Sample consultation (first appointment) ───────────────────────────────
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

    // ── Sample prescription ───────────────────────────────────────────────────
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

    // ── Sample payment ────────────────────────────────────────────────────────
    await Payment.create({
      appointmentId: createdAppointments[0]._id,
      patientId: createdAppointments[0].patientId,
      doctorId: createdAppointments[0].doctorId,
      consultationFee: doctors[0].consultationFee,
      totalAmount: doctors[0].consultationFee,
      paymentMethod: 'CASH',
      status: 'PAID',
      paymentDate: new Date(),
      processedBy: receptionist._id,
    });
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
    console.log('\nRECEPTIONIST:');
    console.log('  Email: receptionist@clinic.com');
    console.log('  Password: Password123!');
    console.log('----------------------------------\n');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
