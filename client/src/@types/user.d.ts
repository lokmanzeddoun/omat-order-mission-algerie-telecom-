interface ReqLogin {
  password: string;
  email: string;
}
interface ResLoginApi extends Res {
  data: {
    matricule: number;
    email: string;
    nom: string;
    prenom: string;
    category: Category;
    role: Role;
  };
}

interface IUser {
  matricule: number;
  nom: string;
  prenom: string;
  grade: string;
  email: string;
  password?: string;
  role: Role;
  category: Category;
  accessToken?: string;
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
