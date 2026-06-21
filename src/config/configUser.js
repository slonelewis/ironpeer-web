/////////////////////////////////////////////////////////
// IronPeer user configuration                         //
/////////////////////////////////////////////////////////

/**
 * User types for IronPeer:
 *   renter  — Someone who rents equipment
 *   owner   — Someone who lists equipment for rent
 *   hauler  — Someone who provides haul/transport services
 *
 * User fields define what's collected at signup and on the profile.
 */

export const userTypes = [
  {
    userType: 'owner',
    label: 'List',
    description: 'I have equipment I want to list and earn money renting it out.',
  },
  {
    userType: 'renter',
    label: 'Rent',
    description: 'I want to rent equipment for personal or professional use.',
  },
  {
    userType: 'hauler',
    label: 'Haul',
    description: 'I want to haul and transport equipment for owners and renters.',
  },
];

export const userFields = [
  // ── Shared: phone number (all user types) ────────────────────────────────────
  {
    key: 'phoneNumber',
    scope: 'protected',
    schemaType: 'text',
    showConfig: {
      label: 'Phone number',
      displayInProfile: false, // keep private
    },
    saveConfig: {
      label: 'Phone number',
      placeholderMessage: 'e.g. (360) 555-1234',
      isRequired: false,
      displayInSignUp: true,
    },
    userTypeConfig: {
      limitToUserTypeIds: false,
    },
  },

  // ── Owner + Hauler: account type (individual vs business) ───────────────────
  {
    key: 'accountType',
    scope: 'protected',
    schemaType: 'enum',
    enumOptions: [
      { option: 'individual', label: 'Individual' },
      { option: 'business', label: 'Business / LLC' },
    ],
    showConfig: {
      label: 'Account type',
      displayInProfile: false,
    },
    saveConfig: {
      label: 'Are you listing as an individual or a business?',
      placeholderMessage: 'Select one',
      isRequired: true,
      displayInSignUp: true,
    },
    userTypeConfig: {
      limitToUserTypeIds: true,
      userTypeIds: ['owner', 'hauler'],
    },
  },

  // ── Owner + Hauler (business only): business name ───────────────────────────
  {
    key: 'businessName',
    scope: 'protected',
    schemaType: 'text',
    showConfig: {
      label: 'Business name',
      displayInProfile: false,
    },
    saveConfig: {
      label: 'Business name',
      placeholderMessage: 'e.g. Lewis Equipment LLC',
      isRequired: false,
      displayInSignUp: true,
    },
    userTypeConfig: {
      limitToUserTypeIds: true,
      userTypeIds: ['owner', 'hauler'],
    },
  },

  // ── Owner + Hauler (business only): EIN ─────────────────────────────────────
  {
    key: 'ein',
    scope: 'protected',
    schemaType: 'text',
    showConfig: {
      label: 'EIN',
      displayInProfile: false,
    },
    saveConfig: {
      label: 'Employer Identification Number (EIN)',
      placeholderMessage: 'e.g. 12-3456789',
      isRequired: false,
      displayInSignUp: false, // collected at payout setup, not signup
    },
    userTypeConfig: {
      limitToUserTypeIds: true,
      userTypeIds: ['owner', 'hauler'],
    },
  },

  // ── Hauler: driver's license number ─────────────────────────────────────────
  {
    key: 'driversLicenseState',
    scope: 'protected',
    schemaType: 'text',
    showConfig: {
      label: "Driver's license state",
      displayInProfile: false,
    },
    saveConfig: {
      label: "Driver's license state (2-letter, e.g. WA)",
      placeholderMessage: 'WA',
      isRequired: true,
      displayInSignUp: true,
    },
    userTypeConfig: {
      limitToUserTypeIds: true,
      userTypeIds: ['hauler'],
    },
  },

  // ── Hauler: vehicle type ─────────────────────────────────────────────────────
  {
    key: 'vehicleType',
    scope: 'public',
    schemaType: 'enum',
    enumOptions: [
      { option: 'pickup-gooseneck', label: 'Pickup + gooseneck trailer' },
      { option: 'pickup-bumper', label: 'Pickup + bumper pull trailer' },
      { option: 'semi-lowboy', label: 'Semi + lowboy trailer' },
      { option: 'semi-flatbed', label: 'Semi + flatbed trailer' },
      { option: 'other', label: 'Other' },
    ],
    showConfig: {
      label: 'Vehicle / trailer type',
    },
    saveConfig: {
      label: 'What do you haul with?',
      isRequired: true,
      displayInSignUp: true,
    },
    userTypeConfig: {
      limitToUserTypeIds: true,
      userTypeIds: ['hauler'],
    },
  },

  // ── Hauler: max haul weight ──────────────────────────────────────────────────
  {
    key: 'maxHaulWeightLbs',
    scope: 'public',
    schemaType: 'long',
    showConfig: {
      label: 'Max haul weight (lbs)',
    },
    saveConfig: {
      label: 'Max haul weight (lbs)',
      placeholderMessage: 'e.g. 20000',
      isRequired: false,
      displayInSignUp: true,
    },
    userTypeConfig: {
      limitToUserTypeIds: true,
      userTypeIds: ['hauler'],
    },
  },
];
