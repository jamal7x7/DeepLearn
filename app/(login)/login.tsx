'use client';

import Link from 'next/link';
import { useActionState, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CircleIcon, Loader2, Triangle } from 'lucide-react';
import { signIn, signUp } from './actions';
import { ActionState } from '@/lib/auth/middleware';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, BookOpen, Shield, Code2 } from 'lucide-react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '@/components/LanguageSwitcher';

const ROLES = [
  {
    key: 'student',
    label: 'Student',
    icon: GraduationCap,
    helper: 'Access course materials and join classes.',
  },
  {
    key: 'teacher',
    label: 'Teacher',
    icon: BookOpen,
    helper: 'Create and manage courses, invite students.',
  },
  {
    key: 'admin',
    label: 'Admin',
    icon: Shield,
    helper: 'Manage users, teams, and system settings.',
  },
  {
    key: 'dev',
    label: 'Dev',
    icon: Code2,
    helper: 'Developer access for advanced features.',
  },
];

export function Login({ mode = 'signin' }: { mode?: 'signin' | 'signup' }) {
  const { t, i18n } = useTranslation();
  const searchParams = useSearchParams();
  const priceId = searchParams?.get('priceId');
  const inviteId = searchParams?.get('inviteId');
  const invitationCode = searchParams?.get('code');
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    mode === 'signin' ? signIn : signUp,
    { error: '' },
  );
  const [teamInfo, setTeamInfo] = useState<{teamName?: string} | null>(null);
  // Controlled role state for signup
  const [role, setRole] = useState('student');

  // Validate invitation code if provided
  useEffect(() => {
    if (mode === 'signup' && invitationCode) {
      const validateCode = async () => {
        try {
          const response = await fetch('/api/invitation-codes', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ code: invitationCode }),
          });

          const data = await response.json();
          if (data.valid) {
            setTeamInfo({
              teamName: data.teamName
            });
          }
        } catch (error) {
          console.error('Error validating code:', error);
        }
      };
      validateCode();
    }
  }, [invitationCode, mode]);

  const isArabic = i18n.language === 'ar';

  return (
    <Tooltip.Provider delayDuration={200}>
      <div className="absolute top-4 right-4 z-30">
        <LanguageSwitcher animateGlobe />
      </div>
      <div
        className={`flex min-h-screen flex-col justify-center py-6 px-2 sm:px-6 lg:px-8 bg-background dark:bg-background${isArabic ? ' text-right' : ''}`}
        dir={isArabic ? 'rtl' : 'ltr'}
      >
        <div className="w-full max-w-md mx-auto relative">
          {/* Back button moved to bottom */}
        </div>

        <div className={`mt-6 w-full max-w-md mx-auto${isArabic ? ' text-right' : ''}`}>
          {mode === 'signup' && invitationCode && teamInfo && (
            <Card className={`mb-4 bg-transparent border-transparent${isArabic ? ' text-right' : ''}`}>
              <CardHeader>
                <CardTitle>{t('joiningTeam', 'Joining a Team')}</CardTitle>
                <CardDescription>
                  {t('joiningTeamDesc', "You're signing up to join the following team:")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900 rounded-md">
                  <p className="font-medium">{teamInfo.teamName}</p>
                  <p className="text-sm text-muted-foreground mt-1">{t('usingInvitationCode', 'Using invitation code:')} {invitationCode}</p>
                </div>
              </CardContent>
            </Card>
          )}
          <div className={`bg-transparent px-2 py-6 sm:px-6 sm:py-8 shadow sm:rounded-lg border border-transparent${isArabic ? ' text-right' : ''}`}>
            <form className="space-y-6" action={formAction}>
              <input type="hidden" name="inviteId" value={inviteId || ''} />
              <input type="hidden" name="priceId" value={priceId || ''} />
              {invitationCode && <input type="hidden" name="invitationCode" value={invitationCode} />}
              {/* Custom role card selection for signup */}
              {mode === 'signup' && !invitationCode && (
                <div className="space-y-2">
                  <Label htmlFor="role-selection">{t('selectRole', 'Select your role')}</Label>
                  <div className="flex flex-row gap-3">
                    {ROLES.map(({ key, label, icon: Icon, helper }) => (
                      <Tooltip.Root key={key} delayDuration={200}>
                        <Tooltip.Trigger asChild>
                          <button
                            type="button"
                            aria-pressed={role === key}
                            tabIndex={0}
                            className={`flex-1 flex flex-col items-center justify-center p-4 rounded-lg border-2 min-w-0 transition-all focus:outline-none focus:ring-2 focus:ring-ring/50 group
                              ${role === key
                                ? 'border-primary bg-primary/10 shadow-md text-primary'
                                : 'border-border bg-background hover:border-primary/60'}
                            `}
                            onClick={() => setRole(key)}
                          >
                            <Icon className={`w-5 h-5 mb-0.5 ${role === key ? 'text-primary' : 'text-muted-foreground'}`} />
                            <span className="font-medium text-sm">{t(`role.${key}`, label)}</span>
                          </button>
                        </Tooltip.Trigger>
                        <Tooltip.Portal>
                          <Tooltip.Content side="top" align="center" className="z-50 px-3 py-2 rounded-md bg-gray-900 text-white text-xs shadow-lg">
                            {t(`roleHelper.${key}`, helper)}
                            <Tooltip.Arrow className="fill-gray-900" />
                          </Tooltip.Content>
                        </Tooltip.Portal>
                      </Tooltip.Root>
                    ))}
                  </div>
                  {/* Hidden input to actually submit the role to the backend */}
                  <input type="hidden" name="role" value={role} />
                </div>
              )}
              <div className={isArabic ? 'text-right' : ''}>
                <Label htmlFor="email">{t('email', 'Email address')}</Label>
                <div className="mt-2">
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="bg-background border-border text-foreground placeholder:text-muted-foreground focus:bg-background focus:border-primary text-left"
                  />
                </div>
              </div>
              <div className={isArabic ? 'text-right' : ''}>
                <Label htmlFor="password">{t('password', 'Password')}</Label>
                <div className="mt-2">
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                    required
                    className="bg-background border-border text-foreground placeholder:text-muted-foreground focus:bg-background focus:border-primary text-left"
                  />
                </div>
              </div>
              {mode === 'signup' && !invitationCode && (
                <div className={isArabic ? 'text-right' : ''}>
                  <Label htmlFor="invitationCode">{t('invitationCode', 'Invitation Code (Optional)')}</Label>
                  <div className="mt-2">
                    <Input
                      id="invitationCode"
                      name="invitationCode"
                      placeholder={t('invitationCodePlaceholder', 'Enter code to join a team')}
                      className="bg-background border-border text-foreground placeholder:text-muted-foreground focus:bg-background focus:border-primary font-mono uppercase text-left"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('invitationCodeHelp', 'If you have an invitation code from your teacher, enter it here to join their team.')}
                  </p>
                </div>
              )}
              {state.error && (
                <div className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 p-3 rounded-md border">
                  {t(state.error, state.error)}
                </div>
              )}
              <div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={pending}
                >
                  {pending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {mode === 'signin' ? t('signingIn', 'Signing in...') : t('creatingAccount', 'Creating account...')}
                    </>
                  ) : (
                    mode === 'signin' ? t('signIn', 'Sign in') : t('createAccount', 'Create account')
                  )}
                </Button>
              </div>
            </form>
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-700" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white dark:bg-gray-900 px-2 text-gray-500 dark:text-gray-400">
                    {t('or', 'Or')}
                  </span>
                </div>
              </div>
              <div className={`mt-6 flex justify-center text-sm${isArabic ? ' text-right' : ''}`}>
                <Link
                  href={mode === 'signin' ? '/sign-up' : '/sign-in'}
                  className="font-medium text-primary hover:text-primary/80"
                >
                  {mode === 'signin'
                    ? t('dontHaveAccount', "Don't have an account? Sign up")
                    : t('alreadyHaveAccount', 'Already have an account? Sign in')}
                </Link>
              </div>
            </div>
          </div>
          {/* Bottom-aligned back button */}
          <div className={`w-full max-w-md mx-auto mt-8 flex justify-center${isArabic ? ' text-right' : ''}`}>
            <Link
              href="/"
              aria-label={t('backToLanding', 'Back to landing')}
              className="flex items-center gap-2 rounded-full px-2 py-1 bg-card shadow-sm hover:bg-accent hover:text-primary transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none group"
            >
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24" className="inline-block group-hover:-translate-x-1 transition-transform">
                <circle cx="12" cy="12" r="11" stroke="none" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.5 17l-5-5 5-5"/>
              </svg>
              <span className="text-sm font-medium hidden sm:inline">{t('back', 'Back')}</span>
              <span className="sr-only">{t('back', 'Back')}</span>
            </Link>
          </div>
        </div>
      </div>
    </Tooltip.Provider>
  );
}
