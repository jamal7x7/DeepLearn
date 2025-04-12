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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export function Login({ mode = 'signin' }: { mode?: 'signin' | 'signup' }) {
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');
  const priceId = searchParams.get('priceId');
  const inviteId = searchParams.get('inviteId');
  const invitationCode = searchParams.get('code');
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    mode === 'signin' ? signIn : signUp,
    { error: '' },
  );
  const [teamInfo, setTeamInfo] = useState<{teamName?: string} | null>(null);
  
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

  return (
    <div className="flex min-h-screen flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight">
          {mode === 'signin' ? 'Sign in to your account' : 'Create a new account'}
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        {mode === 'signup' && invitationCode && teamInfo && (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Joining a Team</CardTitle>
              <CardDescription>
                You're signing up to join the following team:
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900 rounded-md">
                <p className="font-medium">{teamInfo.teamName}</p>
                <p className="text-sm text-muted-foreground mt-1">Using invitation code: {invitationCode}</p>
              </div>
            </CardContent>
          </Card>
        )}
        
        <div className="bg-white dark:bg-gray-900 px-4 py-8 shadow sm:rounded-lg sm:px-10 border dark:border-gray-800">
          <form className="space-y-6" action={formAction}>
            <input type="hidden" name="inviteId" value={inviteId || ''} />
            <input type="hidden" name="priceId" value={priceId || ''} />
            {invitationCode && <input type="hidden" name="invitationCode" value={invitationCode} />}

            {/* Role selection */}
            {mode === 'signup' && !invitationCode && (
              <div className="space-y-2">
                <Label htmlFor="role-selection">Select your role</Label>
                <RadioGroup name="role" defaultValue="student" className="grid grid-cols-2 gap-2">
                  <div className="flex items-center space-x-2 rounded-md border p-2">
                    <RadioGroupItem value="student" id="role-student" />
                    <Label htmlFor="role-student" className="cursor-pointer">Student</Label>
                  </div>
                  <div className="flex items-center space-x-2 rounded-md border p-2">
                    <RadioGroupItem value="teacher" id="role-teacher" />
                    <Label htmlFor="role-teacher" className="cursor-pointer">Teacher</Label>
                  </div>
                  <div className="flex items-center space-x-2 rounded-md border p-2">
                    <RadioGroupItem value="admin" id="role-admin" />
                    <Label htmlFor="role-admin" className="cursor-pointer">Admin</Label>
                  </div>
                  <div className="flex items-center space-x-2 rounded-md border p-2">
                    <RadioGroupItem value="dev" id="role-dev" />
                    <Label htmlFor="role-dev" className="cursor-pointer">Dev</Label>
                  </div>
                </RadioGroup>
              </div>
            )}

            <div>
              <Label htmlFor="email">Email address</Label>
              <div className="mt-2">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <div className="mt-2">
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  required
                />
              </div>
            </div>

            {mode === 'signup' && !invitationCode && (
              <div>
                <Label htmlFor="invitationCode">Invitation Code (Optional)</Label>
                <div className="mt-2">
                  <Input
                    id="invitationCode"
                    name="invitationCode"
                    placeholder="Enter code to join a team"
                    className="font-mono uppercase"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  If you have an invitation code from your teacher, enter it here to join their team.
                </p>
              </div>
            )}

            {state.error && (
              <div className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 p-3 rounded-md border">
                {state.error}
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
                    {mode === 'signin' ? 'Signing in...' : 'Creating account...'}
                  </>
                ) : (
                  mode === 'signin' ? 'Sign in' : 'Create account'
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
                  Or
                </span>
              </div>
            </div>

            <div className="mt-6 flex justify-center text-sm">
              <Link
                href={mode === 'signin' ? '/sign-up' : '/sign-in'}
                className="font-medium text-primary hover:text-primary/80"
              >
                {mode === 'signin'
                  ? "Don't have an account? Sign up"
                  : 'Already have an account? Sign in'}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
