import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Trash2, Loader2, Users, Mail, Shield, ShieldCheck, UserCheck, UserX, Clock } from "lucide-react";
import { useUserManagement } from "@/hooks/useUserManagement";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export const DataAdminView = () => {
  const { user } = useAuth();
  const {
    usersWithRoles,
    pendingUsers,
    pendingInvitations,
    isLoading,
    inviteUser,
    approveUser,
    rejectUser,
    updateRole,
    removeUser,
    cancelInvitation,
  } = useUserManagement();

  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "user">("user");

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    
    await inviteUser.mutateAsync({ email: inviteEmail, role: inviteRole });
    setInviteDialogOpen(false);
    setInviteEmail("");
    setInviteRole("user");
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: fr });
  };

  const getRoleBadge = (role: "admin" | "user") => {
    if (role === "admin") {
      return (
        <Badge variant="default" className="bg-accent">
          <ShieldCheck className="w-3 h-3 mr-1" />
          Admin
        </Badge>
      );
    }
    return (
      <Badge variant="secondary">
        <Shield className="w-3 h-3 mr-1" />
        Utilisateur
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <Users className="w-6 h-6" />
              Gestion des utilisateurs
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Validez les inscriptions et gérez les droits d'accès
            </p>
          </div>

          <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="w-4 h-4 mr-2" />
                Inviter un utilisateur
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Inviter un utilisateur</DialogTitle>
                <DialogDescription>
                  L'utilisateur recevra un accès automatique après avoir créé son compte avec cet email.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="invite-email">Email</Label>
                  <Input
                    id="invite-email"
                    type="email"
                    placeholder="utilisateur@exemple.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-3">
                  <Label>Rôle</Label>
                  <RadioGroup
                    value={inviteRole}
                    onValueChange={(v) => setInviteRole(v as "admin" | "user")}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="user" id="role-user" />
                      <Label htmlFor="role-user" className="font-normal cursor-pointer">
                        <span className="font-medium">Utilisateur</span>
                        <span className="text-muted-foreground ml-2">— Accès standard</span>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="admin" id="role-admin" />
                      <Label htmlFor="role-admin" className="font-normal cursor-pointer">
                        <span className="font-medium">Administrateur</span>
                        <span className="text-muted-foreground ml-2">— Gestion complète</span>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleInvite} disabled={inviteUser.isPending || !inviteEmail.trim()}>
                  {inviteUser.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Inviter
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Pending Users - Show first for visibility */}
        {pendingUsers.length > 0 && (
          <Card className="border-amber-500/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <Clock className="w-5 h-5" />
                Inscriptions en attente ({pendingUsers.length})
              </CardTitle>
              <CardDescription>
                Ces utilisateurs ont créé un compte et attendent votre validation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead>Inscrit le</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingUsers.map((pendingUser) => (
                    <TableRow key={pendingUser.id}>
                      <TableCell className="font-medium">{pendingUser.email}</TableCell>
                      <TableCell>{pendingUser.display_name || "-"}</TableCell>
                      <TableCell>{formatDate(pendingUser.created_at)}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          size="sm"
                          variant="default"
                          className="bg-emerald-600 hover:bg-emerald-700"
                          onClick={() => approveUser.mutate({ userId: pendingUser.user_id, role: "user" })}
                          disabled={approveUser.isPending}
                        >
                          <UserCheck className="w-4 h-4 mr-1" />
                          Approuver
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => rejectUser.mutate(pendingUser.id)}
                          disabled={rejectUser.isPending}
                        >
                          <UserX className="w-4 h-4 mr-1" />
                          Refuser
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Active Users */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5" />
              Utilisateurs actifs ({usersWithRoles.length})
            </CardTitle>
            <CardDescription>
              Utilisateurs ayant accès à l'application
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Depuis</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usersWithRoles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      Aucun utilisateur
                    </TableCell>
                  </TableRow>
                ) : (
                  usersWithRoles.map((userRole) => (
                    <TableRow key={userRole.id}>
                      <TableCell className="font-medium">
                        {userRole.email || (
                          <span className="font-mono text-xs text-muted-foreground">
                            {userRole.user_id.slice(0, 8)}...
                          </span>
                        )}
                        {userRole.user_id === user?.id && (
                          <Badge variant="outline" className="text-xs ml-2">Vous</Badge>
                        )}
                      </TableCell>
                      <TableCell>{userRole.display_name || "-"}</TableCell>
                      <TableCell>
                        {userRole.user_id === user?.id ? (
                          getRoleBadge(userRole.role)
                        ) : (
                          <Select
                            value={userRole.role}
                            onValueChange={(newRole) =>
                              updateRole.mutate({
                                userId: userRole.user_id,
                                newRole: newRole as "admin" | "user",
                              })
                            }
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">Utilisateur</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(userRole.created_at)}</TableCell>
                      <TableCell className="text-right">
                        {userRole.user_id !== user?.id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => removeUser.mutate(userRole.user_id)}
                            disabled={removeUser.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Pending Invitations */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Invitations en attente ({pendingInvitations.length})
            </CardTitle>
            <CardDescription>
              Utilisateurs pré-invités — ils seront approuvés automatiquement à l'inscription
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Rôle prévu</TableHead>
                  <TableHead>Invité le</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingInvitations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      Aucune invitation en attente
                    </TableCell>
                  </TableRow>
                ) : (
                  pendingInvitations.map((invitation) => (
                    <TableRow key={invitation.id}>
                      <TableCell>{invitation.email}</TableCell>
                      <TableCell>{getRoleBadge(invitation.role)}</TableCell>
                      <TableCell>{formatDate(invitation.invited_at)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => cancelInvitation.mutate(invitation.id)}
                          disabled={cancelInvitation.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
