import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { LogOut, TrendingUp, Wallet, ListChecks, Receipt } from 'lucide-react';

export default function Dashboard() {
  const { investor, token, logout, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !investor) {
      setLocation('/login');
    }
  }, [investor, isLoading, setLocation]);

  const { data: transactions, isLoading: loadingTransactions } = useQuery({
    queryKey: ['/api/investor/transactions'],
    enabled: !!token,
    queryFn: async () => {
      const response = await fetch('/api/investor/transactions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch transactions');
      return response.json();
    }
  });

  const handleLogout = () => {
    logout();
    setLocation('/login');
  };

  if (isLoading || !investor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  const tierName = investor.tier === 'builder' ? 'The Builder' :
                   investor.tier === 'innovator' ? 'The Innovator' : 'The Visionary';

  const paymentStatusColor = investor.paymentStatus === 'completed' ? 'bg-green-500' :
                            investor.paymentStatus === 'pending' ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      {/* Header */}
      <header className="bg-gray-800/50 border-b border-cyan-500/30 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-cyan-400" data-testid="text-title">OPIAN REWARDS</h1>
            <p className="text-sm text-gray-300">Investor Portal</p>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <Card className="mb-6 bg-gray-800/50 border-cyan-500/30 backdrop-blur" data-testid="card-welcome">
          <CardHeader>
            <CardTitle className="text-white text-2xl">
              Welcome back, {investor.firstName} {investor.lastName}
            </CardTitle>
            <CardDescription className="text-gray-300">
              <div className="flex items-center gap-2 mt-2">
                <span>Tier: <span className="text-cyan-400 font-bold">{tierName}</span></span>
                <Badge className={`${paymentStatusColor} text-white`} data-testid="badge-status">
                  {investor.paymentStatus}
                </Badge>
              </div>
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Dashboard Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="bg-gray-800/50 border-cyan-500/30 mb-6">
            <TabsTrigger value="overview" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-gray-900" data-testid="tab-overview">
              <TrendingUp className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="transactions" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-gray-900" data-testid="tab-transactions">
              <Wallet className="w-4 h-4 mr-2" />
              Transactions
            </TabsTrigger>
            <TabsTrigger value="progress" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-gray-900" data-testid="tab-progress">
              <ListChecks className="w-4 h-4 mr-2" />
              Progress
            </TabsTrigger>
            <TabsTrigger value="invoices" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-gray-900" data-testid="tab-invoices">
              <Receipt className="w-4 h-4 mr-2" />
              Invoices
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-gray-800/50 border-cyan-500/30 backdrop-blur" data-testid="card-investment">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Total Investment</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-cyan-400" data-testid="text-amount">
                    R {(investor.amount / 100).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-sm text-gray-400 mt-2">
                    Payment Method: {investor.paymentMethod.replace('_', ' ').toUpperCase()}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-cyan-500/30 backdrop-blur" data-testid="card-tier">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Your Tier</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-cyan-400">{tierName}</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Status: <span className="text-white">{investor.paymentStatus}</span>
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-cyan-500/30 backdrop-blur" data-testid="card-joined">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Member Since</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-cyan-400">
                    {new Date(investor.createdAt).toLocaleDateString('en-ZA', { 
                      month: 'short', 
                      year: 'numeric' 
                    })}
                  </p>
                  <p className="text-sm text-gray-400 mt-2">
                    Joined on {new Date(investor.createdAt).toLocaleDateString('en-ZA')}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="mt-6 bg-gray-800/50 border-cyan-500/30 backdrop-blur" data-testid="card-details">
              <CardHeader>
                <CardTitle className="text-white">Investment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400">Email</p>
                    <p className="text-white">{investor.email}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Phone</p>
                    <p className="text-white">{investor.phone}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Investment Tier</p>
                    <p className="text-cyan-400 font-semibold">{tierName}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Payment Status</p>
                    <Badge className={`${paymentStatusColor} text-white`}>
                      {investor.paymentStatus}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions">
            <Card className="bg-gray-800/50 border-cyan-500/30 backdrop-blur" data-testid="card-transactions">
              <CardHeader>
                <CardTitle className="text-white">Transaction History</CardTitle>
                <CardDescription className="text-gray-300">
                  View all your payment transactions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingTransactions ? (
                  <p className="text-gray-400 text-center py-8">Loading transactions...</p>
                ) : transactions && transactions.length > 0 ? (
                  <div className="space-y-4">
                    {transactions.map((transaction: any, index: number) => (
                      <div
                        key={transaction.id}
                        className="flex justify-between items-center p-4 bg-gray-700/30 rounded-lg border border-cyan-500/20"
                        data-testid={`transaction-${index}`}
                      >
                        <div>
                          <p className="text-white font-medium">
                            R {(transaction.amount / 100).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                          </p>
                          <p className="text-sm text-gray-400">
                            {new Date(transaction.createdAt).toLocaleString('en-ZA')}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Method: {transaction.method}
                          </p>
                        </div>
                        <Badge
                          className={
                            transaction.status === 'completed'
                              ? 'bg-green-500 text-white'
                              : transaction.status === 'pending'
                              ? 'bg-yellow-500 text-white'
                              : 'bg-red-500 text-white'
                          }
                          data-testid={`status-${index}`}
                        >
                          {transaction.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-center py-8">No transactions found</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Progress Tab */}
          <TabsContent value="progress">
            <Card className="bg-gray-800/50 border-cyan-500/30 backdrop-blur" data-testid="card-progress">
              <CardHeader>
                <CardTitle className="text-white">Quest Progress</CardTitle>
                <CardDescription className="text-gray-300">
                  Track your investment milestones
                </CardDescription>
              </CardHeader>
              <CardContent>
                {investor.questProgress ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-700/30 rounded-lg border border-cyan-500/20">
                        <p className="text-gray-400 text-sm">Level</p>
                        <p className="text-2xl font-bold text-cyan-400" data-testid="text-level">
                          {investor.questProgress.level || 1}
                        </p>
                      </div>
                      <div className="p-4 bg-gray-700/30 rounded-lg border border-cyan-500/20">
                        <p className="text-gray-400 text-sm">Phase</p>
                        <p className="text-xl font-semibold text-white" data-testid="text-phase">
                          {investor.questProgress.phase || 'N/A'}
                        </p>
                      </div>
                    </div>
                    
                    <Separator className="bg-cyan-500/20" />
                    
                    <div>
                      <p className="text-gray-400 text-sm mb-2">Milestones</p>
                      <div className="space-y-2">
                        {investor.questProgress.milestones && Object.entries(investor.questProgress.milestones).map(([key, value]: [string, any]) => (
                          <div key={key} className="flex items-center justify-between p-3 bg-gray-700/30 rounded border border-cyan-500/20" data-testid={`milestone-${key}`}>
                            <span className="text-white capitalize">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </span>
                            <Badge className={value ? 'bg-green-500' : 'bg-gray-500'}>
                              {value ? 'Completed' : 'Pending'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>

                    {investor.questProgress.startDate && (
                      <div className="mt-4 p-4 bg-gray-700/30 rounded-lg border border-cyan-500/20">
                        <p className="text-gray-400 text-sm">Started On</p>
                        <p className="text-white">
                          {new Date(investor.questProgress.startDate).toLocaleDateString('en-ZA', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-400 text-center py-8">
                    Quest progress will be initialized after your first payment
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Invoices Tab */}
          <TabsContent value="invoices">
            <Card className="bg-gray-800/50 border-cyan-500/30 backdrop-blur" data-testid="card-invoices">
              <CardHeader>
                <CardTitle className="text-white">Invoices & Payments</CardTitle>
                <CardDescription className="text-gray-300">
                  View and pay outstanding invoices
                </CardDescription>
              </CardHeader>
              <CardContent>
                {transactions && transactions.length > 0 ? (
                  <div className="space-y-4">
                    {transactions.filter((t: any) => t.status === 'pending').length > 0 ? (
                      <>
                        <p className="text-yellow-400 font-semibold">Outstanding Payments</p>
                        {transactions.filter((t: any) => t.status === 'pending').map((transaction: any, index: number) => (
                          <div
                            key={transaction.id}
                            className="p-4 bg-gray-700/30 rounded-lg border border-yellow-500/30"
                            data-testid={`invoice-${index}`}
                          >
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <p className="text-white font-medium text-lg">
                                  R {(transaction.amount / 100).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                                </p>
                                <p className="text-sm text-gray-400">
                                  Due Date: {new Date(transaction.createdAt).toLocaleDateString('en-ZA')}
                                </p>
                              </div>
                              <Badge className="bg-yellow-500 text-white">
                                Pending
                              </Badge>
                            </div>
                            <Button
                              className="w-full bg-cyan-500 hover:bg-cyan-600 text-gray-900 font-bold"
                              data-testid={`button-pay-${index}`}
                            >
                              Pay Now
                            </Button>
                          </div>
                        ))}
                      </>
                    ) : (
                      <p className="text-green-400 text-center py-4">
                        ✓ All payments up to date!
                      </p>
                    )}

                    {transactions.filter((t: any) => t.status === 'completed').length > 0 && (
                      <>
                        <Separator className="bg-cyan-500/20 my-6" />
                        <p className="text-gray-400 font-semibold">Paid Invoices</p>
                        {transactions.filter((t: any) => t.status === 'completed').map((transaction: any, index: number) => (
                          <div
                            key={transaction.id}
                            className="p-4 bg-gray-700/30 rounded-lg border border-green-500/20"
                            data-testid={`paid-invoice-${index}`}
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="text-white font-medium">
                                  R {(transaction.amount / 100).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                                </p>
                                <p className="text-sm text-gray-400">
                                  Paid on: {new Date(transaction.updatedAt || transaction.createdAt).toLocaleDateString('en-ZA')}
                                </p>
                              </div>
                              <Badge className="bg-green-500 text-white">
                                Paid
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-400 text-center py-8">No invoices found</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
