"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Lock, Trash2, Loader2 } from "lucide-react";
import { startTransition, useActionState } from "react";
import { updatePassword, deleteAccount } from "@/app/(login)/actions";
import HeadingSmall from "@/components/heading-small";
import { useTranslation } from 'react-i18next';

type ActionState = {
  error?: string;
  success?: string;
};

export default function SecurityPage() {
  const { t } = useTranslation();
  const [passwordState, passwordAction, isPasswordPending] = useActionState<
    ActionState,
    FormData
  >(updatePassword, { error: "", success: "" });

  const [deleteState, deleteAction, isDeletePending] = useActionState<
    ActionState,
    FormData
  >(deleteAccount, { error: "", success: "" });

  const handlePasswordSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    startTransition(() => {
      passwordAction(new FormData(event.currentTarget));
    });
  };

  const handleDeleteSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    startTransition(() => {
      deleteAction(new FormData(event.currentTarget));
    });
  };

  return (
    <section className="flex-1 p-4 lg:p-0">
      {/* <h1 className="text-lg lg:text-2xl font-medium bold  mb-6">
        {t('settings.security.title', 'Security Settings')}
      </h1> */}
      <HeadingSmall title={t('settings.security.title', 'Security Settings')} description={t('settings.security.description', 'Update your Password or delete your account')}/>

      <Card className="mb-8 mt-6">
        <CardHeader>
          <CardTitle>{t('settings.security.password', 'Password')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handlePasswordSubmit}>
            <div className="space-y-3">
              <Label htmlFor="current-password">{t('settings.security.currentPassword', 'Current Password')}</Label>
              <Input
                id="current-password"
                name="currentPassword"
                type="password"
                autoComplete="current-password"
                required
                minLength={8}
                maxLength={100}
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="new-password">{t('settings.security.newPassword', 'New Password')}</Label>
              <Input
                id="new-password"
                name="newPassword"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                maxLength={100}
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="confirm-password">{t('settings.security.confirmPassword', 'Confirm New Password')}</Label>
              <Input
                id="confirm-password"
                name="confirmPassword"
                type="password"
                required
                minLength={8}
                maxLength={100}
              />
            </div>
            {passwordState.error && (
              <p className="text-red-500 text-sm">{t(passwordState.error)}</p>
            )}
            {passwordState.success && (
              <p className="text-green-500 text-sm">{t(passwordState.success)}</p>
            )}
            <Button
              type="submit"
              className="bg-amber-600 hover:bg-amber-700 text-white"
              disabled={isPasswordPending}
            >
              {isPasswordPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('common.saving', 'Saving...')}
                </>
              ) : (
                <>
                  <Lock className="mr-2 h-4 w-4" />
                  {t('settings.security.updatePassword', 'Update Password')}
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card  className=" rounded-lg border border-red-100 bg-red-50  dark:border-red-200/10 dark:bg-red-700/10">
        <CardHeader>
          <CardTitle>{t('settings.security.deleteAccount', 'Delete Account')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 mb-4">
            {t('settings.security.deleteAccountWarning', 'Account deletion is non-reversable. Please proceed with caution.')}
          </p>
          <form onSubmit={handleDeleteSubmit} className="space-y-4">
            <div className="space-y-3">
              <Label htmlFor="delete-password">{t('settings.security.confirmPassword', 'Confirm Password')}</Label>
              <Input
                id="delete-password"
                name="password"
                type="password"
                required
                minLength={8}
                maxLength={100}
              />
            </div>
            {deleteState.error && (
              <p className="text-red-500 text-sm">{t(deleteState.error)}</p>
            )}
            <Button
              type="submit"
              className="bg-destructive hover:bg-red-700"
              disabled={isDeletePending}
            >
              {isDeletePending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('common.deleting', 'Deleting...')}
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t('settings.security.deleteAccountButton', 'Delete Account')}
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
