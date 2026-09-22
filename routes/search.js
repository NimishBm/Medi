import express from "express";

import Doctor from "../models/Doctor.js";

import Symptom from "../models/Symptom.js";

import SymptomCondition from "../models/SymptomCondition.js";

import ConditionSpecialty from "../models/ConditionSpecialty.js";

import Specialty from "../models/Specialty.js";

const router = express.Router();

const escapeRegex = (text) => {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const normalizeSpecialty = (value = "") => {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, "");
};

// Confidence vocabulary used by BODHI's own likelihood/weight fields
const CONFIDENCE_RANK = {
  zero: 0,
  rare: 1,
  low: 2,
  medium: 3,
  high: 4,
  very_high: 5,
};

const confidenceRank = (value = "") =>
  CONFIDENCE_RANK[value.toLowerCase().trim()] ?? 0;

const keepStrongestConfidence = (items, getLevel) => {
  if (items.length === 0) return items;

  const maxRank = Math.max(
    ...items.map((item) => confidenceRank(getLevel(item)))
  );

  return items.filter(
    (item) => confidenceRank(getLevel(item)) === maxRank
  );
};

// ==========================================
// SYMPTOM SUGGESTIONS
// ==========================================

router.get("/suggestions", async (req, res) => {
  try {
    const query = (req.query.q || "").trim();

    if (query.length < 2) {
      return res.json({
        success: true,
        suggestions: [],
      });
    }

    const searchRegex = new RegExp(
      escapeRegex(query),
      "i"
    );

    const matchedSymptoms = await Symptom.find({
      $or: [
        { name: searchRegex },
        { rootSnomedName: searchRegex },
      ],
    })
      .limit(8)
      .lean();

    const suggestions = [
      ...new Set(
        matchedSymptoms
          .map((symptom) => symptom.name)
          .filter(Boolean)
      ),
    ];

    return res.json({
      success: true,
      suggestions,
    });
  } catch (error) {
    console.error("Suggestions error:", error);

    return res.status(500).json({
      success: false,
      message: "Suggestions failed",
      error: error.message,
    });
  }
});

// ==========================================
// MAIN SEARCH
// ==========================================

router.get("/", async (req, res) => {
  try {
    const query = (req.query.q || "").trim();

    if (!query) {
      return res.json({ success: true, doctors: [] });
    }

    const searchRegex = new RegExp(
      escapeRegex(query),
      "i"
    );

    // ==========================================
    // 1. SEARCH DOCTOR NAME
    // ==========================================

    const doctorsByName = await Doctor.find({
      isActive: true,
      name: searchRegex,
      verificationStatus: { $ne: 'REJECTED' }
    })
      .select("-password")
      .lean();

    // ==========================================
    // 2. SEARCH SPECIALIZATION
    // ==========================================

    const doctorsBySpecialization =
      await Doctor.find({
        isActive: true,
        specialization: searchRegex,
        verificationStatus: { $ne: 'REJECTED' }
      })
        .select("-password")
        .lean();

    // ==========================================
    // 3. SEARCH ORGANIZATION
    // ==========================================

    const doctorsByOrganization =
      await Doctor.find({
        isActive: true,
        organization: searchRegex,
        verificationStatus: { $ne: 'REJECTED' }
      })
        .select("-password")
        .lean();

    // ==========================================
    // REMOVE DUPLICATES
    // ==========================================

    const directDoctorMap = new Map();

    [
      ...doctorsByName,
      ...doctorsBySpecialization,
      ...doctorsByOrganization,
    ].forEach((doctor) => {
      directDoctorMap.set(
        doctor._id.toString(),
        doctor
      );
    });

    // ==========================================
    // 4. IF DOCTOR / SPECIALIZATION /
    //    ORGANIZATION FOUND
    //    RETURN DIRECTLY
    //    DO NOT TOUCH BODHI
    // ==========================================

    if (directDoctorMap.size > 0) {
      return res.json({
        success: true,
        doctors: Array.from(directDoctorMap.values()),
        searchType: "doctor",
      });
    }

    // ==========================================
    // 5. SEARCH SYMPTOM FROM BODHI
    // ==========================================

    const matchedSymptoms = await Symptom.find({
      $or: [
        { name: searchRegex },
        { rootSnomedName: searchRegex },
      ],
    }).lean();

    if (matchedSymptoms.length === 0) {
      return res.json({
        success: true,
        doctors: [],
        searchType: "none",
        message:
          "No matching doctors or symptoms found",
      });
    }

    // ==========================================
    // 6. SYMPTOM → CONDITION
    // ==========================================

    const symptomIds = matchedSymptoms.map(
      (symptom) => symptom.uuid
    );

    const symptomConditions =
      await SymptomCondition.find({
        symptomId: { $in: symptomIds },
      }).lean();

    const strongestSymptomConditions =
      keepStrongestConfidence(
        symptomConditions,
        (item) =>
          item.likelihoodConditionGivenSymptom
      );

    const conditionIds = [
      ...new Set(
        strongestSymptomConditions.map(
          (item) => item.conditionId
        )
      ),
    ];

    if (conditionIds.length === 0) {
      return res.json({
        success: true,
        doctors: [],
        searchType: "symptom",
      });
    }

    // ==========================================
    // 7. CONDITION → SPECIALTY
    // ==========================================

    const conditionSpecialties =
      await ConditionSpecialty.find({
        conditionId: { $in: conditionIds },
      }).lean();

    const strongestConditionSpecialties =
      keepStrongestConfidence(
        conditionSpecialties,
        (item) => item.weight
      );

    const specialtyLinkCounts = new Map();

    strongestConditionSpecialties.forEach(
      (item) => {
        specialtyLinkCounts.set(
          item.specialtyId,
          (specialtyLinkCounts.get(
            item.specialtyId
          ) || 0) + 1
        );
      }
    );

    if (specialtyLinkCounts.size === 0) {
      return res.json({
        success: true,
        doctors: [],
        searchType: "symptom",
      });
    }

    const maxSpecialtyLinkCount = Math.max(
      ...specialtyLinkCounts.values()
    );

    // Search-logic constant
    const MIN_SPECIALTY_LINK_SHARE = 0.5;

    const specialtyIds = [
      ...specialtyLinkCounts.entries(),
    ]
      .filter(
        ([, count]) =>
          count >=
          Math.ceil(
            maxSpecialtyLinkCount *
              MIN_SPECIALTY_LINK_SHARE
          )
      )
      .map(([specialtyId]) => specialtyId);

    if (specialtyIds.length === 0) {
      return res.json({
        success: true,
        doctors: [],
        searchType: "symptom",
      });
    }

    // ==========================================
    // 8. GET SPECIALTY NAMES FROM BODHI
    // ==========================================

    const specialties = await Specialty.find({
      specialtyId: { $in: specialtyIds },
    }).lean();

    const specialtyNames = specialties
      .map((specialty) => specialty.name)
      .filter(Boolean);

    // ==========================================
    // 9. MATCH BODHI SPECIALTY WITH
    //    OUR DOCTORS
    // ==========================================

    const allDoctors = await Doctor.find({
      isActive: true,
      verificationStatus: { $ne: 'REJECTED' }
    })
      .select("-password")
      .lean();

    const normalizedSpecialties =
      specialtyNames.map(normalizeSpecialty);

    const doctorsFromSymptoms =
      allDoctors.filter((doctor) => {
        const doctorSpecialization =
          normalizeSpecialty(
            doctor.specialization || ""
          );

        return normalizedSpecialties.includes(
          doctorSpecialization
        );
      });

    // ==========================================
    // 10. RETURN OUR DOCTORS
    //     ORGANIZATION DETAILS ARE INCLUDED
    //     AUTOMATICALLY FROM DOCTORS COLLECTION
    // ==========================================

    return res.json({
      success: true,
      doctors: doctorsFromSymptoms,
      searchType: "symptom",
    });
  } catch (error) {
    console.error("Search error:", error);

    return res.status(500).json({
      success: false,
      message: "Search failed",
      error: error.message,
    });
  }
});

export default router;