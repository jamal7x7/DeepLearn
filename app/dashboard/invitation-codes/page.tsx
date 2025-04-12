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
import { Loader2, PlusCircle, Trash2, Copy, Clock } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { useActionState } from 'react';
import { useUser } from '@/lib/auth';
import { generateInvitationCode, revokeInvitationCode } from '@/app/api/invitation-codes/actions';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { InvitationCode } from '@/lib/db/schema';

type ActionState = {
  error?: string;
  success?: string;
  code?: string;
  expiresAt?: Date | null;
  maxUses?: number;
};

export default function InvitationCodesPage() {
  const { userPromise } = useUser();
  const [user, setUser] = useState<any>(null);
  const [codes, setCodes] = useState<InvitationCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [maxUses, setMaxUses] = useState('1');
  const [expiresInHours, setExpiresInHours] = useState('24');
  
  const [generateState, generateAction, isGeneratePending] = useActionState<
    ActionState,
    FormData
  >(generateInvitationCode, { error: '', success: '' });
  
  const [revokeState, revokeAction, isRevokePending] = useActionState<
    ActionState,
    FormData
  >(revokeInvitationCode, { error: '', success: '' });

  useEffect(() => {
    userPromise.then(setUser);
  }, [userPromise]);

  useEffect(() => {
    if (user?.id) {
      fetchCodes();
    }
  }, [user]);

  useEffect(() => {
    if (generateState?.success && generateState?.code) {
      fetchCodes();
    }
  }, [generateState]);

  useEffect(() => {
    if (revokeState?.success) {
      fetchCodes();
    }
  }, [revokeState]);

  const fetchCodes = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/invitation-codes?teamId=${user.teamId}`);
      if (response.ok) {
        const data = await response.json();
        setCodes(data.codes || []);
      }
    } catch (error) {
      console.error('Error fetching codes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Code copied to clipboard');
  };

  const isTeacher = user?.role === 'teacher' || user?.role === 'owner';

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Invitation Codes</h1>
      <p className="text-muted-foreground">
        Generate unique invitation codes for students to join your class.
      </p>

      {isTeacher && (
        <Card>
          <CardHeader>
            <CardTitle>Generate New Invitation Code</CardTitle>
            <CardDescription>
              Create a unique code that students can use to join your class.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={generateAction} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="teamName">Team Name</Label>
                <Input
                  id="teamName"
                  name="teamName"
                  type="text"
                  placeholder="Enter team name"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Specify the team for this invitation code. If the team does not exist, it will be created.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxUses">Maximum Uses</Label>
                  <Input
                    id="maxUses"
                    name="maxUses"
                    type="number"
                    value={maxUses}
                    onChange={(e) => setMaxUses(e.target.value)}
                    min="1"
                    placeholder="1"
                  />
                  <p className="text-xs text-muted-foreground">
                    How many students can use this code. Leave at 1 for single-use codes.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expiresInHours">Expires After (hours)</Label>
                  <Input
                    id="expiresInHours"
                    name="expiresInHours"
                    type="number"
                    value={expiresInHours}
                    onChange={(e) => setExpiresInHours(e.target.value)}
                    min="1"
                    placeholder="24"
                  />
                  <p className="text-xs text-muted-foreground">
                    Code will expire after this many hours. Set to 24 for one day.
                  </p>
                </div>
              </div>

              {generateState?.error && (
                <p className="text-red-500">{generateState.error}</p>
              )}
              {generateState?.success && generateState?.code && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900 rounded-md">
                  <p className="text-green-700 dark:text-green-300 font-medium">
                    {generateState.success}
                  </p>
                  <div className="mt-2 flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border">
                    <code className="text-lg font-mono font-bold">{generateState.code}</code>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(generateState.code!)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className="bg-primary hover:bg-primary/90"
                disabled={isGeneratePending}
              >
                {isGeneratePending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Generate Code
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Active Invitation Codes</CardTitle>
          <CardDescription>
            Manage your active invitation codes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : codes.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              No active invitation codes found.
            </p>
          ) : (
            <div className="space-y-4">
              {codes.map((code) => (
                <div
                  key={code.id}
                  className="p-4 border rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <code className="text-lg font-mono font-bold">{code.code}</code>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(code.code)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {code.expiresAt
                          ? `Expires: ${format(new Date(code.expiresAt), 'MMM d, yyyy h:mm a')}`
                          : 'Never expires'}
                      </Badge>
                      <Badge variant="outline">
                        Used {code.usedCount} of {code.maxUses || '∞'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Created by {code.createdBy?.name || code.createdBy?.email} on{' '}
                      {format(new Date(code.createdAt), 'MMM d, yyyy')}
                    </p>
                  </div>
                  {isTeacher && (
                    <form action={revokeAction}>
                      <input type="hidden" name="codeId" value={code.id} />
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              type="submit"
                              variant="destructive"
                              size="sm"
                              disabled={isRevokePending}
                            >
                              {isRevokePending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Revoke this code</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </form>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}