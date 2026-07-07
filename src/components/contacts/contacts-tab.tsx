"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  AddressBook,
  MagnifyingGlass as Search,
  UploadSimple,
  Prohibit,
  CaretLeft as ChevronLeft,
  CaretRight as ChevronRight,
  User as UserIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { getContacts, type ContactListItem } from "@/lib/contacts/queries";
import { ContactDetailSheet } from "./contact-detail-sheet";
import { ContactImportDialog } from "./contact-import-dialog";

interface TeamMember {
  id: string;
  fullName: string;
  email?: string;
}

interface ContactsTabProps {
  initialContacts: ContactListItem[];
  initialTotal: number;
  teamMembers: TeamMember[];
  userRole: "admin" | "manager" | "user";
}

const PAGE_SIZE = 25;

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function ContactsTab({
  initialContacts,
  initialTotal,
  teamMembers,
  userRole,
}: ContactsTabProps) {
  const canManage = userRole === "admin" || userRole === "manager";

  const [contacts, setContacts] = useState<ContactListItem[]>(initialContacts);
  const [total, setTotal] = useState(initialTotal);
  const [isLoading, setIsLoading] = useState(false);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [ownerFilter, setOwnerFilter] = useState<string>("all");
  const [suppressionFilter, setSuppressionFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  const [importOpen, setImportOpen] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const isInitialMount = useRef(true);

  const fetchContacts = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getContacts({
        search: search || undefined,
        ownerUserId:
          canManage && ownerFilter !== "all" ? ownerFilter : undefined,
        suppressedOnly: suppressionFilter === "suppressed" ? true : undefined,
        page,
        pageSize: PAGE_SIZE,
      });
      setContacts(result.contacts);
      setTotal(result.total);
    } catch {
      toast({
        title: "Error",
        description: "Failed to load contacts.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [search, ownerFilter, suppressionFilter, page, canManage]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    fetchContacts();
  }, [fetchContacts]);

  return (
    <div className="space-y-6">
      <Card className="border border-border shadow-soft">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-repwell-teal-300/10">
                <AddressBook className="h-5 w-5 text-repwell-teal-300" />
              </div>
              <div>
                <CardTitle className="text-lg">Contacts</CardTitle>
                <CardDescription>
                  {total} {total === 1 ? "contact" : "contacts"} you&apos;ve asked
                  for feedback
                </CardDescription>
              </div>
            </div>
            <Button variant="outline" onClick={() => setImportOpen(true)}>
              <UploadSimple className="mr-2 h-4 w-4" />
              Import CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 p-6">
          {/* Filters */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setPage(1);
                    setSearch(searchInput.trim());
                  }
                }}
                className="pl-9"
              />
            </div>
            {canManage && (
              <Select
                value={ownerFilter}
                onValueChange={(v) => {
                  setOwnerFilter(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All owners" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All owners</SelectItem>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {teamMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Select
              value={suppressionFilter}
              onValueChange={(v) => {
                setSuppressionFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[190px]">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="suppressed">Do-not-contact only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {contacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-repwell-teal-300/10">
                <AddressBook className="h-7 w-7 text-repwell-teal-300" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-heading-accent">
                {search || suppressionFilter !== "all" || ownerFilter !== "all"
                  ? "No contacts match your filters"
                  : "No contacts yet"}
              </h3>
              <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
                {search || suppressionFilter !== "all" || ownerFilter !== "all"
                  ? "Try clearing the search or filters."
                  : "Contacts are created automatically when you send review or video requests. You can also import a list."}
              </p>
              <Button
                variant="outline"
                className="mt-5"
                onClick={() => setImportOpen(true)}
              >
                <UploadSimple className="mr-2 h-4 w-4" />
                Import CSV
              </Button>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-border/50">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className="text-xs font-medium uppercase tracking-wider">
                      Name
                    </TableHead>
                    <TableHead className="text-xs font-medium uppercase tracking-wider">
                      Email
                    </TableHead>
                    <TableHead className="text-xs font-medium uppercase tracking-wider">
                      Owner
                    </TableHead>
                    <TableHead className="text-xs font-medium uppercase tracking-wider">
                      Last activity
                    </TableHead>
                    <TableHead className="text-xs font-medium uppercase tracking-wider">
                      Status
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contacts.map((contact) => (
                    <TableRow
                      key={contact.id}
                      className="cursor-pointer"
                      onClick={() => setSelectedContactId(contact.id)}
                    >
                      <TableCell className="font-medium text-heading">
                        {contact.name || "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {contact.email || "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {contact.ownerName ? (
                          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                            <UserIcon className="h-3.5 w-3.5" />
                            {contact.ownerName}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/70">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(contact.lastActivityAt)}
                      </TableCell>
                      <TableCell>
                        {contact.suppressed ? (
                          <Badge
                            variant="outline"
                            className="gap-1 border-destructive/30 bg-destructive/5 text-destructive"
                          >
                            <Prohibit className="h-3 w-3" />
                            Do not contact
                          </Badge>
                        ) : (
                          <Badge variant="subtle">Active</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border/50 pt-4">
              <p className="text-xs text-muted-foreground">
                Showing {(page - 1) * PAGE_SIZE + 1} to{" "}
                {Math.min(page * PAGE_SIZE, total)} of {total}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1 || isLoading}
                >
                  <ChevronLeft className="mr-1 h-3.5 w-3.5" />
                  Previous
                </Button>
                <span className="text-xs font-medium tabular-nums text-muted-foreground">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages || isLoading}
                >
                  Next
                  <ChevronRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <ContactImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        canAssignOwner={canManage}
        teamMembers={teamMembers}
        onImported={fetchContacts}
      />

      <ContactDetailSheet
        contactId={selectedContactId}
        onOpenChange={(open) => {
          if (!open) setSelectedContactId(null);
        }}
        canManage={canManage}
        teamMembers={teamMembers}
        onMutated={fetchContacts}
      />
    </div>
  );
}
