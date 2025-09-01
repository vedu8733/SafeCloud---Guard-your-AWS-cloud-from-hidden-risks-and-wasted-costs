"use client";
import { useState, useEffect } from "react";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { motion } from "framer-motion";
import { ShieldCheck, Cloud } from "lucide-react";

export default function ConnectPage() {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  // ✅ Check status on load
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch("http://localhost:8000/aws/status", {
          credentials: "include",
        });
        const data = await res.json();
        if (data.success && data.connected) {
          setConnected(true);
          setUserEmail(data.user?.email || "");
        }
      } catch (err) {
        console.error("Status check failed", err);
      }
    };
    checkStatus();
  }, []);

  // ✅ Handle connect button
  const handleConnect = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/auth/login-url", {
        credentials: "include",
      });
      const data = await res.json();
      if (data.success && data.loginUrl) {
        window.location.href = data.loginUrl; // 🔑 Redirect to Cognito login
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error("Login URL fetch failed", err);
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7 }}
      className="flex flex-col items-center justify-center gap-8 py-12"
    >
      <Card className="w-full max-w-md flex flex-col items-center gap-6">
        <div className="flex flex-col items-center gap-2">
          <ShieldCheck className="w-10 h-10 text-brand-accent" />
          <h2 className="text-2xl font-bold">Connect your AWS Account</h2>
          <p className="text-gray-200 text-center text-base">
            Securely connect using{" "}
            <span className="font-semibold">Cognito + STS</span>.<br />
            We never store your credentials.
          </p>
        </div>

        {/* ✅ Connection Status */}
        <div className="flex items-center gap-2">
          <span>Status:</span>
          <Badge color={connected ? "green" : "red"}>
            {connected ? "Connected" : "Not Connected"}
          </Badge>
        </div>
        {connected && userEmail && (
          <p className="text-sm text-gray-300">Signed in as {userEmail}</p>
        )}

        {/* ✅ Connect Button */}
        <button
          onClick={handleConnect}
          disabled={connected || loading}
          className="w-full mt-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-brand-primary to-brand-accent text-white font-semibold shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Connecting..." : connected ? "Connected" : "Connect AWS"}
        </button>

        <div className="flex items-center gap-2 text-xs text-gray-400 mt-2">
          <Cloud className="w-4 h-4 text-brand-muted" />
          <span>
            {connected
              ? "AWS Account linked successfully."
              : "Click connect to authenticate."}
          </span>
        </div>
      </Card>
    </motion.div>
  );
}
