import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { LogOut, TrendingUp, Wallet, ListChecks, Receipt, AlertCircle, ArrowRight, CreditCard } from 'lucide-react';
import { PaymentMethods } from '@/components/payment-methods';

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

  // Calculate investment returns over time
  const getInvestmentReturns = () => {
    const totalAmount = investor.amount / 100;
    const investmentStartDate = investor.createdAt ? new Date(investor.createdAt) : new Date();
    
    // Return rates based on tier (annual percentage returns)
    const returnRates: Record<string, number> = {
      'builder': 0.15,      // 15% annual return
      'innovator': 0.18,    // 18% annual return
      'visionary': 0.22,    // 22% annual return
      'cornerstone': 0.25   // 25% annual return
    };

    const annualReturnRate = returnRates[investor.tier] || 0.15;

    // Calculate returns for years 1-5
    const yearlyReturns = [];
    for (let year = 1; year <= 5; year++) {
      const value = totalAmount * Math.pow(1 + annualReturnRate, year);
      const gain = value - totalAmount;
      yearlyReturns.push({
        year,
        value,
        gain,
        percentage: (gain / totalAmount) * 100
      });
    }

    // Calculate current value based on months elapsed
    const monthsElapsed = investor.createdAt 
      ? Math.max(0, Math.floor((Date.now() - new Date(investor.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30)))
      : 0;
    
    const currentValue = totalAmount * Math.pow(1 + annualReturnRate, monthsElapsed / 12);
    const currentGain = currentValue - totalAmount;

    return {
      totalAmount,
      annualReturnRate,
      yearlyReturns,
      currentValue,
      currentGain,
      monthsElapsed,
      investmentStartDate
    };
  };

  const investmentReturns = getInvestmentReturns();

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
            <TabsTrigger value="payment-methods" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-gray-900" data-testid="tab-payment-methods">
              <CreditCard className="w-4 h-4 mr-2" />
              Payment Methods
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-gray-800/50 border-cyan-500/30 backdrop-blur" data-testid="card-investment">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Initial Investment</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-cyan-400" data-testid="text-amount">
                    R {investmentReturns.totalAmount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-sm text-gray-400 mt-2">
                    {investmentReturns.monthsElapsed} month{investmentReturns.monthsElapsed !== 1 ? 's' : ''} invested
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-cyan-500/30 backdrop-blur" data-testid="card-current-value">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Current Value</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-green-400" data-testid="text-current-value">
                    R {investmentReturns.currentValue.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-sm text-gray-400 mt-2">
                    +R {investmentReturns.currentGain.toLocaleString('en-ZA', { minimumFractionDigits: 2 })} gain
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-cyan-500/30 backdrop-blur" data-testid="card-tier">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Annual Return</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-cyan-400">{(investmentReturns.annualReturnRate * 100).toFixed(0)}%</p>
                  <p className="text-sm text-gray-400 mt-2">
                    {tierName} tier rate
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="mt-6 bg-gray-800/50 border-cyan-500/30 backdrop-blur" data-testid="card-details">
              <CardHeader>
                <CardTitle className="text-white">Projected Returns Over Time</CardTitle>
                <CardDescription className="text-gray-300">
                  Estimated investment value growth at {(investmentReturns.annualReturnRate * 100).toFixed(0)}% annual return
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {investmentReturns.yearlyReturns.map((yearData) => (
                    <div 
                      key={yearData.year} 
                      className="p-4 bg-gray-700/30 rounded-lg border border-cyan-500/20 hover-elevate"
                      data-testid={`year-${yearData.year}`}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-white font-semibold">Year {yearData.year}</p>
                        <Badge className="bg-cyan-500 text-white">
                          +{yearData.percentage.toFixed(1)}%
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-400">Portfolio Value</p>
                          <p className="text-green-400 font-bold text-lg">
                            R {yearData.value.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400">Total Gain</p>
                          <p className="text-cyan-400 font-bold text-lg">
                            +R {yearData.gain.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                  <p className="text-sm text-gray-300 mb-2">Investment Details</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400">Tier</p>
                      <p className="text-cyan-400 font-semibold">{tierName}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Status</p>
                      <Badge className={`${paymentStatusColor} text-white`}>
                        {investor.paymentStatus}
                      </Badge>
                    </div>
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

          {/* Invoices Tab - Now Returns Projection */}
          <TabsContent value="invoices">
            <Card className="bg-gray-800/50 border-cyan-500/30 backdrop-blur" data-testid="card-invoices">
              <CardHeader>
                <CardTitle className="text-white">Investment Growth Timeline</CardTitle>
                <CardDescription className="text-gray-300">
                  Your investment value progression over 5 years at {(investmentReturns.annualReturnRate * 100).toFixed(0)}% annual return
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Current Investment Status */}
                  <div className="p-6 bg-gradient-to-r from-green-500/20 to-cyan-500/20 border border-green-500/30 rounded-lg">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-gray-300 text-sm mb-1">Initial Investment</p>
                        <p className="text-white font-bold text-2xl">
                          R {investmentReturns.totalAmount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-300 text-sm mb-1">Current Value</p>
                        <p className="text-green-400 font-bold text-2xl">
                          R {investmentReturns.currentValue.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                    <div className="pt-3 border-t border-green-500/30">
                      <p className="text-gray-300 text-sm">Total Gain: <span className="text-cyan-400 font-semibold">+R {investmentReturns.currentGain.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</span></p>
                      <p className="text-gray-400 text-xs mt-1">Investment period: {investmentReturns.monthsElapsed} months</p>
                    </div>
                  </div>

                  <Separator className="bg-cyan-500/20" />

                  {/* Year-by-Year Returns */}
                  <p className="text-gray-300 font-semibold text-lg">Year-by-Year Projections</p>
                  <div className="space-y-3">
                    {investmentReturns.yearlyReturns.map((yearData) => {
                      const investmentDate = new Date(investmentReturns.investmentStartDate);
                      const projectedDate = new Date(investmentDate);
                      projectedDate.setFullYear(investmentDate.getFullYear() + yearData.year);
                      const isInFuture = projectedDate > new Date();
                      
                      return (
                        <div
                          key={yearData.year}
                          className="p-4 bg-gray-700/30 rounded-lg border border-cyan-500/20 hover-elevate"
                          data-testid={`year-projection-${yearData.year}`}
                        >
                          <div className="flex justify-between items-center mb-3">
                            <div>
                              <p className="text-white font-semibold text-lg">Year {yearData.year}</p>
                              <p className="text-gray-400 text-sm">
                                {projectedDate.toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' })}
                              </p>
                            </div>
                            <Badge className={isInFuture ? 'bg-cyan-500 text-white' : 'bg-green-500 text-white'}>
                              {isInFuture ? 'Projected' : 'Current Period'}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-gray-800/50 rounded">
                              <p className="text-gray-400 text-xs mb-1">Portfolio Value</p>
                              <p className="text-green-400 font-bold text-xl">
                                R {yearData.value.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                              </p>
                            </div>
                            <div className="p-3 bg-gray-800/50 rounded">
                              <p className="text-gray-400 text-xs mb-1">Total Return</p>
                              <p className="text-cyan-400 font-bold text-xl">
                                +{yearData.percentage.toFixed(1)}%
                              </p>
                              <p className="text-gray-400 text-xs">
                                +R {yearData.gain.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-6 p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                    <p className="text-sm text-gray-300 mb-2">
                      <i className="fas fa-info-circle text-cyan-400 mr-2"></i>
                      Returns Disclaimer
                    </p>
                    <p className="text-xs text-gray-400">
                      Projected returns are estimates based on historical performance and the {tierName} tier's {(investmentReturns.annualReturnRate * 100).toFixed(0)}% annual rate. 
                      Actual returns may vary based on market conditions and investment performance.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment Methods Tab */}
          <TabsContent value="payment-methods">
            <PaymentMethods />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
