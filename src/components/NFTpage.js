import React, { useState, useEffect } from "react";
import Navbar from "./Navbar";
import { useParams, useLocation as useReactRouterLocation } from "react-router-dom";
import MarketplaceJSON from "../Marketplace.json";
import axios from "axios";
import { GetIpfsUrlFromPinata } from "../utils";
//import { ethers } from "ethers";
import CustomToken from "../myToken.json";  


export default function NFTPage(props) {
  
  const [data, updateData] = useState({});
  const [message, updateMessage] = useState("");
  const [currAddress, updateCurrAddress] = useState("0x");
  const [dataFetched, updateDataFetched] = useState(false);
  const { tokenId } = useParams();
  const reactRouterLocation = useReactRouterLocation();
  const onNFTBought = reactRouterLocation.state?.onNFTBought;
  const [showSellForm, setShowSellForm] = useState(false);
  const [formParams, updateFormParams] = useState({ name: '', description: '',certificate: '', price: '' });
  

  useEffect(() => {
    if (!dataFetched) {
      getNFTData(tokenId);
    }
  }, [dataFetched, tokenId]);

  async function getNFTData(tokenId) {
    const ethers = require("ethers");
    // After adding your Hardhat network to your metamask, this code will get providers and signers
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const addr = await signer.getAddress();
    // Pull the deployed contract instance
    let contract = new ethers.Contract(MarketplaceJSON.address, MarketplaceJSON.abi, signer);
    // Create an NFT Token
    var tokenURI = await contract.tokenURI(tokenId);
    
    const listedToken = await contract.getListedTokenForId(tokenId);
    tokenURI = GetIpfsUrlFromPinata(tokenURI);
    
    let meta = await axios.get(tokenURI);
    meta = meta.data;

    let item = {
      price: ethers.formatUnits(listedToken[3], 18),
      tokenId: tokenId,
      seller: listedToken[2],
      owner: listedToken[1],
      image: meta.image,
      name: meta.name,
      description: meta.description,
      certificate:meta.certificate,
      currentlyListed: listedToken[4]
    };

    console.log(item);
    updateData(item);
    updateDataFetched(true);
    console.log("address", addr)
    updateCurrAddress(addr);
    
  }

  async function buyNFT(tokenId) {
    try {

       
      const ethers = require("ethers");
      // After adding your Hardhat network to your metamask, this code will get providers and signers
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // Pull the deployed contract instance
      let contract = new ethers.Contract(MarketplaceJSON.address, MarketplaceJSON.abi, signer);
      const salePrice = ethers.parseUnits(data.price, 18);
      console.log("this is the nft price: ",data.price);

      const customTokenContract = new ethers.Contract(CustomToken.address, CustomToken.abi, signer);
      const approvalTx = await customTokenContract.approve(MarketplaceJSON.address, salePrice);
      await approvalTx.wait();

      const fallbackGasLimit = 2000000; // Set a fallback gas limit
      
      updateMessage("Buying the NFT... Please Wait (Upto 5 mins)");
      // Run the executeSale function
      let transaction = await contract.executeSale(tokenId, {gasLimit: fallbackGasLimit});
      await transaction.wait();

      alert("You successfully bought the NFT!");
      updateMessage("");
      window.location.reload(); // Reload the page or update UI as needed

      if (onNFTBought) {
        onNFTBought(tokenId);
      }

      
    } catch (e) {
      alert("Upload Error" + e);
    }
  }

async function sellNFT(e) {
  e.preventDefault();
  try {
    const ethers = require("ethers");
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    let contract = new ethers.Contract(MarketplaceJSON.address, MarketplaceJSON.abi, signer);

    // Retrieve the token URI for the token ID
    const tokenURI = await contract.tokenURI(tokenId);
    const metadataURL = GetIpfsUrlFromPinata(tokenURI); // Assuming GetIpfsUrlFromPinata() formats the URI correctly
    console.log("this is the metadataURL: ", metadataURL);

    // Prepare formParams and price
    const { price } = formParams;
    const {certificate} = formParams;
    
    const parsedPrice = ethers.parseUnits(price, 18);
    let listingPrice = await contract.getListPrice();
    listingPrice = listingPrice.toString();

    const customTokenContract = new ethers.Contract(CustomToken.address, CustomToken.abi, signer);
      const approvalTx = await customTokenContract.approve(MarketplaceJSON.address, parsedPrice);
      await approvalTx.wait();

    updateMessage("Listing the NFT... Please Wait (Up to 5 mins)");
    const fallbackGasLimit = 2000000; // Set a fallback gas limit

    // List the NFT for sale
    let transaction = await contract.sellNFT(tokenId, parsedPrice, {gasLimit: fallbackGasLimit});
    await transaction.wait();

    alert("You successfully listed the NFT for sale!");
    updateData(tokenId);
    //getNFTData(tokenId);
    console.log("this is the nft price: ", data.price);
    updateMessage("");
    updateFormParams({certificate:''});
    updateFormParams({price: '' });
    await getNFTData(tokenId);
    window.location.replace("/"); // Reload the page or update UI as needed
  } catch (e) {
    alert("Listing Error: " + e);
  }
}


async function cancelListing(tokenId) {
  try {
    const ethers = require("ethers");
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    let contract = new ethers.Contract(MarketplaceJSON.address, MarketplaceJSON.abi, signer);
    
    updateMessage("Canceling the listing... Please Wait (Up to 5 mins)");
    const fallbackGasLimit = 2000000; // Set a fallback gas limit

    let transaction = await contract.cancelList(tokenId, {gasLimit: fallbackGasLimit});
    await transaction.wait();

    alert("You successfully canceled the listing!");
    updateMessage("");
    window.location.reload();
  } catch (e) {
    alert("Cancel Listing Error: " + e);
  }
}

return (
  <div style={{ minHeight: "100vh" }}>
    <Navbar />
    <div className="flex ml-20 mt-20">
      <img src={data.image} alt="" className="w-2/5" />
      <div className="text-xl ml-20 space-y-8 text-white shadow-2xl rounded-lg border-2 p-5">
        <div>Name: {data.name}</div>
        <div>Description: {data.description}</div>
        <div>Price: <span className="">{data.price + " CARB"}</span></div>
        <div>Certificate: <span className="">{data.certificate + "link to follow the nft"}</span></div>
        <div>Owner: <span className="text-sm">{data.owner}</span></div>
        <div>Seller: <span className="text-sm">{data.seller}</span></div>
        <div>
          {currAddress !== data.owner && currAddress !== data.seller ? (
            <button
              className="enableEthereumButton bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded text-sm"
              onClick={() => buyNFT(tokenId)}
            >
              Buy this NFT
            </button>
          ) : (
            <>{data.currentlyListed ? (
              <div>
              <div className="text-white-700 mb-4">This NFT is already listed for sale</div>
              <button
                      className="enableEthereumButton bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded text-sm"
                      onClick={() => cancelListing(tokenId)}
                    >
                      Cancel Listing
                    </button>
              </div>
            ) : (
              <>
                <div className="text-white-700 mb-4">You are the owner of this NFT</div>
                <button
                  className="enableEthereumButton bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded text-sm"
                  onClick={() => setShowSellForm(true)}
                >
                  Sell this NFT
                </button>
                {showSellForm && (
       
       <form className="bg-white shadow-md rounded px-8 pt-4 pb-8 mb-4 mt-4" onSubmit={sellNFT}>
            <div className="mb-6">
                    <label className="block text-green-500 text-sm font-bold mb-2" htmlFor="price">Price (in CARB)</label>
                    <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" type="number" placeholder="1 CARB" step="1" value={formParams.price} onChange={e => updateFormParams({ ...formParams, price: e.target.value })}></input>
                  </div>
            <div>
            <button className="enableEthereumButton bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded text-sm">
                    List NFT for sale
                  </button>
              <button
                type="button"
                className="enableEthereumButton bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded text-sm"
                onClick={() => setShowSellForm(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        
      )}
              </>
            )}
            </>
          )}
          <div className="text-green text-center mt-3">{message}</div>
        </div>
      </div>
    </div>
    
  </div>
);
}
