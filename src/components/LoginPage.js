import React from "react";
import { connectMetaMask } from "../utils";

export default function LoginPage() {
  async function handleLogin() {
    try {
      await connectMetaMask();
      window.location.href = "/"; // Redirect to home page or wherever you want
    } catch (e) {
      if (e.code !== 4001 && e.code !== -32002) {
        alert("Failed to connect MetaMask: " + e.message);
      }
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-3xl mb-5">Connect to MetaMask</h1>
      <button
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        onClick={handleLogin}
      >
        Connect MetaMask
      </button>
    </div>
  );
}
