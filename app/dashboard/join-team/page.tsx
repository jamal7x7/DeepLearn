'use client';

import { useState } from 'react';
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

type ActionState = {
  error?: string;
  success?: string;
};

export default function JoinTeamPage() {
  const [code, setCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    teamName?: string;
    message: string;
  } | null>(null);
  const router = useRouter();

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

  return (
    <div className="max-w-md mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Join a Team</CardTitle>
          <CardDescription>
            Enter the invitation code provided by your teacher to join their class.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Invitation Code</Label>
              <div className="flex space-x-2">
                <Input
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="Enter code"
                  className="font-mono uppercase"
                  maxLength={10}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={validateCode}
                  disabled={isValidating || !code.trim()}
                >
                  {isValidating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Verify'
                  )}
                </Button>
              </div>
            </div>

            {validationResult && (
              <div
                className={`p-3 rounded-md ${
                  validationResult.valid
                    ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900'
                    : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900'
                }`}
              >
                <p
                  className={`${
                    validationResult.valid
                      ? 'text-green-700 dark:text-green-300'
                      : 'text-red-700 dark:text-red-300'
                  } font-medium`}
                >
                  {validationResult.message}
                </p>
                {validationResult.valid && validationResult.teamName && (
                  <p className="mt-1 text-sm">Team: {validationResult.teamName}</p>
                )}
              </div>
            )}

            {joinState?.error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 rounded-md">
                <p className="text-red-700 dark:text-red-300 font-medium">
                  {joinState.error}
                </p>
              </div>
            )}

            {joinState?.success && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900 rounded-md">
                <p className="text-green-700 dark:text-green-300 font-medium">
                  {joinState.success}
                </p>
                <p className="mt-1 text-sm">Redirecting to dashboard...</p>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <form action={joinAction} className="w-full">
            <input type="hidden" name="code" value={code} />
            <Button
              type="submit"
              className="w-full"
              disabled={
                isJoinPending ||
                !code.trim() ||
                !validationResult?.valid ||
                Boolean(joinState?.success)
              }
            >
              {isJoinPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Joining...
                </>
              ) : (
                'Join Team'
              )}
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
}