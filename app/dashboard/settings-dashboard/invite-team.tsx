'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Loader2, PlusCircle, Shield, BookUser, GraduationCap, Users, MailPlus } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { use, useActionState } from 'react';
import { inviteTeamMember } from '@/app/(login)/actions';
import { useUser } from '@/lib/auth';

type ActionState = {
  error?: string;
  success?: string;
};

// Map role to icon and color
const ROLE_ICONS: Record<string, React.ReactNode> = {
  'owner': <Shield className="w-6 h-6 text-orange-500" aria-label="Owner" />, // Owner = shield
  'member': <BookUser className="w-6 h-6 text-blue-500" aria-label="Member" />, // Member = book-user
  'default': <Users className="w-6 h-6 text-primary" aria-label="Team Member" />,
};
function getRoleIcon(role?: string) {
  return ROLE_ICONS[role?.toLowerCase() ?? 'default'] ?? ROLE_ICONS['default'];
}

export function InviteTeamMember() {
  const { userPromise } = useUser();
  const user = use(userPromise);
  const isOwner = user?.role === 'owner';
  const [inviteState, inviteAction, isInvitePending] = useActionState<
    ActionState,
    FormData
  >(inviteTeamMember, { error: '', success: '' });

  return (
    <Card className="max-w-md mx-auto mt-8 shadow-lg border-2 border-orange-200 hover:shadow-2xl transition-all duration-200">
      <CardHeader className="flex flex-row items-center gap-2">
        <MailPlus className="w-7 h-7 text-orange-500 animate-bounce" aria-label="Invite Icon" />
        <CardTitle className="text-lg font-bold">Invite Team Member</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={inviteAction} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="flex items-center gap-2">
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Enter email"
                required
                disabled={!isOwner}
                className="flex-1"
                aria-required="true"
              />
              <Users className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <RadioGroup
              defaultValue="member"
              name="role"
              className="flex flex-row gap-6"
              disabled={!isOwner}
              aria-label="Select role"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="member" id="member" />
                {getRoleIcon('member')}
                <Label htmlFor="member" className="cursor-pointer">Member</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="owner" id="owner" />
                {getRoleIcon('owner')}
                <Label htmlFor="owner" className="cursor-pointer">Owner</Label>
              </div>
            </RadioGroup>
          </div>
          {inviteState?.error && (
            <p className="text-red-600 rounded bg-red-50 border border-red-200 px-3 py-2 mt-2 animate-shake" role="alert">{inviteState.error}</p>
          )}
          {inviteState?.success && (
            <p className="text-green-600 rounded bg-green-50 border border-green-200 px-3 py-2 mt-2 animate-pulse" role="status">{inviteState.success}</p>
          )}
          <Button
            type="submit"
            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold flex items-center gap-2 transition-all duration-150 focus-visible:ring-2 focus-visible:ring-orange-400"
            disabled={isInvitePending || !isOwner}
            aria-disabled={isInvitePending || !isOwner}
            aria-busy={isInvitePending}
          >
            {isInvitePending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending Invite...
              </>
            ) : (
              <>
                <PlusCircle className="w-5 h-5" />
                Send Invite
              </>
            )}
          </Button>
        </form>
      </CardContent>
      {!isOwner && (
        <CardFooter>
          <p className="text-sm text-muted-foreground">
            You must be a team owner to invite new members.
          </p>
        </CardFooter>
      )}
    </Card>
  );
}
