import { useEffect, useState } from 'react';
import { useLocation } from 'react-router';
import { ethers } from 'ethers';
import fullLogo from '../full_logo.png';
import {
  Link
} from "react-router-dom";
import MarketplaceJSON from "../Marketplace.json";
import CustomToken from "../myToken.json";
import { CopyToClipboard } from 'react-copy-to-clipboard';

function Navbar() {
  const [connected, toggleConnect] = useState(false);
  const location = useLocation();
  const [tokenAddress, setTokenAddress] = useState('');
  const [currAddress, updateAddress] = useState('0x');
  const [errorMessage, setErrorMessage] = useState('');
  const [copied, setCopied] = useState(false);

  async function getAddress() {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const addr = await signer.getAddress();
      updateAddress(addr);
      toggleConnect(true);
      setTokenAddress(CustomToken.address);
      console.log("this is the custom token address: ", CustomToken.address);
    } catch (error) {
      console.error("Error getting address or token address: ", error);
      setErrorMessage("Failed to get address from MetaMask or token address");
    }
  }

  function updateButton(isConnected) {
    const ethereumButton = document.querySelector('.enableEthereumButton');
    if (ethereumButton) {
      if (isConnected) {
        ethereumButton.textContent = "Connected";
        ethereumButton.classList.remove("hover:bg-blue-70", "bg-blue-500");
        ethereumButton.classList.add("hover:bg-green-70", "bg-green-500");
      } else {
        ethereumButton.textContent = "Connect Wallet";
        ethereumButton.classList.remove("hover:bg-green-70", "bg-green-500");
        ethereumButton.classList.add("hover:bg-blue-70", "bg-blue-500");
      }
    }
  }

  async function connectWebsite() {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.listAccounts();

      if (accounts.length > 0) {
        alert("MetaMask already connected");
        
        updateButton(true);
        getAddress();
        return;
      }

      const network = await provider.getNetwork();
      if (network.chainId !== 11155111) { // Sepolia chain ID in decimal
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0xaa36a7' }], // Hexadecimal representation of Sepolia chain ID
        });
      }

      await window.ethereum.request({ method: 'eth_requestAccounts' })
        .then(() => {
          updateButton(true);
          getAddress();
          window.location.replace(location.pathname);
          approveTokens();

        });
    } catch (error) {
      console.error("Error connecting to MetaMask: ", error);
      if (error.code === -32002) {
        setErrorMessage("MetaMask request is already pending. Please check MetaMask.");
      } else if (error.code === 4001) {
        setErrorMessage("User rejected the request.");
        toggleConnect(false);
        updateButton(false);
      } else {
        setErrorMessage("Failed to connect to MetaMask");
      }
    }
  }

  async function approveTokens() {
    try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const customTokenContract = new ethers.Contract(CustomToken.address, CustomToken.abi, signer);

        // Set a high allowance, e.g., 1000 tokens
        const amount = ethers.parseUnits('1000', 18);
        const approvalTx = await customTokenContract.approve(MarketplaceJSON.address, amount);
        await approvalTx.wait();

        console.log("Approved marketplace to spend tokens on your behalf");
    } catch (error) {
        console.error("Error approving tokens:", error);
    }
}


  async function getCustomTokens() {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      let marketplaceContract = new ethers.Contract(MarketplaceJSON.address, MarketplaceJSON.abi, signer);
      console.log("this is the marketplace address: ", marketplaceContract.target);
      console.log("this is the marketplace abi: ", marketplaceContract.abi);

      let CarbonToken = new ethers.Contract(CustomToken.address, CustomToken.abi, signer);
      console.log("this is the carbon token owner: ", CarbonToken.owner());

      const fallbackGasLimit = 2000000; // Set a fallback gas limit

      let tx = await marketplaceContract.getTokens({ gasLimit: fallbackGasLimit }); // Call the getTokens function from the contract
      const receipt = await tx.wait();
      if (receipt.status === 1) {
        alert('Successfully received tokens!');
      } else {
        throw new Error('Transaction failed or was reverted');
      }
    } catch (error) {
      console.error('Error receiving tokens:', error);
      //setErrorMessage('Failed to receive tokens: ' + error.message);
    }
  }

  useEffect(() => {
    if (window.ethereum === undefined) return;

    const checkConnection = async () => {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const isConnected = window.ethereum.isConnected();
      const accounts = await provider.listAccounts();
      if (isConnected && accounts.length > 0) {
        getAddress();
        toggleConnect(true);
        updateButton(true);
      } else {
        toggleConnect(false);
        updateButton(false);
      }
    };

    checkConnection();

    window.ethereum.on('accountsChanged', () => {
      checkConnection();
      window.location.replace(location.pathname);
    });

    window.ethereum.on('disconnect', () => {
      updateAddress('0x');
      toggleConnect(false);
      updateButton(false);
    });
  }, [location]);
  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000); // Reset copied state after 2 seconds
  };

  return (
    <div>
      <nav className="w-screen">
        <ul className='flex items-end justify-between py-3 bg-transparent text-white pr-5'>
          <li className='flex items-end ml-5 pb-2'>
            <Link to="/">
              <img src={fullLogo} alt="" width={100} height={100} className="inline-block -mt-2" />
              <div className='inline-block font-bold text-xl ml-2'>
                CARBON CREDIT Marketplace
              </div>
            </Link>
          </li>
          <li className='w-2/6'>
            <ul className='lg:flex justify-between font-bold mr-10 text-lg'>
              <li className={location.pathname === "/" ? 'border-b-2 hover:pb-0 p-2' : 'hover:border-b-2 hover:pb-0 p-2'}>
                <Link to="/">Marketplace</Link>
              </li>
              <li className={location.pathname === "/sellNFT" ? 'border-b-2 hover:pb-0 p-2' : 'hover:border-b-2 hover:pb-0 p-2'}>
                <Link to="/sellNFT">List My NFT</Link>
              </li>
              <li className={location.pathname === "/profile" ? 'border-b-2 hover:pb-0 p-2' : 'hover:border-b-2 hover:pb-0 p-2'}>
                <Link to="/profile">Profile</Link>
              </li>
              <li>
                <button onClick={connectWebsite} className="enableEthereumButton bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm">{connected ? "Connected" : "Connect Wallet"}</button>
              </li>
              <li>
                <button onClick={getCustomTokens} className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded text-sm">Get CARB Tokens</button>
              </li>
            </ul>
          </li>
        </ul>
      </nav>
      {connected && currAddress !== "0x" && (
        <div className='text-white text-bold text-right mr-10 text-sm'>
          <div>Your Wallet address: {currAddress.substring(0, 15)}...</div>
          <div>Token Address: {tokenAddress}
            <CopyToClipboard text={tokenAddress} onCopy={handleCopy}>
              <button className="ml-2 p-2 bg-white text-green-500 rounded">Copy</button>
            </CopyToClipboard>
            {copied && <span className="ml-2 text-yellow-300">Copied!</span>}
          </div>
        </div>
      )}
      {errorMessage && <div className="text-red-500 text-center mt-3">{errorMessage}</div>}
    </div>
  );
}

export default Navbar;
