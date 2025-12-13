import { getSession } from "@/lib/get-session"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Store, Key, Bell, Users } from "lucide-react"

export default async function SettingsPage() {
  const session = await getSession()

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your Seller Dawn configuration
        </p>
      </div>

      <Tabs defaultValue="shopify">
        <TabsList>
          <TabsTrigger value="shopify" className="gap-2">
            <Store className="h-4 w-4" />
            Shopify
          </TabsTrigger>
          <TabsTrigger value="api" className="gap-2">
            <Key className="h-4 w-4" />
            API Keys
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="team" className="gap-2">
            <Users className="h-4 w-4" />
            Team
          </TabsTrigger>
        </TabsList>

        <TabsContent value="shopify" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Shopify Store Connection</CardTitle>
              <CardDescription>
                Connect your Shopify store to import orders
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="store-domain">Store Domain</Label>
                <Input
                  id="store-domain"
                  placeholder="your-store.myshopify.com"
                  defaultValue={process.env.SHOPIFY_STORE_DOMAIN || ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="access-token">Access Token</Label>
                <Input
                  id="access-token"
                  type="password"
                  placeholder="shpat_xxxxxxxxxxxxx"
                />
                <p className="text-xs text-muted-foreground">
                  Create an access token in your Shopify admin under Apps &gt; Develop apps
                </p>
              </div>
              <Button>Save Connection</Button>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Sync Settings</CardTitle>
              <CardDescription>
                Configure how orders are synced from Shopify
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Auto-sync Interval</p>
                  <p className="text-sm text-muted-foreground">
                    Automatically sync orders every 5 minutes
                  </p>
                </div>
                <Button variant="outline">Configure</Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Webhook URL</p>
                  <p className="text-sm text-muted-foreground font-mono">
                    {process.env.APP_URL || "https://your-domain.com"}/api/shopify/webhook
                  </p>
                </div>
                <Button variant="outline">Copy</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>API Configuration</CardTitle>
              <CardDescription>
                Configure external service integrations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Twilio (SMS)</Label>
                <div className="grid gap-2">
                  <Input placeholder="Account SID" />
                  <Input placeholder="Auth Token" type="password" />
                  <Input placeholder="Phone Number" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>File Storage (S3/R2)</Label>
                <div className="grid gap-2">
                  <Input placeholder="Endpoint URL" />
                  <Input placeholder="Access Key ID" />
                  <Input placeholder="Secret Access Key" type="password" />
                  <Input placeholder="Bucket Name" />
                </div>
              </div>
              <Button>Save API Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Configure email and SMS notification preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                Notification settings coming soon...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Team Management</CardTitle>
              <CardDescription>
                Manage users and their roles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                Team management coming soon...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
