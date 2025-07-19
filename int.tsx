"use client"
import { useState, useEffect } from "react"
import React from "react"
import Link from "next/link"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import axios, { AxiosResponse } from "axios"
import toast, { Toaster } from 'react-hot-toast'
import { ArrowLeft, Building, CreditCard, SendToBack, CheckCircle, AlertCircle, Loader2,ArrowRight, Wallet} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"

// Type definitions (reusing from the main page)
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

export default function InternalTransferPage(): JSX.Element {
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

  const getStatusBadgeClass = (status: string): string => {
    switch (status) {
      case "ACTIVE":
        return "border-green-200 text-green-700 bg-green-50"
      case "PENDING":
        return "border-yellow-200 text-yellow-700 bg-yellow-50"
      case "SUSPENDED":
        return "border-red-200 text-red-700 bg-red-50"
      default:
        return "border-gray-200 text-gray-700 bg-gray-50"
    }
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

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!transferAmount || parseFloat(transferAmount) <= 0) {
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

    const fromAccountData = getAccountByAccountId(selectedFromAccount)
    if (fromAccountData && getAccountBalance(fromAccountData.account) < parseFloat(transferAmount)) {
      toast.error("The source account does not have sufficient balance.", {
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
      const response = await transferMutation.mutateAsync({
        amount: parseFloat(transferAmount)
      })
      setServerResponse(response)
    } catch (error) {
      // Error handling is done in the mutation's onError callback
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

  const getAllAccounts = () => {
    if (!userData?.accountTypes) return []
    
    return userData.accountTypes.flatMap(accountType =>
      accountType.accounts.map(account => ({
        ...account,
        accountType: accountType
      }))
    )
  }

  const availableAccounts = getAllAccounts().filter(acc => acc.activationStatus === "ACTIVE")

  return (
    <div className="min-h-screen bg-[#f5f3fa]">
      {/* Toast container */}
      <Toaster />
      
      <header className="px-6 py-4 border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="container flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/transactions">
                <ArrowLeft className="h-5 w-5" />
                <span className="sr-only">Back to Transactions</span>
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-[#0d9488] to-[#2dd4bf] bg-clip-text text-transparent">
                Internal Transfer
              </h1>
              <p className="text-sm text-gray-600">Transfer money between your accounts</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-8">
        {/* Error banner for API errors */}
        {hasUserError && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">
              <span className="font-medium">Connection Error:</span> {getErrorMessage(userError)}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => refetchUser()}
                className="ml-4 border-red-300 text-red-700 hover:bg-red-50"
              >
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Account Selection */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5 text-[#2dd4bf]" />
                  Your Accounts
                </CardTitle>
                <CardDescription>
                  Select accounts for your transfer
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingUser ? (
                  <div className="space-y-4">
                    {[...Array(2)].map((_, i) => (
                      <div key={i} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <div>
                              <Skeleton className="h-5 w-24 mb-2" />
                              <Skeleton className="h-4 w-32" />
                            </div>
                          </div>
                          <Skeleton className="h-6 w-20" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : hasUserError ? (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-300" />
                    <p className="text-red-500 mb-4">Unable to load accounts</p>
                    <Button onClick={() => refetchUser()} variant="outline">
                      Retry Loading
                    </Button>
                  </div>
                ) : availableAccounts.length === 0 ? (
                  <div className="text-center py-8">
                    <Wallet className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500 mb-2">No active accounts found</p>
                    <p className="text-sm text-gray-400">You need at least 2 active accounts to make internal transfers</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userData?.accountTypes.map((accountType) => (
                      <div key={accountType.id} className="space-y-3">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-[#2dd4bf]" />
                          <h3 className="font-medium text-[#0d9488]">{accountType.type} Account</h3>
                          <span className="text-sm text-gray-500">({accountType.accountNumber})</span>
                        </div>
                        
                        <div className="space-y-2">
                          {accountType.accounts.map((account) => (
                            <div 
                              key={account.id}
                              className={`p-4 border-2 rounded-lg transition-all cursor-pointer hover:shadow-md ${
                                selectedFromAccount === account.id || selectedToAccount === account.id
                                  ? 'border-[#2dd4bf] bg-[#2dd4bf]/5'
                                  : 'border-gray-200 hover:border-[#2dd4bf]/50'
                              } ${
                                account.activationStatus !== "ACTIVE" ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 rounded-full bg-[#2dd4bf]/10">
                                    <Wallet className="h-5 w-5 text-[#2dd4bf]" />
                                  </div>
                                  <div>
                                    <div className="font-medium text-[#0d9488]">{account.type}</div>
                                    <div className="text-sm text-gray-600">
                                      Interest: {(account.interestRate * 100).toFixed(1)}% p.a.
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="font-bold text-[#2dd4bf]">
                                    {formatCurrency(getAccountBalance(account), getAccountCurrency(account))}
                                  </div>
                                  <Badge 
                                    variant="outline" 
                                    className={`text-xs ${getStatusBadgeClass(account.activationStatus)}`}
                                  >
                                    {account.activationStatus}
                                  </Badge>
                                </div>
                              </div>
                              
                              {account.activationStatus === "ACTIVE" && (
                                <div className="mt-3 flex gap-2">
                                  <Button
                                    variant={selectedFromAccount === account.id ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setSelectedFromAccount(account.id)}
                                    className={selectedFromAccount === account.id ? "bg-[#2dd4bf] hover:bg-[#10b981]" : ""}
                                  >
                                    {selectedFromAccount === account.id && <CheckCircle className="h-4 w-4 mr-1" />}
                                    From Account
                                  </Button>
                                  <Button
                                    variant={selectedToAccount === account.id ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setSelectedToAccount(account.id)}
                                    disabled={selectedFromAccount === account.id}
                                    className={selectedToAccount === account.id ? "bg-[#2dd4bf] hover:bg-[#10b981]" : ""}
                                  >
                                    {selectedToAccount === account.id && <CheckCircle className="h-4 w-4 mr-1" />}
                                    To Account
                                  </Button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Transfer Form */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <SendToBack className="h-5 w-5 text-[#2dd4bf]" />
                  Transfer Details
                </CardTitle>
                <CardDescription>
                  Enter the amount you want to transfer
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleTransfer} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Transfer Amount</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="0.00"
                      value={transferAmount}
                      onChange={(e) => setTransferAmount(e.target.value)}
                      className="text-lg font-medium"
                      step="0.01"
                      min="0"
                    />
                  </div>

                  {/* Transfer Summary */}
                  {selectedFromAccount && selectedToAccount && transferAmount && (
                    <div className="p-4 bg-[#2dd4bf]/5 rounded-lg border border-[#2dd4bf]/20">
                      <h4 className="font-medium mb-3 text-[#0d9488]">Transfer Summary</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>From:</span>
                          <span className="font-medium">
                            {(() => {
                              const fromData = getAccountByAccountId(selectedFromAccount)
                              return fromData ? `${fromData.account.type} (${fromData.accountType.accountNumber})` : 'Unknown'
                            })()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>To:</span>
                          <span className="font-medium">
                            {(() => {
                              const toData = getAccountByAccountId(selectedToAccount)
                              return toData ? `${toData.account.type} (${toData.accountType.accountNumber})` : 'Unknown'
                            })()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Amount:</span>
                          <span className="font-medium text-[#2dd4bf]">
                            {formatCurrency(parseFloat(transferAmount), userData?.defaultCurrency || "NGN")}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Transfer Fee:</span>
                          <span className="font-medium text-green-600">Free</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-[#2dd4bf] to-[#34d399] hover:from-[#10b981] hover:to-[#2dd4bf] text-white"
                    disabled={
                      !selectedFromAccount || 
                      !selectedToAccount || 
                      !transferAmount || 
                      parseFloat(transferAmount) <= 0 ||
                      transferMutation.isPending
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
        </div>
      </main>
    </div>
  )
}