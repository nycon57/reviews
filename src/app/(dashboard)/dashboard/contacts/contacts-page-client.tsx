"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  AddressBook,
  MagnifyingGlass,
  Plus,
  UploadSimple,
  SpinnerGap as Loader2,
  User,
  LinkSimple,
  Trash,
} from "@phosphor-icons/react";
import { getContacts, deleteContact } from "@/lib/contacts/actions";
import type { Contact } from "@/lib/contacts/types";
import { AddContactDialog } from "@/components/contacts/add-contact-dialog";
import { ContactImportWizard } from "@/components/contacts/contact-import-wizard";
import { useToast } from "@/hooks/use-toast";

export function ContactsPageClient() {
  const { toast } = useToast();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [refetchCount, setRefetchCount] = useState(0);

  // Dialog state
  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const pageSize = 25;

  const refetch = useCallback(() => setRefetchCount((c) => c + 1), []);

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      setLoading(true);
      try {
        const result = await getContacts(page, pageSize, search || undefined);
        if (!cancelled) {
          if (result.success) {
            setContacts(result.data ?? []);
            setTotal(result.total ?? 0);
          } else {
            toast({ title: "Error", description: result.error || "Failed to load contacts", variant: "destructive" });
          }
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to fetch contacts:", err);
          toast({ title: "Error", description: "Failed to load contacts", variant: "destructive" });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, [page, search, refetchCount, toast]);

  // Debounced search
  const [searchInput, setSearchInput] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch((prev) => {
        if (prev !== searchInput) setPage(1);
        return searchInput;
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleDelete = (contact: Contact) => {
    startTransition(async () => {
      const result = await deleteContact(contact.id);
      if (result.success) {
        toast({ title: "Contact deactivated", description: `${contact.fullName} has been deactivated.` });
        refetch();
      } else {
        toast({ title: "Error", description: result.error || "Failed to delete contact", variant: "destructive" });
      }
    });
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-repwell-teal-300/10">
            <AddressBook className="h-6 w-6 text-repwell-teal-300" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold leading-tight tracking-tight text-repwell-teal-500">
              Contacts
            </h1>
            <p className="text-sm leading-snug text-repwell-teal-300">
              Manage your organization&apos;s employee directory
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setImportOpen(true)}
          >
            <UploadSimple className="mr-2 h-4 w-4" />
            Import CSV
          </Button>
          <Button
            onClick={() => setAddOpen(true)}
            className="bg-repwell-teal-300 hover:bg-repwell-teal-400 text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Contact
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <MagnifyingGlass className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search contacts..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="pl-10 focus-visible:ring-repwell-teal-300"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-repwell-teal-300" />
          </div>
        ) : contacts.length === 0 ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 p-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-repwell-sage-100/50">
              <AddressBook weight="duotone" className="h-8 w-8 text-repwell-teal-300" />
            </div>
            <h3 className="font-sans text-lg font-semibold text-repwell-teal-500">
              No contacts yet
            </h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              Add contacts manually or import a CSV file to build your employee directory.
            </p>
            <div className="flex gap-2 mt-2">
              <Button
                variant="outline"
                onClick={() => setImportOpen(true)}
              >
                <UploadSimple className="mr-2 h-4 w-4" />
                Import CSV
              </Button>
              <Button
                onClick={() => setAddOpen(true)}
                className="bg-repwell-teal-300 hover:bg-repwell-teal-400 text-white"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Contact
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-repwell-sage-100/20">
                    <th className="px-4 py-3 text-left font-medium text-repwell-teal-500">Name</th>
                    <th className="px-4 py-3 text-left font-medium text-repwell-teal-500">Email</th>
                    <th className="px-4 py-3 text-left font-medium text-repwell-teal-500 hidden md:table-cell">Department</th>
                    <th className="px-4 py-3 text-left font-medium text-repwell-teal-500 hidden lg:table-cell">Title</th>
                    <th className="px-4 py-3 text-left font-medium text-repwell-teal-500 hidden lg:table-cell">Phone</th>
                    <th className="px-4 py-3 text-left font-medium text-repwell-teal-500">Status</th>
                    <th className="px-4 py-3 text-right font-medium text-repwell-teal-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.map((contact) => (
                    <tr key={contact.id} className="border-b border-border last:border-0 hover:bg-repwell-sage-100/10 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-repwell-sage-100/50 flex-shrink-0">
                            <User className="h-4 w-4 text-repwell-teal-400" />
                          </div>
                          <span className="font-medium text-repwell-teal-500">{contact.fullName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-repwell-teal-400">{contact.email}</td>
                      <td className="px-4 py-3 text-repwell-teal-400 hidden md:table-cell">{contact.department || "—"}</td>
                      <td className="px-4 py-3 text-repwell-teal-400 hidden lg:table-cell">{contact.title || "—"}</td>
                      <td className="px-4 py-3 text-repwell-teal-400 hidden lg:table-cell">{contact.phone || "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {contact.isActive ? (
                            <Badge variant="secondary" className="text-xs bg-repwell-sage-100/50 text-repwell-teal-400">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs text-muted-foreground">
                              Inactive
                            </Badge>
                          )}
                          {contact.userId && (
                            <span role="img" aria-label="Linked to user account" title="Linked to user account">
                              <LinkSimple className="h-3.5 w-3.5 text-repwell-sage-200" />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {contact.isActive && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(contact)}
                            disabled={isPending}
                            className="h-8 w-8 text-muted-foreground hover:text-red-600"
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-border px-4 py-3">
                <p className="text-sm text-muted-foreground">
                  Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Dialogs */}
      <AddContactDialog open={addOpen} onOpenChange={setAddOpen} onSuccess={refetch} />
      <ContactImportWizard open={importOpen} onOpenChange={setImportOpen} onComplete={refetch} />
    </div>
  );
}
