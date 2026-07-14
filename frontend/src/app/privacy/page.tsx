'use client';

import React from 'react';
import Link from 'next/link';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between py-12 px-6 lg:px-8">
      <div className="max-w-3xl mx-auto w-full">
        <div className="text-center mb-10">
          <Link href="/" className="text-2xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 via-sky-400 to-emerald-400 bg-clip-text text-transparent hover:opacity-90 transition-opacity">
            DawnBox
          </Link>
          <h1 className="mt-4 text-3xl font-extrabold text-white sm:text-4xl">Privacy Policy</h1>
          <p className="mt-2 text-sm text-slate-400">Last updated: July 14, 2026</p>
        </div>

        <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-8 backdrop-blur-md shadow-xl space-y-6 text-slate-300 leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-white mb-2">1. Overview</h2>
            <p>
              DawnBox ("we", "our", or "us") provides an AI-powered notification prioritization dashboard. We are committed to protecting your privacy. This Privacy Policy explains how we access, process, and protect your information when you connect your accounts (Google/Gmail, GitHub, Slack) to our services.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">2. Data We Access</h2>
            <p>
              When you connect third-party integrations, we access only the data necessary to provide notification management services:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>Google/Gmail:</strong> We request read-only access (<code className="text-indigo-400">gmail.readonly</code>) to fetch unread email subjects, sender details, timestamps, and body snippets for classification.</li>
              <li><strong>GitHub:</strong> We request notification access to retrieve active issues, pull requests, and updates.</li>
              <li><strong>Slack:</strong> We request read access to retrieve unread mentions and messages.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">3. How We Use Your Data</h2>
            <p>
              We process your data using AI model pipelines (specifically Llama via Groq API) to:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Classify notification categories (Action Required, FYI, Ignore).</li>
              <li>Assign priority scores from 0-10.</li>
              <li>Generate short summaries (AI Insights) to help you catch up faster.</li>
            </ul>
            <p className="mt-2">
              We **do not** sell, lease, or share your email content or personal data with any third-party marketing companies. Data is used solely for generating your local dashboard briefing.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">4. Data Storage & Security</h2>
            <p>
              OAuth access tokens and fetched notifications are stored securely in our private Neon PostgreSQL database. All connections use industry-standard SSL/TLS encryption. You can completely disconnect any integration or delete your account at any time from the settings panel, which will immediately delete all associated tokens and synced data from our servers.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">5. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at <a href="mailto:support@dawn-box.vercel.app" className="text-indigo-400 hover:underline">support@dawn-box.vercel.app</a>.
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
