import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { parse } from 'csv-parse/sync';

import Symptom from '../models/Symptom.js';
import Condition from '../models/Condition.js';
import Specialty from '../models/Specialty.js';
import SymptomCondition from '../models/SymptomCondition.js';
import ConditionSpecialty from '../models/ConditionSpecialty.js';

dotenv.config();

const BASE_URL =
  'https://huggingface.co/datasets/ekacare/BODHI-S/resolve/main/data';

const GITHUB_BASE_URL =
  'https://raw.githubusercontent.com/eka-care/BODHI/main/bodhi-s/csv';

const fetchText = async (url) => {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch ${url}: ${response.status} ${response.statusText}`
    );
  }

  return response.text();
};

const parseJsonl = (text) => {
  return text
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => JSON.parse(line));
};

const importBodhi = async () => {
  try {
    console.log('Connecting to MongoDB...');

    await mongoose.connect(process.env.MONGO_URI);

    console.log('MongoDB connected');

    // --------------------------------------------------
    // 1. FETCH CSV FILES
    // --------------------------------------------------

    console.log('Fetching symptoms...');

    const symptomCsv = await fetchText(
      `${GITHUB_BASE_URL}/nodes_symptom.csv`
    );

    console.log('Fetching conditions...');

    const conditionCsv = await fetchText(
      `${GITHUB_BASE_URL}/nodes_condition.csv`
    );

    console.log('Fetching specialties...');

    const specialtyCsv = await fetchText(
      `${GITHUB_BASE_URL}/nodes_speciality.csv`
    );

    // --------------------------------------------------
    // 2. PARSE CSV FILES
    // --------------------------------------------------

    const symptoms = parse(symptomCsv, {
      columns: true,
      skip_empty_lines: true,
      relax_column_count: true,
    });

    const conditions = parse(conditionCsv, {
      columns: true,
      skip_empty_lines: true,
      relax_column_count: true,
    });

    const specialties = parse(specialtyCsv, {
      columns: true,
      skip_empty_lines: true,
      relax_column_count: true,
    });

    console.log(`Symptoms found: ${symptoms.length}`);
    console.log(`Conditions found: ${conditions.length}`);
    console.log(`Specialties found: ${specialties.length}`);

    // --------------------------------------------------
    // 3. INSERT SYMPTOMS
    // --------------------------------------------------

    console.log('Importing symptoms...');

    const symptomDocuments = symptoms
      .filter((item) => item.uuid && item.name)
      .map((item) => ({
        uuid: item.uuid,
        snomedId: item.snomed_id || null,
        rootSnomedId: item.root_snomed_id || null,
        rootSnomedName: item.root_snomed_name || null,
        name: item.name,
        triageLevel: item.triage_level || null,
      }));

    await Symptom.bulkWrite(
      symptomDocuments.map((doc) => ({
        updateOne: {
          filter: { uuid: doc.uuid },
          update: { $set: doc },
          upsert: true,
        },
      }))
    );

    console.log(
      `Symptoms imported: ${symptomDocuments.length}`
    );

    // --------------------------------------------------
    // 4. INSERT CONDITIONS
    // --------------------------------------------------

    console.log('Importing conditions...');

    const conditionDocuments = conditions
      .filter((item) => item.snomed_id && item.name)
      .map((item) => ({
        snomedId: item.snomed_id,
        name: item.name,
        type: item.type || null,
        triageLevel: item.condition_triage_level || null,
      }));

    await Condition.bulkWrite(
      conditionDocuments.map((doc) => ({
        updateOne: {
          filter: { snomedId: doc.snomedId },
          update: { $set: doc },
          upsert: true,
        },
      }))
    );

    console.log(
      `Conditions imported: ${conditionDocuments.length}`
    );

    // --------------------------------------------------
    // 5. INSERT SPECIALTIES
    // --------------------------------------------------

    console.log('Importing specialties...');

    const specialtyDocuments = specialties
      .filter((item) => item.id && item.name)
      .map((item) => ({
        specialtyId: Number(item.id),
        name: item.name,
      }));

    await Specialty.bulkWrite(
      specialtyDocuments.map((doc) => ({
        updateOne: {
          filter: { specialtyId: doc.specialtyId },
          update: { $set: doc },
          upsert: true,
        },
      }))
    );

    console.log(
      `Specialties imported: ${specialtyDocuments.length}`
    );

    // --------------------------------------------------
    // 6. FETCH TRIPLES
    // --------------------------------------------------

    console.log('Fetching BODHI-S relationships...');

    const triplesText = await fetchText(
      `${BASE_URL}/triples.jsonl`
    );

    const triples = parseJsonl(triplesText);

    console.log(`Triples found: ${triples.length}`);

    // --------------------------------------------------
    // 7. SYMPTOM → CONDITION
    // --------------------------------------------------

    console.log('Importing symptom → condition relationships...');

    const symptomConditionDocuments = triples
      .filter(
        (item) =>
          item.relation === 'PRESENT_IN' &&
          item.head_type === 'Symptom' &&
          item.tail_type === 'Condition'
      )
      .map((item) => ({
        symptomId: item.head,
        conditionId: item.tail,
        likelihoodConditionGivenSymptom:
          item.properties?.likelihood_condition_given_symptom || null,
        likelihoodSymptomGivenCondition:
          item.properties?.likelihood_symptom_given_condition || null,
      }));

    await SymptomCondition.deleteMany({});

    if (symptomConditionDocuments.length > 0) {
      await SymptomCondition.insertMany(
        symptomConditionDocuments
      );
    }

    console.log(
      `Symptom → condition relationships imported: ${symptomConditionDocuments.length}`
    );

    // --------------------------------------------------
    // 8. CONDITION → SPECIALTY
    // --------------------------------------------------

    console.log('Importing condition → specialty relationships...');

    const conditionSpecialtyDocuments = triples
      .filter(
        (item) =>
          item.relation === 'TREATED_BY' &&
          item.head_type === 'Condition' &&
          item.tail_type === 'Speciality'
      )
      .map((item) => ({
        conditionId: item.head,
        specialtyId: Number(item.tail),
        weight: item.properties?.weight || null,
      }));

    await ConditionSpecialty.deleteMany({});

    if (conditionSpecialtyDocuments.length > 0) {
      await ConditionSpecialty.insertMany(
        conditionSpecialtyDocuments
      );
    }

    console.log(
      `Condition → specialty relationships imported: ${conditionSpecialtyDocuments.length}`
    );

    console.log('\n======================================');
    console.log('BODHI-S IMPORT COMPLETED');
    console.log('======================================\n');

  } catch (error) {
    console.error('\nBODHI import failed:');
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('\nMongoDB connection closed');
  }
};

importBodhi();