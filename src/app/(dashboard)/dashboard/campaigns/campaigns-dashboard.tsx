"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  Envelope as Mail,
  Plus,
  PaperPlaneRight as Send,
  Clock,
  CheckCircle as CheckCircle2,
  Pause,
  Play,
  Calendar,
  Users,
  ChartBar as BarChart3,
  Eye,
  DotsThree as MoreHorizontal,
} from "@phosphor-icons/react";

interface CampaignsDashboardProps {
  userRole: string;
}

// Mock campaign data for demonstration
interface Campaign {
  id: string;
  name: string;
  description: string;
  status: "draft" | "scheduled" | "active" | "paused" | "completed";
  type: "one_time" | "recurring" | "triggered";
  targetAudience: string;
  totalRecipients: number;
  sentCount: number;
  openRate: number;
  responseRate: number;
  createdAt: string;
  scheduledAt?: string;
  completedAt?: string;
}

const mockCampaigns: Campaign[] = [
  {
    id: "1",
    name: "Monthly Customer Satisfaction",
    description: "Automated monthly survey to all customers who closed in the past 30 days",
    status: "active",
    type: "recurring",
    targetAudience: "Recent Closings",
    totalRecipients: 245,
    sentCount: 189,
    openRate: 68,
    responseRate: 42,
    createdAt: "2024-01-15T10:00:00Z",
    scheduledAt: "2024-01-15T10:00:00Z",
  },
  {
    id: "2",
    name: "Q4 Feedback Campaign",
    description: "One-time campaign to gather feedback from Q4 customers",
    status: "completed",
    type: "one_time",
    targetAudience: "Q4 2023 Customers",
    totalRecipients: 512,
    sentCount: 512,
    openRate: 72,
    responseRate: 51,
    createdAt: "2023-12-01T09:00:00Z",
    completedAt: "2024-01-05T14:30:00Z",
  },
  {
    id: "3",
    name: "New Loan Officer Welcome",
    description: "Triggered campaign for customers of newly onboarded loan officers",
    status: "paused",
    type: "triggered",
    targetAudience: "New LO Customers",
    totalRecipients: 78,
    sentCount: 45,
    openRate: 61,
    responseRate: 38,
    createdAt: "2024-01-10T14:00:00Z",
  },
  {
    id: "4",
    name: "Spring 2024 Outreach",
    description: "Scheduled campaign for spring outreach",
    status: "scheduled",
    type: "one_time",
    targetAudience: "All Active Customers",
    totalRecipients: 1200,
    sentCount: 0,
    openRate: 0,
    responseRate: 0,
    createdAt: "2024-01-20T11:00:00Z",
    scheduledAt: "2024-03-01T09:00:00Z",
  },
];

export function CampaignsDashboard({ userRole: _userRole }: CampaignsDashboardProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>(mockCampaigns);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const { toast } = useToast();

  // Stats calculations
  const activeCampaigns = campaigns.filter((c) => c.status === "active").length;
  const totalSent = campaigns.reduce((sum, c) => sum + c.sentCount, 0);
  const avgOpenRate = campaigns.length > 0
    ? Math.round(campaigns.reduce((sum, c) => sum + c.openRate, 0) / campaigns.length)
    : 0;
  const avgResponseRate = campaigns.length > 0
    ? Math.round(campaigns.reduce((sum, c) => sum + c.responseRate, 0) / campaigns.length)
    : 0;

  function getStatusBadge(status: Campaign["status"]) {
    switch (status) {
      case "draft":
        return <Badge variant="outline">Draft</Badge>;
      case "scheduled":
        return (
          <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
            <Clock className="mr-1 h-3 w-3" />
            Scheduled
          </Badge>
        );
      case "active":
        return (
          <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700">
            <Play className="mr-1 h-3 w-3" />
            Active
          </Badge>
        );
      case "paused":
        return (
          <Badge variant="outline" className="border-yellow-200 bg-yellow-50 text-yellow-700">
            <Pause className="mr-1 h-3 w-3" />
            Paused
          </Badge>
        );
      case "completed":
        return (
          <Badge variant="outline" className="border-gray-200 bg-gray-50 text-gray-700">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Completed
          </Badge>
        );
    }
  }

  function getTypeBadge(type: Campaign["type"]) {
    switch (type) {
      case "one_time":
        return <Badge variant="secondary">One-time</Badge>;
      case "recurring":
        return <Badge variant="secondary">Recurring</Badge>;
      case "triggered":
        return <Badge variant="secondary">Triggered</Badge>;
    }
  }

  function handleCreateCampaign() {
    toast({
      title: "Campaign created",
      description: "Your new campaign has been created as a draft.",
    });
    setCreateDialogOpen(false);
  }

  function handleToggleCampaign(campaignId: string, currentStatus: Campaign["status"]) {
    const newStatus = currentStatus === "active" ? "paused" : "active";
    setCampaigns((prev) =>
      prev.map((c) =>
        c.id === campaignId ? { ...c, status: newStatus } : c
      )
    );
    toast({
      title: newStatus === "active" ? "Campaign resumed" : "Campaign paused",
      description: `The campaign has been ${newStatus === "active" ? "resumed" : "paused"}.`,
    });
  }

  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                <Play className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeCampaigns}</p>
                <p className="text-xs text-muted-foreground">Active Campaigns</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                <Send className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalSent.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Sent</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                <Eye className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{avgOpenRate}%</p>
                <p className="text-xs text-muted-foreground">Avg Open Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100">
                <BarChart3 className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{avgResponseRate}%</p>
                <p className="text-xs text-muted-foreground">Avg Response Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns list */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Campaigns</CardTitle>
            <CardDescription>
              Manage your email campaigns for survey distribution
            </CardDescription>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Campaign
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create Campaign</DialogTitle>
                <DialogDescription>
                  Set up a new email campaign for survey distribution.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Campaign Name</Label>
                  <Input id="name" placeholder="Monthly Customer Survey" />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Brief description of this campaign..."
                    rows={3}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="type">Campaign Type</Label>
                  <Select defaultValue="one_time">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="one_time">One-time</SelectItem>
                      <SelectItem value="recurring">Recurring</SelectItem>
                      <SelectItem value="triggered">Triggered</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="audience">Target Audience</Label>
                  <Select defaultValue="all">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Customers</SelectItem>
                      <SelectItem value="recent">Recent Closings (30 days)</SelectItem>
                      <SelectItem value="quarter">Current Quarter</SelectItem>
                      <SelectItem value="custom">Custom Segment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="schedule">Schedule for Later</Label>
                    <p className="text-xs text-muted-foreground">
                      Set a specific date and time
                    </p>
                  </div>
                  <Switch id="schedule" />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateCampaign}>
                  Create Campaign
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="all">
            <TabsList className="mb-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              {campaigns.map((campaign) => (
                <CampaignCard
                  key={campaign.id}
                  campaign={campaign}
                  onToggle={() => handleToggleCampaign(campaign.id, campaign.status)}
                  getStatusBadge={getStatusBadge}
                  getTypeBadge={getTypeBadge}
                />
              ))}
            </TabsContent>

            <TabsContent value="active" className="space-y-4">
              {campaigns.filter((c) => c.status === "active").map((campaign) => (
                <CampaignCard
                  key={campaign.id}
                  campaign={campaign}
                  onToggle={() => handleToggleCampaign(campaign.id, campaign.status)}
                  getStatusBadge={getStatusBadge}
                  getTypeBadge={getTypeBadge}
                />
              ))}
              {campaigns.filter((c) => c.status === "active").length === 0 && (
                <EmptyState message="No active campaigns" />
              )}
            </TabsContent>

            <TabsContent value="scheduled" className="space-y-4">
              {campaigns.filter((c) => c.status === "scheduled").map((campaign) => (
                <CampaignCard
                  key={campaign.id}
                  campaign={campaign}
                  onToggle={() => handleToggleCampaign(campaign.id, campaign.status)}
                  getStatusBadge={getStatusBadge}
                  getTypeBadge={getTypeBadge}
                />
              ))}
              {campaigns.filter((c) => c.status === "scheduled").length === 0 && (
                <EmptyState message="No scheduled campaigns" />
              )}
            </TabsContent>

            <TabsContent value="completed" className="space-y-4">
              {campaigns.filter((c) => c.status === "completed").map((campaign) => (
                <CampaignCard
                  key={campaign.id}
                  campaign={campaign}
                  onToggle={() => handleToggleCampaign(campaign.id, campaign.status)}
                  getStatusBadge={getStatusBadge}
                  getTypeBadge={getTypeBadge}
                />
              ))}
              {campaigns.filter((c) => c.status === "completed").length === 0 && (
                <EmptyState message="No completed campaigns" />
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Info card */}
      <Card className="bg-muted/30 border-dashed">
        <CardContent className="py-4 px-6">
          <h3 className="font-medium mb-2">Campaign Types</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• <strong>One-time</strong> - Send once to a specific audience</li>
            <li>• <strong>Recurring</strong> - Automatically send on a schedule (daily, weekly, monthly)</li>
            <li>• <strong>Triggered</strong> - Send based on events (e.g., loan closing, new customer)</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function CampaignCard({
  campaign,
  onToggle,
  getStatusBadge,
  getTypeBadge,
}: {
  campaign: Campaign;
  onToggle: () => void;
  getStatusBadge: (status: Campaign["status"]) => React.ReactNode;
  getTypeBadge: (type: Campaign["type"]) => React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between p-4 border rounded-lg">
      <div className="space-y-1 flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className="font-medium">{campaign.name}</h4>
          {getStatusBadge(campaign.status)}
          {getTypeBadge(campaign.type)}
        </div>
        <p className="text-sm text-muted-foreground truncate">{campaign.description}</p>
        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {campaign.targetAudience}
          </span>
          <span>
            {campaign.sentCount.toLocaleString()} / {campaign.totalRecipients.toLocaleString()} sent
          </span>
          {campaign.scheduledAt && campaign.status === "scheduled" && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(campaign.scheduledAt).toLocaleDateString()}
            </span>
          )}
        </div>
        <div className="flex items-center gap-4 text-xs mt-1">
          <span className="text-muted-foreground">
            Open rate: <span className="font-medium text-foreground">{campaign.openRate}%</span>
          </span>
          <span className="text-muted-foreground">
            Response rate: <span className="font-medium text-foreground">{campaign.responseRate}%</span>
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2 ml-4">
        {(campaign.status === "active" || campaign.status === "paused") && (
          <Button variant="outline" size="sm" onClick={onToggle}>
            {campaign.status === "active" ? (
              <>
                <Pause className="mr-1 h-3 w-3" />
                Pause
              </>
            ) : (
              <>
                <Play className="mr-1 h-3 w-3" />
                Resume
              </>
            )}
          </Button>
        )}
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-8 text-muted-foreground">
      <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
      <p>{message}</p>
    </div>
  );
}
