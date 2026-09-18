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

// Confidence vocabulary used by BODHI's own likelihood/weight fields,
// ranked so we can keep only the strongest links instead of every
// link ever recorded (which is what was pulling in ~all specialties).
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

// Keeps only the items at the strongest confidence level present,
// falling back to weaker levels only if nothing stronger exists,
// so a real match is never reduced to zero results.
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
// SYMPTOM SUGGESTIONS (autocomplete)
// Pulled live from the BODHI Symptom collection —
// never a hardcoded word list.
// ==========================================

router.get("/suggestions", async (req, res) => {
  try {
    const query = (req.query.q || "").trim();

    if (query.length < 2) {
      return res.json({ success: true, suggestions: [] });
    }

    const searchRegex = new RegExp(escapeRegex(query), "i");

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

    return res.json({ success: true, suggestions });
  } catch (error) {
    console.error("Suggestions error:", error);

    return res.status(500).json({
      success: false,
      message: "Suggestions failed",
      error: error.message,
    });
  }
});

router.get("/", async (req, res) => {
  try {
    const query = (req.query.q || "").trim();

    // Minimum 4 characters
    if (query.length < 4) {
      return res.json({
        success: true,
        doctors: [],
        message: "Enter at least 4 characters to search",
      });
    }

    const searchRegex = new RegExp(
      escapeRegex(query),
      "i"
    );

    // ==========================================
    // 1. SEARCH DOCTOR NAME FROM OUR DB
    // ==========================================

    const doctorsByName = await Doctor.find({
      isActive: true,
      name: searchRegex,
    })
      .select("-password")
      .lean();

    // ==========================================
    // 2. SEARCH SPECIALIZATION FROM OUR DB
    // ==========================================

    const doctorsBySpecialization =
      await Doctor.find({
        isActive: true,
        specialization: searchRegex,
      })
        .select("-password")
        .lean();

    // Remove duplicates
    const directDoctorMap = new Map();

    [
      ...doctorsByName,
      ...doctorsBySpecialization,
    ].forEach((doctor) => {
      directDoctorMap.set(
        doctor._id.toString(),
        doctor
      );
    });

    // ==========================================
    // 3. IF NAME/SPECIALIZATION FOUND
    //    RETURN OUR DOCTORS DIRECTLY
    //    DO NOT TOUCH BODHI
    // ==========================================

    if (directDoctorMap.size > 0) {
      return res.json({
        success: true,
        doctors: Array.from(
          directDoctorMap.values()
        ),
        searchType: "doctor",
      });
    }

    // ==========================================
    // 4. SEARCH SYMPTOM FROM BODHI
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
    // 5. SYMPTOM → CONDITION
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
        (item) => item.likelihoodConditionGivenSymptom
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
    // 6. CONDITION → SPECIALTY
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

    // A specialty can show up with just one strong link while another
    // specialty has many. Counting how often each specialty appears
    // lets us keep only the specialties that are repeatedly, not just
    // once, linked at the strongest confidence level.
    const specialtyLinkCounts = new Map();

    strongestConditionSpecialties.forEach((item) => {
      specialtyLinkCounts.set(
        item.specialtyId,
        (specialtyLinkCounts.get(item.specialtyId) || 0) + 1
      );
    });

    const maxSpecialtyLinkCount = Math.max(
      ...specialtyLinkCounts.values()
    );

    // Search-logic constant (like the 4-char minimum), not medical data.
    const MIN_SPECIALTY_LINK_SHARE = 0.5;

    const specialtyIds = [...specialtyLinkCounts.entries()]
      .filter(
        ([, count]) =>
          count >=
          Math.ceil(
            maxSpecialtyLinkCount * MIN_SPECIALTY_LINK_SHARE
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
    // 7. GET SPECIALTY NAMES FROM BODHI DB
    // ==========================================

    const specialties = await Specialty.find({
      specialtyId: { $in: specialtyIds },
    }).lean();

    const specialtyNames = specialties
      .map((specialty) => specialty.name)
      .filter(Boolean);

    // ==========================================
    // 8. MATCH BODHI SPECIALTY WITH OUR
    //    DOCTORS COLLECTION
    // ==========================================

    const allDoctors = await Doctor.find({
      isActive: true,
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
    // 9. RETURN OUR DOCTORS
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