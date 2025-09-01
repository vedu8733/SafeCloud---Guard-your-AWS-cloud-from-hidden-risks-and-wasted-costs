"use client";
import { motion } from "framer-motion";
import {
  Cloud,
  ShieldCheck,
  Lock,
  DollarSign,
  CheckCircle,
  ArrowRight,
  BarChart3,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import CountUp from "react-countup";

export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const faqs = [
    {
      q: "How does SafeCloud connect to my AWS?",
      a: "In production, you authenticate via AWS Cognito and assume an IAM role using STS to scan your environment securely.",
    },
    {
      q: "Do you store my credentials?",
      a: "No. Short-lived temporary credentials are used to perform read-only scans, and are not persisted on the server.",
    },
    {
      q: "Which frameworks and services are supported?",
      a: "AWS IAM, S3, EC2, RDS, and more. Results can be exported to PDF and integrated into CI/CD pipelines.",
    },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="relative flex flex-col items-center justify-center text-center gap-16 py-20 overflow-hidden"
    >
      {/* 🌌 Background Glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-purple-900/30 via-black to-black blur-3xl" />

      {/* ✨ Floating Particles */}
      <motion.div
        className="absolute top-0 left-0 w-full h-full"
        animate={{ opacity: [0.4, 0.7, 0.4] }}
        transition={{ repeat: Infinity, duration: 6 }}
      >
        <div className="w-2 h-2 bg-brand-accent rounded-full absolute top-20 left-1/4 animate-ping" />
        <div className="w-3 h-3 bg-purple-500 rounded-full absolute top-40 left-2/3 animate-pulse" />
        <div className="w-2 h-2 bg-pink-500 rounded-full absolute top-72 left-1/2 animate-ping" />
      </motion.div>

      {/* 🚀 Hero Section */}
      <div className="flex flex-col items-center gap-4 relative z-10">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.7 }}
          className="bg-white/10 rounded-full p-6 shadow-glass mb-4"
        >
          <Cloud size={64} className="text-brand-primary" />
        </motion.div>
        <h1 className="text-5xl md:text-7xl font-extrabold bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent drop-shadow-lg">
          SafeCloud
        </h1>
        <p className="text-xl md:text-2xl text-gray-200 font-medium max-w-2xl">
          Guarding your cloud from{" "}
          <span className="text-brand-accent font-semibold">hidden risks</span>{" "}
          and{" "}
          <span className="text-green-400 font-semibold">wasted costs</span>
        </p>
        <p className="max-w-xl text-base md:text-lg text-gray-300 mt-2">
          Scan your AWS cloud for compliance, cost, and security issues.
          Generate one-click PDF reports. Modern, secure, and effortless.
        </p>
        <Link href="/connect">
          <motion.button
            whileHover={{
              scale: 1.05,
              boxShadow: "0px 0px 20px #7c3aed",
            }}
            whileTap={{ scale: 0.97 }}
            className="mt-6 px-10 py-4 rounded-2xl bg-gradient-to-r from-brand-primary to-brand-accent text-white font-semibold shadow-lg transition-all text-lg"
          >
            🚀 Get Started Free
          </motion.button>
        </Link>
      </div>

      {/* 📊 Metrics with Animated Counters */}
      <div className="w-full max-w-5xl grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-4 text-left">
          <div className="text-3xl font-extrabold text-white">
            <CountUp end={10000} duration={3} />+
          </div>
          <div className="text-sm text-gray-300">Resources scanned</div>
        </div>
        <div className="glass-card p-4 text-left">
          <div className="text-3xl font-extrabold text-white">
            <CountUp end={1200} duration={3} />
          </div>
          <div className="text-sm text-gray-300">Issues resolved</div>
        </div>
        <div className="glass-card p-4 text-left">
          <div className="text-3xl font-extrabold text-white">
            <CountUp end={92} duration={3} />%
          </div>
          <div className="text-sm text-gray-300">Avg. compliance</div>
        </div>
        <div className="glass-card p-4 text-left">
          <div className="text-3xl font-extrabold text-green-400">
            $<CountUp end={50000} duration={3} />
          </div>
          <div className="text-sm text-gray-300">Est. cost saved</div>
        </div>
      </div>

      {/* 🎠 Infinite Logo Slider */}
      <div className="w-full overflow-hidden relative max-w-5xl">
        <motion.div
          className="flex gap-12 text-gray-400 text-lg whitespace-nowrap"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
        >
          <span>AWS</span>
          <span>ISO 27001</span>
          <span>SOC 2</span>
          <span>GDPR</span>
          <span>HIPAA</span>
          <span>AWS</span>
          <span>ISO 27001</span>
          <span>SOC 2</span>
          <span>GDPR</span>
          <span>HIPAA</span>
        </motion.div>
      </div>

      {/* 🛡️ Features */}
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-6 text-left mt-10">
        <motion.div whileHover={{ y: -4 }} className="glass-card p-6">
          <div className="flex items-center gap-3 mb-2">
            <ShieldCheck className="w-6 h-6 text-brand-accent" />
            <h3 className="text-lg font-bold">Security Scanning</h3>
          </div>
          <p className="text-sm text-gray-300 mb-3">
            Enterprise-grade security analysis across IAM, networking, data, and
            workloads.
          </p>
          <ul className="text-sm space-y-1 text-gray-300">
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" /> IAM Policy
              Review
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" /> Network
              Guardrails
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" /> Encryption
              Checks
            </li>
          </ul>
        </motion.div>

        <motion.div whileHover={{ y: -4 }} className="glass-card p-6">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-6 h-6 text-green-500" />
            <h3 className="text-lg font-bold">Cost Optimization</h3>
          </div>
          <p className="text-sm text-gray-300 mb-3">
            Find unused resources and right-size your spend with actionable
            insights.
          </p>
          <ul className="text-sm space-y-1 text-gray-300">
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" /> Idle Resource
              Cleanup
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" /> Savings Plan
              Tips
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" /> Storage
              Optimization
            </li>
          </ul>
        </motion.div>

        <motion.div whileHover={{ y: -4 }} className="glass-card p-6">
          <div className="flex items-center gap-3 mb-2">
            <Lock className="w-6 h-6 text-blue-400" />
            <h3 className="text-lg font-bold">Compliance Monitoring</h3>
          </div>
          <p className="text-sm text-gray-300 mb-3">
            Automated checks to keep you aligned with standards and audits.
          </p>
          <ul className="text-sm space-y-1 text-gray-300">
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" /> SOC 2, ISO
              27001
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" /> GDPR, HIPAA
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" /> Audit-ready
              reports
            </li>
          </ul>
        </motion.div>
      </div>

      {/* ❓ FAQ */}
      <div className="w-full max-w-5xl text-left mt-10">
        <h3 className="text-2xl font-bold mb-4">Frequently asked questions</h3>
        <div className="space-y-3">
          {faqs.map((item, idx) => (
            <div key={idx} className="glass-card p-4">
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full flex items-center justify-between gap-4 text-left"
              >
                <span className="font-semibold">{item.q}</span>
                <ChevronDown
                  className={`w-5 h-5 transition-transform ${
                    openFaq === idx ? "rotate-180" : ""
                  }`}
                />
              </button>
              {openFaq === idx && (
                <div className="mt-2 text-sm text-gray-300">{item.a}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 🚀 CTA */}
      <div className="w-full max-w-5xl mt-10">
        <div className="glass-card p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-4 text-left">
          <div>
            <h3 className="text-2xl font-bold">
              Ready to secure and optimize your cloud?
            </h3>
            <p className="text-gray-300 mt-1">
              Connect your AWS in minutes and get your first report today.
            </p>
          </div>
          <Link href="/connect" className="shrink-0">
            <motion.button
              whileHover={{
                scale: 1.05,
                boxShadow: "0px 0px 20px #7c3aed",
              }}
              whileTap={{ scale: 0.97 }}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-brand-primary to-brand-accent text-white font-semibold shadow-lg flex items-center gap-2"
            >
              Get Started <ArrowRight className="w-4 h-4" />
            </motion.button>
          </Link>
        </div>
      </div>
    </motion.section>
  );
}
