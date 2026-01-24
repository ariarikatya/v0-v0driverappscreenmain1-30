"use client"

import { useState, useEffect } from "react"
import { LoginForm } from "@/components/login-form"
import { RegisterForm } from "@/components/register-form"
import { TripFSMButton } from "@/components/trip-fsm-button"
import { QueueQRScanner, type QueuePassenger } from "@/components/queue-qr-scanner"
import { GeoTrackerIndicator } from "@/components/geo-tracker-indicator"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { 
  Wallet, 
  LogOut, 
  Languages, 
  MapPin, 
  Users, 
  Clock,
  ChevronRight
} from "lucide-react"
import Link from "next/link"
import { translations, type Language } from "@/lib/translations"
import { formatCurrency } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type AuthState = "login" | "register" | "awaiting" | "dashboard"
type TripState = "idle" | "preparation" | "boarding" | "in_transit" | "completed"

export default function HomePage() {
  const [authState, setAuthState] = useState<AuthState>("login")
  const [language, setLanguage] = useState<Language>("ru")
  const [tripState, setTripState] = useState<TripState>("idle")
  const [balance, setBalance] = useState(12450)
  const { toast } = useToast()
  const t = translations[language]

  // Queue passengers state
  const [passengers, setPassengers] = useState<QueuePassenger[]>([
    { id: 1, name: "Иван П.", queuePosition: 1, isFirst: true, count: 2, ticketCount: 2, orderNumber: 101 },
    { id: 2, name: "Ольга В.", queuePosition: 2, isFirst: false, count: 1, ticketCount: 1, orderNumber: 102 },
    { id: 3, name: "Сергей К.", queuePosition: 3, isFirst: false, count: 3, ticketCount: 3, orderNumber: 103 },
    { id: 4, name: "Мария С.", queuePosition: 4, isFirst: false, count: 1, ticketCount: 1, orderNumber: 104 },
    { id: 5, name: "Алексей Д.", queuePosition: 5, isFirst: false, count: 2, ticketCount: 2, orderNumber: 105 },
  ])

  // Load auth state from localStorage
  useEffect(() => {
    const savedAuth = localStorage.getItem("driverAuthState")
    if (savedAuth === "dashboard") {
      setAuthState("dashboard")
    }
    
    const savedLang = localStorage.getItem("driverLanguage")
    if (savedLang) {
      setLanguage(savedLang as Language)
    }

    const savedTripState = localStorage.getItem("driverTripState")
    if (savedTripState) {
      setTripState(savedTripState as TripState)
    }
  }, [])

  // Save state to localStorage
  useEffect(() => {
    localStorage.setItem("driverAuthState", authState)
  }, [authState])

  useEffect(() => {
    localStorage.setItem("driverLanguage", language)
  }, [language])

  useEffect(() => {
    localStorage.setItem("driverTripState", tripState)
  }, [tripState])

  const handleLogin = () => {
    setAuthState("dashboard")
    toast({
      title: language === "ru" ? "Вход выполнен" : "Logged in",
      description: language === "ru" ? "Добро пожаловать!" : "Welcome!",
    })
  }

  const handleLogout = () => {
    setAuthState("login")
    setTripState("idle")
    localStorage.removeItem("driverAuthState")
    localStorage.removeItem("driverTripState")
    toast({
      title: language === "ru" ? "Выход выполнен" : "Logged out",
    })
  }

  const handleRegister = () => {
    setAuthState("awaiting")
  }

  const handleTripStateChange = (newState: TripState) => {
    setTripState(newState)
  }

  const handleAcceptPassenger = (passengerId: number) => {
    setPassengers(prev => prev.filter(p => p.id !== passengerId))
    toast({
      title: language === "ru" ? "Пассажир принят" : "Passenger accepted",
    })
  }

  const handleRejectPassenger = (passengerId: number) => {
    setPassengers(prev => prev.filter(p => p.id !== passengerId))
    toast({
      title: language === "ru" ? "Пассажир отклонён" : "Passenger rejected",
      variant: "destructive",
    })
  }

  const handleReturnPassenger = (passengerId: number) => {
    // Already handled in QueueQRScanner
  }

  const languageOptions = [
    { code: "fr" as Language, name: "Français", flag: "FR" },
    { code: "ar" as Language, name: "العربية", flag: "AR" },
    { code: "darija-ar" as Language, name: "الدارجة", flag: "MA" },
    { code: "darija-latin" as Language, name: "Darija", flag: "MA" },
    { code: "amazigh-ar" as Language, name: "ⴰⵎⴰⵣⵉⵖ", flag: "MA" },
    { code: "amazigh-latin" as Language, name: "Tamazight", flag: "MA" },
    { code: "es" as Language, name: "Español", flag: "ES" },
    { code: "en" as Language, name: "English", flag: "EN" },
    { code: "ru" as Language, name: "Русский", flag: "RU" },
  ]

  // Login screen
  if (authState === "login") {
    return (
      <LoginForm 
        onLogin={handleLogin} 
        onRegister={() => setAuthState("register")}
        language={language}
        onLanguageChange={setLanguage}
      />
    )
  }

  // Register screen
  if (authState === "register") {
    return (
      <RegisterForm 
        onRegister={handleRegister}
        onBack={() => setAuthState("login")}
        language={language}
        onLanguageChange={setLanguage}
      />
    )
  }

  // Awaiting approval screen
  if (authState === "awaiting") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-100 dark:bg-yellow-900/30 mb-4 mx-auto">
            <Clock className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
          </div>
          <h1 className="text-xl font-bold mb-4">{t.awaitingApproval}</h1>
          <Button 
            onClick={() => setAuthState("dashboard")} 
            className="w-full mb-2"
          >
            {t.refreshStatus}
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setAuthState("login")} 
            className="w-full"
          >
            {t.logout}
          </Button>
        </Card>
      </div>
    )
  }

  // Main Dashboard
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            <span className="font-semibold">{t.tripNumber}247</span>
          </div>
          
          <div className="flex items-center gap-2">
            <GeoTrackerIndicator language={language} />
            
            <Select value={language} onValueChange={(value) => setLanguage(value as Language)}>
              <SelectTrigger className="w-[80px] h-8">
                <SelectValue>
                  <div className="flex items-center gap-1">
                    <Languages className="h-3 w-3" />
                    <span className="text-xs">{languageOptions.find(l => l.code === language)?.flag}</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {languageOptions.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium">{lang.flag}</span>
                      <span>{lang.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="p-4 space-y-4 pb-24">
        {/* Balance Card */}
        <Link href="/balance">
          <Card className="p-4 hover:bg-accent/50 transition-colors cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10">
                  <Wallet className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t.driverBalance}</p>
                  <p className="text-xl font-bold">{formatCurrency(balance)} RUB</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </Card>
        </Link>

        {/* Trip FSM Button */}
        <TripFSMButton 
          currentState={tripState}
          onStateChange={handleTripStateChange}
          language={language}
          t={t}
        />

        {/* Queue Section - Only visible during boarding or preparation */}
        {(tripState === "preparation" || tripState === "boarding") && (
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">{t.queue}</h2>
              <span className="text-sm text-muted-foreground">
                ({passengers.filter(p => !p.scanned || p.qrError).length})
              </span>
            </div>

            <QueueQRScanner
              passengers={passengers}
              onUpdate={setPassengers}
              onAccept={handleAcceptPassenger}
              onReject={handleRejectPassenger}
              onReturn={handleReturnPassenger}
              disabled={tripState === "idle"}
              language={language}
              t={t}
            />
          </Card>
        )}

        {/* Route Stops */}
        <Card className="p-4">
          <h2 className="font-semibold mb-3">{t.routeStops}</h2>
          <div className="space-y-3">
            {[
              { name: t.centerStart, bookings: 3, time: "08:00" },
              { name: t.leninStreet, bookings: 2, time: "08:15" },
              { name: t.galleryMall, bookings: 1, time: "08:30" },
              { name: t.stationEnd, bookings: 0, time: "08:45" },
            ].map((stop, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <div>
                    <p className="font-medium">{stop.name}</p>
                    <p className="text-xs text-muted-foreground">{stop.time}</p>
                  </div>
                </div>
                {stop.bookings > 0 && (
                  <span className="text-sm font-medium text-primary">
                    {stop.bookings} {t.bookings}
                  </span>
                )}
              </div>
            ))}
          </div>
        </Card>
      </main>
    </div>
  )
}
