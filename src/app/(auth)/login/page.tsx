"use client";

import { signIn } from "next-auth/react";

export default function LoginPage() {
  return (
    <div className="flex h-screen bg-white">
      {/* Left: Login form */}
      <div className="w-full md:w-1/2 flex items-center justify-center px-6">
        <div className="max-w-sm w-full space-y-6">
          {/* Logo, Sign in, and Create Account Centered */}
          <div className="text-center space-y-2">
          <img src="/airtable-logo.svg" alt="Airtable" className="h-35 mx-auto" />
          <h2 className="text-2xl font-bold">Sign in</h2>
            <p className="text-sm text-gray-600">
              or <a href="#" className="text-blue-600 underline">create an account</a>
            </p>
          </div>

          {/* Email input */}
          <input
            type="email"
            placeholder="Email address"
            className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />

          {/* Continue button */}
          <button className="w-full bg-blue-500 text-white py-2 rounded-xl hover:bg-blue-600">
            Continue
          </button>

          {/* Divider */}
          <div className="flex items-center gap-2">
            <hr className="flex-1 border-gray-300" />
            <span className="text-gray-500 text-sm">or</span>
            <hr className="flex-1 border-gray-300" />
          </div>

          {/* Sign in buttons */}
          <button
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            className="w-full border py-2 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-50"
            >
            <img src="/google-icon.svg" alt="Google" className="w-5 h-5" />
            Sign in with Google
        </button>


          <button className="w-full border py-2 rounded-xl hover:bg-gray-50">
            Sign in with Single Sign On
          </button>

          <button className="w-full border py-2 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-50">
            <img src="/apple-icon.svg" alt="Apple" className="w-5 h-5" />
            Sign in with Apple
          </button>
        </div>
      </div>

      {/* Right: Image panel */}
      <div className="hidden md:flex w-1/2 items-center justify-center">
        <img
          src="/login-promo.png"
          alt="Promo"
          className="max-w-md rounded-3xl shadow-xl"
        />
      </div>
    </div>
  );
}
