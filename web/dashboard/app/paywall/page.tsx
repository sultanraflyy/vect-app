'use client';

import { useState } from 'react';
import Link from 'next/link';
import AuthGuard from '@/components/AuthGuard';
import DashboardLayout from '@/components/DashboardLayout';
import {
  Check,
  X,
  Zap,
  Star,
  Building2,
  ChevronRight,
  Coins,
  FlaskConical,
} from 'lucide-react';

// ─── Plans ──────────────────────────────────────────────────────────────────

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: '/month',
    credits: '150 standard credits/mo',
    badge: null,
    checkoutUrl: null,
    color: 'slate',
    features: [
      { label: 'Standard verifications', included: true },
      { label: 'Web search', included: true },
      { label: 'Claim auto-grouping', included: true },
      { label: '1 seat', included: true },
      { label: 'Deep research', included: false },
      { label: 'PDF / CSV export', included: false },
      { label: 'Analytics', included: false },
      { label: 'API access', included: false },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$14.99',
    period: '/month',
    credits: '1,500 standard + 150 deep/mo',
    badge: 'MOST POPULAR',
    checkoutUrl: 'https://vect.lemonsqueezy.com/checkout/pro',
    color: 'blue',
    features: [
      { label: 'Standard verifications', included: true },
      { label: 'Web search', included: true },
      { label: 'Claim auto-grouping', included: true },
      { label: '3 seats', included: true },
      { label: 'Deep research', included: true },
      { label: 'PDF / CSV export', included: true },
      { label: 'Analytics', included: true },
      { label: 'API access', included: false },
    ],
  },
  {
    id: 'business',
    name: 'Business',
    price: '$49.99',
    period: '/month',
    credits: '5,000 standard + 500 deep/mo',
    badge: null,
    checkoutUrl: 'https://vect.lemonsqueezy.com/checkout/business',
    color: 'amber',
    features: [
      { label: 'Standard verifications', included: true },
      { label: 'Web search', included: true },
      { label: 'Claim auto-grouping', included: true },
      { label: 'Unlimited seats', included: true },
      { label: 'Deep research', included: true },
      { label: 'PDF / CSV export', included: true },
      { label: 'Analytics', included: true },
      { label: 'API access', included: true },
    ],
  },
];

// ─── Top-up packs ────────────────────────────────────────────────────────────

const standardPacks = [
  { credits: '500 credits', price: '$4.99', url: 'https://vect.lemonsqueezy.com/checkout/standard-500' },
  { credits: '1,500 credits', price: '$9.99', url: 'https://vect.lemonsqueezy.com/checkout/standard-1500' },
  { credits: '4,000 credits', price: '$19.99', url: 'https://vect.lemonsqueezy.com/checkout/standard-4000' },
];

const deepPacks = [
  { credits: '50 deep credits', price: '$9.99', url: 'https://vect.lemonsqueezy.com/checkout/deep-50' },
  { credits: '200 deep credits', price: '$29.99', url: 'https://vect.lemonsqueezy.com/checkout/deep-200' },
];

// ─── Component ───────────────────────────────────────────────────────────────

function PaywallContent() {
  const [tab, setTab] = useState<'plans' | 'topup'>('plans');

  const planColors: Record<string, { ring: string; badge: string; cta: string; highlight: string }> = {
    slate: {
      ring: 'border-slate-200',
      badge: 'bg-slate-100 text-slate-600',
      cta: 'bg-slate-100 text-slate-700 hover:bg-slate-200',
      highlight: '',
    },
    blue: {
      ring: 'border-blue-500 ring-2 ring-blue-500/20',
      badge: 'bg-blue-600 text-white',
      cta: 'bg-blue-600 text-white hover:bg-blue-700',
      highlight: 'bg-blue-50/50',
    },
    amber: {
      ring: 'border-amber-400',
      badge: 'bg-amber-400 text-white',
      cta: 'bg-amber-500 text-white hover:bg-amber-600',
      highlight: '',
    },
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6 animate-fade-up">
        <h2 className="text-xl font-semibold text-slate-900 mb-1">Plans &amp; Pricing</h2>
        <p className="text-sm text-slate-500">Choose a plan that fits your verification needs</p>
      </div>

      {/* Tab toggle */}
      <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-xl w-fit animate-fade-up">
        <button
          onClick={() => setTab('plans')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'plans' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Plans
        </button>
        <button
          onClick={() => setTab('topup')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'topup' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Top-up Credits
        </button>
      </div>

      {/* Plans tab */}
      {tab === 'plans' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-up">
          {plans.map((plan) => {
            const colors = planColors[plan.color];
            const isCurrent = plan.id === 'free';

            return (
              <div
                key={plan.id}
                className={`relative bg-white rounded-2xl border ${colors.ring} ${colors.highlight} p-6 flex flex-col shadow-sm`}
              >
                {plan.badge && (
                  <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold ${colors.badge}`}>
                    {plan.badge}
                  </div>
                )}
                {isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                    Current Plan
                  </div>
                )}

                {/* Plan header */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    {plan.id === 'free' && <Zap className="w-5 h-5 text-slate-400" />}
                    {plan.id === 'pro' && <Star className="w-5 h-5 text-blue-600" />}
                    {plan.id === 'business' && <Building2 className="w-5 h-5 text-amber-500" />}
                    <span className="font-semibold text-slate-900">{plan.name}</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-slate-900">{plan.price}</span>
                    <span className="text-sm text-slate-500">{plan.period}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{plan.credits}</p>
                </div>

                {/* Features */}
                <ul className="space-y-2.5 flex-1 mb-6">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2.5 text-sm">
                      {f.included ? (
                        <Check className="w-4 h-4 text-green-500 shrink-0" />
                      ) : (
                        <X className="w-4 h-4 text-slate-300 shrink-0" />
                      )}
                      <span className={f.included ? 'text-slate-700' : 'text-slate-400'}>
                        {f.label}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                {isCurrent ? (
                  <div className={`w-full py-2.5 rounded-xl text-sm font-medium text-center ${colors.cta}`}>
                    Current Plan
                  </div>
                ) : (
                  <a
                    href={plan.checkoutUrl!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-medium transition-colors ${colors.cta}`}
                  >
                    Get {plan.name}
                    <ChevronRight className="w-4 h-4" />
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Top-up Credits tab */}
      {tab === 'topup' && (
        <div className="space-y-6 animate-fade-up">
          {/* Standard credits */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Coins className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-semibold text-slate-900">Standard Credits</h3>
              <span className="text-xs text-slate-400">— for regular verifications</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {standardPacks.map((pack, i) => (
                <a
                  key={i}
                  href={pack.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-sm transition-all group"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{pack.credits}</p>
                    <p className="text-xs text-slate-500 mt-0.5">one-time purchase</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-blue-600">{pack.price}</span>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Deep research credits */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <FlaskConical className="w-4 h-4 text-purple-600" />
              <h3 className="text-sm font-semibold text-slate-900">Deep Research Credits</h3>
              <span className="text-xs text-slate-400">— for in-depth analysis (Pro+)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {deepPacks.map((pack, i) => (
                <a
                  key={i}
                  href={pack.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-4 hover:border-purple-300 hover:shadow-sm transition-all group"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{pack.credits}</p>
                    <p className="text-xs text-slate-500 mt-0.5">one-time purchase</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-purple-600">{pack.price}</span>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-purple-500 transition-colors" />
                  </div>
                </a>
              ))}
            </div>
          </div>

          <p className="text-xs text-slate-400">
            Purchases are one-time top-ups added to your account balance. Deep research credits require a Pro or Business subscription.
          </p>
        </div>
      )}
    </div>
  );
}

export default function PaywallPage() {
  return (
    <AuthGuard>
      <DashboardLayout title="Plans & Pricing">
        <PaywallContent />
      </DashboardLayout>
    </AuthGuard>
  );
}
