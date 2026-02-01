"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WidgetCard } from "./widget-card";
import type { WidgetConfig } from "@/lib/widgets/types";

interface WidgetListProps {
  widgets: WidgetConfig[];
  total: number;
}

export function WidgetList({ widgets, total }: WidgetListProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const filteredWidgets = widgets.filter((w) => {
    if (search && !w.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== "all" && w.status !== statusFilter) return false;
    if (typeFilter !== "all" && w.widget_type !== typeFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-repwell-teal-500">Widgets</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {total} widget{total === 1 ? "" : "s"} created
          </p>
        </div>
        <Button
          onClick={() => router.push("/dashboard/widgets/new")}
          className="gap-2 bg-repwell-teal-300 hover:bg-repwell-teal-400"
        >
          <Plus size={16} />
          Create Widget
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search widgets..."
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="lo_review">LO Reviews</SelectItem>
            <SelectItem value="branch_review">Branch Reviews</SelectItem>
            <SelectItem value="company_review">Company Reviews</SelectItem>
            <SelectItem value="review_carousel">Carousel</SelectItem>
            <SelectItem value="star_rating_badge">Star Badge</SelectItem>
            <SelectItem value="video_testimonial">Video</SelectItem>
            <SelectItem value="review_wall">Review Wall</SelectItem>
            <SelectItem value="nps_score_badge">NPS Badge</SelectItem>
            <SelectItem value="social_proof_banner">Social Proof</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Grid */}
      {filteredWidgets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 rounded-xl bg-repwell-sage-100/50 flex items-center justify-center mb-4">
            <LayoutGrid size={24} className="text-repwell-teal-300" />
          </div>
          <h3 className="text-base font-semibold text-repwell-teal-500 mb-1">
            {search || statusFilter !== "all" || typeFilter !== "all"
              ? "No widgets match your filters"
              : "No widgets yet"}
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm mb-4">
            {search || statusFilter !== "all" || typeFilter !== "all"
              ? "Try adjusting your search or filter criteria."
              : "Create your first embeddable review widget to showcase customer reviews on your website."}
          </p>
          {!search && statusFilter === "all" && typeFilter === "all" && (
            <Button
              onClick={() => router.push("/dashboard/widgets/new")}
              className="gap-2 bg-repwell-teal-300 hover:bg-repwell-teal-400"
            >
              <Plus size={16} />
              Create Widget
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredWidgets.map((widget) => (
            <WidgetCard key={widget.id} widget={widget} />
          ))}
        </div>
      )}
    </div>
  );
}
