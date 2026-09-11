const DEMO_ENTITIES = ['Decedent', 'PersonalEffect', 'StorageUnit', 'CustodyLog', 'Examination', 'Release', 'HospitalTransfer'];

export async function countDemoData(base44) {
  const counts = {};
  let total = 0;
  for (const entity of DEMO_ENTITIES) {
    const allRecords = await base44.entities[entity].filter({}, undefined, 1000);
    const demoCount = allRecords.filter(r => r.is_demo_data === true).length;
    const oldCount = allRecords.filter(r => r.is_demo_data !== true && r.is_demo_data !== false).length;
    counts[entity] = demoCount + oldCount;
    total += demoCount + oldCount;
  }
  return { counts, total, hospitals: ['oakville', 'milton', 'georgetown'] };
}

export async function deleteDemoData(base44) {
  const deleted = {};
  const deleteOrder = ['PersonalEffect', 'CustodyLog', 'Examination', 'Release', 'HospitalTransfer', 'Decedent', 'StorageUnit'];
  for (const entity of deleteOrder) {
    let count = 0;
    const demoRecords = await base44.entities[entity].filter({ is_demo_data: true }, undefined, 1000);
    if (demoRecords.length > 0) {
      await base44.entities[entity].deleteMany({ is_demo_data: true });
      count += demoRecords.length;
    }
    const allRecords = await base44.entities[entity].filter({}, undefined, 1000);
    const oldRecords = allRecords.filter(r => r.is_demo_data !== true && r.is_demo_data !== false);
    for (const r of oldRecords) {
      await base44.entities[entity].delete(r.id);
      count++;
    }
    deleted[entity] = count;
  }
  return deleted;
}

export async function generateDemoData(base44, user) {
  const now = new Date();
  const dt = (daysAgo, hour = 10, minute = 0) => {
    const d = new Date(now);
    d.setDate(d.getDate() - daysAgo);
    d.setHours(hour, minute, 0, 0);
    return d.toISOString();
  };
  let caseCounter = 1000;
  const genCaseNum = () => `MS-2026-${String(++caseCounter).padStart(4, '0')}`;

  // === Storage Units ===
  const storageUnitDefs = [
    { label: 'Room A - Rack 1 - Tray 1', room: 'Room A', unit_type: 'refrigerated_tray', capacity: 1, temp: 4, hospital: 'oakville' },
    { label: 'Room A - Rack 1 - Tray 2', room: 'Room A', unit_type: 'refrigerated_tray', capacity: 1, temp: 4, hospital: 'oakville' },
    { label: 'Room A - Rack 1 - Tray 3', room: 'Room A', unit_type: 'refrigerated_tray', capacity: 1, temp: 4, hospital: 'oakville' },
    { label: 'Room A - Rack 2 - Tray 1', room: 'Room A', unit_type: 'refrigerated_tray', capacity: 1, temp: 4, hospital: 'oakville' },
    { label: 'Room B - Freezer 1', room: 'Room B', unit_type: 'freezer_compartment', capacity: 1, temp: -18, hospital: 'oakville' },
    { label: 'Room B - Freezer 2', room: 'Room B', unit_type: 'freezer_compartment', capacity: 1, temp: -18, hospital: 'oakville' },
    { label: 'Isolation Unit 1', room: 'Isolation', unit_type: 'isolation_unit', capacity: 1, temp: 4, hospital: 'oakville' },
    { label: 'Decomp Unit 1', room: 'Decomp', unit_type: 'decomp_unit', capacity: 1, temp: 4, hospital: 'oakville' },
    { label: 'Room C - Rack 1 - Tray 1', room: 'Room C', unit_type: 'refrigerated_tray', capacity: 1, temp: 4, hospital: 'milton' },
    { label: 'Room C - Rack 1 - Tray 2', room: 'Room C', unit_type: 'refrigerated_tray', capacity: 1, temp: 4, hospital: 'milton' },
    { label: 'Room C - Rack 1 - Tray 3', room: 'Room C', unit_type: 'refrigerated_tray', capacity: 1, temp: 4, hospital: 'milton' },
    { label: 'Room C - Rack 2 - Tray 1', room: 'Room C', unit_type: 'refrigerated_tray', capacity: 1, temp: 4, hospital: 'milton' },
    { label: 'Cooler 1 - Bay A', room: 'Cooler 1', unit_type: 'freezer_compartment', capacity: 1, temp: -18, hospital: 'milton' },
    { label: 'Cooler 1 - Bay B', room: 'Cooler 1', unit_type: 'freezer_compartment', capacity: 1, temp: -18, hospital: 'milton' },
    { label: 'Room D - Rack 1 - Tray 1', room: 'Room D', unit_type: 'refrigerated_tray', capacity: 1, temp: 4, hospital: 'georgetown' },
    { label: 'Room D - Rack 1 - Tray 2', room: 'Room D', unit_type: 'refrigerated_tray', capacity: 1, temp: 4, hospital: 'georgetown' },
    { label: 'Room D - Rack 1 - Tray 3', room: 'Room D', unit_type: 'refrigerated_tray', capacity: 1, temp: 4, hospital: 'georgetown' },
    { label: 'Bay 1 - Freezer', room: 'Bay 1', unit_type: 'freezer_compartment', capacity: 1, temp: -18, hospital: 'georgetown' },
    { label: 'Bay 2 - Freezer', room: 'Bay 2', unit_type: 'freezer_compartment', capacity: 1, temp: -18, hospital: 'georgetown' },
  ];

  const storageUnits = await base44.entities.StorageUnit.bulkCreate(
    storageUnitDefs.map(u => ({
      label: u.label, room: u.room, unit_type: u.unit_type, capacity: u.capacity,
      current_occupancy: 0, temperature_celsius: u.temp, status: 'available',
      hospital_location: u.hospital, is_demo_data: true,
    }))
  );
  const unitByLabel = {};
  storageUnits.forEach(u => { unitByLabel[u.label] = u; });

  // === Decedents ===
  const decedentDefs = [
    { uid: genCaseNum(), firstName: 'John', lastName: 'Mitchell', gender: 'male', age: 67, dob: '1959-03-15', status: 'intake', identStatus: 'identified', sourceType: 'hospital', sourceName: 'Oakville Trafalgar Memorial Hospital', floor: 'ICU - 4th Floor', arrival: dt(0, 8, 30), condition: 'intact', hospitalLoc: 'oakville', origHospital: 'oakville', isDonor: 'no', requiresAutopsy: false, nokName: 'Mary Mitchell', nokContact: '905-555-0142', nokRel: 'Spouse', intakeOfficer: 'Sarah Johnson', documentationComplete: false, personalEffectsLogged: false, storageLabel: null },
    { uid: genCaseNum(), firstName: '', lastName: '', gender: 'male', age: 45, dob: null, status: 'intake', identStatus: 'unidentified', sourceType: 'law_enforcement', sourceName: 'Halton Regional Police', floor: null, arrival: dt(0, 6, 15), condition: 'traumatic_injuries', hospitalLoc: 'oakville', origHospital: 'oakville', isDonor: 'unknown', requiresAutopsy: true, nokName: '', nokContact: '', nokRel: '', intakeOfficer: 'Sarah Johnson', documentationComplete: false, personalEffectsLogged: false, physicalDesc: 'Male, approximately 45 years old, 180cm, 80kg, brown hair, tattoo on left forearm', identifyingMarks: 'Scar on right eyebrow, tattoo of eagle on left forearm', storageLabel: null, flags: ['awaiting_identification'] },
    { uid: genCaseNum(), firstName: 'Sarah', lastName: 'Chen', gender: 'female', age: 38, dob: '1988-07-22', status: 'examination', identStatus: 'identified', sourceType: 'law_enforcement', sourceName: 'Halton Regional Police - Coroner Office', floor: 'Examination Room 2', arrival: dt(2, 14, 0), condition: 'traumatic_injuries', hospitalLoc: 'oakville', origHospital: 'oakville', isDonor: 'no', requiresAutopsy: true, nokName: 'David Chen', nokContact: '905-555-0188', nokRel: 'Brother', intakeOfficer: 'Sarah Johnson', assignedPathologist: 'Dr. Michael Reeves', documentationComplete: true, personalEffectsLogged: true, causeOfDeath: 'Pending autopsy', mannerOfDeath: 'pending', lawEnforcementCase: 'HRP-2026-0847', storageLabel: 'Room A - Rack 1 - Tray 1', flags: ['coroner_case', 'requires_autopsy'] },
    { uid: genCaseNum(), firstName: 'Margaret', lastName: 'Thompson', gender: 'female', age: 72, dob: '1954-01-10', status: 'storage', identStatus: 'identified', sourceType: 'hospital', sourceName: 'Oakville Trafalgar Memorial Hospital', floor: 'Palliative Care - 3rd Floor', arrival: dt(3, 11, 0), condition: 'intact', hospitalLoc: 'oakville', origHospital: 'oakville', isDonor: 'yes', donorRegNum: 'OD-2024-88472', donorCardVerified: 'yes', donorVerMethod: 'Provincial Donor Registry', donationOrg: 'Trillium Gift of Life Network', donationCoordName: 'Jennifer Park', donationCoordContact: '416-555-0199', organsForDonation: ['kidneys', 'liver', 'corneas'], donationStatus: 'approved_for_recovery', recoveryTeam: 'Trillium Recovery Team A', recoveryDatetime: dt(1, 9, 0), recoveryFacility: 'Trillium Recovery Centre', nokName: 'Robert Thompson', nokContact: '905-555-0234', nokRel: 'Son', intakeOfficer: 'Sarah Johnson', documentationComplete: true, personalEffectsLogged: true, causeOfDeath: 'Cardiac arrest', mannerOfDeath: 'natural', storageLabel: 'Room A - Rack 1 - Tray 2', flags: ['organ_donor'] },
    { uid: genCaseNum(), firstName: 'William', lastName: 'Davies', gender: 'male', age: 81, dob: '1945-06-30', status: 'released', identStatus: 'identified', sourceType: 'hospital', sourceName: 'Oakville Trafalgar Memorial Hospital', floor: 'General Ward - 2nd Floor', arrival: dt(8, 10, 0), condition: 'intact', hospitalLoc: 'oakville', origHospital: 'oakville', isDonor: 'no', requiresAutopsy: false, nokName: 'Elizabeth Davies', nokContact: '905-555-0311', nokRel: 'Daughter', intakeOfficer: 'James Park', documentationComplete: true, personalEffectsLogged: true, causeOfDeath: 'Pneumonia', mannerOfDeath: 'natural', storageLabel: null },
    { uid: genCaseNum(), firstName: 'Robert', lastName: 'Foster', gender: 'male', age: 64, dob: '1962-09-18', status: 'storage', identStatus: 'identified', sourceType: 'hospital', sourceName: 'Oakville Trafalgar Memorial Hospital', floor: 'ER', arrival: dt(10, 22, 0), condition: 'intact', hospitalLoc: 'oakville', origHospital: 'oakville', isDonor: 'no', requiresAutopsy: false, nokName: 'Patricia Foster', nokContact: '905-555-0456', nokRel: 'Wife', intakeOfficer: 'Sarah Johnson', documentationComplete: true, personalEffectsLogged: false, causeOfDeath: 'Stroke', mannerOfDeath: 'natural', storageLabel: 'Room A - Rack 1 - Tray 3', flags: ['extended_holding'] },
    { uid: genCaseNum(), firstName: 'Elizabeth', lastName: 'Wong', gender: 'female', age: 55, dob: '1971-04-12', status: 'storage', identStatus: 'identified', sourceType: 'hospital', sourceName: 'Oakville Trafalgar Memorial Hospital', floor: 'ICU - 4th Floor', arrival: dt(4, 15, 30), condition: 'intact', hospitalLoc: 'oakville', origHospital: 'oakville', isDonor: 'no', requiresAutopsy: false, nokName: 'Thomas Wong', nokContact: '905-555-0578', nokRel: 'Son', intakeOfficer: 'James Park', documentationComplete: true, personalEffectsLogged: true, causeOfDeath: 'Heart failure', mannerOfDeath: 'natural', documents: ['https://example.com/demo-doc1.pdf', 'https://example.com/demo-doc2.pdf'], storageLabel: 'Room B - Freezer 1' },
    { uid: genCaseNum(), firstName: 'David', lastName: "O'Brien", gender: 'male', age: 59, dob: '1967-12-05', status: 'storage', identStatus: 'identified', sourceType: 'hospital', sourceName: 'Milton District Hospital', floor: 'ICU', arrival: dt(1, 16, 0), condition: 'intact', hospitalLoc: 'oakville', origHospital: 'milton', isDonor: 'no', requiresAutopsy: false, nokName: "Maureen O'Brien", nokContact: '905-555-0633', nokRel: 'Wife', intakeOfficer: 'Lisa Chen', documentationComplete: true, personalEffectsLogged: false, causeOfDeath: 'Cancer', mannerOfDeath: 'natural', storageLabel: 'Room A - Rack 2 - Tray 1', flags: ['inter_hospital_transfer'] },
    { uid: genCaseNum(), firstName: 'Emily', lastName: 'Carter', gender: 'female', age: 47, dob: '1979-02-28', status: 'intake', identStatus: 'identified', sourceType: 'hospital', sourceName: 'Milton District Hospital', floor: 'General Ward - 3rd Floor', arrival: dt(1, 9, 0), condition: 'intact', hospitalLoc: 'milton', origHospital: 'milton', isDonor: 'no', requiresAutopsy: false, nokName: 'Richard Carter', nokContact: '905-555-0712', nokRel: 'Husband', intakeOfficer: 'Lisa Chen', documentationComplete: false, personalEffectsLogged: false, storageLabel: 'Room C - Rack 1 - Tray 1', flags: ['awaiting_documentation'] },
    { uid: genCaseNum(), firstName: 'Thomas', lastName: 'Wright', gender: 'male', age: 70, dob: '1956-08-14', status: 'holding', identStatus: 'identified', sourceType: 'hospital', sourceName: 'Milton District Hospital', floor: 'Palliative Care', arrival: dt(5, 13, 0), condition: 'intact', hospitalLoc: 'milton', origHospital: 'milton', isDonor: 'no', requiresAutopsy: false, nokName: 'Susan Wright', nokContact: '905-555-0823', nokRel: 'Daughter', intakeOfficer: 'Lisa Chen', documentationComplete: true, personalEffectsLogged: true, causeOfDeath: 'Pancreatic cancer', mannerOfDeath: 'natural', storageLabel: 'Cooler 1 - Bay A' },
    { uid: genCaseNum(), firstName: 'Patricia', lastName: 'Murphy', gender: 'female', age: 63, dob: '1963-05-20', status: 'storage', identStatus: 'identified', sourceType: 'hospital', sourceName: 'Milton District Hospital', floor: 'ER', arrival: dt(6, 10, 0), condition: 'intact', hospitalLoc: 'milton', origHospital: 'milton', isDonor: 'no', requiresAutopsy: false, nokName: 'Kevin Murphy', nokContact: '905-555-0945', nokRel: 'Son', intakeOfficer: 'Lisa Chen', assignedPathologist: 'Dr. Amanda Liu', documentationComplete: true, personalEffectsLogged: true, causeOfDeath: 'Heart attack', mannerOfDeath: 'natural', storageLabel: 'Room C - Rack 1 - Tray 2' },
    { uid: genCaseNum(), firstName: 'James', lastName: 'Wilson', gender: 'male', age: 52, dob: '1974-11-03', status: 'storage', identStatus: 'identified', sourceType: 'hospital', sourceName: 'Milton District Hospital', floor: 'ICU', arrival: dt(3, 18, 0), condition: 'intact', hospitalLoc: 'milton', origHospital: 'milton', isDonor: 'no', requiresAutopsy: false, nokName: 'Linda Wilson', nokContact: '905-555-1067', nokRel: 'Wife', intakeOfficer: 'Lisa Chen', documentationComplete: true, personalEffectsLogged: false, causeOfDeath: 'Respiratory failure', mannerOfDeath: 'natural', storageLabel: 'Room C - Rack 1 - Tray 3' },
    { uid: genCaseNum(), firstName: 'Linda', lastName: 'Martinez', gender: 'female', age: 41, dob: '1985-03-08', status: 'transferred', identStatus: 'identified', sourceType: 'hospital', sourceName: 'Milton District Hospital', floor: 'General Ward', arrival: dt(2, 11, 0), condition: 'intact', hospitalLoc: 'georgetown', origHospital: 'milton', isDonor: 'no', requiresAutopsy: false, nokName: 'Carlos Martinez', nokContact: '905-555-1189', nokRel: 'Husband', intakeOfficer: 'Lisa Chen', documentationComplete: true, personalEffectsLogged: true, causeOfDeath: 'Brain aneurysm', mannerOfDeath: 'natural', storageLabel: null, flags: ['inter_hospital_transfer'] },
    { uid: genCaseNum(), firstName: 'Henry', lastName: 'Walsh', gender: 'male', age: 76, dob: '1950-12-25', status: 'holding', identStatus: 'identified', sourceType: 'hospital', sourceName: 'Georgetown Hospital', floor: 'General Ward', arrival: dt(4, 8, 0), condition: 'intact', hospitalLoc: 'georgetown', origHospital: 'georgetown', isDonor: 'no', requiresAutopsy: false, nokName: 'Margaret Walsh', nokContact: '905-555-1234', nokRel: 'Wife', intakeOfficer: 'David Brown', documentationComplete: true, personalEffectsLogged: true, causeOfDeath: 'Old age', mannerOfDeath: 'natural', storageLabel: null },
    { uid: genCaseNum(), firstName: 'Catherine', lastName: 'Brown', gender: 'female', age: 68, dob: '1958-07-04', status: 'storage', identStatus: 'identified', sourceType: 'hospital', sourceName: 'Georgetown Hospital', floor: 'Palliative Care', arrival: dt(5, 14, 0), condition: 'intact', hospitalLoc: 'georgetown', origHospital: 'georgetown', isDonor: 'no', requiresAutopsy: false, nokName: 'Stephen Brown', nokContact: '905-555-1356', nokRel: 'Son', intakeOfficer: 'David Brown', documentationComplete: true, personalEffectsLogged: true, causeOfDeath: "Alzheimer's complications", mannerOfDeath: 'natural', storageLabel: 'Room D - Rack 1 - Tray 1' },
    { uid: genCaseNum(), firstName: 'Michael', lastName: 'Anderson', gender: 'male', age: 49, dob: '1977-10-15', status: 'storage', identStatus: 'identified', sourceType: 'hospital', sourceName: 'Georgetown Hospital', floor: 'ER', arrival: dt(3, 20, 0), condition: 'decomposed', hospitalLoc: 'georgetown', origHospital: 'georgetown', isDonor: 'unknown', requiresAutopsy: true, nokName: 'Jennifer Anderson', nokContact: '905-555-1478', nokRel: 'Wife', intakeOfficer: 'David Brown', documentationComplete: false, personalEffectsLogged: false, physicalDesc: 'Male, 175cm, 85kg, signs of decomposition', storageLabel: 'Bay 1 - Freezer', flags: ['unresolved_exception', 'requires_autopsy', 'documentation_incomplete'] },
    { uid: genCaseNum(), firstName: 'Dorothy', lastName: 'Lewis', gender: 'female', age: 79, dob: '1947-02-14', status: 'storage', identStatus: 'identified', sourceType: 'hospital', sourceName: 'Georgetown Hospital', floor: 'General Ward', arrival: dt(2, 12, 0), condition: 'intact', hospitalLoc: 'georgetown', origHospital: 'georgetown', isDonor: 'yes', donorRegNum: 'OD-2023-45621', donorCardVerified: 'yes', donorVerMethod: 'Provincial Donor Registry', donationOrg: 'Trillium Gift of Life Network', donationCoordName: 'Mark Stevens', donationCoordContact: '416-555-0200', tissuesForDonation: ['corneas', 'skin', 'bone'], donationStatus: 'recovery_completed', recoveryDatetime: dt(1, 10, 0), recoveryFacility: 'Trillium Recovery Centre', nokName: 'Helen Lewis', nokContact: '905-555-1590', nokRel: 'Daughter', intakeOfficer: 'David Brown', documentationComplete: true, personalEffectsLogged: true, causeOfDeath: 'Stroke', mannerOfDeath: 'natural', storageLabel: 'Room D - Rack 1 - Tray 2', flags: ['tissue_donor'] },
    { uid: genCaseNum(), firstName: 'Kevin', lastName: 'Taylor', gender: 'male', age: 35, dob: '1991-06-08', status: 'intake', identStatus: 'identified', sourceType: 'hospital', sourceName: 'Georgetown Hospital', floor: 'ICU', arrival: dt(0, 7, 45), condition: 'intact', hospitalLoc: 'georgetown', origHospital: 'georgetown', isDonor: 'no', requiresAutopsy: false, nokName: 'Amy Taylor', nokContact: '905-555-1623', nokRel: 'Wife', intakeOfficer: 'David Brown', documentationComplete: false, personalEffectsLogged: false, storageLabel: null },
  ];

  const decedents = await base44.entities.Decedent.bulkCreate(
    decedentDefs.map(d => ({
      unique_id: d.uid, first_name: d.firstName, last_name: d.lastName, date_of_birth: d.dob,
      gender: d.gender, estimated_age: d.age, status: d.status, identification_status: d.identStatus,
      source_type: d.sourceType, source_name: d.sourceName, hospital_floor: d.floor,
      arrival_datetime: d.arrival, condition_on_arrival: d.condition,
      storage_location_id: d.storageLabel ? unitByLabel[d.storageLabel]?.id : null,
      storage_location_label: d.storageLabel, case_number: d.uid, law_enforcement_case: d.lawEnforcementCase,
      intake_officer: d.intakeOfficer, assigned_pathologist: d.assignedPathologist,
      next_of_kin_name: d.nokName, next_of_kin_contact: d.nokContact, next_of_kin_relationship: d.nokRel,
      physical_description: d.physicalDesc, identifying_marks: d.identifyingMarks,
      personal_effects_logged: d.personalEffectsLogged, documentation_complete: d.documentationComplete,
      requires_autopsy: d.requiresAutopsy || false, cause_of_death: d.causeOfDeath, manner_of_death: d.mannerOfDeath,
      flags: d.flags || [], hospital_location: d.hospitalLoc, originating_hospital: d.origHospital,
      is_donor: d.isDonor || 'unknown', donor_registration_number: d.donorRegNum,
      donor_card_verified: d.donorCardVerified, donor_verification_method: d.donorVerMethod,
      donation_organization: d.donationOrg, donation_coordinator_name: d.donationCoordName,
      donation_coordinator_contact: d.donationCoordContact, organs_for_donation: d.organsForDonation,
      tissues_for_donation: d.tissuesForDonation, donation_status: d.donationStatus,
      recovery_team_assigned: d.recoveryTeam, recovery_datetime: d.recoveryDatetime,
      recovery_facility: d.recoveryFacility, documents: d.documents, is_demo_data: true,
    }))
  );
  const decedByUid = {};
  decedents.forEach(d => { decedByUid[d.unique_id] = d; });

  // === Custody Logs ===
  const custodyLogs = [];
  for (const d of decedentDefs) {
    const decedent = decedByUid[d.uid];
    const hl = d.hospitalLoc;
    custodyLogs.push({ decedent_id: decedent.id, decedent_unique_id: d.uid, action_type: 'intake', performed_by: d.intakeOfficer, performed_by_role: 'intake_officer', timestamp: d.arrival, notes: `Intake at ${d.sourceName}.`, verification_method: 'qr_scan', location: 'Intake Bay', hospital_location: hl, is_demo_data: true });
    custodyLogs.push({ decedent_id: decedent.id, decedent_unique_id: d.uid, action_type: 'scan_in', performed_by: d.intakeOfficer, performed_by_role: 'intake_officer', timestamp: d.arrival, notes: 'QR code scanned at intake', verification_method: 'qr_scan', location: 'Intake Bay', hospital_location: hl, is_demo_data: true });
    if (d.storageLabel) {
      custodyLogs.push({ decedent_id: decedent.id, decedent_unique_id: d.uid, action_type: 'moved_to_storage', from_location: 'Intake Bay', to_location: d.storageLabel, performed_by: d.intakeOfficer, performed_by_role: 'intake_officer', timestamp: new Date(new Date(d.arrival).getTime() + 7200000).toISOString(), notes: `Moved to ${d.storageLabel}`, verification_method: 'qr_scan', location: d.storageLabel, hospital_location: hl, is_demo_data: true });
    }
    if (d.personalEffectsLogged) {
      custodyLogs.push({ decedent_id: decedent.id, decedent_unique_id: d.uid, action_type: 'personal_effects_logged', performed_by: d.intakeOfficer, performed_by_role: 'intake_officer', timestamp: new Date(new Date(d.arrival).getTime() + 3600000).toISOString(), notes: 'Personal effects logged and secured', verification_method: 'manual', location: 'Personal Effects Storage', hospital_location: hl, is_demo_data: true });
    }
    if (d.documentationComplete) {
      custodyLogs.push({ decedent_id: decedent.id, decedent_unique_id: d.uid, action_type: 'documentation_updated', performed_by: d.intakeOfficer, performed_by_role: 'intake_officer', timestamp: new Date(new Date(d.arrival).getTime() + 10800000).toISOString(), notes: 'Documentation completed and verified', verification_method: 'digital_signature', location: 'Administration', hospital_location: hl, is_demo_data: true });
    }
    if (d.status === 'examination' || d.requiresAutopsy) {
      custodyLogs.push({ decedent_id: decedent.id, decedent_unique_id: d.uid, action_type: 'moved_to_examination', from_location: d.storageLabel || 'Storage', to_location: 'Examination Room', performed_by: d.assignedPathologist || 'Dr. Michael Reeves', performed_by_role: 'pathologist', timestamp: new Date(new Date(d.arrival).getTime() + 86400000).toISOString(), notes: 'Moved to examination room', verification_method: 'qr_scan', location: 'Examination Room', hospital_location: hl, is_demo_data: true });
    }
    if (d.status === 'holding') {
      custodyLogs.push({ decedent_id: decedent.id, decedent_unique_id: d.uid, action_type: 'moved_to_holding', from_location: d.storageLabel || 'Storage', to_location: 'Holding Area', performed_by: d.intakeOfficer, performed_by_role: 'intake_officer', timestamp: new Date(new Date(d.arrival).getTime() + 172800000).toISOString(), notes: 'Moved to holding area awaiting release', verification_method: 'qr_scan', location: 'Holding Area', hospital_location: hl, is_demo_data: true });
    }
    if (d.status === 'released') {
      custodyLogs.push({ decedent_id: decedent.id, decedent_unique_id: d.uid, action_type: 'released', from_location: 'Holding Area', to_location: 'Funeral Home', performed_by: d.intakeOfficer, performed_by_role: 'intake_officer', timestamp: new Date(new Date(d.arrival).getTime() + 259200000).toISOString(), notes: 'Released to funeral home', verification_method: 'digital_signature', location: 'Release Bay', hospital_location: hl, is_demo_data: true });
    }
    if (d.flags?.includes('inter_hospital_transfer') && d.origHospital !== d.hospitalLoc) {
      custodyLogs.push({ decedent_id: decedent.id, decedent_unique_id: d.uid, action_type: 'hospital_transfer', from_location: d.origHospital === 'milton' ? 'Milton District Hospital' : d.origHospital === 'oakville' ? 'Oakville Trafalgar' : 'Georgetown Hospital', to_location: d.hospitalLoc === 'oakville' ? 'Oakville Trafalgar' : d.hospitalLoc === 'milton' ? 'Milton District Hospital' : 'Georgetown Hospital', performed_by: 'Lisa Chen', performed_by_role: 'intake_officer', timestamp: d.arrival, notes: `Transferred from ${d.origHospital} to ${d.hospitalLoc}`, verification_method: 'qr_scan', location: 'Transfer Bay', hospital_location: hl, is_demo_data: true });
    }
    if (d.flags?.includes('unresolved_exception')) {
      custodyLogs.push({ decedent_id: decedent.id, decedent_unique_id: d.uid, action_type: 'alert_raised', performed_by: 'System', performed_by_role: 'system', timestamp: new Date(new Date(d.arrival).getTime() + 43200000).toISOString(), notes: 'Alert: Documentation incomplete and autopsy required. Case requires immediate attention.', verification_method: 'manual', location: 'Storage', hospital_location: hl, is_flagged: true, flag_reason: 'Unresolved: autopsy pending, documentation incomplete', is_demo_data: true });
    }
    if (d.flags?.includes('extended_holding')) {
      custodyLogs.push({ decedent_id: decedent.id, decedent_unique_id: d.uid, action_type: 'alert_raised', performed_by: 'System', performed_by_role: 'system', timestamp: new Date(new Date(d.arrival).getTime() + 259200000).toISOString(), notes: 'Alert: Decedent in storage over 72 hours. Extended holding threshold reached.', verification_method: 'manual', location: d.storageLabel, hospital_location: hl, is_flagged: true, flag_reason: 'Extended holding > 72 hours', is_demo_data: true });
    }
  }
  await base44.entities.CustodyLog.bulkCreate(custodyLogs);

  // === Personal Effects ===
  const personalEffects = [];
  const addEffects = (decedent, items, hospital) => {
    items.forEach(([item, cat, status, extra]) => {
      personalEffects.push({ decedent_id: decedent.id, decedent_unique_id: decedent.unique_id, item_name: item, category: cat, quantity: 1, condition: 'Good', storage_location: `Personal Effects Cabinet - ${hospital}`, status: status || 'secured', logged_by: decedent.intake_officer || 'Staff', hospital_location: hospital.toLowerCase().includes('oak') ? 'oakville' : hospital.toLowerCase().includes('mil') ? 'milton' : 'georgetown', is_demo_data: true, ...(extra || {}) });
    });
  };
  addEffects(decededByUid[decedentDefs.find(d => d.firstName === 'Catherine').uid], [['Gold wedding ring', 'jewelry'], ['Silver bracelet', 'jewelry'], ['Eyeglasses', 'medical_devices'], ['Wallet with ID', 'documents'], ['Clothing - blue dress', 'clothing']], 'Georgetown');
  addEffects(decededByUid[decedentDefs.find(d => d.firstName === 'Sarah').uid], [['Silver necklace', 'jewelry'], ['House keys', 'keys'], ['Mobile phone', 'electronics']], 'Oakville');
  addEffects(decededByUid[decedentDefs.find(d => d.firstName === 'Margaret').uid], [['Hearing aid', 'medical_devices'], ['Wedding band', 'jewelry']], 'Oakville');
  addEffects(decededByUid[decedentDefs.find(d => d.firstName === 'Emily').uid], [['Clothing - sweater and pants', 'clothing'], ['Watch', 'jewelry'], ['Purse with contents', 'other']], 'Milton');
  addEffects(decededByUid[decedentDefs.find(d => d.firstName === 'William').uid], [['Eyeglasses', 'medical_devices', 'released', { released_to: 'Elizabeth Davies', release_datetime: dt(5, 14, 0), acknowledgment_signed: true }], ['Wedding ring', 'jewelry', 'released', { released_to: 'Elizabeth Davies', release_datetime: dt(5, 14, 0), acknowledgment_signed: true }], ['Clothing', 'clothing', 'released', { released_to: 'Elizabeth Davies', release_datetime: dt(5, 14, 0), acknowledgment_signed: true }]], 'Oakville');
  await base44.entities.PersonalEffect.bulkCreate(personalEffects);

  // === Examinations ===
  const examinations = [];
  const sarah = decedByUid[decedentDefs.find(d => d.firstName === 'Sarah').uid];
  examinations.push({ decedent_id: sarah.id, decedent_unique_id: sarah.unique_id, decedent_name: 'Sarah Chen', exam_type: 'full_autopsy', scheduled_datetime: dt(1, 9, 0), started_datetime: dt(1, 9, 30), status: 'in_progress', pathologist_name: 'Dr. Michael Reeves', pathologist_id: 'PATH-001', assistant_names: ['Technician Alan Brooks'], toxicology_requested: true, samples_collected: ['Blood', 'Urine', 'Tissue samples'], notes: 'Coroner case - traumatic injuries. Full autopsy requested by Halton Regional Police.', hospital_location: 'oakville', is_demo_data: true });
  const patricia = decedByUid[decedentDefs.find(d => d.firstName === 'Patricia').uid];
  examinations.push({ decedent_id: patricia.id, decedent_unique_id: patricia.unique_id, decedent_name: 'Patricia Murphy', exam_type: 'external_examination', scheduled_datetime: dt(4, 10, 0), started_datetime: dt(4, 10, 15), completed_datetime: dt(4, 11, 30), status: 'completed', pathologist_name: 'Dr. Amanda Liu', pathologist_id: 'PATH-003', findings_summary: 'External examination consistent with cardiac event. No signs of foul play.', cause_of_death: 'Myocardial infarction', manner_of_death: 'natural', is_signed_off: true, signed_off_by: 'Dr. Amanda Liu', signed_off_datetime: dt(4, 12, 0), notes: 'Routine external examination. Cause of death determined.', hospital_location: 'milton', is_demo_data: true });
  const robert = decedByUid[decedentDefs.find(d => d.firstName === 'Robert').uid];
  examinations.push({ decedent_id: robert.id, decedent_unique_id: robert.unique_id, decedent_name: 'Robert Foster', exam_type: 'external_examination', scheduled_datetime: dt(8, 11, 0), started_datetime: dt(8, 11, 15), completed_datetime: dt(8, 12, 0), status: 'pending_review', pathologist_name: 'Dr. Michael Reeves', pathologist_id: 'PATH-001', findings_summary: 'External examination complete. Findings consistent with cerebrovascular accident.', cause_of_death: 'Cerebrovascular accident (stroke)', manner_of_death: 'natural', is_signed_off: false, notes: 'Awaiting pathologist sign-off', hospital_location: 'oakville', is_demo_data: true });
  const michael = decedByUid[decedentDefs.find(d => d.firstName === 'Michael').uid];
  examinations.push({ decedent_id: michael.id, decedent_unique_id: michael.unique_id, decedent_name: 'Michael Anderson', exam_type: 'forensic_analysis', scheduled_datetime: dt(1, 14, 0), status: 'scheduled', pathologist_name: 'Dr. Amanda Liu', pathologist_id: 'PATH-003', toxicology_requested: true, notes: 'Forensic analysis requested due to decomposition. Identification and cause of death to be determined.', hospital_location: 'georgetown', is_demo_data: true });
  await base44.entities.Examination.bulkCreate(examinations);

  // === Releases ===
  const releases = [];
  const william = decedByUid[decedentDefs.find(d => d.firstName === 'William').uid];
  releases.push({ decedent_id: william.id, decedent_unique_id: william.unique_id, decedent_name: 'William Davies', release_type: 'funeral_home', receiving_party_name: 'Elizabeth Davies', receiving_party_organization: 'Oakville Funeral Home', receiving_party_id_type: 'Driver License', receiving_party_id_number: 'DL-ONT-88472', receiving_party_contact: '905-555-0311', identity_verified_by: 'James Park', identity_verified_method: 'Photo ID + Digital Signature', secondary_verifier: 'Sarah Johnson', documentation_complete: true, personal_effects_released: true, digital_signature: 'SIG-WD-2026-001', status: 'completed', approved_by: 'James Park', approval_datetime: dt(5, 13, 0), release_datetime: dt(5, 14, 0), receipt_number: 'REL-2026-001', notes: 'Released to Oakville Funeral Home. All documentation complete.', hospital_location: 'oakville', is_demo_data: true });
  const thomas = decedByUid[decedentDefs.find(d => d.firstName === 'Thomas').uid];
  releases.push({ decedent_id: thomas.id, decedent_unique_id: thomas.unique_id, decedent_name: 'Thomas Wright', release_type: 'funeral_home', receiving_party_name: 'Susan Wright', receiving_party_organization: 'Milton Memorial Funeral Home', receiving_party_id_type: 'Driver License', receiving_party_id_number: 'DL-ONT-92341', receiving_party_contact: '905-555-0823', identity_verified_by: 'Lisa Chen', identity_verified_method: 'Photo ID', documentation_complete: true, personal_effects_released: false, status: 'pending', notes: 'Funeral home pickup scheduled. Awaiting confirmation.', hospital_location: 'milton', is_demo_data: true });
  const henry = decedByUid[decedentDefs.find(d => d.firstName === 'Henry').uid];
  releases.push({ decedent_id: henry.id, decedent_unique_id: henry.unique_id, decedent_name: 'Henry Walsh', release_type: 'funeral_home', receiving_party_name: 'Margaret Walsh', receiving_party_organization: 'Georgetown Funeral Services', receiving_party_id_type: 'Driver License', receiving_party_id_number: 'DL-ONT-77103', receiving_party_contact: '905-555-1234', identity_verified_by: 'David Brown', identity_verified_method: 'Photo ID', documentation_complete: true, personal_effects_released: true, status: 'pending', notes: 'Funeral home pickup scheduled for tomorrow.', hospital_location: 'georgetown', is_demo_data: true });
  await base44.entities.Release.bulkCreate(releases);

  // === Hospital Transfers ===
  const transfers = [];
  const david = decedByUid[decedentDefs.find(d => d.firstName === 'David').uid];
  transfers.push({ decedent_id: david.id, decedent_unique_id: david.unique_id, decedent_name: "David O'Brien", from_hospital: 'milton', to_hospital: 'oakville', transfer_datetime: dt(1, 14, 0), transferred_by: 'Lisa Chen', received_by: 'Sarah Johnson', reason: 'Specialist examination required - cardiac pathology expertise at Oakville', status: 'received', received_datetime: dt(1, 16, 0), notes: 'Transfer completed successfully. Custody maintained throughout transfer.', digital_signature: 'TRF-DOB-2026-001', is_demo_data: true });
  const linda = decedByUid[decedentDefs.find(d => d.firstName === 'Linda').uid];
  transfers.push({ decedent_id: linda.id, decedent_unique_id: linda.unique_id, decedent_name: 'Linda Martinez', from_hospital: 'milton', to_hospital: 'georgetown', transfer_datetime: dt(0, 9, 0), transferred_by: 'Lisa Chen', received_by: '', reason: 'Family request - closer to family residence in Georgetown', status: 'in_transit', notes: 'Transfer in progress. ETA Georgetown: 1 hour. Custody maintained.', is_demo_data: true });
  await base44.entities.HospitalTransfer.bulkCreate(transfers);

  // === Update Storage Unit Occupancy ===
  const unitUpdates = [];
  for (const d of decedentDefs) {
    if (d.storageLabel && unitByLabel[d.storageLabel]) {
      const unit = unitByLabel[d.storageLabel];
      const decedent = decedByUid[d.uid];
      const name = d.firstName ? `${d.firstName} ${d.lastName}` : 'Unidentified';
      unitUpdates.push({ id: unit.id, current_occupancy: 1, status: 'occupied', current_decedent_id: decedent.id, current_decedent_name: name });
    }
  }
  const decompUnit = storageUnits.find(u => u.label === 'Decomp Unit 1');
  if (decompUnit) unitUpdates.push({ id: decompUnit.id, status: 'maintenance', notes: 'Scheduled maintenance - temperature calibration' });
  if (unitUpdates.length > 0) await base44.entities.StorageUnit.bulkUpdate(unitUpdates);

  return {
    created: { StorageUnit: storageUnits.length, Decedent: decedents.length, CustodyLog: custodyLogs.length, PersonalEffect: personalEffects.length, Examination: examinations.length, Release: releases.length, HospitalTransfer: transfers.length },
    total: storageUnits.length + decedents.length + custodyLogs.length + personalEffects.length + examinations.length + releases.length + transfers.length,
  };
}