"use client"
import react from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import axios, { AxiosResponse } from "axios"
import toast, { Toaster } from 'react-hot-toast'
import { ArrowLeft, Building, CreditCard, SendToBack, CheckCircle, AlertCircle, Loader2, ArrowRight, Wallet, Bell, Mail, Search, User, ArrowUpDown } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"


// Type definitions (keeping your existing types)
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

interface TransferRequest {
  amount: number
}

interface TransferResponse {
  success: boolean
  message: string
  transactionId?: string
  [key: string]: any
}

// API functions
const fetchUserData = async (): Promise<UserData> => {
  const response: AxiosResponse<UserData> = await axios.get('https://sbfserver.site/accounts/user/test')
  return response.data
}

const submitTransfer = async (transferData: TransferRequest): Promise<TransferResponse> => {
  const response: AxiosResponse<TransferResponse> = await axios.post(
    'https://sbfserver.site/transactions/transfer/test',
    transferData
  )
  return response.data
}


// Type definitions
interface CurrencyBalance {
  id: string;
  accountId: string;
  currencyCode: string;
  availableBalance: number;
  ledgerBalance: number;
  createdAt: string;
  updatedAt: string;
}

interface Account {
  id: string;
  accountTypeId: string;
  type: "SAVINGS" | "CURRENT" | "FIXED_DEPOSIT_BY_DATE" | "FIXED_DEPOSIT_BY_AMOUNT";
  defaultAccount: boolean;
  minimumBalance: number;
  interestRate: number;
  overdraftLimit: number;
  activationStatus: "ACTIVE" | "PENDING" | "SUSPENDED";
  createdAt: string;
  currencyBalances: CurrencyBalance[];
  lockConditions?: any;
}

// Props interface for AccountSelector
interface AccountSelectorProps {
  accounts: Account[];
  selectedAccount: string;
  onSelect: (accountId: string) => void;
  label: string;
  excludeAccount?: string;
  isLoading?: boolean;
}

// Account Selector Component with TypeScript
const AccountSelector: React.FC<AccountSelectorProps> = ({ 
  accounts, 
  selectedAccount, 
  onSelect, 
  label, 
  excludeAccount, 
  isLoading = false 
}) => {
  const filteredAccounts = accounts.filter((acc: Account) => acc.id !== excludeAccount);

  // Helper function to format currency with proper typing
  const formatCurrency = (amount: number, currencyCode: string): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      currencyDisplay: 'code'
    }).format(amount);
  };

  // Helper function to get account balance with proper typing
  const getAccountBalance = (account: Account): number => {
    const primaryBalance = account.currencyBalances?.[0];
    return primaryBalance?.availableBalance || 0;
  };

  // Helper function to get account currency with proper typing
  const getAccountCurrency = (account: Account): string => {
    const primaryBalance = account.currencyBalances?.[0];
    return primaryBalance?.currencyCode || "NGN";
  };

  // Helper function to get badge styling based on status
  const getBadgeClassName = (status: Account['activationStatus']): string => {
    const baseClasses = "text-xs";
    
    switch (status) {
      case "ACTIVE":
        return `${baseClasses} border-green-200 text-green-700 bg-green-50`;
      case "PENDING":
        return `${baseClasses} border-yellow-200 text-yellow-700 bg-yellow-50`;
      case "SUSPENDED":
        return `${baseClasses} border-red-200 text-red-700 bg-red-50`;
      default:
        return `${baseClasses} border-gray-200 text-gray-700 bg-gray-50`;
    }
  };

  // Helper function to format account type display
  const formatAccountType = (type: Account['type']): string => {
    return type.replace(/_/g, ' ');
  };

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium text-gray-700">{label}</Label>
      
      {isLoading ? (
        <div className="p-4 border border-gray-200 rounded-lg">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-[#2dd4bf]" />
            <span className="text-sm text-gray-500">Loading accounts...</span>
          </div>
        </div>
      ) : filteredAccounts.length === 0 ? (
        <div className="p-4 border border-gray-200 rounded-lg text-center">
          <Wallet className="h-8 w-8 mx-auto mb-2 text-gray-300" />
          <p className="text-sm text-gray-500">No available accounts</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredAccounts.map((account: Account) => {
            const isSelected = selectedAccount === account.id;
            const balance = getAccountBalance(account);
            const currency = getAccountCurrency(account);
            
            return (
              <div 
                key={account.id}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                  isSelected
                    ? 'border-[#2dd4bf] bg-[#2dd4bf]/5 shadow-sm'
                    : 'border-gray-200 hover:border-[#2dd4bf]/50'
                }`}
                onClick={() => onSelect(account.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelect(account.id);
                  }
                }}
                aria-selected={isSelected}
                aria-label={`Select ${formatAccountType(account.type)} account with balance ${formatCurrency(balance, currency)}`}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-[#2dd4bf]/10">
                      <Wallet className="h-4 w-4 text-[#2dd4bf]" />
                    </div>
                    <div>
                      <div className="font-medium text-[#0d9488]">
                        {formatAccountType(account.type)}
                      </div>
                      <div className="text-sm text-gray-600">
                        Interest: {(account.interestRate * 100).toFixed(1)}% p.a.
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-[#2dd4bf]">
                      {formatCurrency(balance, currency)}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="outline" 
                        className={getBadgeClassName(account.activationStatus)}
                      >
                        {account.activationStatus}
                      </Badge>
                      {isSelected && (
                        <CheckCircle className="h-4 w-4 text-[#2dd4bf]" aria-label="Selected" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default function InternalTransferPage() {
  const queryClient = useQueryClient()
  
  // Query for user data
  const {
    data: userData,
    isLoading: isLoadingUser,
    error: userError,
    isError: hasUserError,
    refetch: refetchUser
  } = useQuery<UserData, Error>({
    queryKey: ['user', 'test'],
    queryFn: fetchUserData,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 3,
    retryDelay: (attemptIndex: number): number => Math.min(1000 * 2 ** attemptIndex, 30000),
  })

  // Transfer mutation
  const transferMutation = useMutation<TransferResponse, Error, TransferRequest>({
    mutationFn: submitTransfer,
    onSuccess: (data) => {
      toast.success(data.message || "Your transfer has been processed successfully!", {
        duration: 4000,
        position: 'top-right',
        style: {
          background: '#10b981',
          color: '#fff',
          borderRadius: '8px',
        },
        iconTheme: {
          primary: '#fff',
          secondary: '#10b981',
        },
      })
      setTransferAmount("")
      setSelectedFromAccount("")
      setSelectedToAccount("")
      // Invalidate and refetch user data to update balances
      queryClient.invalidateQueries({ queryKey: ['user', 'test'] })
    },
    onError: (error) => {
      const errorMessage = axios.isAxiosError(error) 
        ? error.response?.data?.message || "Transfer failed. Please try again."
        : "An unexpected error occurred."
      
      toast.error(errorMessage, {
        duration: 5000,
        position: 'top-right',
        style: {
          background: '#ef4444',
          color: '#fff',
          borderRadius: '8px',
        },
        iconTheme: {
          primary: '#fff',
          secondary: '#ef4444',
        },
      })
    },
  })

  // State management
  const [transferAmount, setTransferAmount] = useState<string>("")
  const [selectedFromAccount, setSelectedFromAccount] = useState<string>("")
  const [selectedToAccount, setSelectedToAccount] = useState<string>("")
  const [serverResponse, setServerResponse] = useState<TransferResponse | null>(null)

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

  const formatCurrency = (amount: number, currencyCode: string): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      currencyDisplay: 'code'
    }).format(amount)
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

  const getAccountByAccountId = (accountId: string): { account: Account; accountType: AccountType } | null => {
    if (!userData?.accountTypes) return null
    
    for (const accountType of userData.accountTypes) {
      const account = accountType.accounts.find(acc => acc.id === accountId)
      if (account) {
        return { account, accountType }
      }
    }
    return null
  }

  const validateCurrencyMatch = (fromAccountId: string, toAccountId: string): boolean => {
    const fromData = getAccountByAccountId(fromAccountId)
    const toData = getAccountByAccountId(toAccountId)
    
    if (!fromData || !toData) return false
    
    const fromCurrency = getAccountCurrency(fromData.account)
    const toCurrency = getAccountCurrency(toData.account)
    
    return fromCurrency === toCurrency
  }

  const getAllAccounts = () => {
    if (!userData?.accountTypes) return []
    
    return userData.accountTypes.flatMap(accountType =>
      accountType.accounts.map(account => ({
        ...account,
        accountType: accountType
      }))
    )
  }

  // FIXED: Show ACTIVE accounts instead of PENDING
  const availableAccounts = getAllAccounts().filter(acc => acc.activationStatus === "PENDING" || acc.activationStatus === "ACTIVE")

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const amount = parseFloat(transferAmount)
    
    // Enhanced validation
    if (!amount || amount <= 0) {
      toast.error("Please enter a valid transfer amount.", {
        duration: 4000,
        position: 'top-right',
        style: {
          background: '#ef4444',
          color: '#fff',
          borderRadius: '8px',
        },
      })
      return
    }

    if (!selectedFromAccount || !selectedToAccount) {
      toast.error("Please select both source and destination accounts.", {
        duration: 4000,
        position: 'top-right',
        style: {
          background: '#ef4444',
          color: '#fff',
          borderRadius: '8px',
        },
      })
      return
    }

    if (selectedFromAccount === selectedToAccount) {
      toast.error("Source and destination accounts cannot be the same.", {
        duration: 4000,
        position: 'top-right',
        style: {
          background: '#ef4444',
          color: '#fff',
          borderRadius: '8px',
        },
      })
      return
    }

    // Check account balance
    const fromAccountData = getAccountByAccountId(selectedFromAccount)
    if (!fromAccountData) {
      toast.error("Source account not found.", {
        duration: 4000,
        position: 'top-right',
        style: {
          background: '#ef4444',
          color: '#fff',
          borderRadius: '8px',
        },
      })
      return
    }

    const fromBalance = getAccountBalance(fromAccountData.account)
    
    if (fromBalance < amount) {
      toast.error(`Insufficient balance. Available: ${formatCurrency(fromBalance, getAccountCurrency(fromAccountData.account))}`, {
        duration: 4000,
        position: 'top-right',
        style: {
          background: '#ef4444',
          color: '#fff',
          borderRadius: '8px',
        },
      })
      return
    }

    // Check minimum transfer amount
    const minAmount = 1.00
    if (amount < minAmount) {
      toast.error(`Minimum transfer amount is ${formatCurrency(minAmount, userData?.defaultCurrency || "NGN")}`, {
        duration: 4000,
        position: 'top-right',
        style: {
          background: '#ef4444',
          color: '#fff',
          borderRadius: '8px',
        },
      })
      return
    }

    // Currency validation
    if (!validateCurrencyMatch(selectedFromAccount, selectedToAccount)) {
      toast.error("Source and destination accounts must use the same currency.", {
        duration: 4000,
        position: 'top-right',
        style: {
          background: '#ef4444',
          color: '#fff',
          borderRadius: '8px',
        },
      })
      return
    }

    setServerResponse(null)
    
    try {
      // MODIFIED: Now only sending amount in the request body
      const response = await transferMutation.mutateAsync({
        amount: amount
      })
      setServerResponse(response)
    } catch (error) {
      // Error handling is done in the mutation's onError callback
    }
  }

  const getErrorMessage = (error: Error): string => {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status
      const message = error.response?.data?.message
      
      switch (status) {
        case 400:
          return message || "Invalid transfer request"
        case 401:
          return "Authentication required. Please log in again."
        case 403:
          return "You don't have permission to perform this transfer"
        case 404:
          return "Account not found"
        case 422:
          return message || "Transfer validation failed"
        case 429:
          return "Too many requests. Please try again later."
        case 500:
          return "Server error. Please try again later."
        default:
          return message || "Network error. Please check your connection."
      }
    }
    return "An unexpected error occurred"
  }

  // Debug logging
  useEffect(() => {
    if (userData) {
      console.log('User Data:', userData)
      console.log('Account Types:', userData.accountTypes)
      console.log('All Accounts:', getAllAccounts())
      console.log('Available Accounts (ACTIVE):', availableAccounts)
      console.log('Account statuses:', userData.accountTypes.flatMap(at => 
        at.accounts.map(acc => ({ type: acc.type, status: acc.activationStatus, balance: getAccountBalance(acc) }))
      ))
    }
  }, [userData, availableAccounts])

  return (
    <div className="min-h-screen bg-[#f5f3fa]">
      {/* Toast container */}
      <Toaster />
      
      {/* Header */}
      <header className="px-6 pt-2 w-full bg-[#f5f3fa] backdrop-blur supports-[backdrop-filter]:bg-[#f5f3fa]/80">
        <div className="container flex h-14 !py-4 items-center justify-between">
          <div className="flex items-center gap-4 flex-1 max-w-2xl">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/">
                <ArrowLeft className="h-5 w-5" />
                <span className="sr-only">Back to Transactions</span>
              </Link>
            </Button>
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
                <p className="text-xs text-gray-500">
                  {isLoadingUser ? (
                    <span className="text-gray-400">Please wait...</span>
                  ) : (
                    "Internal Transfer"
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

        {/* Page Title Section */}
        <div className="container pt-4 pb-2">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-[#0d9488] to-[#2dd4bf] bg-clip-text text-transparent">
              Internal Transfer
              {userData?.personalProfile?.otherNames && (
                <span className="text-lg font-normal text-gray-600 ml-3">
                  Welcome back, {userData.personalProfile.otherNames.split(' ')[0]}!
                </span>
              )}
            </h1>
            <p className="text-sm text-gray-600">Transfer money between your accounts</p>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <div className="max-w-4xl mx-auto">
            {/* Account Overview */}
          {!isLoadingUser && !hasUserError && userData && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5 text-[#2dd4bf]" />
                  Account Overview
                </CardTitle>
                <CardDescription>
                  Current status of all your accounts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {userData.accountTypes.map((accountType) => (
                    <div key={accountType.id} className="space-y-3">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-[#2dd4bf]" />
                        <h3 className="font-medium text-[#0d9488]">{accountType.type} Account</h3>
                        <span className="text-sm text-gray-500">({accountType.accountNumber})</span>
                      </div>
                      
                      <div className="grid gap-3 md:grid-cols-2">
                        {accountType.accounts.map((account) => (
                          <div 
                            key={account.id}
                            className="p-4 border rounded-lg bg-white"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div className="p-1 rounded-full bg-[#2dd4bf]/10">
                                  <Wallet className="h-3 w-3 text-[#2dd4bf]" />
                                </div>
                                <div className="font-medium text-sm text-[#0d9488]">
                                  {account.type.replace(/_/g, ' ')}
                                </div>
                              </div>
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${
                                  account.activationStatus === "ACTIVE" 
                                    ? "border-green-200 text-green-700 bg-green-50"
                                    : account.activationStatus === "PENDING"
                                    ? "border-yellow-200 text-yellow-700 bg-yellow-50"
                                    : "border-red-200 text-red-700 bg-red-50"
                                }`}
                              >
                                {account.activationStatus}
                              </Badge>
                            </div>
                            <div className="space-y-1">
                              <div className="text-lg font-bold text-[#2dd4bf]">
                                {formatCurrency(getAccountBalance(account), getAccountCurrency(account))}
                              </div>
                              <div className="text-xs text-gray-600">
                                Interest: {(account.interestRate * 100).toFixed(1)}% p.a.
                              </div>
                              {account.minimumBalance > 0 && (
                                <div className="text-xs text-gray-500">
                                  Min. Balance: {formatCurrency(account.minimumBalance, getAccountCurrency(account))}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Transfer Form Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowUpDown className="h-5 w-5 text-[#2dd4bf]" />
                Transfer Between Your Accounts
              </CardTitle>
              <CardDescription>
                Select source and destination accounts, then enter the transfer amount
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingUser ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-[#2dd4bf] mb-4" />
                  <p className="text-gray-500 text-sm">Loading your accounts...</p>
                </div>
              ) : hasUserError ? (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-300" />
                  <p className="text-red-500 mb-4">Unable to load accounts</p>
                  <Button onClick={() => refetchUser()} variant="outline">
                    Retry Loading
                  </Button>
                </div>
              ) : availableAccounts.length < 2 ? (
                <div className="text-center py-8">
                  <Wallet className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500 mb-2">
                    {availableAccounts.length === 0 ? "No active accounts found" : "Only one active account found"}
                  </p>
                  <p className="text-sm text-gray-400">You need at least 2 active accounts to make internal transfers</p>
                  {getAllAccounts().length > 0 && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-700">
                        You have {getAllAccounts().filter(acc => acc.activationStatus === "PENDING").length} pending accounts. 
                        Please wait for activation or contact support.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <form onSubmit={handleTransfer} className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    {/* From Account */}
                    <AccountSelector
                      accounts={availableAccounts}
                      selectedAccount={selectedFromAccount}
                      onSelect={setSelectedFromAccount}
                      label="Transfer From"
                      excludeAccount={selectedToAccount}
                      isLoading={false}
                    />

                    {/* To Account */}
                    <AccountSelector
                      accounts={availableAccounts}
                      selectedAccount={selectedToAccount}
                      onSelect={setSelectedToAccount}
                      label="Transfer To"
                      excludeAccount={selectedFromAccount}
                      isLoading={false}
                    />
                  </div>

                  {/* Transfer Amount */}
                  <div className="space-y-2">
                    <Label htmlFor="amount" className="text-sm font-medium text-gray-700">
                      Transfer Amount
                    </Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="Enter amount (e.g., 500)"
                      value={transferAmount}
                      onChange={(e) => setTransferAmount(e.target.value)}
                      className="text-lg font-medium h-12"
                      step="0.01"
                      min="1"
                    />
                  </div>

                  {/* Transfer Summary */}
                  {selectedFromAccount && selectedToAccount && transferAmount && (
                    <div className="p-4 bg-[#2dd4bf]/5 rounded-lg border border-[#2dd4bf]/20">
                      <h4 className="font-medium mb-3 text-[#0d9488] flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Transfer Summary
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>From:</span>
                          <span className="font-medium">
                            {(() => {
                              const fromData = getAccountByAccountId(selectedFromAccount)
                              return fromData ? `${fromData.account.type.replace(/_/g, ' ')} (${fromData.accountType.accountNumber})` : 'Unknown'
                            })()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>To:</span>
                          <span className="font-medium">
                            {(() => {
                              const toData = getAccountByAccountId(selectedToAccount)
                              return toData ? `${toData.account.type.replace(/_/g, ' ')} (${toData.accountType.accountNumber})` : 'Unknown'
                            })()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Amount:</span>
                          <span className="font-bold text-[#2dd4bf]">
                            {formatCurrency(parseFloat(transferAmount), userData?.defaultCurrency || "NGN")}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Transfer Fee:</span>
                          <span className="font-medium text-green-600">Free</span>
                        </div>
                        <hr className="my-2" />
                        <div className="flex justify-between font-medium">
                          <span>Total:</span>
                          <span className="text-[#2dd4bf]">
                            {formatCurrency(parseFloat(transferAmount), userData?.defaultCurrency || "NGN")}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-[#2dd4bf] to-[#34d399] hover:from-[#10b981] hover:to-[#2dd4bf] text-white h-12"
                    disabled={
                      !selectedFromAccount || 
                      !selectedToAccount || 
                      !transferAmount || 
                      parseFloat(transferAmount) <= 0 ||
                      transferMutation.isPending ||
                      availableAccounts.length < 2
                    }
                  >
                    {transferMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing Transfer...
                      </>
                    ) : (
                      <>
                        Transfer Now
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Server Response */}
          {serverResponse && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Transfer Response
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <pre className="text-sm text-green-800 whitespace-pre-wrap">
                      {JSON.stringify(serverResponse, null, 2)}
                    </pre>
                  </div>
                  {serverResponse.transactionId && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Transaction ID:</span> {serverResponse.transactionId}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}