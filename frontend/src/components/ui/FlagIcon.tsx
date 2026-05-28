import { clsx } from 'clsx';
import { getFlagCodeForTeamName } from '../../utils/flags';

interface FlagIconProps {
  teamName: string;
  fallback?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses: Record<NonNullable<FlagIconProps['size']>, string> = {
  sm: 'w-4 h-3',
  md: 'w-5 h-4',
  lg: 'w-6 h-5',
};

export function FlagIcon({ teamName, fallback = '🏳️', className, size = 'md' }: FlagIconProps) {
  const code = getFlagCodeForTeamName(teamName);

  if (!code) {
    return <span className={clsx('inline-flex items-center justify-center', sizeClasses[size], className)}>{fallback}</span>;
  }

  return (
    <span className={clsx('inline-flex items-center justify-center overflow-hidden rounded-sm', sizeClasses[size], className)} aria-label={teamName} title={teamName}>
      <span className={clsx('fi', `fi-${code}`, 'block h-full w-full')} aria-hidden="true" />
    </span>
  );
}
