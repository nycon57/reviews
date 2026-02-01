'use client';

import { useState, useEffect, useTransition, useRef } from 'react';
import {
  Phone,
  UserCircle,
  LinkSimple,
  LinkBreak,
  SpinnerGap,
} from '@phosphor-icons/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  getLoPhoneAssignments,
  assignNumberToLo,
  unassignNumber,
  type LoPhoneAssignment as LoPhoneAssignmentData,
} from '@/lib/sms/enterprise/per-lo-numbers';
import { getOrganizationMembers, type OrganizationMember } from '@/lib/organization';
import { formatForDisplay } from '@/lib/sms/phone-utils';

export function LoPhoneAssignment() {
  const [assignments, setAssignments] = useState<LoPhoneAssignmentData[]>([]);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedNumber, setSelectedNumber] = useState<LoPhoneAssignmentData | null>(null);
  const [selectedLoId, setSelectedLoId] = useState('');
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const fetchIdRef = useRef(0);

  useEffect(() => {
    const fetchId = ++fetchIdRef.current;

    Promise.all([getLoPhoneAssignments(), getOrganizationMembers()]).then(
      ([assignResult, memberResult]) => {
        if (fetchId !== fetchIdRef.current) return;

        if (assignResult.success && assignResult.data) {
          setAssignments(assignResult.data);
        }
        if (memberResult.members) {
          setMembers(memberResult.members.filter((m) => m.is_active && m.role === 'user'));
        }
        setLoading(false);
      }
    );
  }, []);

  function refreshData() {
    Promise.all([getLoPhoneAssignments(), getOrganizationMembers()]).then(
      ([assignResult, memberResult]) => {
        if (assignResult.success && assignResult.data) {
          setAssignments(assignResult.data);
        }
        if (memberResult.members) {
          setMembers(memberResult.members.filter((m) => m.is_active && m.role === 'user'));
        }
      }
    );
  }

  function openAssignDialog(assignment: LoPhoneAssignmentData) {
    setSelectedNumber(assignment);
    setSelectedLoId(assignment.loanOfficerId ?? '');
    setAssignDialogOpen(true);
  }

  function handleAssign() {
    if (!selectedNumber || !selectedLoId) return;

    startTransition(async () => {
      const result = await assignNumberToLo({
        phoneNumberId: selectedNumber.phoneNumberId,
        loanOfficerId: selectedLoId,
      });

      if (result.success) {
        toast({ title: 'Number assigned', description: 'Phone number has been assigned to the loan officer.' });
        setAssignDialogOpen(false);
        refreshData();
      } else {
        toast({ title: 'Assignment failed', description: result.error, variant: 'destructive' });
      }
    });
  }

  function handleUnassign(assignment: LoPhoneAssignmentData) {
    startTransition(async () => {
      const result = await unassignNumber({
        phoneNumberId: assignment.phoneNumberId,
      });

      if (result.success) {
        toast({ title: 'Number unassigned', description: 'Phone number returned to the pool.' });
        refreshData();
      } else {
        toast({ title: 'Unassign failed', description: result.error, variant: 'destructive' });
      }
    });
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Per-LO Phone Numbers
          </CardTitle>
          <CardDescription>
            Assign dedicated phone numbers to loan officers. Messages from an LO will use their assigned number.
            Unassigned numbers use the organization default.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {assignments.length === 0 ? (
            <div className="rounded-md border border-dashed p-6 text-center">
              <Phone className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">
                No phone numbers available. Purchase numbers in SMS Settings first.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Phone Number</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead className="w-[120px]">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.map((assignment) => (
                  <TableRow key={assignment.phoneNumberId}>
                    <TableCell className="font-mono">
                      {formatForDisplay(assignment.phoneNumber)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {assignment.numberType.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {assignment.loanOfficerName ? (
                        <div className="flex items-center gap-2">
                          <UserCircle className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{assignment.loanOfficerName}</span>
                          <span className="text-sm text-muted-foreground">
                            {assignment.loanOfficerEmail}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Unassigned (pool)</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {assignment.loanOfficerId ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUnassign(assignment)}
                          disabled={isPending}
                        >
                          <LinkBreak className="mr-1 h-4 w-4" />
                          Unassign
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openAssignDialog(assignment)}
                          disabled={isPending}
                        >
                          <LinkSimple className="mr-1 h-4 w-4" />
                          Assign
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Assign Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Phone Number</DialogTitle>
            <DialogDescription>
              Select a loan officer to assign{' '}
              {selectedNumber ? formatForDisplay(selectedNumber.phoneNumber) : ''} to.
              Their outbound messages will use this number.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={selectedLoId} onValueChange={setSelectedLoId}>
              <SelectTrigger>
                <SelectValue placeholder="Select loan officer" />
              </SelectTrigger>
              <SelectContent>
                {members.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.full_name || m.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssign} disabled={!selectedLoId || isPending}>
              {isPending ? (
                <SpinnerGap className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <LinkSimple className="mr-2 h-4 w-4" />
              )}
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
