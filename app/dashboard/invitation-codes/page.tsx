'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from "react-i18next";
import { Pencil, X, Check } from 'lucide-react';
import { Loader2, PlusCircle, Trash2, Copy, Clock } from 'lucide-react';
import { useActionState } from 'react';
import { toast } from 'sonner';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useUser } from '@/lib/auth';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { InvitationCode } from '@/lib/db/schema';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { createTeamAction } from '@/app/actions/team';
import { generateInvitationCode, revokeInvitationCode } from '@/app/api/invitation-codes/actions';

type Team = { id: number; name: string };

export default function InvitationCodesPage() {
  const { userPromise } = useUser();
  const [teamRole, setTeamRole] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTab, setSelectedTab] = useState<string | undefined>(undefined);
  const [isLoadingTeams, setIsLoadingTeams] = useState(true);
  const [editingTeamId, setEditingTeamId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);
  const { t, i18n } = useTranslation();

  useEffect(() => {
    setRoleLoading(true);
    fetch('/api/user/team-role')
      .then(res => res.json())
      .then(data => {
        setTeamRole(data.teamRole);
        setUserRole(data.userRole);
      })
      .finally(() => setRoleLoading(false));
  }, []);

  useEffect(() => {
    setIsLoadingTeams(true);
    fetch('/api/manage-users/teams')
      .then(res => res.json())
      .then(data => {
        if (data.teams && data.teams.length > 0) {
          setTeams(data.teams);
          setSelectedTab(String(data.teams[0].id));
        } else {
          setTeams([]);
          setSelectedTab(undefined);
        }
      })
      .finally(() => setIsLoadingTeams(false));
  }, []);

  useEffect(() => {
    userPromise.then(setUser);
  }, [userPromise]);

  if (roleLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (
    userRole !== 'teacher' &&
    userRole !== 'owner' &&
    teamRole !== 'representative'
  ) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-lg text-muted-foreground">{t("notAuthorizedInvitationCodes")}</div>
      </div>
    );
  }

  const startRenaming = (teamId: number, currentName: string) => {
    setEditingTeamId(teamId);
    setEditingName(currentName);
  };

  const cancelRenaming = () => {
    setEditingTeamId(null);
    setEditingName('');
  };

  const saveRenaming = async (teamId: number) => {
    if (!editingName.trim() || isRenaming) return;
    setIsRenaming(true);
    try {
      const res = await fetch('/api/manage-users/teams', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId, newName: editingName.trim() }),
      });
      if (res.ok) {
        setTeams(teams =>
          teams.map(t =>
            t.id === teamId ? { ...t, name: editingName.trim() } : t
          )
        );
        if (selectedTab === String(teamId)) {
          setSelectedTab(String(teamId));
        }
        cancelRenaming();
      } else {
        // Optionally, show error
      }
    } finally {
      setIsRenaming(false);
    }
  };

  const handleTeamCreated = (team: Team) => {
    fetch('/api/manage-users/teams')
      .then(res => res.json())
      .then(data => {
        setTeams(data.teams || []);
        setSelectedTab(String(team.id));
      });
  };

  const isTeacher = user?.role === 'teacher' || user?.role === 'owner';

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex flex-col overflow-auto">
        <div className="p-6 space-y-6 w-full max-w-5xl mx-auto" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-2xl font-bold">{t("invitationCodesTitle")}</h1>
              <p className="text-muted-foreground">
                {t("invitationCodesDescription")}
              </p>
            </div>
            {isTeacher && (
              <Button 
                onClick={() => setSelectedTab("new")}
                className="bg-primary hover:bg-primary/90 text-white font-medium"
                size="lg"
              >
                <PlusCircle className="mr-2 h-5 w-5" />
                {t("addTeam")}
              </Button>
            )}
          </div>
          {isLoadingTeams ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Tabs
              value={selectedTab}
              onValueChange={setSelectedTab}
              className="w-full"
            >
              <TabsList className="flex justify-between items-center w-full bg-background border-b rounded-none px-0">
                <div className="flex gap-1">
                  {teams.map(team => (
                    <TabsTrigger key={team.id} value={String(team.id)} className="rounded-none px-4 py-2 text-sm font-medium">
                      {team.name}
                    </TabsTrigger>
                  ))}
                </div>
                <div className="flex gap-1 items-center">
                  {isTeacher && selectedTab && selectedTab !== "new" && (
                    editingTeamId === Number(selectedTab) ? (
                      <div className="flex items-center gap-1">
                        <Input
                          value={editingName}
                          onChange={e => setEditingName(e.target.value)}
                          className="h-7 w-24 px-2 py-1 text-xs"
                          autoFocus
                          maxLength={32}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              saveRenaming(Number(selectedTab));
                            } else if (e.key === 'Escape') {
                              cancelRenaming();
                            }
                          }}
                        />
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          onClick={() => saveRenaming(Number(selectedTab))}
                          disabled={isRenaming}
                          aria-label={t("save")}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          onClick={cancelRenaming}
                          aria-label={t("cancel")}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 p-0"
                        onClick={() => startRenaming(Number(selectedTab), teams.find(t => String(t.id) === selectedTab)?.name || '')}
                        aria-label={t("rename")}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )
                  )}
                  <TabsTrigger value="new" className="flex items-center rounded-none px-4 py-2 text-sm font-medium">
                    <PlusCircle className="h-4 w-4 mr-1" />
                    {t("addTeam")}
                  </TabsTrigger>
                </div>
              </TabsList>
              {teams.map(team => (
                <TabsContent key={team.id} value={String(team.id)} dir={i18n.language === 'ar' ? 'rtl' : 'ltr'} className="pt-6">
                  <TeamTabContent team={team} user={user} />
                </TabsContent>
              ))}
              <TabsContent value="new" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'} className="pt-6">
                <AddTeamForm user={user} onTeamCreated={handleTeamCreated} />
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
}

function TeamTabContent({ team, user }: { team: Team; user: any }) {
  const [codes, setCodes] = useState<InvitationCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [maxUses, setMaxUses] = useState('1');
  const [expiresInHours, setExpiresInHours] = useState('24');

  const [generateState, generateAction, isGeneratePending] = useActionState(
    generateInvitationCode,
    { error: '' }
  );
  const [revokeState, revokeAction, isRevokePending] = useActionState(
    revokeInvitationCode,
    { error: '' }
  );

  const { t } = useTranslation();

  const fetchCodes = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/invitation-codes?teamId=${team.id}`);
      if (response.ok) {
        const data = await response.json();
        const codesPatched = (data.codes || []).map((c: any) => ({
          ...c,
          maxUses: typeof c.maxUses === 'number' ? c.maxUses : undefined,
        }));
        setCodes(codesPatched);
      }
    } catch (error) {
      console.error('Error fetching codes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCodes();
  }, [team?.id]);

  useEffect(() => {
    if (generateState?.success && generateState?.code) {
      fetchCodes();
    }
  }, [generateState, fetchCodes]);

  useEffect(() => {
    if (revokeState?.success) {
      fetchCodes();
    }
  }, [revokeState, fetchCodes]);

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(t("codeCopiedToClipboard"));
  };

  const isTeacher = user?.role === 'teacher' || user?.role === 'owner';

  return (
    <div className="space-y-6">
      {isTeacher && (
        <Card>
          <CardHeader>
            <CardTitle>{t("generateNewInvitationCode")}</CardTitle>
            <CardDescription>
              {t("generateNewInvitationCodeDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              action={generateAction}
              className="space-y-4"
              onSubmit={() => {
                // Ensure teamName is set to the current team
                // (handled by hidden input below)
              }}
            >
              <input type="hidden" name="teamName" value={team.name} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`maxUses-${team.id}`}>{t("maximumUses")}</Label>
                  <Input
                    id={`maxUses-${team.id}`}
                    name="maxUses"
                    type="number"
                    value={maxUses}
                    onChange={(e) => setMaxUses(e.target.value)}
                    min="1"
                    placeholder="1"
                  />
                  <p className="text-xs text-muted-foreground">
                    {t("maximumUsesDesc")}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`expiresInHours-${team.id}`}>{t("expiresAfterHours")}</Label>
                  <Input
                    id={`expiresInHours-${team.id}`}
                    name="expiresInHours"
                    type="number"
                    value={expiresInHours}
                    onChange={(e) => setExpiresInHours(e.target.value)}
                    min="1"
                    placeholder="24"
                  />
                  <p className="text-xs text-muted-foreground">
                    {t("expiresAfterHoursDesc")}
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
                    {t("generating")}
                  </>
                ) : (
                  <>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    {t("generateCode")}
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t("activeInvitationCodes")}</CardTitle>
          <CardDescription>
            {t("manageActiveInvitationCodes")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : codes.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              {t("noActiveInvitationCodesFound")}
            </p>
          ) : (
            <div className="space-y-4">
              {codes.map((code) => (
                <div
                  key={`${code.id}-${code.code}`}
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
                          ? t("expiresAt", { date: format(new Date(code.expiresAt), 'MMM d, yyyy h:mm a') })
                          : t("neverExpires")}
                      </Badge>
                      <Badge variant="outline">
                        {t("usedOf", { used: code.usedCount, max: code.maxUses || '∞' })}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t("createdByOn", {
                        name: (
                          code.createdBy &&
                          typeof code.createdBy === 'object' &&
                          ('name' in code.createdBy || 'email' in code.createdBy)
                        )
                          ? ((code.createdBy as { name?: string; email?: string }).name ??
                             (code.createdBy as { name?: string; email?: string }).email ??
                             t("unknown"))
                          : t("unknown"),
                        date: format(new Date(code.createdAt), 'MMM d, yyyy')
                      })}
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
                            <p>{t("revokeThisCode")}</p>
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

function AddTeamForm({
  user,
  onTeamCreated,
}: {
  user: any;
  onTeamCreated: (team: Team) => void;
}) {
  const [teamName, setTeamName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await createTeamAction(teamName, user?.id);
      if (res?.error) {
        setError(res.error);
      } else if (res?.team) {
        setTeamName('');
        onTeamCreated(res.team);
        toast.success(t("teamCreatedSuccessfully"));
      } else {
        setError(t("unknownError"));
      }
    } catch (err) {
      setError(t("failedToCreateTeam"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto mt-8">
      <CardHeader>
        <CardTitle>{t("addNewTeam")}</CardTitle>
        <CardDescription>
          {t("addNewTeamDesc")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-team-name">{t("teamName")}</Label>
            <Input
              id="new-team-name"
              value={teamName}
              onChange={e => setTeamName(e.target.value)}
              required
              placeholder={t("enterTeamName")}
              disabled={isSubmitting}
            />
          </div>
          {error && <p className="text-red-500">{error}</p>}
          <Button
            type="submit"
            className="bg-primary hover:bg-primary/90"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("creating")}
              </>
            ) : (
              <>
                <PlusCircle className="mr-2 h-4 w-4" />
                {t("createTeam")}
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}