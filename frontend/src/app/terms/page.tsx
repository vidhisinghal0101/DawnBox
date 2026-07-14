'use client';

import React from 'react';
import Link from 'next/link';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between py-12 px-6 lg:px-8">
      <div className="max-w-3xl mx-auto w-full">
        <div className="text-center mb-10">
          <Link href="/" className="text-2xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 via-sky-400 to-emerald-400 bg-clip-text text-transparent hover:opacity-90 transition-opacity">
            DawnBox
          </Link>
          <h1 className="mt-4 text-3xl font-extrabold text-white sm:text-4xl">Terms of Service</h1>
          <p className="mt-2 text-sm text-slate-400">Last updated: July 14, 2026</p>
        </div>

        <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-8 backdrop-blur-md shadow-xl space-y-6 text-slate-300 leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-white mb-2">1. Agreement to Terms</h2>
            <p>
              By accessing or using DawnBox ("Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">2. Description of Service</h2>
            <p>
              DawnBox provides an inbox prioritization tool that collects unread notifications and emails from your connected accounts (Gmail, GitHub, Slack) and uses AI to summarize, score, and sort them.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">3. User Responsibilities</h2>
            <p>
              When connecting your accounts, you represent that you have the right to grant us access to fetch those notifications. You are responsible for maintaining the confidentiality of your login sessions and credentials. You agree not to use the Service for any illegal or unauthorized purpose.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">4. Intellectual Property</h2>
            <p>
              The Service, including its code, designs, and logo, is the intellectual property of DawnBox and is protected by copyright laws. You may not copy, modify, or distribute any part of our service without prior written consent.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">5. Disclaimer of Warranties</h2>
            <p>
              The Service is provided on an "as is" and "as available" basis without warranties of any kind, whether express or implied. We do not guarantee that the Service will be uninterrupted, error-free, or completely accurate in its AI-based classification.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">6. Limitation of Liability</h2>
            <p>
              In no event shall DawnBox be liable for any direct, indirect, incidental, or consequential damages resulting from your use or inability to use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">7. Changes to Terms</h2>
            <p>
              We reserve the right to modify these Terms of Service at any time. Changes will be posted on this page and are effective immediately.
            </p>
          </section>
        </div>

        <div className="text-center mt-8">
          <Link href="/login" className="text-sm font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
