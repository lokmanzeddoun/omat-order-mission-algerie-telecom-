import i18n from 'i18n';

// Display labels for enum values used across pages. Each value is read from the
// `enums` namespace when accessed, so it always follows the current UI language.
const labelMap = (group: string, codes: string[]): Record<string, string> =>
  Object.defineProperties(
    {},
    Object.fromEntries(codes.map((code) => [code, { enumerable: true, get: () => i18n.t(`enums:${group}.${code}`) }])),
  );

export const roleLabels = labelMap('role', ['USER', 'ADMIN', 'SUPER_ADMIN']);

export const categoryLabels = labelMap('category', ['CADRE', 'CADRE_SUPERIEUR', 'EXECUTION_MAITRISE']);

export const toOptions = (labels: Record<string, string>) =>
  Object.entries(labels).map(([value, label]) => ({ value, label }));

export const transportLabels = labelMap('transport', [
  'SERVICE_CAR',
  'TRANSPORT_ENTREPRISE',
  'TRANSPORT_EMPLOYEE',
  'PERSONAL_CAR',
]);

export const directionLabels = labelMap('direction', ['NORD', 'SUD', 'MIXTE']);
