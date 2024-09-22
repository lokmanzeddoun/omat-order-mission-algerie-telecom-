import { GridRowsProp } from '@mui/x-data-grid';

// Define the row data type
export interface RowData {
  id: number;
  matricule: number;
  nom: string;
  prenom: string;
  email: string;
  role: string;
  grade: string;
  category: string;
  service: string;
  status: string;
}

export const invoiceRowData: GridRowsProp<RowData> = [
  {
    id: 1,
    matricule: 1001,
    nom: 'Smith',
    prenom: 'John',
    email: 'john.smith@example.com',
    role: 'Admin',
    grade: 'Senior',
    category: 'Finance',
    service: 'Accounting',
    status: 'ACTIVE',
  },
  {
    id: 2,
    matricule: 1002,
    nom: 'Doe',
    prenom: 'Jane',
    email: 'jane.doe@example.com',
    role: 'Manager',
    grade: 'Mid-level',
    category: 'HR',
    service: 'Recruitment',
    status: 'ACTIVE',
  },
  {
    id: 3,
    matricule: 1003,
    nom: 'Brown',
    prenom: 'Charlie',
    email: 'charlie.brown@example.com',
    role: 'Employee',
    grade: 'Junior',
    category: 'IT',
    service: 'Support',
    status: 'INACTIVE',
  },
  {
    id: 4,
    matricule: 1004,
    nom: 'Miller',
    prenom: 'Sara',
    email: 'sara.miller@example.com',
    role: 'Employee',
    grade: 'Junior',
    category: 'Marketing',
    service: 'Advertising',
    status: 'ACTIVE',
  },
  {
    id: 5,

    matricule: 1005,
    nom: 'Williams',
    prenom: 'Robert',
    email: 'robert.williams@example.com',
    role: 'Employee',
    grade: 'Mid-level',
    category: 'Engineering',
    service: 'Development',
    status: 'ACTIVE',
  },
];
