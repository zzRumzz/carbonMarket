import { ethers } from "ethers";

export async function login() {
  try {
    if (typeof window.ethereum !== 'undefined') {
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      return signer.getAddress();
    } else {
      throw new Error("MetaMask is not installed");
    }
  } catch (error) {
    if (error.code === 4001) {
      // User rejected the request
      console.warn("User rejected the MetaMask connection request");
    } else {
      console.error("Unexpected error occurred during MetaMask connection:", error);
    }
    throw error; // Re-throw to handle it in the calling function
  }
}
