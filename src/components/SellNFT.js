import Navbar from "./Navbar";
import { useState, useEffect } from "react";
import { uploadFileToIPFS, uploadJSONToIPFS } from "../pinata";
import Marketplace from '../Marketplace.json';
import { useLocation } from "react-router";
import { ethers } from "ethers";
import CustomToken from '../myToken.json'; // Import your custom token ABI and address

export default function SellNFT() {
    const [formParams, updateFormParams] = useState({ name: '', description: '', price: '' });
    const [fileURL, setFileURL] = useState(null);
    const [message, updateMessage] = useState('');
    const location = useLocation();

    // This function uploads the NFT image to IPFS
    async function OnChangeFile(e) {
        var file = e.target.files[0];
        // Check for file extension
        try {
            // Upload the file to IPFS
            disableButton();
            updateMessage("Uploading image.. please don't click anything!");
            const response = await uploadFileToIPFS(file);
            if (response.success === true) {
                enableButton();
                updateMessage("");
                console.log("Uploaded image to Pinata: ", response.pinataURL);
                setFileURL(response.pinataURL);
            }
        } catch (e) {
            console.log("Error during file upload", e);
        }
    }

    // This function uploads the metadata to IPFS
    async function uploadMetadataToIPFS() {
        const { name, description, price } = formParams;
        // Make sure that none of the fields are empty
        if (!name || !description || !price || !fileURL) {
            updateMessage("Please fill all the fields!");
            return -1;
        }

        const nftJSON = {
            name, description, price, image: fileURL
        }

        try {
            // Upload the metadata JSON to IPFS
            const response = await uploadJSONToIPFS(nftJSON);
            if (response.success === true) {
                console.log("Uploaded JSON to Pinata: ", response);
                return response.pinataURL;
            }
        } catch (e) {
            console.log("Error uploading JSON metadata:", e);
        }
    }

    // This function lists the NFT
    async function listNFT(e) {    
        e.preventDefault();

        // Upload data to IPFS
        try {
            const metadataURL = await uploadMetadataToIPFS();
            if (metadataURL === -1) return;

            // After adding your Hardhat network to your MetaMask, this code will get providers and signers
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            disableButton();
            updateMessage("Uploading NFT (takes 5 mins).. please don't click anything!");

            // Pull the deployed contract instance
            let contract = new ethers.Contract(Marketplace.address, Marketplace.abi, signer);

            // Convert price to the custom token's smallest unit (assuming 18 decimals)
            const price = ethers.parseUnits(formParams.price, 18);

            // Approve the marketplace contract to spend the custom tokens
            const customTokenContract = new ethers.Contract(CustomToken.address, CustomToken.abi, signer);
            const approvalTx = await customTokenContract.approve(Marketplace.address, price);
            await approvalTx.wait();

            // Actually create the NFT
            let transaction = await contract.createToken(metadataURL, price);
            await transaction.wait();

            alert("Successfully listed your NFT!");
            enableButton();
            updateMessage("");
            updateFormParams({ name: '', description: '', price: '' });
            window.location.replace("/");
        } catch (e) {
            alert("Upload error" + e);
        }
    }

    async function disableButton() {
        const listButton = document.getElementById("list-button");
        listButton.disabled = true;
        listButton.style.backgroundColor = "grey";
        listButton.style.opacity = 0.3;
    }

    async function enableButton() {
        const listButton = document.getElementById("list-button");
        listButton.disabled = false;
        listButton.style.backgroundColor = "#A500FF";
        listButton.style.opacity = 1;
    }

    return (
        <div className="">
            <Navbar></Navbar>
            <div className="flex flex-col place-items-center mt-10" id="nftForm">
                <form className="bg-white shadow-md rounded px-8 pt-4 pb-8 mb-4">
                    <h3 className="text-center font-bold text-green-500 mb-8">Upload your NFT to the marketplace</h3>
                    <div className="mb-4">
                        <label className="block text-green-500 text-sm font-bold mb-2" htmlFor="name">NFT Name</label>
                        <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="name" type="text" placeholder="Axie#4563" onChange={e => updateFormParams({ ...formParams, name: e.target.value })} value={formParams.name}></input>
                    </div>
                    <div className="mb-6">
                        <label className="block text-green-500 text-sm font-bold mb-2" htmlFor="description">NFT Description</label>
                        <textarea className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" cols="40" rows="5" id="description" type="text" placeholder="Axie Infinity Collection" value={formParams.description} onChange={e => updateFormParams({ ...formParams, description: e.target.value })}></textarea>
                    </div>
                    <div className="mb-6">
                        <label className="block text-green-500 text-sm font-bold mb-2" htmlFor="price">Price (in CARB)</label>
                        <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" type="number" placeholder="Min 1" step="1" value={formParams.price} onChange={e => updateFormParams({ ...formParams, price: e.target.value })}></input>
                    </div>
                    <div>
                        <label className="block text-green-500 text-sm font-bold mb-2" htmlFor="image">Upload Image (&lt;500 KB)</label>
                        <input type={"file"} onChange={OnChangeFile}></input>
                    </div>
                    <br></br>
                    <div className="text-red-500 text-center">{message}</div>
                    <button onClick={listNFT} className="font-bold mt-10 w-full bg-green-500 text-white rounded p-2 shadow-lg" id="list-button">
                        List NFT
                    </button>
                </form>
            </div>
        </div>
    );
}
