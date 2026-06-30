'use client';

import React, { useState } from 'react';
import { 
  X, 
  Check, 
  CreditCard, 
  ShieldCheck, 
  Lock, 
  Sparkles, 
  Loader2, 
  Zap, 
  Star 
} from 'lucide-react';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: (planName: string) => void;
}

export default function PricingModal({ isOpen, onClose, onUpgrade }: PricingModalProps) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [checkoutStep, setCheckoutStep] = useState<'plans' | 'payment' | 'success'>('plans');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Checkout form state
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [zip, setZip] = useState('');
  const [formError, setFormError] = useState('');

  if (!isOpen) return null;

  const plans = [
    {
      id: 'basic',
      name: 'Basic',
      priceMonthly: 0,
      priceYearly: 0,
      description: 'Test out our core features',
      features: [
        '1 ATS Match optimization',
        'Standard layout formatting',
        'Basic Word (DOCX) downloads',
        'AI Match Score dashboard'
      ],
      icon: Zap,
      color: 'text-slate-500',
      badge: 'Free Trial',
      actionText: 'Current Plan'
    },
    {
      id: 'pro',
      name: 'Pro Optimizer',
      priceMonthly: 19,
      priceYearly: 15,
      description: 'Everything you need to land interviews',
      features: [
        'Unlimited ATS optimizations',
        'LaTeX cloud compiler (High-fidelity PDF)',
        'Cover Letter compiler & editor',
        'LinkedIn Bio optimization',
        'Custom brand styling parameters',
        'Download LaTeX source (.tex)'
      ],
      icon: Sparkles,
      color: 'text-indigo-600 dark:text-indigo-400',
      badge: 'Most Popular',
      actionText: 'Upgrade to Pro'
    },
    {
      id: 'elite',
      name: 'Lifetime Elite',
      priceMonthly: 49, // One-time fee
      priceYearly: 49,
      isOneTime: true,
      description: 'One payment, lifetime utility',
      features: [
        'All Pro subscription features',
        'Lifetime access (no subscription)',
        'VIP AI processing queue (faster)',
        'Beta access to new AI templates',
        'Premium support channels'
      ],
      icon: Star,
      color: 'text-amber-500',
      badge: 'Best Value',
      actionText: 'Go Elite'
    }
  ];

  const handleSelectPlan = (planId: string) => {
    if (planId === 'basic') {
      onClose();
      return;
    }
    setSelectedPlan(planId);
    setCheckoutStep('payment');
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = value.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length > 0) {
      setCardNumber(parts.join(' '));
    } else {
      setCardNumber(value);
    }
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (value.length > 2) {
      value = value.substring(0, 2) + '/' + value.substring(2, 4);
    }
    setExpiry(value);
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardName || cardNumber.length < 19 || expiry.length < 5 || cvc.length < 3 || !zip) {
      setFormError('Please fill out all billing fields correctly.');
      return;
    }
    
    setFormError('');
    setIsProcessing(true);

    // Simulate Stripe payment processing
    setTimeout(() => {
      setIsProcessing(false);
      setCheckoutStep('success');
      const planName = plans.find(p => p.id === selectedPlan)?.name || 'Pro';
      onUpgrade(planName);
    }, 1800);
  };

  const currentSelectedPlanDetails = plans.find(p => p.id === selectedPlan);
  const planPrice = currentSelectedPlanDetails
    ? (currentSelectedPlanDetails.isOneTime
        ? currentSelectedPlanDetails.priceMonthly
        : (billingCycle === 'monthly' ? currentSelectedPlanDetails.priceMonthly : currentSelectedPlanDetails.priceYearly))
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden transition-all duration-300">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100 dark:border-slate-900 shrink-0">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <Zap className="w-4 h-4 fill-white" />
            </div>
            <h2 className="text-sm sm:text-base font-black text-slate-805 dark:text-slate-100 uppercase tracking-wide">
              {checkoutStep === 'plans' && 'Choose Your ResumeAI Plan'}
              {checkoutStep === 'payment' && 'Secure Checkout'}
              {checkoutStep === 'success' && 'Upgrade Complete!'}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
          
          {/* STEP 1: PLANS */}
          {checkoutStep === 'plans' && (
            <div className="space-y-8">
              
              {/* Billing Toggle */}
              <div className="flex flex-col items-center justify-center space-y-2">
                <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-1.5 rounded-full border border-slate-200 dark:border-slate-800">
                  <button
                    onClick={() => setBillingCycle('monthly')}
                    className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all cursor-pointer ${
                      billingCycle === 'monthly' 
                        ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-805 dark:hover:text-slate-350'
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setBillingCycle('yearly')}
                    className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all flex items-center space-x-1.5 cursor-pointer ${
                      billingCycle === 'yearly' 
                        ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-850 dark:hover:text-slate-350'
                    }`}
                  >
                    <span>Yearly</span>
                    <span className="text-[9px] px-1.5 py-0.5 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-extrabold rounded-full tracking-wide">
                      -20%
                    </span>
                  </button>
                </div>
                <p className="text-xxs text-slate-400">Save 20% on Pro plans with annual billing</p>
              </div>

              {/* Plans Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
                {plans.map((plan) => {
                  const IconComponent = plan.icon;
                  const price = plan.isOneTime ? plan.priceMonthly : (billingCycle === 'monthly' ? plan.priceMonthly : plan.priceYearly);
                  const isPro = plan.id === 'pro';

                  return (
                    <div 
                      key={plan.id}
                      className={`relative flex flex-col p-6 rounded-2xl border transition-all duration-300 ${
                        isPro 
                          ? 'border-indigo-500 bg-indigo-500/[0.02] dark:bg-indigo-500/[0.01] shadow-lg shadow-indigo-500/5 md:scale-[1.03] z-10' 
                          : 'border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/20'
                      }`}
                    >
                      {/* Badge */}
                      {plan.badge && (
                        <span className={`absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider rounded-full ${
                          isPro 
                            ? 'bg-indigo-600 text-white' 
                            : plan.id === 'elite' 
                            ? 'bg-amber-500 text-white' 
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}>
                          {plan.badge}
                        </span>
                      )}

                      <div className="flex items-center space-x-2 mb-3">
                        <IconComponent className={`w-5 h-5 ${plan.color}`} />
                        <h3 className="text-sm font-black text-slate-800 dark:text-slate-100">{plan.name}</h3>
                      </div>
                      
                      <p className="text-xxs text-slate-400 mb-4">{plan.description}</p>

                      {/* Pricing block */}
                      <div className="flex items-baseline space-x-1 mb-5">
                        <span className="text-2xl font-black text-slate-800 dark:text-slate-100">${price}</span>
                        {plan.isOneTime ? (
                          <span className="text-[10px] font-bold text-slate-400">one-time</span>
                        ) : price > 0 ? (
                          <span className="text-[10px] font-bold text-slate-400">/mo</span>
                        ) : null}
                      </div>

                      {/* Feature list */}
                      <ul className="space-y-2.5 flex-1 mb-6">
                        {plan.features.map((feature, i) => (
                          <li key={i} className="flex items-start space-x-2 text-xxs text-slate-600 dark:text-slate-400 leading-tight">
                            <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>

                      {/* Action Button */}
                      <button
                        onClick={() => handleSelectPlan(plan.id)}
                        className={`w-full py-2.5 text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer ${
                          isPro
                            ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/10'
                            : plan.id === 'elite'
                            ? 'bg-amber-500 hover:bg-amber-400 text-white shadow-amber-500/10'
                            : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        {plan.actionText}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Secure Trust Info */}
              <div className="flex flex-col md:flex-row items-center justify-center gap-6 border-t border-slate-100 dark:border-slate-900 pt-6 text-[10px] text-slate-400">
                <div className="flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>30-Day Money Back Guarantee</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <Lock className="w-4 h-4 text-indigo-500" />
                  <span>Secure 256-Bit SSL Checkout</span>
                </div>
              </div>

            </div>
          )}

          {/* STEP 2: SECURE CHECKOUT FORM */}
          {checkoutStep === 'payment' && currentSelectedPlanDetails && (
            <div className="max-w-md mx-auto grid grid-cols-1 gap-6">
              
              {/* Checkout Summary Card */}
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-150 dark:border-slate-800 rounded-xl">
                <div>
                  <h4 className="text-xs font-black text-slate-850 dark:text-slate-100">
                    {currentSelectedPlanDetails.name} Plan
                  </h4>
                  <p className="text-[10px] text-slate-400">
                    {currentSelectedPlanDetails.isOneTime ? 'Lifetime Access' : `${billingCycle === 'monthly' ? 'Monthly' : 'Annual'} Subscription`}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-slate-800 dark:text-slate-100">${planPrice}</span>
                  {!currentSelectedPlanDetails.isOneTime && (
                    <span className="text-[10px] text-slate-450 dark:text-slate-400 block">
                      {billingCycle === 'monthly' ? 'billed monthly' : 'billed yearly'}
                    </span>
                  )}
                </div>
              </div>

              {/* Form Input fields */}
              <form onSubmit={handlePaymentSubmit} className="space-y-4">
                
                {formError && (
                  <div className="p-3 border border-rose-200 bg-rose-50 dark:bg-rose-950/20 dark:border-rose-900/50 text-xxs font-semibold text-rose-600 dark:text-rose-400 rounded-xl">
                    {formError}
                  </div>
                )}

                {/* Name on Card */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Cardholder Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Jane Doe"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-200"
                  />
                </div>

                {/* Credit Card Details container */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Card Number</span>
                    <div className="flex space-x-1">
                      <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </label>
                  
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="4111 2222 3333 4444"
                      maxLength={19}
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      className="w-full p-2.5 pl-10 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-200 font-mono"
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                      <Lock className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </div>
                </div>

                {/* Expiry, CVC & ZIP in a row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Expiry Date
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="MM/YY"
                      maxLength={5}
                      value={expiry}
                      onChange={handleExpiryChange}
                      className="w-full p-2.5 text-xs text-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-200 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      CVC / CVV
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="123"
                      maxLength={4}
                      value={cvc}
                      onChange={(e) => setCvc(e.target.value.replace(/[^0-9]/g, ''))}
                      className="w-full p-2.5 text-xs text-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-200 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      ZIP / Postal
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="10001"
                      value={zip}
                      onChange={(e) => setZip(e.target.value)}
                      className="w-full p-2.5 text-xs text-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-200"
                    />
                  </div>

                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="w-full py-3 bg-indigo-650 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs flex items-center justify-center space-x-2 cursor-pointer disabled:cursor-not-allowed disabled:bg-slate-400 shadow-md shadow-indigo-500/10"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Validating card & processing...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5 fill-current" />
                        <span>Pay ${planPrice}.05 & Upgrade</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-center space-x-2 text-[9px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-900">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Stripe security. We never store your full card details.</span>
                </div>

              </form>

              {/* Navigation Back */}
              <button 
                type="button"
                onClick={() => setCheckoutStep('plans')}
                className="text-xxs text-indigo-600 hover:text-indigo-500 font-bold text-center block mt-2 cursor-pointer"
              >
                ← Back to pricing plans
              </button>

            </div>
          )}

          {/* STEP 3: PAYMENT SUCCESS */}
          {checkoutStep === 'success' && currentSelectedPlanDetails && (
            <div className="max-w-md mx-auto text-center py-6 space-y-5">
              
              {/* Checkmark Animation container */}
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto text-emerald-600 animate-bounce">
                <Check className="w-9 h-9 stroke-[3]" />
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-black text-slate-850 dark:text-slate-100">
                  Upgrade Successful!
                </h3>
                <p className="text-xxs text-slate-400">
                  Thank you for your purchase. You are now subscribed to the <strong className="text-slate-650 dark:text-slate-200">{currentSelectedPlanDetails.name}</strong> tier.
                </p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-sm mx-auto text-left space-y-2">
                <h4 className="text-xxs font-extrabold uppercase text-slate-400 tracking-wider">Unlocked Premium benefits:</h4>
                <ul className="space-y-1.5">
                  <li className="flex items-center space-x-2 text-[10px] text-slate-700 dark:text-slate-350">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <span>Unlimited resume optimization variants</span>
                  </li>
                  <li className="flex items-center space-x-2 text-[10px] text-slate-700 dark:text-slate-350">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <span>Access to high-fidelity LaTeX compiles</span>
                  </li>
                  <li className="flex items-center space-x-2 text-[10px] text-slate-700 dark:text-slate-350">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <span>Cover Letter drafts & suggestions collateral</span>
                  </li>
                </ul>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => {
                    setCheckoutStep('plans');
                    onClose();
                  }}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-500/10 cursor-pointer"
                >
                  Start Optimizing with Pro
                </button>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}
