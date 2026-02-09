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
