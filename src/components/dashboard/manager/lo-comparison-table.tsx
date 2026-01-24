"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowsDownUp as ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Warning as AlertTriangle,
  CheckCircle,
  Eye,
  Star,
} from "@phosphor-icons/react";
import type { LoanOfficerComparison } from "@/lib/dashboard";

interface LOComparisonTableProps {
  data: LoanOfficerComparison[];
}

type SortField = "fullName" | "totalReviews" | "averageRating" | "npsScore" | "responseRate" | "reputationScore";
type SortDirection = "asc" | "desc";

export function LOComparisonTable({ data }: LOComparisonTableProps) {
  const [sortField, setSortField] = useState<SortField>("reputationScore");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];

      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDirection === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
      }

      return 0;
    });
  }, [data, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-1 h-3 w-3" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="ml-1 h-3 w-3" />
    ) : (
      <ArrowDown className="ml-1 h-3 w-3" />
    );
  };

  const getStatusBadge = (status: LoanOfficerComparison["performanceStatus"]) => {
    switch (status) {
      case "excellent":
        return (
          <Badge variant="default" className="bg-green-500/10 text-green-700 hover:bg-green-500/20">
            <CheckCircle className="mr-1 h-3 w-3" />
            Excellent
          </Badge>
        );
      case "good":
        return (
          <Badge variant="secondary">
            Good
          </Badge>
        );
      case "needs_attention":
        return (
          <Badge variant="default" className="bg-yellow-500/10 text-yellow-700 hover:bg-yellow-500/20">
            <AlertTriangle className="mr-1 h-3 w-3" />
            Needs Attention
          </Badge>
        );
      case "at_risk":
        return (
          <Badge variant="destructive">
            <AlertTriangle className="mr-1 h-3 w-3" />
            At Risk
          </Badge>
        );
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Team Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[200px] items-center justify-center text-muted-foreground">
            <div className="text-center">
              <p className="text-sm">No loan officers found</p>
              <p className="text-xs">Add team members to see their performance</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Team Performance</span>
          <span className="text-sm font-normal text-muted-foreground">
            {data.length} loan officer{data.length !== 1 ? "s" : ""}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[250px]">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="-ml-3 h-8 font-medium"
                    onClick={() => handleSort("fullName")}
                  >
                    Loan Officer
                    {getSortIcon("fullName")}
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 font-medium"
                    onClick={() => handleSort("totalReviews")}
                  >
                    Reviews
                    {getSortIcon("totalReviews")}
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 font-medium"
                    onClick={() => handleSort("averageRating")}
                  >
                    Rating
                    {getSortIcon("averageRating")}
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 font-medium"
                    onClick={() => handleSort("npsScore")}
                  >
                    NPS
                    {getSortIcon("npsScore")}
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 font-medium"
                    onClick={() => handleSort("responseRate")}
                  >
                    Response Rate
                    {getSortIcon("responseRate")}
                  </Button>
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.map((lo) => (
                <TableRow key={lo.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={lo.photoUrl || undefined} alt={lo.fullName} />
                        <AvatarFallback className="text-xs">
                          {getInitials(lo.fullName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{lo.fullName}</div>
                        {(lo.branch || lo.region) && (
                          <div className="text-xs text-muted-foreground">
                            {[lo.branch, lo.region].filter(Boolean).join(" - ")}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-col items-end">
                      <span className="font-medium">{lo.totalReviews}</span>
                      {lo.reviewsThisMonth > 0 && (
                        <span className="text-xs text-green-600">
                          +{lo.reviewsThisMonth} this month
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Star className="h-3 w-3 text-yellow-400" weight="fill" />
                      <span className="font-medium">{lo.averageRating.toFixed(1)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={`font-medium ${
                        lo.npsScore >= 50
                          ? "text-green-600"
                          : lo.npsScore >= 0
                            ? "text-yellow-600"
                            : "text-red-600"
                      }`}
                    >
                      {lo.npsScore > 0 ? "+" : ""}
                      {lo.npsScore}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="font-medium">{lo.responseRate}%</span>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(lo.performanceStatus)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/dashboard/team/${lo.id}`}>
                        <Eye className="mr-1 h-3 w-3" />
                        View
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
