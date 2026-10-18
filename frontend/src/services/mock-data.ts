import type {
  Actor,
  AuditLogEntry,
  Anomaly,
  DashboardMetrics,
  Entity,
  Integration,
  TimelineEvent,
  EntityField,
} from '@/types';

const actors: Actor[] = [
  { id: 'u1', name: 'Sarah Chen', email: 'sarah.chen@acme.com', role: 'Data Steward' },
  { id: 'u2', name: 'Marcus Webb', email: 'm.webb@acme.com', role: 'Compliance Officer' },
  { id: 'u3', name: 'Priya Nair', email: 'p.nair@acme.com', role: 'System Admin' },
  { id: 'u4', name: 'David Okafor', email: 'd.okafor@acme.com', role: 'Auditor' },
  { id: 'u5', name: 'Elena Rossi', email: 'e.rossi@acme.com', role: 'Analyst' },
];

// Industry schema templates definition
const industrySchemas: Record<string, {
  displayName: string;
  name: string;
  sourceApplication: string;
  department: string;
  risk: 'low' | 'medium' | 'high';
  recordCount: number;
  schema: EntityField[];
}[]> = {
  healthcare: [
    {
      displayName: 'Patient Health Records',
      name: 'patient_health_records',
      sourceApplication: 'MediCore EHR',
      department: 'Clinical Operations',
      risk: 'medium',
      recordCount: 48213,
      schema: [
        { key: 'patientId', label: 'Patient ID', type: 'string', sensitive: false },
        { key: 'fullName', label: 'Full Name', type: 'string', sensitive: true },
        { key: 'diagnosisCode', label: 'ICD-10 Diagnosis', type: 'string', sensitive: true },
        { key: 'treatmentLog', label: 'Treatment Records', type: 'json', sensitive: true },
        { key: 'consentSigned', label: 'HIPAA Consent Signed', type: 'boolean', sensitive: false },
      ],
    },
    {
      displayName: 'Clinical Trial Dossiers',
      name: 'clinical_trial_dossiers',
      sourceApplication: 'LabCore Analytics',
      department: 'Research & Dev',
      risk: 'high',
      recordCount: 1420,
      schema: [
        { key: 'trialId', label: 'Trial ID', type: 'string', sensitive: false },
        { key: 'phase', label: 'Trial Phase', type: 'string', sensitive: false },
        { key: 'efficacyScore', label: 'Efficacy Index', type: 'number', sensitive: false },
        { key: 'adverseEvents', label: 'Reported Adverse Events', type: 'json', sensitive: true },
      ],
    },
    {
      displayName: 'E-Prescriptions Ledger',
      name: 'prescription_ledger',
      sourceApplication: 'RxLink Portal',
      department: 'Pharmacy Services',
      risk: 'low',
      recordCount: 89400,
      schema: [
        { key: 'rxId', label: 'Prescription ID', type: 'string', sensitive: false },
        { key: 'physicianNpi', label: 'Physician NPI', type: 'string', sensitive: false },
        { key: 'ndcDrugCode', label: 'Drug Code', type: 'string', sensitive: false },
        { key: 'quantity', label: 'Quantity Dispensed', type: 'number', sensitive: false },
      ],
    },
  ],
  banking: [
    {
      displayName: 'SWIFT Wire Transfers',
      name: 'swift_wire_transfers',
      sourceApplication: 'FinTrust Core API',
      department: 'Treasury Ops',
      risk: 'low',
      recordCount: 128904,
      schema: [
        { key: 'swiftRef', label: 'SWIFT Reference', type: 'string', sensitive: false },
        { key: 'senderIban', label: 'Sender IBAN', type: 'string', sensitive: true },
        { key: 'receiverIban', label: 'Receiver IBAN', type: 'string', sensitive: true },
        { key: 'amount', label: 'Transfer Amount', type: 'number', sensitive: true },
        { key: 'currency', label: 'Currency', type: 'string', sensitive: false },
      ],
    },
    {
      displayName: 'KYC Compliance Dossiers',
      name: 'kyc_compliance_vault',
      sourceApplication: 'IdentityVerify System',
      department: 'Risk Management',
      risk: 'medium',
      recordCount: 34120,
      schema: [
        { key: 'customerId', label: 'Customer ID', type: 'string', sensitive: false },
        { key: 'documentType', label: 'Identity Document', type: 'string', sensitive: false },
        { key: 'riskScore', label: 'PEP Risk Score', type: 'number', sensitive: false },
        { key: 'wealthVerified', label: 'Wealth Source Verified', type: 'boolean', sensitive: false },
      ],
    },
    {
      displayName: 'AML Alert Register',
      name: 'aml_ledger',
      sourceApplication: 'Guardian AML Engine',
      department: 'Financial Crime Unit',
      risk: 'high',
      recordCount: 4320,
      schema: [
        { key: 'alertId', label: 'AML Alert ID', type: 'string', sensitive: false },
        { key: 'txReference', label: 'Tx Reference', type: 'string', sensitive: false },
        { key: 'detectionReason', label: 'Flag Reason', type: 'string', sensitive: false },
        { key: 'confidenceScore', label: 'Efficacy Score', type: 'number', sensitive: false },
      ],
    },
  ],
  education: [
    {
      displayName: 'Student Transcripts',
      name: 'student_grades_transcript',
      sourceApplication: 'EduTrack SIS',
      department: 'Registrar Office',
      risk: 'low',
      recordCount: 31204,
      schema: [
        { key: 'studentId', label: 'Student ID', type: 'string', sensitive: false },
        { key: 'gpaCumulative', label: 'Cumulative GPA', type: 'number', sensitive: true },
        { key: 'academicProbation', label: 'Probation Status', type: 'boolean', sensitive: true },
        { key: 'courseGrades', label: 'Term Grades', type: 'json', sensitive: true },
      ],
    },
    {
      displayName: 'Tuition Fee Registry',
      name: 'tuition_ledger',
      sourceApplication: 'CampusPay ERP',
      department: 'Bursar Office',
      risk: 'medium',
      recordCount: 15420,
      schema: [
        { key: 'invoiceNumber', label: 'Invoice No', type: 'string', sensitive: false },
        { key: 'studentId', label: 'Student ID', type: 'string', sensitive: false },
        { key: 'amountPaid', label: 'Amount Paid', type: 'number', sensitive: false },
        { key: 'gatewayRef', label: 'Gateway Ref', type: 'string', sensitive: true },
      ],
    },
    {
      displayName: 'Faculty Accreditations',
      name: 'faculty_accreditations',
      sourceApplication: 'HiringPortal Academic',
      department: 'Academic Affairs',
      risk: 'medium',
      recordCount: 840,
      schema: [
        { key: 'facultyId', label: 'Faculty ID', type: 'string', sensitive: false },
        { key: 'tenureStatus', label: 'Tenure Status', type: 'boolean', sensitive: false },
        { key: 'accreditingBody', label: 'Accrediting Body', type: 'string', sensitive: false },
        { key: 'backgroundCheckPassed', label: 'Background Check', type: 'boolean', sensitive: true },
      ],
    },
  ],
  government: [
    {
      displayName: 'Citizen Registries',
      name: 'citizen_identities',
      sourceApplication: 'GovCore ID Ledger',
      department: 'Civil Services',
      risk: 'high',
      recordCount: 948200,
      schema: [
        { key: 'citizenId', label: 'National ID', type: 'string', sensitive: false },
        { key: 'fullName', label: 'Full Name', type: 'string', sensitive: true },
        { key: 'fingerprintHash', label: 'Biometric Signature', type: 'string', sensitive: true },
        { key: 'clearanceLevel', label: 'Security Clearance', type: 'string', sensitive: false },
      ],
    },
    {
      displayName: 'Land Titles & Deeds',
      name: 'land_titles_deeds',
      sourceApplication: 'LandReg Ledger',
      department: 'Registry Office',
      risk: 'medium',
      recordCount: 42100,
      schema: [
        { key: 'plotId', label: 'Cadastral Plot ID', type: 'string', sensitive: false },
        { key: 'ownerAddress', label: 'Registered Owner', type: 'string', sensitive: true },
        { key: 'assessedValue', label: 'Tax Assessment Value', type: 'number', sensitive: false },
        { key: 'deedSigned', label: 'Deed Signed', type: 'boolean', sensitive: false },
      ],
    },
    {
      displayName: 'Public Procurement Contracts',
      name: 'procurement_contracts',
      sourceApplication: 'GovBuy Portal',
      department: 'Finance Ministry',
      risk: 'low',
      recordCount: 14890,
      schema: [
        { key: 'contractId', label: 'Contract Reference', type: 'string', sensitive: false },
        { key: 'vendorId', label: 'Vendor Registry ID', type: 'string', sensitive: false },
        { key: 'budgetAllocated', label: 'Budget Allocated', type: 'number', sensitive: false },
        { key: 'approvalHash', label: 'Signoff Signature', type: 'string', sensitive: true },
      ],
    },
  ],
  enterprise: [
    {
      displayName: 'ERP Invoices Register',
      name: 'erp_invoice_register',
      sourceApplication: 'SAP ERP Core',
      department: 'Corporate Accounts',
      risk: 'medium',
      recordCount: 235180,
      schema: [
        { key: 'invoiceId', label: 'ERP Invoice ID', type: 'string', sensitive: false },
        { key: 'billingAddress', label: 'Billing Address', type: 'string', sensitive: true },
        { key: 'totalAmount', label: 'Invoice Total', type: 'number', sensitive: false },
        { key: 'soxApproved', label: 'SOX Auditor Verified', type: 'boolean', sensitive: false },
      ],
    },
    {
      displayName: 'IP Patents Ledger',
      name: 'ip_patents_vault',
      sourceApplication: 'Nexus Patents Safe',
      department: 'R&D Intellectual',
      risk: 'high',
      recordCount: 248,
      schema: [
        { key: 'patentId', label: 'Patent ID', type: 'string', sensitive: false },
        { key: 'patentTitle', label: 'Patent Title', type: 'string', sensitive: false },
        { key: 'codeSignature', label: 'IP Build Hash', type: 'string', sensitive: true },
        { key: 'stewardSignature', label: 'Inventor Approval', type: 'string', sensitive: true },
      ],
    },
    {
      displayName: 'Access Authorization Ledgers',
      name: 'access_control_lists',
      sourceApplication: 'CyberSafe IAM',
      department: 'Corporate Security',
      risk: 'low',
      recordCount: 12050,
      schema: [
        { key: 'policyId', label: 'Policy Reference', type: 'string', sensitive: false },
        { key: 'authorizedGroupId', label: 'IAM Group', type: 'string', sensitive: false },
        { key: 'mfaEnforced', label: 'MFA Enforced', type: 'boolean', sensitive: false },
        { key: 'allowedSubnets', label: 'Allowed CIDR', type: 'json', sensitive: true },
      ],
    },
  ],
  police: [
    {
      displayName: 'Case Reports Logs',
      name: 'case_incident_reports',
      sourceApplication: 'PoliceDispatch MS',
      department: 'Patrol Division',
      risk: 'medium',
      recordCount: 84200,
      schema: [
        { key: 'caseId', label: 'Case Incident ID', type: 'string', sensitive: false },
        { key: 'stewardBadge', label: 'Officer Badge No', type: 'string', sensitive: false },
        { key: 'incidentSeverity', label: 'Incident Code', type: 'string', sensitive: false },
        { key: 'depositionText', label: 'Witness Statements', type: 'string', sensitive: true },
      ],
    },
    {
      displayName: 'Evidence Chain-of-Custody',
      name: 'evidence_chain_of_custody',
      sourceApplication: 'CaseVault Ledger',
      department: 'Forensics & Evidence',
      risk: 'high',
      recordCount: 8412,
      schema: [
        { key: 'itemId', label: 'Evidence Item ID', type: 'string', sensitive: false },
        { key: 'custodianSignature', label: 'Custodian Signature', type: 'string', sensitive: true },
        { key: 'roomBarcode', label: 'Locker Shelf No', type: 'string', sensitive: false },
        { key: 'tamperEvidenceSeal', label: 'Tamper Seal Intact', type: 'boolean', sensitive: false },
      ],
    },
    {
      displayName: 'Armory Dispatches',
      name: 'weapon_dispatch_ledger',
      sourceApplication: 'ArmorySafe System',
      department: 'Tactical Operations',
      risk: 'low',
      recordCount: 1280,
      schema: [
        { key: 'dispatchId', label: 'Dispatch Reference', type: 'string', sensitive: false },
        { key: 'weaponSerial', label: 'Weapon Serial No', type: 'string', sensitive: true },
        { key: 'officerBadge', label: 'Officer Badge No', type: 'string', sensitive: false },
        { key: 'dispatchDurationHours', label: 'Dispatch Duration', type: 'number', sensitive: false },
      ],
    },
  ],
  insurance: [
    {
      displayName: 'Claim Adjustment Registers',
      name: 'claims_ledger',
      sourceApplication: 'SolvencyClaims Portal',
      department: 'Claims Division',
      risk: 'medium',
      recordCount: 48020,
      schema: [
        { key: 'claimId', label: 'Claim ID', type: 'string', sensitive: false },
        { key: 'adjusterCode', label: 'Adjuster Code', type: 'string', sensitive: false },
        { key: 'payoutAuthorized', label: 'Payout Authorized', type: 'number', sensitive: true },
        { key: 'incidentReportHash', label: 'Accident Report Hash', type: 'string', sensitive: true },
      ],
    },
    {
      displayName: 'Underwriting Registry',
      name: 'underwriting_registry',
      sourceApplication: 'RiskAssure Underwrite',
      department: 'Underwriting Ops',
      risk: 'high',
      recordCount: 12800,
      schema: [
        { key: 'policyId', label: 'Policy Reference', type: 'string', sensitive: false },
        { key: 'underwriterSignature', label: 'UW Underwriter Signoff', type: 'string', sensitive: true },
        { key: 'calculatedRiskFactor', label: 'Risk Factor Score', type: 'number', sensitive: false },
        { key: 'medicalWaiverSigned', label: 'Medical Waiver Status', type: 'boolean', sensitive: true },
      ],
    },
    {
      displayName: 'Policy Declarations',
      name: 'policy_declarations',
      sourceApplication: 'PolicySafe CRM',
      department: 'Client Relations',
      risk: 'low',
      recordCount: 148200,
      schema: [
        { key: 'declarationId', label: 'Declaration Ref', type: 'string', sensitive: false },
        { key: 'premiumPaid', label: 'Premium Amount', type: 'number', sensitive: false },
        { key: 'renewalStatus', label: 'Renewal Approved', type: 'boolean', sensitive: false },
        { key: 'brokerLicenseNo', label: 'Broker License No', type: 'string', sensitive: false },
      ],
    },
  ],
  manufacturing: [
    {
      displayName: 'ISO-9001 Inspections',
      name: 'quality_inspections',
      sourceApplication: 'Apex Inspection Station',
      department: 'Quality Assurance',
      risk: 'medium',
      recordCount: 54100,
      schema: [
        { key: 'inspectionId', label: 'Inspection ID', type: 'string', sensitive: false },
        { key: 'inspectionScore', label: 'QA Pass Score', type: 'number', sensitive: false },
        { key: 'calibrationDeviation', label: 'Calibration Delta', type: 'number', sensitive: false },
        { key: 'inspectorSignature', label: 'Inspector Signoff', type: 'string', sensitive: true },
      ],
    },
    {
      displayName: 'Logistics Manifests',
      name: 'supply_chain_manifests',
      sourceApplication: 'SupplyLink ERP',
      department: 'Logistics Control',
      risk: 'low',
      recordCount: 18900,
      schema: [
        { key: 'manifestId', label: 'Manifest ID', type: 'string', sensitive: false },
        { key: 'transporterCode', label: 'Carrier Code', type: 'string', sensitive: false },
        { key: 'destinationCountry', label: 'Destination Country', type: 'string', sensitive: false },
        { key: 'sealIntactVerified', label: 'Secure Seal Intact', type: 'boolean', sensitive: true },
      ],
    },
    {
      displayName: 'Equipment Calibration Logs',
      name: 'cnc_calibrations',
      sourceApplication: 'CNC Machining Core',
      department: 'Maintenance Ops',
      risk: 'high',
      recordCount: 1420,
      schema: [
        { key: 'machineId', label: 'CNC Machine ID', type: 'string', sensitive: false },
        { key: 'calibrationCodeHash', label: 'CNC Firmware Hash', type: 'string', sensitive: true },
        { key: 'errorTolerance', label: 'Error Tolerance mm', type: 'number', sensitive: false },
        { key: 'authorizedTechnician', label: 'Tech Dispatcher', type: 'string', sensitive: false },
      ],
    },
  ],
  legal: [
    {
      displayName: 'Trust Accounts Ledger',
      name: 'trust_account_ledger',
      sourceApplication: 'LawTrust Escrow',
      department: 'Escrow Accounts',
      risk: 'high',
      recordCount: 12450,
      schema: [
        { key: 'escrowId', label: 'Escrow Account ID', type: 'string', sensitive: false },
        { key: 'beneficiaryIban', label: 'Escrow Beneficiary', type: 'string', sensitive: true },
        { key: 'escrowBalance', label: 'Escrow Balance', type: 'number', sensitive: true },
        { key: 'attorneySignature', label: 'Attorney Signoff', type: 'string', sensitive: true },
      ],
    },
    {
      displayName: 'Court Case Filings',
      name: 'litigation_filings',
      sourceApplication: 'LexCourt Filing Hub',
      department: 'Litigation Division',
      risk: 'medium',
      recordCount: 4890,
      schema: [
        { key: 'filingId', label: 'Filing ID', type: 'string', sensitive: false },
        { key: 'courtJurisdictionId', label: 'Court Code', type: 'string', sensitive: false },
        { key: 'filingHash', label: 'Docket Content Hash', type: 'string', sensitive: true },
        { key: 'feePaymentVerified', label: 'Filing Fee Paid', type: 'boolean', sensitive: false },
      ],
    },
    {
      displayName: 'NDA Signatures Ledger',
      name: 'nda_registries',
      sourceApplication: 'SignSecure NDA',
      department: 'Corporate Contracts',
      risk: 'low',
      recordCount: 2310,
      schema: [
        { key: 'ndaId', label: 'NDA ID', type: 'string', sensitive: false },
        { key: 'disclosingParty', label: 'Disclosing Party', type: 'string', sensitive: false },
        { key: 'receivingParty', label: 'Receiving Party', type: 'string', sensitive: true },
        { key: 'signatureTimestamp', label: 'Signature Time', type: 'date', sensitive: false },
      ],
    },
  ],
};

// Procedural generator storage per industry
const industryData: Record<string, {
  entities: Entity[];
  auditLogs: AuditLogEntry[];
  anomalies: Anomaly[];
  timelineEvents: TimelineEvent[];
  integrations: Integration[];
  dashboardMetrics: DashboardMetrics;
}> = {};

function hashForIndex(index: number): string {
  const base = '0a1b2c3d4e5f60718293a4b5c6d7e8f9';
  return base.slice((index * 2) % 30, ((index * 2) % 30) + 16);
}

// Procedural generation function
function initializeIndustry(industry: string) {
  if (industryData[industry]) return;

  const schemas = industrySchemas[industry] || industrySchemas.healthcare;
  
  // 1. Generate Entities (Assets)
  const entities: Entity[] = schemas.map((schema, idx) => ({
    id: `e-${industry}-${idx + 1}`,
    name: schema.name,
    displayName: schema.displayName,
    category: industry,
    sourceApplication: schema.sourceApplication,
    recordCount: schema.recordCount,
    changeCount: 100 + idx * 80 + (idx % 2 === 0 ? 320 : 15),
    lastChangedAt: new Date(2026, 6, 18, 14, 22).toISOString(),
    createdAt: new Date(2025, 0, 12, 9, 0).toISOString(),
    schema: schema.schema,
    department: schema.department,
    owner: actors[idx % actors.length],
    status: (['connected', 'syncing', 'error'] as const)[idx % 3],
    version: `v${idx + 1}.4.${idx % 3}`,
    risk: schema.risk,
  }));

  // 2. Generate Audit Logs
  const operations: AuditLogEntry['operation'][] = ['CREATE', 'UPDATE', 'DELETE', 'RESTORE'];
  const severities: AuditLogEntry['severity'][] = ['info', 'warning', 'critical', 'anomaly'];
  const statuses: AuditLogEntry['status'][] = ['verified', 'pending', 'flagged'];

  const auditLogs: AuditLogEntry[] = Array.from({ length: 48 }, (_, index) => {
    const entity = entities[index % entities.length];
    const actor = actors[index % actors.length];
    const operation = operations[index % operations.length];
    const severity = index % 8 === 0 ? 'anomaly' : index % 14 === 0 ? 'critical' : severities[index % 3];
    const status = index % 11 === 0 ? 'flagged' : statuses[index % 2];
    const date = new Date(2026, 6, 18 - Math.floor(index / 6), 8 + (index % 12), index % 60).toISOString();

    const beforeSnapshot: Record<string, unknown> = {
      id: `REC-${1000 + index}`,
      [entity.schema[1]?.key ?? 'name']: `Original Value ${index}`,
      [entity.schema[2]?.key ?? 'field']: index % 2 === 0 ? 'Active' : 'Inactive',
    };
    const afterSnapshot: Record<string, unknown> = {
      ...beforeSnapshot,
      [entity.schema[1]?.key ?? 'name']: `Updated Value ${index}`,
      [entity.schema[2]?.key ?? 'field']: index % 2 === 0 ? 'Inactive' : 'Active',
    };

    return {
      id: `log-${industry}-${index + 1}`,
      entityId: entity.id,
      entityName: entity.displayName,
      operation,
      severity,
      status,
      actor,
      sourceApplication: entity.sourceApplication,
      ipAddress: `10.0.${index % 255}.${(index * 7) % 255}`,
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X) SentinelAudit-Client/1.0',
      reason: index % 3 === 0 ? 'Compliance verification registry signoff' : undefined,
      fieldChanges: entity.schema.slice(1, 3).map((field) => ({
        field: field.key,
        label: field.label,
        oldValue: beforeSnapshot[field.key],
        newValue: afterSnapshot[field.key],
        type: field.type,
        sensitive: field.sensitive,
        changed: beforeSnapshot[field.key] !== afterSnapshot[field.key],
      })),
      beforeSnapshot,
      afterSnapshot,
      hash: hashForIndex(index) + hashForIndex(index + 1),
      previousHash: index === 0 ? '0'.repeat(32) : hashForIndex(index - 1) + hashForIndex(index),
      createdAt: date,
    };
  });

  // 3. Generate Timeline events
  const timelineEvents: TimelineEvent[] = auditLogs.map((log) => ({
    id: `tl-${log.id}`,
    auditLogId: log.id,
    entityId: log.entityId,
    entityName: log.entityName,
    operation: log.operation,
    actor: log.actor,
    summary: `${log.operation} on ${log.entityName} by ${log.actor.name}`,
    fieldCount: log.fieldChanges.length,
    hash: log.hash,
    previousHash: log.previousHash,
    createdAt: log.createdAt,
  }));

  // 4. Generate Anomalies
  const anomalies: Anomaly[] = auditLogs
    .filter((log) => log.severity === 'anomaly' || log.severity === 'critical')
    .slice(0, 12)
    .map((log, i) => ({
      id: `an-${industry}-${i + 1}`,
      auditLogId: log.id,
      entityName: log.entityName,
      actor: log.actor,
      severity: log.severity,
      status: (['open', 'investigating', 'resolved', 'dismissed'] as const)[i % 4],
      title:
        i % 3 === 0
          ? `Unusual bulk ${log.operation.toLowerCase()} detected`
          : i % 3 === 1
          ? 'Sensitive schema changes made off-hours'
          : 'Privileged supervisor modified secure fields',
      description: `AI anomaly detection flagged this configuration revision as statistically inconsistent with standard logs for ${industry}.`,
      detectedBy: i % 3 === 0 ? 'rule' : 'ai',
      confidenceScore: 0.75 + (i % 4) * 0.05,
      signals: [
        { label: 'Off-hours signature', description: 'Change occurred outside 8–18 UTC', weight: 0.3 },
        { label: 'Sensitive field modified', description: 'Modified fields contain encryption hashes', weight: 0.4 },
        { label: 'Steward anomaly', description: 'Actor rarely access this department source', weight: 0.3 },
      ],
      createdAt: log.createdAt,
    }));

  // 5. Generate Integrations
  const integrations: Integration[] = entities.map((entity, i) => ({
    id: `int-${industry}-${i + 1}`,
    name: entity.sourceApplication,
    category: (i % 2 === 0 ? 'database' : 'saas') as Integration['category'],
    status: (['connected', 'syncing', 'error'] as const)[i % 3],
    description: `Bi-directional change tracking integration for ${entity.displayName}.`,
    endpoint: `https://${entity.sourceApplication.toLowerCase().replace(/\s/g, '')}.api.example.com/v2`,
    apiKeyMasked: 'sk_••••••••••••' + hashForIndex(i).slice(0, 4),
    lastSyncAt: new Date(2026, 6, 18, 6 + i, 0).toISOString(),
    recordCount: entity.recordCount,
    changeCount: entity.changeCount,
    createdAt: entity.createdAt,
  }));

  // 6. Generate Metrics
  const totalChanges = auditLogs.length * 105;
  const dashboardMetrics: DashboardMetrics = {
    totalChanges,
    changesTrend: 8.4 + (schemas.length * 2),
    totalEntities: entities.length,
    totalAnomalies: anomalies.length,
    openAnomalies: anomalies.filter((a) => a.status === 'open').length,
    criticalAnomalies: anomalies.filter((a) => a.severity === 'critical').length,
    activeIntegrations: integrations.filter((i) => i.status === 'connected').length,
    verifiedChanges: auditLogs.filter((l) => l.status === 'verified').length,
    changesOverTime: Array.from({ length: 14 }, (_, i) => ({
      date: new Date(2026, 6, 5 + i).toISOString(),
      value: 140 + Math.round(Math.sin(i) * 50) + i * 8,
    })),
    operationsBreakdown: [
      { operation: 'UPDATE', count: Math.round(totalChanges * 0.65) },
      { operation: 'CREATE', count: Math.round(totalChanges * 0.20) },
      { operation: 'DELETE', count: Math.round(totalChanges * 0.10) },
      { operation: 'RESTORE', count: Math.round(totalChanges * 0.05) },
    ],
    topEntities: entities.slice(0, 5).map((e) => ({
      entityId: e.id,
      name: e.displayName,
      changeCount: e.changeCount,
    })),
    severityBreakdown: [
      { severity: 'info', count: Math.round(totalChanges * 0.85) },
      { severity: 'warning', count: Math.round(totalChanges * 0.09) },
      { severity: 'critical', count: Math.round(totalChanges * 0.04) },
      { severity: 'anomaly', count: anomalies.length },
    ],
    protectedAssets: entities.length,
    todayChanges: Math.round(totalChanges / 15),
    auditEvents: totalChanges,
    versionSnapshots: Math.round(totalChanges * 0.4),
    criticalAlerts: anomalies.filter((a) => a.severity === 'critical').length,
    integrityScore: 100 - (anomalies.filter((a) => a.status === 'open').length * 2.5),
    aiRiskScore: Math.min(10, Math.round(2 + anomalies.length / 3)),
    activityTimeline: [
      { date: '08:00', readCount: 140, writeCount: 35 },
      { date: '12:00', readCount: 380, writeCount: 130 },
      { date: '16:00', readCount: 420, writeCount: 150 },
    ],
    riskDistribution: [
      { name: 'Info', value: 85, color: 'hsl(var(--info))' },
      { name: 'Low Risk', value: 12, color: 'hsl(var(--success))' },
    ],
    departmentActivity: entities.map((e) => ({
      department: e.department,
      changes: Math.round(totalChanges / entities.length),
    })),
    mostModifiedAssets: entities.map((e) => ({
      assetName: e.name,
      creates: Math.round(e.changeCount * 0.2),
      updates: Math.round(e.changeCount * 0.7),
      deletes: Math.round(e.changeCount * 0.1),
    })),
    userActivity: [
      { userName: actors[0].name, changes: Math.round(totalChanges * 0.4), role: actors[0].role },
      { userName: actors[1].name, changes: Math.round(totalChanges * 0.35), role: actors[1].role },
      { userName: actors[2].name, changes: Math.round(totalChanges * 0.25), role: actors[2].role },
    ],
    latestAlerts: [],
    recentVersionChanges: [],
    recentAuditEvents: [],
  };

  industryData[industry] = {
    entities,
    auditLogs,
    timelineEvents,
    anomalies,
    integrations,
    dashboardMetrics,
  };
}

// Dynamic helper functions that take an industry string and dynamically resolve the data
export const mockData = {
  getActors() {
    return actors;
  },
  getEntities(industry: string = 'healthcare') {
    initializeIndustry(industry);
    return industryData[industry].entities;
  },
  getAuditLogs(industry: string = 'healthcare') {
    initializeIndustry(industry);
    return industryData[industry].auditLogs;
  },
  getTimelineEvents(industry: string = 'healthcare') {
    initializeIndustry(industry);
    return industryData[industry].timelineEvents;
  },
  getAnomalies(industry: string = 'healthcare') {
    initializeIndustry(industry);
    return industryData[industry].anomalies;
  },
  getIntegrations(industry: string = 'healthcare') {
    initializeIndustry(industry);
    return industryData[industry].integrations;
  },
  getDashboardMetrics(industry: string = 'healthcare') {
    initializeIndustry(industry);
    return industryData[industry].dashboardMetrics;
  },
};
