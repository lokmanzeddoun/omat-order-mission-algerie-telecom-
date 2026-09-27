import { useRef } from 'react';
import { Upload } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from 'components/ui';

/** "Importer" button backed by a hidden file input (resets so the same file can be re-imported). */
export default function FileImportButton({
  onFile,
  accept,
  label,
}: {
  onFile: (file: File) => void | Promise<void>;
  /** Optional file filter; by default any file is allowed (as before). */
  accept?: string;
  label?: string;
}) {
  const { t } = useTranslation();
  const input = useRef<HTMLInputElement>(null);
  return (
    <>
      <Button onClick={() => input.current?.click()}>
        <Upload />
        {label ?? t('actions.import')}
      </Button>
      <input
        ref={input}
        type="file"
        accept={accept}
        hidden
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (file) await onFile(file);
        }}
      />
    </>
  );
}
