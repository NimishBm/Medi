import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Organization from '../models/Organization.js';

dotenv.config();

const ORGS = [
  {
    name: 'Apollo Hospitals',
    organizationId: 'apollo-hospitals',
    type: 'CHAIN',
    description: 'Apollo Hospitals is one of India\'s largest integrated healthcare organisations, offering world-class medical care across multiple cities.',
    city: 'Hyderabad',
    address: 'Jubilee Hills, Hyderabad, Telangana 500033',
    phone: '+91-40-23607777',
    email: 'info@apollohospitals.com',
    website: 'https://www.apollohospitals.com',
    specialties: ['Cardiology', 'Oncology', 'Neurology', 'Orthopaedics', 'Transplants'],
    logo: '',
    isActive: true,
    verificationStatus: 'APPROVED',
  },
  {
    name: 'Continental Hospitals',
    organizationId: 'continental-hospitals',
    type: 'HOSPITAL',
    description: 'Continental Hospitals is a leading multi-specialty hospital in Hyderabad, known for its state-of-the-art infrastructure and expert medical professionals.',
    city: 'Hyderabad',
    address: 'Plot No. 3, Road No. 2, IT & Financial District, Nanakramguda, Hyderabad 500032',
    phone: '+91-40-67000000',
    email: 'info@continentalhospitals.com',
    website: 'https://www.continentalhospitals.com',
    specialties: ['Cardiology', 'Neurosurgery', 'Oncology', 'Gastroenterology', 'Robotic Surgery'],
    logo: '',
    isActive: true,
    verificationStatus: 'APPROVED',
  },
  {
    name: 'Care Hospitals',
    organizationId: 'care-hospitals',
    type: 'CHAIN',
    description: 'CARE Hospitals is a premier healthcare provider in India, offering comprehensive medical services with advanced diagnostic and treatment facilities.',
    city: 'Hyderabad',
    address: 'Exhibition Road, Nampally, Hyderabad, Telangana 500001',
    phone: '+91-40-30418888',
    email: 'info@carehospitals.com',
    website: 'https://www.carehospitals.com',
    specialties: ['Cardiology', 'Nephrology', 'Pulmonology', 'Orthopaedics', 'Urology'],
    logo: '',
    isActive: true,
    verificationStatus: 'APPROVED',
  },
  {
    name: 'AIG Hospitals',
    organizationId: 'aig-hospitals',
    type: 'HOSPITAL',
    description: 'AIG Hospitals (Asian Institute of Gastroenterology) is a world-renowned centre of excellence for gastrointestinal diseases and liver care.',
    city: 'Hyderabad',
    address: 'Survey No. 136, Mind Space, Gachibowli, Hyderabad 500032',
    phone: '+91-40-42444444',
    email: 'info@aighospitals.com',
    website: 'https://www.aigindialogistics.com',
    specialties: ['Gastroenterology', 'Hepatology', 'Bariatric Surgery', 'Endoscopy', 'Liver Transplant'],
    logo: '',
    isActive: true,
    verificationStatus: 'APPROVED',
  },
  {
    name: 'KIMS Hospitals',
    organizationId: 'kims-hospitals',
    type: 'CHAIN',
    description: 'KIMS (Krishna Institute of Medical Sciences) is a multi-specialty hospital group providing comprehensive healthcare services across Telangana and Andhra Pradesh.',
    city: 'Hyderabad',
    address: '1-8-31/1, Minister Road, Secunderabad, Hyderabad, Telangana 500003',
    phone: '+91-40-44885000',
    email: 'info@kimshospitals.com',
    website: 'https://www.kimshospitals.com',
    specialties: ['Cardiology', 'Oncology', 'Neurology', 'Orthopaedics', 'Paediatrics'],
    logo: '',
    isActive: true,
    verificationStatus: 'APPROVED',
  },
];

const seedOrganizations = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/MediQ');
    console.log('✅ Connected to MongoDB');

    let created = 0;
    let skipped = 0;

    for (const org of ORGS) {
      const exists = await Organization.findOne({ organizationId: org.organizationId });
      if (exists) {
        console.log(`⏭  Skipped (already exists): ${org.name}`);
        skipped++;
      } else {
        await Organization.create(org);
        console.log(`✅ Created: ${org.name}`);
        created++;
      }
    }

    console.log(`\nDone — ${created} created, ${skipped} skipped.`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  }
};

seedOrganizations();
