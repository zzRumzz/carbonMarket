import Navbar from "./Navbar";
import { useParams } from 'react-router-dom';
import MarketplaceJSON from "../Marketplace.json";
import axios from "axios";
import { useState, useEffect } from "react";
import NFTTile from "./NFTTile";
import { ethers } from 'ethers';

export default function Profile() {
    const [data, updateData] = useState([]);
    const [address, updateAddress] = useState("0x");
    const [totalPrice, updateTotalPrice] = useState("0");
    const [dataFetched, updateFetched] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const params = useParams();
    const tokenId = params.tokenId;

    useEffect(() => {
        if (!dataFetched) {
            getNFTData(tokenId);
        }
    }, [dataFetched, tokenId]);

    async function getNFTData(tokenId) {
        try {
            let sumPrice = 0;

            // After adding your Hardhat network to your metamask, this code will get providers and signers
            const provider = new ethers.BrowserProvider(window.ethereum);
            await provider.send("eth_requestAccounts", []);
            const signer = await provider.getSigner();

            const addr = await signer.getAddress();

            // Pull the deployed contract instance
            let contract = new ethers.Contract(MarketplaceJSON.address, MarketplaceJSON.abi, signer);

            // Create an NFT Token
            let transaction = await contract.getMyNFTs();
            const seen = new Set(); // To track seen tokens

            const items = await Promise.all(transaction.map(async (i) => {
                const tokenId = Number(i[0]);
                if (seen.has(tokenId)) return null; // Skip if already seen
                seen.add(tokenId); // Mark token as seen
                const tokenURI = await contract.tokenURI(tokenId);
                let meta = await axios.get(tokenURI);
                meta = meta.data;
                const priceBigInt = i[3];
                let price = ethers.formatUnits(priceBigInt.toString(), 'ether');
                let item = {
                    price,
                    tokenId: tokenId,
                    seller: i[2].seller,
                    owner: i[1].owner,
                    image: meta.image,
                    name: meta.name,
                    description: meta.description,
                };
                sumPrice += Number(price);
                return item;
            }));
            
            updateData(items.filter(item => item !== null));
            updateFetched(true);
            updateAddress(addr);
            updateTotalPrice(sumPrice.toPrecision(3));
        } catch (error) {
            console.error("Error fetching NFT data: ", error);
            if (error.code === -32002) {
                setErrorMessage("MetaMask request is already pending. Please check MetaMask.");
            } else {
                setErrorMessage("Failed to connect to MetaMask");
            }
        }
    }

    return (
        <div className="profileClass min-h-screen">
            <Navbar />
            <div className="profileClass">
                <div className="flex text-center flex-col mt-11 md:text-2xl text-white">
                    <div className="mb-5">
                        <h2 className="font-bold">Wallet Address</h2>  
                        {address}
                    </div>
                </div>
                <div className="flex flex-row text-center justify-center mt-10 md:text-2xl text-white">
                    <div>
                        <h2 className="font-bold">No. of NFTs</h2>
                        {data.length}
                    </div>
                    <div className="ml-20">
                        <h2 className="font-bold">Total Value</h2>
                        {totalPrice} CARB
                    </div>
                </div>
                <div className="flex flex-col text-center items-center mt-11 text-white">
                    <h2 className="font-bold">Your NFTs</h2>
                    <div className="flex justify-center flex-wrap max-w-screen-xl">
                        {data.map((value, index) => {
                            return <NFTTile data={value} key={index} />;
                        })}
                    </div>
                    <div className="mt-10 text-xl">
                        {data.length === 0 ? "Oops, No NFT data to display (Are you logged in?)" : ""}
                    </div>
                </div>
                {errorMessage && <div className="text-red-500 text-center mt-3">{errorMessage}</div>}
            </div>
        </div>
    );
}
