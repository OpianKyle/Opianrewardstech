import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { LogOut, TrendingUp, Wallet, ListChecks, Receipt, AlertCircle, ArrowRight } from 'lucide-react';

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

  // Check if investor has completed signup/investment
  const hasInvestmentDetails = investor.tier && investor.amount;

  if (!hasInvestmentDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
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

        <div className="container mx-auto px-4 py-16 max-w-4xl">
          <Card className="bg-gray-800/50 border-cyan-500/30 backdrop-blur" data-testid="card-incomplete">
            <CardHeader>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-yellow-500/10 rounded-full">
                  <AlertCircle className="w-8 h-8 text-yellow-400" />
                </div>
                <div>
                  <CardTitle className="text-white text-2xl">Complete Your Investment</CardTitle>
                  <CardDescription className="text-gray-300 mt-2">
                    Welcome, {investor.firstName || 'Investor'}! Your account is almost ready.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                <p className="text-white mb-4">
                  To access your full investor dashboard, you need to complete your investment signup and select a tier.
                </p>
                <ul className="text-gray-300 space-y-2 mb-6">
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 mt-1">•</span>
                    <span>Choose your investment tier (Builder, Innovator, or Visionary)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 mt-1">•</span>
                    <span>Select your payment method</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 mt-1">•</span>
                    <span>Complete secure payment to activate your account</span>
                  </li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={() => setLocation('/')}
                  className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-gray-900 font-bold"
                  data-testid="button-complete-signup"
                >
                  Complete Signup
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="flex-1 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
                  data-testid="button-logout-incomplete"
                >
                  Logout
                </Button>
              </div>

              <Separator className="bg-cyan-500/20" />

              <div className="text-sm text-gray-400">
                <p className="mb-2">Need help?</p>
                <p>Contact our support team at support@opianrewards.com</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const tierName = investor.tier === 'builder' ? 'The Builder' :
                   investor.tier === 'innovator' ? 'The Innovator' : 
                   investor.tier === 'visionary' ? 'The Visionary' : 'The Cornerstone';

  const paymentStatusColor = investor.paymentStatus === 'completed' ? 'bg-green-500' :
                            investor.paymentStatus === 'pending' ? 'bg-yellow-500' : 'bg-red-500';

  // Calculate payment details based on tier and payment method
  const getPaymentDetails = () => {
    const isLumpSum = investor.paymentMethod === 'lump_sum';
    const totalAmount = investor.amount / 100;

    let depositAmount = 0;
    let monthlyAmount = 0;

    if (!isLumpSum) {
      // deposit_monthly payment method
      switch (investor.tier) {
        case 'builder':
          depositAmount = 6000;
          monthlyAmount = 500;
          break;
        case 'innovator':
          depositAmount = 12000;
          monthlyAmount = 1000;
          break;
        case 'visionary':
          depositAmount = 18000;
          monthlyAmount = 1500;
          break;
        default:
          depositAmount = totalAmount;
          monthlyAmount = 0;
      }
    }

    // Calculate next payment date (first monthly payment is 1 month after signup)
    let nextPaymentDate = null;
    if (!isLumpSum && investor.createdAt) {
      const signupDate = new Date(investor.createdAt);
      nextPaymentDate = new Date(signupDate);
      nextPaymentDate.setMonth(signupDate.getMonth() + 1);
    }

    return {
      isLumpSum,
      depositAmount,
      monthlyAmount,
      nextPaymentDate,
      totalAmount
    };
  };

  const paymentDetails = getPaymentDetails();

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
                  <CardTitle className="text-white text-lg">
                    {paymentDetails.isLumpSum ? 'Total Investment' : 'Deposit Amount'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-cyan-400" data-testid="text-amount">
                    R {paymentDetails.isLumpSum 
                      ? paymentDetails.totalAmount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })
                      : paymentDetails.depositAmount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })
                    }
                  </p>
                  <p className="text-sm text-gray-400 mt-2">
                    {paymentDetails.isLumpSum ? 'One-off Payment' : `+ R${paymentDetails.monthlyAmount} × 12 months`}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-cyan-500/30 backdrop-blur" data-testid="card-next-payment">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Next Payment</CardTitle>
                </CardHeader>
                <CardContent>
                  {paymentDetails.isLumpSum ? (
                    <>
                      <p className="text-2xl font-bold text-green-400" data-testid="text-no-payments">
                        No Future Payments
                      </p>
                      <p className="text-sm text-gray-400 mt-2">
                        Paid in full
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-3xl font-bold text-cyan-400" data-testid="text-next-amount">
                        R {paymentDetails.monthlyAmount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-sm text-gray-400 mt-2" data-testid="text-next-date">
                        {paymentDetails.nextPaymentDate 
                          ? `Due: ${paymentDetails.nextPaymentDate.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}`
                          : 'Date TBD'
                        }
                      </p>
                    </>
                  )}
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
                  <div>
                    <p className="text-gray-400">Total Investment</p>
                    <p className="text-white font-semibold">
                      R {paymentDetails.totalAmount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Payment Structure</p>
                    <p className="text-white">
                      {paymentDetails.isLumpSum ? (
                        'One-off Payment'
                      ) : (
                        `R${paymentDetails.depositAmount.toLocaleString('en-ZA')} + R${paymentDetails.monthlyAmount} × 12`
                      )}
                    </p>
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
                  {paymentDetails.isLumpSum 
                    ? 'Your payment history' 
                    : 'Upcoming monthly payments and payment history'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {paymentDetails.isLumpSum ? (
                  <div className="space-y-4">
                    <div className="p-6 bg-green-500/10 border border-green-500/30 rounded-lg text-center">
                      <p className="text-green-400 text-lg font-semibold mb-2">
                        ✓ Paid in Full
                      </p>
                      <p className="text-gray-300 text-sm">
                        Your one-off payment of R {paymentDetails.totalAmount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })} has been completed.
                      </p>
                      <p className="text-gray-400 text-xs mt-2">
                        No future payments required
                      </p>
                    </div>

                    {transactions && transactions.length > 0 && (
                      <>
                        <Separator className="bg-cyan-500/20" />
                        <p className="text-gray-400 font-semibold">Payment History</p>
                        {transactions.map((transaction: any, index: number) => (
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
                  <div className="space-y-4">
                    {/* Deposit Payment */}
                    <div className="p-4 bg-gray-700/30 rounded-lg border border-cyan-500/30">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-white font-medium text-sm text-gray-400">Deposit Payment</p>
                          <p className="text-white font-medium text-lg">
                            R {paymentDetails.depositAmount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                          </p>
                          <p className="text-sm text-gray-400">
                            Paid on: {new Date(investor.createdAt).toLocaleDateString('en-ZA')}
                          </p>
                        </div>
                        <Badge className="bg-green-500 text-white">
                          Paid
                        </Badge>
                      </div>
                    </div>

                    <Separator className="bg-cyan-500/20" />

                    {/* Monthly Payments Schedule */}
                    <p className="text-gray-400 font-semibold">Monthly Payment Schedule</p>
                    <div className="space-y-3">
                      {Array.from({ length: 12 }, (_, i) => {
                        const paymentDate = new Date(investor.createdAt);
                        paymentDate.setMonth(paymentDate.getMonth() + i + 1);
                        const isPast = paymentDate < new Date();
                        const isCurrent = !isPast && i === 0;
                        
                        return (
                          <div
                            key={i}
                            className={`p-3 rounded-lg border ${
                              isCurrent 
                                ? 'bg-yellow-500/10 border-yellow-500/30' 
                                : isPast 
                                  ? 'bg-gray-700/30 border-green-500/20'
                                  : 'bg-gray-700/30 border-cyan-500/20'
                            }`}
                            data-testid={`monthly-payment-${i}`}
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="text-white font-medium">
                                  R {paymentDetails.monthlyAmount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                                </p>
                                <p className="text-sm text-gray-400">
                                  Payment {i + 1} of 12 - Due: {paymentDate.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </p>
                              </div>
                              <Badge className={
                                isCurrent 
                                  ? 'bg-yellow-500 text-white' 
                                  : isPast 
                                    ? 'bg-green-500 text-white'
                                    : 'bg-gray-500 text-white'
                              }>
                                {isCurrent ? 'Due Now' : isPast ? 'Paid' : 'Upcoming'}
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
