export interface Document {
  id: string;
  name: string;
  status: 'signed' | 'pending' | 'declined';
  dateModified: string;
  sender: string;
  recipient: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface SignaturePlaceholder {
  id: string;
  type: 'signature' | 'initial' | 'date' | 'text';
  x: number;
  y: number;
  value?: string;
}

export const mockUser: User = {
  id: '1',
  name: 'Alex Johnson',
  email: 'alex@company.com',
};

export const mockSentDocuments: Document[] = [
  { id: '1', name: 'NDA_Contract.pdf', status: 'signed', dateModified: '2026-02-08', sender: 'You', recipient: 'Jane Smith' },
  { id: '2', name: 'Employment_Agreement.pdf', status: 'pending', dateModified: '2026-02-07', sender: 'You', recipient: 'Bob Wilson' },
  { id: '3', name: 'Vendor_Agreement.pdf', status: 'declined', dateModified: '2026-02-05', sender: 'You', recipient: 'Carol Davis' },
  { id: '4', name: 'Lease_Contract.pdf', status: 'signed', dateModified: '2026-02-04', sender: 'You', recipient: 'Dan Brown' },
  { id: '5', name: 'Service_Agreement.pdf', status: 'pending', dateModified: '2026-02-03', sender: 'You', recipient: 'Eve Miller' },
];

export const mockReceivedDocuments: Document[] = [
  { id: '6', name: 'Partnership_Deal.pdf', status: 'pending', dateModified: '2026-02-08', sender: 'Jane Smith', recipient: 'You' },
  { id: '7', name: 'Consulting_Contract.pdf', status: 'signed', dateModified: '2026-02-06', sender: 'Bob Wilson', recipient: 'You' },
  { id: '8', name: 'Purchase_Order.pdf', status: 'pending', dateModified: '2026-02-05', sender: 'Carol Davis', recipient: 'You' },
];

export interface Template {
  id: string;
  name: string;
  dateCreated: string;
  category: string;
  content: string;
}

export const mockTemplates: Template[] = [
  {
    id: 't1',
    name: 'Standard NDA Template',
    dateCreated: '2026-01-15',
    category: 'Legal',
    content: "NON-DISCLOSURE AGREEMENT\n\nThis Non-Disclosure Agreement (the \"Agreement\") is entered into by and between [Party A] and [Party B].\n\n1. Purpose\nThe parties wish to explore a potential business opportunity of mutual interest and in connection with this opportunity, each party may disclose to the other certain confidential technical and business information that the disclosing party desires the receiving party to treat as confidential.\n\n2. Confidential Information\n\"Confidential Information\" means any information disclosed by either party to the other party, either directly or indirectly, in writing, orally or by inspection of tangible objects (including without limitation documents, prototypes, samples, plant and equipment)."
  },
  {
    id: 't2',
    name: 'Freelance Contract',
    dateCreated: '2026-01-20',
    category: 'Business',
    content: "INDEPENDENT CONTRACTOR AGREEMENT\n\nThis Independent Contractor Agreement (the \"Agreement\") is made and entered into as of [Date] by and between [Client Name] (\"Client\") and [Contractor Name] (\"Contractor\").\n\n1. Services\nContractor agrees to perform the following services for Client: [Description of Services].\n\n2. Compensation\nClient shall pay Contractor the sum of [Amount] for the Services. Payment shall be made within [Number] days of receipt of invoice."
  },
  {
    id: 't3',
    name: 'House Rental Agreement',
    dateCreated: '2026-02-01',
    category: 'Real Estate',
    content: "RESIDENTIAL LEASE AGREEMENT\n\nThis Residential Lease Agreement (the \"Lease\") is made and entered into on [Date] by and between [Landlord Name] (\"Landlord\") and [Tenant Name] (\"Tenant\").\n\n1. Property\nLandlord agrees to lease to Tenant and Tenant agrees to lease from Landlord the property located at [Address].\n\n2. Term\nThe term of this Lease shall be for a period of [Term], commencing on [Start Date] and ending on [End Date].\n\n3. Rent\nTenant shall pay Landlord rent in the amount of [Amount] per month."
  },
];

export interface SignForm {
  id: string;
  name: string;
  templateId: string;
  status: 'active' | 'inactive';
  responses: number;
  url: string;
  dateCreated: string;
}

export const mockSignForms: SignForm[] = [
  { id: 'sf1', name: 'Employee Onboarding', templateId: 't1', status: 'active', responses: 12, url: '/forms/sf1', dateCreated: '2026-02-01' },
  { id: 'sf2', name: 'Event Registration Waiver', templateId: 't2', status: 'active', responses: 45, url: '/forms/sf2', dateCreated: '2026-02-05' },
  { id: 'sf3', name: 'Client Intake Form', templateId: 't3', status: 'inactive', responses: 8, url: '/forms/sf3', dateCreated: '2026-01-10' },
];
