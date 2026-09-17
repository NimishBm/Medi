import express from 'express';

import Doctor from '../models/Doctor.js';
import Symptom from '../models/Symptom.js';
import Condition from '../models/Condition.js';
import Specialty from '../models/Specialty.js';
import SymptomCondition from '../models/SymptomCondition.js';
import ConditionSpecialty from '../models/ConditionSpecialty.js';

const router = express.Router();

// Escape special characters before creating RegExp
const escapeRegex = (value) => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

// Normalize specialty names
const normalizeSpecialty = (name) => {
  return name
    .toLowerCase()
    .replace(/\bspecialist\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

router.get('/', async (req, res) => {
  try {
    const query = req.query.q?.trim();

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required',
      });
    }

    const searchRegex = new RegExp(
      escapeRegex(query),
      'i'
    );

    // ==================================================
    // 1. DIRECT DOCTOR SEARCH
    // ==================================================

    const doctorsByName = await Doctor.find({
      isActive: true,
      name: searchRegex,
    })
      .select('-password')
      .lean();

    const doctorsBySpecialization = await Doctor.find({
      isActive: true,
      specialization: searchRegex,
    })
      .select('-password')
      .lean();

    // ==================================================
    // 2. DIRECT SPECIALTY SEARCH
    // ==================================================

    const directSpecialties = await Specialty.find({
      name: searchRegex,
    }).lean();

    // ==================================================
    // 3. DIRECT CONDITION SEARCH
    // ==================================================

    const directConditions = await Condition.find({
      name: searchRegex,
    }).lean();

    // ==================================================
    // 4. SYMPTOM SEARCH
    // ==================================================

    const matchedSymptoms = await Symptom.find({
      name: searchRegex,
    }).lean();

    /*
      BODHI contains many symptom variants.

      Example:
      Headache <pain> electric shock like
      Headache <agg by> in the morning
      Headache <char> tenderness

      We don't want to return all of them.
      We group them using rootSnomedName.
    */

    const symptomRootMap = new Map();

    matchedSymptoms.forEach((symptom) => {
      const rootName =
        symptom.rootSnomedName || symptom.name;

      const rootId =
        symptom.rootSnomedId || symptom.uuid;

      if (!symptomRootMap.has(rootId)) {
        symptomRootMap.set(rootId, {
          id: rootId,
          name: rootName,
        });
      }
    });

    const symptoms = Array.from(
      symptomRootMap.values()
    );

    // ==================================================
    // 5. SYMPTOM → CONDITION
    // ==================================================

    const symptomIds = matchedSymptoms
      .map((symptom) => symptom.uuid)
      .filter(Boolean);

    const symptomConditions =
      symptomIds.length > 0
        ? await SymptomCondition.find({
            symptomId: {
              $in: symptomIds,
            },
          }).lean()
        : [];

    // ==================================================
    // 6. COMBINE CONDITION IDs
    // ==================================================

    const conditionIds = [
      ...new Set([
        ...directConditions.map(
          (condition) => condition.snomedId
        ),

        ...symptomConditions.map(
          (item) => item.conditionId
        ),
      ]),
    ];

    // ==================================================
    // 7. GET UNIQUE CONDITIONS
    // ==================================================

    const matchedConditions =
      conditionIds.length > 0
        ? await Condition.find({
            snomedId: {
              $in: conditionIds,
            },
          }).lean()
        : [];

    /*
      Remove duplicate condition names.
    */

    const conditionMap = new Map();

    matchedConditions.forEach((condition) => {
      if (!conditionMap.has(condition.name)) {
        conditionMap.set(
          condition.name,
          condition
        );
      }
    });

    const possibleConditions =
      Array.from(conditionMap.values());

    // ==================================================
    // 8. CONDITION → SPECIALTY
    // ==================================================

    const conditionSpecialties =
      conditionIds.length > 0
        ? await ConditionSpecialty.find({
            conditionId: {
              $in: conditionIds,
            },
          }).lean()
        : [];

    const specialtyIds = [
      ...new Set(
        conditionSpecialties.map(
          (item) => item.specialtyId
        )
      ),
    ];

    // ==================================================
    // 9. GET SPECIALTIES
    // ==================================================

    const specialtiesFromConditions =
      specialtyIds.length > 0
        ? await Specialty.find({
            specialtyId: {
              $in: specialtyIds,
            },
          }).lean()
        : [];

    // Combine directly searched specialties
    // with specialties obtained from conditions.

    const specialtyMap = new Map();

    [
      ...directSpecialties,
      ...specialtiesFromConditions,
    ].forEach((specialty) => {
      const key = normalizeSpecialty(
        specialty.name
      );

      if (!specialtyMap.has(key)) {
        specialtyMap.set(
          key,
          specialty
        );
      }
    });

    const specialties =
      Array.from(
        specialtyMap.values()
      ).map((specialty) => specialty.name);

    // ==================================================
    // 10. GET DOCTORS FROM SPECIALTIES
    // ==================================================

    let doctorsFromSpecialties = [];

    const specialtyNames = Array.from(
      specialtyMap.values()
    ).map(
      (specialty) => specialty.name
    );

    if (specialtyNames.length > 0) {
      const allDoctors = await Doctor.find({
        isActive: true,
      })
        .select('-password')
        .lean();

      doctorsFromSpecialties =
        allDoctors.filter((doctor) => {
          const doctorSpecialty =
            normalizeSpecialty(
              doctor.specialization || ''
            );

          return specialtyNames.some(
            (specialtyName) =>
              doctorSpecialty ===
              normalizeSpecialty(
                specialtyName
              )
          );
        });
    }

    // ==================================================
    // 11. COMBINE DOCTORS WITHOUT DUPLICATES
    // ==================================================

    const doctorMap = new Map();

    [
      ...doctorsByName,
      ...doctorsBySpecialization,
      ...doctorsFromSpecialties,
    ].forEach((doctor) => {
      doctorMap.set(
        doctor._id.toString(),
        doctor
      );
    });

    // ==================================================
    // 12. CLEAN DOCTOR RESPONSE
    // ==================================================

    const doctors = Array.from(
      doctorMap.values()
    ).map((doctor) => ({
      _id: doctor._id,
      name: doctor.name,
      specialization: doctor.specialization,
      experience: doctor.experience,
      qualifications: doctor.qualifications,
      consultationFee:
        doctor.consultationFee,
      clinicLocation:
        doctor.clinicLocation,
      consultationType:
        doctor.consultationType,
      averageRating:
        doctor.averageRating,
      totalReviews:
        doctor.totalReviews,
      averageConsultationTime:
        doctor.averageConsultationTime,
      availability:
        doctor.availability,
    }));

    // ==================================================
    // 13. FINAL CLEAN RESPONSE
    // ==================================================

    return res.json({
      success: true,
      query,

      symptoms,

      possibleConditions:
        possibleConditions.map(
          (condition) => condition.name
        ),

      specialties,

      doctors,
    });

  } catch (error) {
    console.error(
      'Search error:',
      error
    );

    return res.status(500).json({
      success: false,
      message: 'Search failed',
    });
  }
});

export default router;