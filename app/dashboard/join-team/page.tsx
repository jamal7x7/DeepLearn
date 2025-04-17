'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { useActionState } from 'react';
import { joinTeamWithCode } from '@/app/api/invitation-codes/actions';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/auth';
import { useTranslation } from 'react-i18next';

type ActionState = {
  error?: string;
  success?: string;
};

export default function JoinTeamPage() {
  const { userPromise } = useUser();
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const { t, i18n } = useTranslation();

  useEffect(() => {
    userPromise.then((u) => {
      setUser(u);
    });
  }, [userPromise]);

  // If user is not loaded yet, show nothing (or a loader)
  const [code, setCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    teamName?: string;
    message: string;
  } | null>(null);

  const [joinState, joinAction, isJoinPending] = useActionState<
    ActionState,
    FormData
  >(joinTeamWithCode, { error: '', success: '' });

  // Validate the code without joining
  const validateCode = async () => {
    if (!code.trim()) return;

    setIsValidating(true);
    setValidationResult(null);

    try {
      const response = await fetch('/api/invitation-codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: code.trim() }),
      });

      const data = await response.json();
      setValidationResult(data);
    } catch (error) {
      console.error('Error validating code:', error);
      setValidationResult({
        valid: false,
        message: 'An error occurred while validating the code',
      });
    } finally {
      setIsValidating(false);
    }
  };

  // Redirect to dashboard after successful join
  if (joinState?.success) {
    setTimeout(() => {
      router.push('/dashboard');
    }, 2000);
  }

  if (user === null) {
    // Show a centered loader while checking authentication
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-md shadow-lg border-2 border-primary-100">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold flex flex-col items-center gap-2">
            <span>👥</span>
            {t('joinATeam', 'Join a Team')}
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {t('enterInvitationCode', 'Enter your invitation code below to join a team.')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={joinAction} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="code" className="font-semibold">{t('invitationCode', 'Invitation Code')}</Label>
              <div className="flex gap-2 items-center">
                <Input
                  id="code"
                  name="code"
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  placeholder={t('enterCode', 'e.g. ABC123')}
                  className="font-mono uppercase tracking-widest text-lg text-center py-6 border-2 border-primary-200 focus:ring-2 focus:ring-primary-500 transition-all"
                  maxLength={10}
                  autoComplete="off"
                  required
                  aria-invalid={!!validationResult && !validationResult.valid}
                  aria-describedby="code-feedback"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={validateCode}
                  disabled={isValidating || !code.trim()}
                  aria-label={t('verify', 'Verify Code')}
                  className="h-12"
                >
                  {isValidating ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    t('verify', 'Verify')
                  )}
                </Button>
              </div>
              {validationResult && (
                <div
                  id="code-feedback"
                  className={`flex items-center gap-2 mt-2 p-2 rounded-md text-sm font-medium transition-all ${
                    validationResult.valid
                      ? 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-900'
                      : 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-900'
                  }`}
                  role={validationResult.valid ? 'status' : 'alert'}
                  aria-live="polite"
                >
                  {validationResult.valid ? (
                    <span className="inline-block">✔️</span>
                  ) : (
                    <span className="inline-block">❌</span>
                  )}
                  <span>{validationResult.message}</span>
                  {validationResult.valid && validationResult.teamName && (
                    <span className="ml-auto text-xs text-muted-foreground">{t('team', 'Team')}: <span className="font-bold">{validationResult.teamName}</span></span>
                  )}
                </div>
              )}
            </div>

            {joinState?.error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 rounded-md text-red-700 dark:text-red-300 font-medium animate-shake">
                {joinState.error}
              </div>
            )}
            {joinState?.success && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900 rounded-md text-green-700 dark:text-green-300 font-medium animate-fade-in">
                {joinState.success}
                <div className="mt-1 text-xs text-muted-foreground">{t('redirectingToDashboard', 'Redirecting to dashboard...')}</div>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12 text-lg font-semibold"
              disabled={
                isJoinPending ||
                !code.trim() ||
                !validationResult?.valid ||
                Boolean(joinState?.success)
              }
              aria-disabled={
                isJoinPending ||
                !code.trim() ||
                !validationResult?.valid ||
                Boolean(joinState?.success)
              }
            >
              {isJoinPending ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  {t('joining', 'Joining...')}
                </>
              ) : (
                t('joinTeam', 'Join Team')
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}