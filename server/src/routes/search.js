import express from 'express';

import Doctor from '../models/Doctor.js';

import Symptom from '../models/Symptom.js';

import Condition from '../models/Condition.js';

import Specialty from '../models/Specialty.js';

import SymptomCondition from '../models/SymptomCondition.js';

import ConditionSpecialty from '../models/ConditionSpecialty.js';

const router = express.Router();


// ======================================================
// HELPER FUNCTIONS
// ======================================================

// Escape special characters before creating RegExp
const escapeRegex = (value) => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};


// Normalize specialty names
// Example:
// "ENT specialist" -> "ent"
// "ENT"            -> "ent"
const normalizeSpecialty = (name) => {
  return name
    .toLowerCase()
    .replace(/\bspecialist\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};


// ======================================================
// SEARCH API
// GET /api/search?q=...
// ======================================================

router.get('/', async (req, res) => {
  try {
    const query = req.query.q?.trim();


    // --------------------------------------------------
    // 1. Validate search query
    // --------------------------------------------------

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
    // 2. SEARCH DOCTORS BY NAME
    // ==================================================

    const doctorsByName = await Doctor.find({
      isActive: true,
      name: searchRegex,
    }).select('-password');


    // ==================================================
    // 3. SEARCH DOCTORS BY SPECIALIZATION
    // ==================================================

    const doctorsBySpecialization = await Doctor.find({
      isActive: true,
      specialization: searchRegex,
    }).select('-password');


    // ==================================================
    // 4. SEARCH SPECIALTY IN BODHI
    // ==================================================

    const directSpecialties = await Specialty.find({
      name: searchRegex,
    });


    // ==================================================
    // 5. SEARCH CONDITIONS / DISEASES
    // ==================================================

    const directConditions = await Condition.find({
      name: searchRegex,
    });


    // ==================================================
    // 6. SEARCH SYMPTOMS
    // ==================================================

    const symptoms = await Symptom.find({
      name: searchRegex,
    });


    // ==================================================
    // 7. SYMPTOM → CONDITION
    // ==================================================

    const symptomIds = symptoms.map(
      (symptom) => symptom.uuid
    );


    const symptomConditions =
      symptomIds.length > 0
        ? await SymptomCondition.find({
            symptomId: {
              $in: symptomIds,
            },
          })
        : [];


    const conditionIdsFromSymptoms = [
      ...new Set(
        symptomConditions.map(
          (item) => item.conditionId
        )
      ),
    ];


    // ==================================================
    // 8. COMBINE CONDITIONS
    // ==================================================

    const allConditionIds = [
      ...new Set([
        // Conditions found directly
        ...directConditions.map(
          (condition) => condition.snomedId
        ),

        // Conditions found through symptoms
        ...conditionIdsFromSymptoms,
      ]),
    ];


    // ==================================================
    // 9. CONDITION → SPECIALTY
    // ==================================================

    const conditionSpecialties =
      allConditionIds.length > 0
        ? await ConditionSpecialty.find({
            conditionId: {
              $in: allConditionIds,
            },
          })
        : [];


    const specialtyIdsFromConditions = [
      ...new Set(
        conditionSpecialties.map(
          (item) => item.specialtyId
        )
      ),
    ];


    // ==================================================
    // 10. GET SPECIALTY DOCUMENTS
    // ==================================================

    const specialtiesFromConditions =
      specialtyIdsFromConditions.length > 0
        ? await Specialty.find({
            specialtyId: {
              $in: specialtyIdsFromConditions,
            },
          })
        : [];


    // ==================================================
    // 11. COMBINE SPECIALTIES
    // ==================================================

    const specialtyMap = new Map();


    [
      ...directSpecialties,
      ...specialtiesFromConditions,
    ].forEach((specialty) => {
      specialtyMap.set(
        specialty.specialtyId,
        specialty
      );
    });


    const relatedSpecialties =
      Array.from(
        specialtyMap.values()
      );


    // ==================================================
    // 12. GET ALL ACTIVE DOCTORS FROM MONGODB
    // ==================================================

    const allDoctors = await Doctor.find({
      isActive: true,
    }).select('-password');


    // ==================================================
    // 13. FIND DOCTORS FROM DIRECT SPECIALTY SEARCH
    // ==================================================

    let doctorsFromSpecialties = [];


    if (directSpecialties.length > 0) {

      // User searched a specialty directly
      // Example: ENT
      // Only match doctors belonging to ENT

      const directSpecialtyNames =
        directSpecialties.map(
          (specialty) => specialty.name
        );


      doctorsFromSpecialties =
        allDoctors.filter((doctor) => {

          const doctorSpecialty =
            normalizeSpecialty(
              doctor.specialization || ''
            );


          return directSpecialtyNames.some(
            (specialtyName) => {

              return (
                doctorSpecialty ===
                normalizeSpecialty(
                  specialtyName
                )
              );

            }
          );

        });

    }


    // ==================================================
    // 14. FIND DOCTORS FROM CONDITION/SYMPTOM SEARCH
    // ==================================================

    else if (
      specialtiesFromConditions.length > 0
    ) {

      // User searched a symptom or condition
      //
      // Example:
      // Headache
      // ↓
      // Conditions
      // ↓
      // Specialties
      // ↓
      // Doctors

      const bodhiSpecialtyNames =
        specialtiesFromConditions.map(
          (specialty) => specialty.name
        );


      doctorsFromSpecialties =
        allDoctors.filter((doctor) => {

          const doctorSpecialty =
            normalizeSpecialty(
              doctor.specialization || ''
            );


          return bodhiSpecialtyNames.some(
            (specialtyName) => {

              return (
                doctorSpecialty ===
                normalizeSpecialty(
                  specialtyName
                )
              );

            }
          );

        });

    }


    // ==================================================
    // 15. COMBINE ALL DOCTORS
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
    // 16. GET FINAL CONDITIONS
    // ==================================================

    const finalConditions =
      allConditionIds.length > 0
        ? await Condition.find({
            snomedId: {
              $in: allConditionIds,
            },
          })
        : [];


    // ==================================================
    // 17. RESPONSE
    // ==================================================

    return res.json({
      success: true,
      query,

      // Actual doctors from YOUR MongoDB
      doctors: Array.from(
        doctorMap.values()
      ),

      // Matching symptoms from BODHI
      symptoms,

      // Matching conditions from BODHI
      conditions: finalConditions,

      // Relevant specialties from BODHI
      specialties: relatedSpecialties,
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