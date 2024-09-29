interface ReqLogin {
  password: string;
  email: string;
}
interface ResLoginApi extends Res {
  user: {
    matricule: number;
    email: string;
    nom: string;
    prenom: string;
    category: Category;
    role: Role;
    createdAt: Date;
  };
  token: string | null;
}

interface IUser {
  matricule: number;
  nom: string;
  prenom: string;
  grade?: string;
  email: string;
  password?: string;
  role: Role;
  category: Category;
  serviceId?: string | null;
}

interface DispatchAuth {
  type: string;
  payload?: any;
}

declare enum Category {
  cadre = 'CADRE',
  cadre_superieur = 'CADRE_SUPERIEUR',
  execution_maitrise = 'EXECUTION_MAITRISE',
  other = 'OTHER',
}
declare enum Role {
  user = 'USER',
  admin = 'ADMIN',
  super_admin = 'SUPER_ADMIN',
  guest = 'GUEST',
}
