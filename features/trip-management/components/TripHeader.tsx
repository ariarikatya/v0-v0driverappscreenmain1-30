"use client"

import Link from "next/link"
import { ArrowLeftRight, Wallet, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Language } from "@/lib/translations"
import type { RouteStop } from "../types"

interface TripHeaderProps {
  selectedTrip: string
  tripStatus: string
  isDirectionReversed: boolean
  isRouteDropdownDisabled: boolean
  userStatus: "pending" | "approved" | "confirmed"
  language: Language
  t: Record<string, string>
  tripId?: string
  routeData: Record<string, { start: string; end: string; tariff: number; stops: RouteStop[] }>
  getRouteDisplayName: () => string
  getTripStatusEmoji: () => string
  onSelectRoute: (tripId: string) => void
  onToggleDirection: () => void
  onLogout: () => void
  onNavigateToBalance: () => void
}

export function TripHeader({
  selectedTrip,
  tripStatus,
  isDirectionReversed,
  isRouteDropdownDisabled,
  userStatus,
  language,
  t,
  tripId,
  routeData,
  getRouteDisplayName,
  getTripStatusEmoji,
  onSelectRoute,
  onToggleDirection,
  onLogout,
  onNavigateToBalance,
}: TripHeaderProps) {
  const isConfirmed = userStatus === "confirmed"
  const isRouteDropdownLocked = isRouteDropdownDisabled || (!selectedTrip && tripStatus !== "PREP_IDLE")

  return (
    <div className="bg-card border-b border-border px-4 py-4 sticky top-0 z-10 shadow-sm rounded-lg mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 flex-1">
          <Select
            value={selectedTrip}
            onValueChange={onSelectRoute}
            disabled={!isConfirmed || isRouteDropdownLocked}
          >
            <SelectTrigger
              className={`${isRouteDropdownLocked ? "w-auto min-w-40 max-w-full" : "w-auto min-w-48 max-w-full"} h-auto min-h-10 ${
                isRouteDropdownLocked ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <SelectValue placeholder={t.selectTrip}>
                <span className="whitespace-normal leading-tight break-words">
                  {selectedTrip && getRouteDisplayName()}
                </span>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="247">
                {routeData["247"].start} → {routeData["247"].end}
              </SelectItem>
              <SelectItem value="248">
                {routeData["248"].start} → {routeData["248"].end}
              </SelectItem>
              <SelectItem value="249">
                {routeData["249"].start} → {routeData["249"].end}
              </SelectItem>
            </SelectContent>
          </Select>
          {tripStatus === "PREP_IDLE" && selectedTrip && (
            <Button
              variant="outline"
              size="icon"
              onClick={onToggleDirection}
              disabled={!selectedTrip || !isConfirmed}
            >
              <ArrowLeftRight className="h-4 w-4" />
            </Button>
          )}
          {selectedTrip && (
            <Badge variant="secondary" className="text-sm px-2 py-1 whitespace-nowrap">
              {language === "ru" ? "Тариф:" : "Tariff:"} {routeData[selectedTrip]?.tariff ?? ""} ₽
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={tripStatus !== "PREP_IDLE" ? "default" : "secondary"} className="text-2xl px-3 py-1">
            {getTripStatusEmoji()}
          </Badge>
          <Link href="/balance">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              disabled={!isConfirmed}
              onClick={(e) => {
                if (!isConfirmed) {
                  e.preventDefault()
                }
                onNavigateToBalance()
              }}
            >
              <Wallet className="h-5 w-5" />
            </Button>
          </Link>
          <Button variant="ghost" size="icon" onClick={onLogout} className="h-9 w-9">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {tripId && (
        <div className="mb-3">
          <p className="text-xs text-muted-foreground">
            {t.tripId}: {tripId}
          </p>
        </div>
      )}
    </div>
  )
}
