import Navbar from "./Navbar";
import NFTTile from "./NFTTile";
import MarketplaceJSON from "../Marketplace.json";
import axios from "axios";
import { useState, useEffect } from "react";
import { GetIpfsUrlFromPinata } from "../utils";
import { ethers } from 'ethers';

export default function Marketplace() {
  const sampleData = [];
  const [data, updateData] = useState(sampleData);
  const [dataFetched, updateFetched] = useState(false);
  const [currentAddress, setCurrentAddress] = useState("");

  async function getAllNFTs() {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      setCurrentAddress(address);
      console.log("Current Address:", address);

      const contract = new ethers.Contract(MarketplaceJSON.address, MarketplaceJSON.abi, signer);
      const transaction = await contract.getAllNFTs();
      console.log("Transaction:", transaction);

      const items = await Promise.all(transaction.map(async (item) => {
        try {
          const tokenId = Number(item[0]);
          console.log(`Processing Token ID: ${tokenId}`);

          const tokenURI = await contract.tokenURI(tokenId);
          console.log(`Token URI for Token ID ${tokenId}: ${tokenURI}`);

          const metaResponse = await axios.get(GetIpfsUrlFromPinata(tokenURI));
          const meta = metaResponse.data;
          console.log(`Metadata for Token ID ${tokenId}:`, meta);

          const price = ethers.formatUnits(item[3].toString(), 'ether');
          const owner = await contract.ownerOf(tokenId);
          console.log(`Owner for Token ID ${tokenId}: ${owner}`);

          return {
            tokenId,
            price,
            seller: item[2],
            owner,
            image: meta.image,
            name: meta.name,
            description: meta.description,
          };
        } catch (error) {
          console.error(`Error processing Token ID ${item[0]}:`, error);
          return null;
        }
      }));

      console.log("All Items:", items);
      console.log("this is the marketplace address: ", contract.target);

      // Filter out null items
      
      const filteredItems = items.filter(item =>item !== null &&  item.owner ===  contract.target);
                               
      console.log("Filtered Items:", filteredItems);

      updateData(filteredItems);
      updateFetched(true);

    } catch (error) {
      console.error("Error fetching NFTs:", error);
    }
  }

  useEffect(() => {
    if (!dataFetched) {
      getAllNFTs();
    }
  }, [dataFetched]);

  const handleNFTBought = (tokenId) => {
    const newData = data.filter(item => item.tokenId !== tokenId);
    updateData(newData);
  };

  return (
    <div>
      <Navbar />
      <div className="flex flex-col place-items-center mt-20">
        <div className="md:text-xl font-bold text-white">
          Top NFTs
        </div>
        <div className="flex mt-5 justify-between flex-wrap max-w-screen-xl text-center">
          {data.length > 0 ? (
            data.map((value, index) => (
              <NFTTile data={value} key={index} onNFTBought={handleNFTBought} />
            ))
          ) : (
            <div className="text-white">No NFTs available</div>
          )}
        </div>
      </div>
    </div>
  );
}
