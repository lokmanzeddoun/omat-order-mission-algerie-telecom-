import { useId, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { DropdownMenu as RadixDropdown } from 'radix-ui';
import { Check, ChevronDown } from 'lucide-react';
import { currentLanguage, setLanguage, SUPPORTED_LANGS, type Lang } from 'i18n';
import { cn } from 'lib/utils';

// Inline SVG flags: emoji flags don't render on Windows browsers.
function FlagFR({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 3 2" aria-hidden="true" className={className}>
      <rect width="1" height="2" fill="#000091" />
      <rect x="1" width="1" height="2" fill="#fff" />
      <rect x="2" width="1" height="2" fill="#e1000f" />
    </svg>
  );
}

function FlagDZ({ className }: { className?: string }) {
  const mask = useId();
  return (
    <svg viewBox="0 0 900 600" aria-hidden="true" className={className}>
      <rect width="450" height="600" fill="#006233" />
      <rect x="450" width="450" height="600" fill="#fff" />
      <mask id={mask}>
        <rect width="900" height="600" fill="#fff" />
        <circle cx="487.5" cy="300" r="120" fill="#000" />
      </mask>
      <circle cx="450" cy="300" r="150" fill="#d21034" mask={`url(#${mask})`} />
      <polygon fill="#d21034" points="465,300 517,283 517,229 549,273 601,256 569,300 601,344 549,327 517,371 517,317" />
    </svg>
  );
}

const flags: Record<Lang, (props: { className?: string }) => ReactNode> = { fr: FlagFR, ar: FlagDZ };
const flagClass = 'h-3.5 w-5 shrink-0 rounded-[1px] shadow-[0_0_0_1px_rgb(0_0_0/0.15)]';

/**
 * Language menu (Français / العربية) for the header band. Switching also flips the
 * layout direction (see i18n.ts) and is remembered in this browser.
 */
export default function LanguageSwitch() {
  const { t } = useTranslation();
  const lang = currentLanguage();
  const Flag = flags[lang];

  return (
    <RadixDropdown.Root modal={false}>
      <RadixDropdown.Trigger asChild>
        <button
          type="button"
          aria-label={`${t('actions.changeLanguage')} (${t(`language.${lang}`)})`}
          title={t('actions.changeLanguage')}
          className="flex cursor-pointer items-center gap-1.5 rounded-xs px-1.5 py-1.5 text-sm font-medium text-white/90 hover:bg-white/10"
        >
          <Flag className={flagClass} />
          <span className="hidden sm:inline" lang={lang}>
            {lang === 'ar' ? 'ع' : 'FR'}
          </span>
          <ChevronDown aria-hidden="true" className="hidden size-3.5 text-white/80 sm:block" />
        </button>
      </RadixDropdown.Trigger>
      <RadixDropdown.Portal>
        <RadixDropdown.Content
          align="end"
          sideOffset={4}
          className="omat-ui z-[1500] min-w-40 rounded-sm border border-border-strong bg-surface py-1 text-sm text-fg shadow-md"
        >
          <RadixDropdown.RadioGroup value={lang} onValueChange={(v) => void setLanguage(v as Lang)}>
            {SUPPORTED_LANGS.map((l) => {
              const ItemFlag = flags[l];
              return (
                <RadixDropdown.RadioItem
                  key={l}
                  value={l}
                  lang={l}
                  className={cn(
                    'flex cursor-pointer items-center gap-2 px-3 py-1.5 outline-none select-none',
                    'data-[highlighted]:bg-primary-soft data-[highlighted]:text-primary data-[state=checked]:font-semibold',
                  )}
                >
                  <ItemFlag className={flagClass} />
                  <span className="flex-1">{t(`language.${l}`)}</span>
                  <RadixDropdown.ItemIndicator>
                    <Check aria-hidden="true" className="size-4" />
                  </RadixDropdown.ItemIndicator>
                </RadixDropdown.RadioItem>
              );
            })}
          </RadixDropdown.RadioGroup>
        </RadixDropdown.Content>
      </RadixDropdown.Portal>
    </RadixDropdown.Root>
  );
}
