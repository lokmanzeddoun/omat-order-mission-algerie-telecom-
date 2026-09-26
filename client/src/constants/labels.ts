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
