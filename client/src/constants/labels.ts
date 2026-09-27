// Display labels for enum values used across pages.

export const roleLabels: Record<string, string> = {
  USER: 'Agent',
  ADMIN: 'Administrateur',
  SUPER_ADMIN: 'Super administrateur',
};

export const categoryLabels: Record<string, string> = {
  CADRE: 'Cadre',
  CADRE_SUPERIEUR: 'Cadre supérieur',
  EXECUTION_MAITRISE: 'Exécution / Maîtrise',
};

export const toOptions = (labels: Record<string, string>) =>
  Object.entries(labels).map(([value, label]) => ({ value, label }));

export const transportLabels: Record<string, string> = {
  SERVICE_CAR: 'Véhicule de service',
  TRANSPORT_ENTREPRISE: 'Autre moyen de transport pris en charge par l’entreprise',
  TRANSPORT_EMPLOYEE: 'Moyen de transport pris en charge par le travailleur',
  PERSONAL_CAR: 'Véhicule personnel (usage exceptionnel, à la demande de la hiérarchie)',
};

export const directionLabels: Record<string, string> = {
  NORD: 'Nord',
  SUD: 'Sud',
  MIXTE: 'Nord et Sud',
};
