"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import axios, { AxiosResponse } from "axios"
import { Bell, Mail, Search, User, ArrowRight, Building, Building2, CreditCard, Globe, Heart, History, SendToBack, Wallet, ChevronDown, Check, Loader2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {Select,SelectContent,SelectItem,SelectTrigger,SelectValue,} from "@/components/ui/select"

// Enhanced Type definitions based on API response
interface PersonalProfile {
  id: string
  userId: string
  otherNames: string
  lastName: string
  gender: "MALE" | "FEMALE" | "OTHER"
  phone: string
  address: string
  dateOfBirth: string
  kycVerified: boolean
  riskAssessment: string | null
  bvn: string
  identificationType: string
  identificationPhoto: string
}

interface CurrencyBalance {
  id: string
  accountId: string
  currencyCode: string
  availableBalance: number
  ledgerBalance: number
  createdAt: string
  updatedAt: string
}

interface Account {
  id: string
  accountTypeId: string
  type: "SAVINGS" | "CURRENT" | "FIXED_DEPOSIT_BY_DATE" | "FIXED_DEPOSIT_BY_AMOUNT"
  defaultAccount: boolean
  minimumBalance: number
  interestRate: number
  overdraftLimit: number
  activationStatus: "ACTIVE" | "PENDING" | "SUSPENDED"
  createdAt: string
  currencyBalances: CurrencyBalance[]
  lockConditions: any
}

interface AccountType {
  id: string
  accountNumber: string
  type: "PERSONAL" | "CORPORATE"
  defaultAccountType: boolean
  userId: string
  createdAt: string
  updatedAt: string
  accounts: Account[]
}

interface UserData {
  id: string
  email: string
  role: "CUSTOMER" | "ADMIN"
  createdAt: string
  updatedAt: string
  country: string | null
  biometricAuth: boolean
  twoFactorEnabled: boolean
  language: string
  defaultCurrency: string
  personalProfile: PersonalProfile
  corporateProfile: any
  accountTypes: AccountType[]
}

interface Transaction {
  id: string
  type: "TRANSFER" | "EXCHANGE" | "DEPOSIT" | "WITHDRAWAL"
  timestamp: string
  amount: number
  currency: string
  status: "COMPLETED" | "PENDING" | "FAILED"
  description?: string
  fromAccount?: string
  toAccount?: string
}

// API functions
const fetchUserData = async (): Promise<UserData> => {
  const response: AxiosResponse<UserData> = await axios.get('https://sbfserver.site/accounts/user/test')
  return response.data
}

export default function TransactionsPage(){
  // TanStack Query for user data
  const {
    data: userData,
    isLoading: isLoadingUser,
    error: userError,
    isError: hasUserError,
    refetch: refetchUser
  } = useQuery<UserData, Error>({
    queryKey: ['user', 'test'],
    queryFn: fetchUserData,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 3,
    retryDelay: (attemptIndex: number): number => Math.min(1000 * 2 ** attemptIndex, 30000),
  })

  // State management
  const [selectedAccountTypeId, setSelectedAccountTypeId] = useState<string>("")
  const [selectedAccountId, setSelectedAccountId] = useState<string>("")
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null)
  const [selectedAccountType, setSelectedAccountType] = useState<AccountType | null>(null)
  
  // Transactions state
  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: "1",
      type: "TRANSFER",
      timestamp: new Date().toISOString(),
      amount: 1000,
      currency: "NGN",
      status: "COMPLETED",
      description: "Internal transfer"
    },
    {
      id: "2",
      type: "EXCHANGE",
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      amount: 500,
      currency: "USD",
      status: "PENDING",
      description: "Currency exchange"
    }
  ])
  const [isLoadingTransactions, setIsLoadingTransactions] = useState<boolean>(false)

  // Auto-select account type and account when userData changes
  useEffect(() => {
    if (userData?.accountTypes && userData.accountTypes.length > 0) {
      // Auto-select first account type if none selected
      if (!selectedAccountTypeId) {
        const defaultAccountType = userData.accountTypes.find(at => at.defaultAccountType) || userData.accountTypes[0]
        setSelectedAccountTypeId(defaultAccountType.id)
      }
    }
  }, [userData, selectedAccountTypeId])

  // Update selected account type when selectedAccountTypeId changes
  useEffect(() => {
    if (selectedAccountTypeId && userData?.accountTypes) {
      const accountType = userData.accountTypes.find(at => at.id === selectedAccountTypeId)
      setSelectedAccountType(accountType || null)
      
      // Auto-select first active account in the selected account type
      if (accountType?.accounts && accountType.accounts.length > 0) {
        const activeAccount = accountType.accounts.find(acc => acc.activationStatus === "ACTIVE") || accountType.accounts[0]
        setSelectedAccountId(activeAccount.id)
      }
    }
  }, [selectedAccountTypeId, userData])

  // Update selected account when selectedAccountId changes
  useEffect(() => {
    if (selectedAccountId && selectedAccountType?.accounts) {
      const account = selectedAccountType.accounts.find(acc => acc.id === selectedAccountId)
      setSelectedAccount(account || null)
    }
  }, [selectedAccountId, selectedAccountType])

  // Helper functions
  const getDisplayName = (): string => {
    if (userData?.personalProfile) {
      const { otherNames, lastName } = userData.personalProfile
      if (otherNames && lastName) {
        return `${otherNames} ${lastName}`
      }
      return otherNames || lastName || userData.email
    }
    return userData?.email || "User"
  }

  const getUserInitials = (): string => {
    if (userData?.personalProfile) {
      const { otherNames, lastName } = userData.personalProfile
      if (otherNames && lastName) {
        return `${otherNames[0]}${lastName[0]}`.toUpperCase()
      }
      if (otherNames) return otherNames[0].toUpperCase()
      if (lastName) return lastName[0].toUpperCase()
    }
    if (userData?.email) {
      return userData.email[0].toUpperCase()
    }
    return "U"
  }

  const getAccountTypeDisplay = (): string => {
    if (selectedAccountType) {
      return `${selectedAccountType.type.toLowerCase()} Account`
    }
    return "Account"
  }

  const formatCurrency = (amount: number, currencyCode: string): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      currencyDisplay: 'code'
    }).format(amount)
  }

  const formatDateTime = (timestamp: string): string => {
    return new Date(timestamp).toLocaleString()
  }

  const getAccountBalance = (account: Account): number => {
    const primaryBalance = account.currencyBalances.find(
      balance => balance.currencyCode === userData?.defaultCurrency
    ) || account.currencyBalances[0]
    return primaryBalance?.availableBalance || 0
  }

  const getAccountCurrency = (account: Account): string => {
    const primaryBalance = account.currencyBalances.find(
      balance => balance.currencyCode === userData?.defaultCurrency
    ) || account.currencyBalances[0]
    return primaryBalance?.currencyCode || "NGN"
  }

  const getStatusBadgeClass = (status: string): string => {
    switch (status) {
      case "ACTIVE":
        return "border-green-200 text-green-700 bg-green-50"
      case "PENDING":
        return "border-yellow-200 text-yellow-700 bg-yellow-50"
      case "SUSPENDED":
        return "border-red-200 text-red-700 bg-red-50"
      case "COMPLETED":
        return "border-green-200 text-green-700 bg-green-50"
      case "FAILED":
        return "border-red-200 text-red-700 bg-red-50"
      default:
        return "border-gray-200 text-gray-700 bg-gray-50"
    }
  }

  const getTransactionIcon = (type: Transaction['type']) => {
    switch (type) {
      case "TRANSFER":
        return <SendToBack className="h-5 w-5 text-[#2dd4bf]" />
      case "EXCHANGE":
        return <CreditCard className="h-5 w-5 text-[#2dd4bf]" />
      case "DEPOSIT":
        return <ArrowRight className="h-5 w-5 text-[#2dd4bf] rotate-90" />
      case "WITHDRAWAL":
        return <ArrowRight className="h-5 w-5 text-[#2dd4bf] -rotate-90" />
      default:
        return <Wallet className="h-5 w-5 text-[#2dd4bf]" />
    }
  }

  const getErrorMessage = (error: Error): string => {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        return "User not found"
      }
      if (error.response?.status >= 500) {
        return "Server error. Please try again later."
      }
      return "Network error. Please check your connection."
    }
    return "An unexpected error occurred"
  }

  return (
    <>
    <div className="min-h-screen bg-[#f5f3fa]">
      <header className="px-6 pt-2 w-full bg-[#f5f3fa] backdrop-blur supports-[backdrop-filter]:bg-[#f5f3fa]/80">
        <div className="container flex h-14 !py-4 items-center justify-between">
          <div className="flex items-center gap-4 flex-1 max-w-2xl">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="search"
                placeholder="Search investments, accounts, or beneficiaries..."
                className="w-full pl-10 bg-white/50 border-gray-200 focus:border-[#2dd4bf] focus:ring-[#2dd4bf]/20 transition-colors"
              />
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-6">
            <Link href="#" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              Contacts
            </Link>
            <Link href="#" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              Support
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="text-gray-600 hover:text-gray-900">
              <Mail className="h-5 w-5" />
              <span className="sr-only">Messages</span>
            </Button>
            <Button variant="ghost" size="icon" className="text-gray-600 hover:text-gray-900">
              <Bell className="h-5 w-5" />
              <span className="sr-only">Notifications</span>
            </Button>
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage 
                  src={userData?.personalProfile?.identificationPhoto || "/placeholder.svg?height=32&width=32"} 
                  alt={getDisplayName()}
                />
                <AvatarFallback>
                  {isLoadingUser ? (
                    <Loader2 className="h-4 w-4 animate-spin text-[#2dd4bf]" />
                  ) : (
                    <span className="text-sm font-medium text-[#0d9488]">
                      {getUserInitials()}
                    </span>
                  )}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block text-sm">
                <p className="font-medium">
                  {isLoadingUser ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-3 w-3 animate-spin text-[#2dd4bf]" />
                      <span className="text-gray-500">Loading...</span>
                    </div>
                  ) : hasUserError ? (
                    <span className="text-red-500 text-xs">
                      {getErrorMessage(userError)}
                    </span>
                  ) : (
                    getDisplayName()
                  )}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {isLoadingUser ? (
                    <span className="text-gray-400">Please wait...</span>
                  ) : (
                    getAccountTypeDisplay()
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Error banner for API errors */}
        {hasUserError && (
          <div className="container">
            <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-red-700">
                  <span className="font-medium">Connection Error:</span> {getErrorMessage(userError)}
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => refetchUser()}
                  className="border-red-300 text-red-700 hover:bg-red-50"
                >
                  Retry
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Account selector */}
        <div className="container">
          <Card className="mb-6 border-[#2dd4bf]/20 bg-gradient-to-r from-[#2dd4bf]/5 to-[#34d399]/5">
            <CardContent className="p-4">
              {isLoadingUser ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-[#2dd4bf] mb-4" />
                  <p className="text-gray-500 text-sm">Loading account information...</p>
                </div>
              ) : hasUserError ? (
                <div className="text-center py-8">
                  <p className="text-red-500 mb-4">Unable to load account information</p>
                  <Button onClick={() => refetchUser()} variant="outline">
                    Retry Loading
                  </Button>
                </div>
              ) : userData?.accountTypes && userData.accountTypes.length > 0 ? (
                <>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-full bg-[#2dd4bf]/10">
                        <Building className="h-5 w-5 text-[#2dd4bf]" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-[#0d9488]">Select Account</h3>
                        <p className="text-sm text-gray-600">
                          {userData.accountTypes.length} account type{userData.accountTypes.length !== 1 ? 's' : ''} available
                        </p>
                      </div>
                    </div>
                    
                    <div className="min-w-[280px]">
                      <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                        <SelectTrigger className="w-full border-[#2dd4bf]/30 focus:border-[#2dd4bf] focus:ring-[#2dd4bf]/20">
                          <SelectValue placeholder="Choose an account">
                            {selectedAccount && (
                              <div className="flex items-center justify-between w-full">
                                <div className="flex flex-col items-start">
                                  <span className="font-medium">{selectedAccount.type}</span>
                                  <span className="text-xs text-gray-500">
                                    {selectedAccountType?.accountNumber} • {formatCurrency(getAccountBalance(selectedAccount), getAccountCurrency(selectedAccount))}
                                  </span>
                                </div>
                              </div>
                            )}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {userData.accountTypes.map((accountType) => (
                            accountType.accounts.map((account) => (
                              <SelectItem key={account.id} value={account.id}>
                                <div className="flex items-center justify-between w-full min-w-[240px]">
                                  <div className="flex flex-col items-start">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium">{account.type}</span>
                                      <Badge 
                                        variant="outline" 
                                        className={`text-xs ${getStatusBadgeClass(account.activationStatus)}`}
                                      >
                                        {account.activationStatus}
                                      </Badge>
                                    </div>
                                    <span className="text-sm text-gray-600">{accountType.type}</span>
                                    <span className="text-xs text-gray-500">
                                      {accountType.accountNumber}
                                    </span>
                                  </div>
                                  <div className="text-right">
                                    <div className="font-semibold text-[#2dd4bf]">
                                      {formatCurrency(getAccountBalance(account), getAccountCurrency(account))}
                                    </div>
                                  </div>
                                </div>
                              </SelectItem>
                            ))
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Selected account details */}
                  {selectedAccount && (
                    <div className="mt-4 pt-4 border-t border-[#2dd4bf]/20">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Account Type</span>
                          <p className="font-medium text-[#0d9488]">{selectedAccount.type}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Current Balance</span>
                          <p className="font-medium text-[#2dd4bf]">
                            {formatCurrency(getAccountBalance(selectedAccount), getAccountCurrency(selectedAccount))}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500">Status</span>
                          <p className={`font-medium ${
                            selectedAccount.activationStatus === "ACTIVE" ? "text-green-600" : 
                            selectedAccount.activationStatus === "PENDING" ? "text-yellow-600" : "text-red-600"
                          }`}>
                            {selectedAccount.activationStatus}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500">Interest Rate</span>
                          <p className="font-medium text-gray-700">
                            {(selectedAccount.interestRate * 100).toFixed(1)}% p.a.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No accounts found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </header>

      <main className="container py-8">
        <div className="mb-12">
          <h1 className="text-4xl mb-1 font-bold bg-gradient-to-r from-[#0d9488] to-[#2dd4bf] bg-clip-text text-transparent">
            Transactions
            {userData?.personalProfile?.otherNames && (
              <span className="text-lg font-normal text-gray-600 ml-3">
                Welcome back, {userData.personalProfile.otherNames.split(' ')[0]}!
              </span>
            )}
          </h1>
          <p className="text-muted-foreground">
            Manage your money transfers and view transaction history
          </p>
        </div>
<Card className="border-0 shadow-lg pt-0 mb-12">
          <CardHeader className="bg-gradient-to-r py-4 from-[#2dd4bf] via-[#34d399] to-[#10b981] rounded-t-lg text-white relative overflow-hidden">
            <CardTitle>Account Information</CardTitle>
            <CardDescription className="text-white/90">
              Your account details and limits
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {isLoadingUser ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-[#2dd4bf] mb-4" />
                <p className="text-gray-500 text-sm">Loading account details...</p>
              </div>
            ) : selectedAccount ? (
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg text-[#0d9488]">Account Details</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Account Type</span>
                      <span className="font-semibold">{selectedAccount.type}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Account Number</span>
                      <span className="font-semibold">{selectedAccountType?.accountNumber}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Minimum Balance</span>
                      <span className="font-semibold">
                        {formatCurrency(selectedAccount.minimumBalance, getAccountCurrency(selectedAccount))}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Interest Rate</span>
                      <span className="font-semibold">{(selectedAccount.interestRate * 100).toFixed(1)}% p.a.</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg text-[#0d9488]">Account Limits</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Overdraft Limit</span>
                      <span className="font-semibold">
                        {selectedAccount.overdraftLimit > 0 
                          ? formatCurrency(selectedAccount.overdraftLimit, getAccountCurrency(selectedAccount))
                          : "Not Available"
                        }
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">KYC Status</span>
                      <span className={`font-semibold ${
                        userData?.personalProfile?.kycVerified ? "text-green-600" : "text-yellow-600"
                      }`}>
                        {userData?.personalProfile?.kycVerified ? "Verified" : "Pending"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Default Currency</span>
                      <span className="font-semibold">{userData?.defaultCurrency}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">Select an account to view details</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="bg-gradient-to-r from-[#2dd4bf]/10 to-[#34d399]/10">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-semibold text-[#0d9488]">Internal Transfer</CardTitle>
                <div className="p-3 rounded-full bg-[#2dd4bf]/10 group-hover:bg-[#2dd4bf]/20 transition-colors">
                  <SendToBack className="h-6 w-6 text-[#2dd4bf]" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <CardDescription className="text-gray-600 mb-4">
                Transfer money between your own accounts instantly
              </CardDescription>
              <div className="space-y-2 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4" />
                  <span>Instant processing</span>
                </div>
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4" />
                  <span>No transfer fees</span>
                </div>
              </div>
              <Button 
                asChild 
                className="w-full mt-4 bg-gradient-to-r from-[#2dd4bf] to-[#34d399] hover:from-[#10b981] hover:to-[#2dd4bf] text-white"
                disabled={!selectedAccount || selectedAccount.activationStatus !== "ACTIVE"}
              >
                <Link href="/transaction/transfer/internal">
                  Transfer Now <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="bg-gradient-to-r from-[#2dd4bf]/10 to-[#34d399]/10">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-semibold text-[#0d9488]">External Transfer</CardTitle>
                <div className="p-3 rounded-full bg-[#2dd4bf]/10 group-hover:bg-[#2dd4bf]/20 transition-colors">
                  <Globe className="h-6 w-6 text-[#2dd4bf]" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <CardDescription className="text-gray-600 mb-4">
                Send money to accounts in other banks worldwide
              </CardDescription>
              <div className="space-y-2 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  <span>Multiple currencies</span>
                </div>
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4" />
                  <span>1-2 business days</span>
                </div>
              </div>
              <Button 
                asChild 
                className="w-full mt-4 bg-gradient-to-r from-[#2dd4bf] to-[#34d399] hover:from-[#10b981] hover:to-[#2dd4bf] text-white"
                disabled={!selectedAccount || selectedAccount.activationStatus !== "ACTIVE"}
              >
                <Link href="/transaction/transfer/external">
                  Transfer Now <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="bg-gradient-to-r from-[#2dd4bf]/10 to-[#34d399]/10">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-semibold text-[#0d9488]">Beneficiary Transfer</CardTitle>
                <div className="p-3 rounded-full bg-[#2dd4bf]/10 group-hover:bg-[#2dd4bf]/20 transition-colors">
                  <Heart className="h-6 w-6 text-[#2dd4bf]" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <CardDescription className="text-gray-600 mb-4">
                Send money to your saved beneficiaries quickly
              </CardDescription>
              <div className="space-y-2 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  <span>Manage beneficiaries</span>
                </div>
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4" />
                  <span>Quick transfers</span>
                </div>
              </div>
              <Button 
                asChild 
                className="w-full mt-4 bg-gradient-to-r from-[#2dd4bf] to-[#34d399] hover:from-[#10b981] hover:to-[#2dd4bf] text-white"
                disabled={!selectedAccount || selectedAccount.activationStatus !== "ACTIVE"}
              >
                <Link href="/transaction/transfer/beneficiary">
                  Transfer Now <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        

        <Card className="border-0 pt-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r py-4 from-[#2dd4bf] via-[#34d399] to-[#10b981] rounded-t-lg text-white relative overflow-hidden">
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription className="text-white/90">
              Your latest transactions
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {isLoadingTransactions ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-[#2dd4bf] mb-4" />
                <p className="text-gray-500 text-sm">Loading recent transactions...</p>
              </div>
            ) : transactions && transactions.length > 0 ? (
              <div className="space-y-4">
                {transactions.map((transaction: Transaction) => (
                  <div
                    key={transaction.id}
                    className="rounded-xl border-2 border-gray-100 p-4 hover:border-[#2dd4bf] transition-colors duration-300"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 rounded-full bg-[#ccfbf1]">
                          {getTransactionIcon(transaction.type)}
                        </div>
                        <div>
                          <div className="font-semibold text-[#0d9488]">
                            {transaction.type}
                          </div>
                          <div className="text-sm text-gray-600">
                            {formatDateTime(transaction.timestamp)}
                          </div>
                          {transaction.description && (
                            <div className="text-xs text-gray-500 mt-1">
                              {transaction.description}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg text-[#2dd4bf]">
                          {formatCurrency(transaction.amount, transaction.currency)}
                        </div>
                        <Badge
                          variant="outline"
                          className={`mt-2 ${getStatusBadgeClass(transaction.status)}`}
                        >
                          {transaction.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <Wallet className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium mb-2">No transactions yet</p>
                <p className="text-sm">Your recent transactions will appear here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
    </>
  )
}