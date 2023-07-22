import { useMemo, useState } from "react";
import {
  useContractWrite,
  useContractReads,
  usePrepareContractWrite,
} from "wagmi";
import { useAccount } from "wagmi";
import { usePrepareZoraDropPurchase, zoraDropABI } from "../wagmi/generated";
import { Address, formatEther } from "viem";

export function MintZORANFT({ address }: { address: Address }) {
  const { isConnected } = useAccount();

  const [quantity, setQuantity] = useState(BigInt(1)); // quantity is a BigNumber from the start

  const inputStyle: React.CSSProperties = {
    border: 'none',
    borderRadius: '20px',
    padding: '10px',
    boxShadow: '0 2px 5px rgba(0, 0, 0, 0.3)',
    backgroundImage: 'linear-gradient(to bottom, #f8f8f8, #e1e1e1)',
    background: "black",
    color: "white",
    outline: 'none',
    transition: 'box-shadow 0.3s ease-in-out',
    width: '100px',    
  };

  const mintStyle: React.CSSProperties = {
    border: 'none',
    borderRadius: '20px',
    padding: '10px',
    boxShadow: '0 2px 5px rgba(0, 0, 0, 0.3)',
    backgroundImage: 'linear-gradient(to bottom, #f8f8f8, #e1e1e1)',
    background: "black",
    color: "white",
    outline: 'none',
    transition: 'box-shadow 0.3s ease-in-out',
    width: '600px',
    height: '50px',
    fontSize: '1em',    
  };

  const divStyle: React.CSSProperties = {
    marginTop: "10px", // Add margin at the top to create new lines
    marginBottom: "10px", // Add margin at the bottom to create new lines
    color: "white",
    fontWeight: 'bold',
    textShadow: '1px 1px 2px black',
    fontSize: '18px'
  };

  const soldOutStyle: React.CSSProperties = {
    marginTop: "10px", // Add margin at the top to create new lines
    marginBottom: "10px", // Add margin at the bottom to create new lines
    color: "red",
    fontWeight: 'bold',
    textShadow: '1px 1px 2px black',
    fontSize: '24px'
  };


  const headerStyle: React.CSSProperties = {
    marginTop: "10px", // Add margin at the top to create new lines
    marginBottom: "10px", // Add margin at the bottom to create new lines
    color: "white",
    fontWeight: 'bold',
    textShadow: '1px 1px 2px black',
    fontSize: '34px'
  };

  const header2Style: React.CSSProperties = {
    marginTop: "10px", // Add margin at the top to create new lines
    marginBottom: "10px", // Add margin at the bottom to create new lines
    color: "white",
    fontWeight: 'bold',
    textShadow: '1px 1px 2px black',
    fontSize: '24px'
  };
  // onChange handler for the input
  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuantity = BigInt(e.target.value);
    setQuantity(newQuantity);
  };

  const { data: mintData, isLoading: dataIsLoading } = useContractReads({
    allowFailure: false,
    contracts: [
      {
        abi: zoraDropABI,
        address,
        functionName: "saleDetails",
      },
      {
        abi: zoraDropABI,
        address,
        functionName: "zoraFeeForAmount",
        args: [BigInt(1)],
      },
      {
        abi: zoraDropABI,
        address,
        functionName: "name",
      },
    ],
  });

  const [salesConfig, zoraFee, name] = useMemo(() => {
    if (!mintData) {
      return new Array(3).map(() => undefined);
    }
    return mintData;
  }, [mintData]);

  const [mintPrice, zoraFeeAmount, mintPriceWithFee] = useMemo(() => {
    if (!salesConfig || !zoraFee) {
      return [BigInt(0), BigInt(0), BigInt(0)];
    }
    return [
      salesConfig?.publicSalePrice,
      zoraFee[1],
      salesConfig?.publicSalePrice + zoraFee[1],
    ];
  }, [mintData, zoraFee, salesConfig]);

  const { config: preparedZoraDropPurchaseConfig, error: prepareError } =
    usePrepareContractWrite({
      address,
      functionName: "purchase",
      abi: zoraDropABI,
      enabled: !!salesConfig,
      args: [quantity],
      value: mintPriceWithFee * quantity,
    });

  const {
    write: preparedZoraDropPurchaseWrite,
    isLoading: mintIsLoading,
    error: mintError,
  } = useContractWrite(preparedZoraDropPurchaseConfig);

  if (dataIsLoading) {
    return (
      <div className="flex items-center justify-center">
        <h3>loading...</h3>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-screen pb-48">
      <div style={{ textAlign: "center" }}>
      <h1 style={headerStyle}>{name} </h1>
        <p></p>
        <p></p>
        <h2 style={header2Style}>Price: {mintPrice ? formatEther(mintPrice) : '...'} ETH Per Mint</h2>
        <div style={divStyle}>Mint Amount:</div>
        <input
          type="number"
          value={quantity.toString()}
          onChange={handleQuantityChange}
          name=""
          style={inputStyle} // Apply inline style here
        />
        
        <div style={divStyle}>
          Total price:{" "}
          {mintPriceWithFee ? formatEther(mintPriceWithFee * quantity) : `...`}{" "} eth + gas
          </div>
        
        <div style={divStyle}>
        {salesConfig?.totalMinted.toString() || "..."} / {salesConfig?.maxSupply.toString() || "..."} Minted
        </div>
        {mintError && (
          <div style={soldOutStyle}>
            {(mintError as any)?.shortMessage || mintError.toString()}
          </div>
        )}
        {prepareError && (
          <div style={soldOutStyle}>
            {(prepareError as any)?.shortMessage || prepareError.message}
          </div>
        )}
        
        {isConnected && <button style={mintStyle}
          disabled={!!(mintError || mintIsLoading)}
          onClick={() => preparedZoraDropPurchaseWrite?.()}
          className={`border-[2px] border-black px-3 py-1 rounded hover:bg-black hover:text-white ${
            !isConnected ? "cursor-not-allowed" : ""
          }`}
        
        > Mint

        </button>
        }
        <p></p>
          <p></p>
          <a style={divStyle} href="https://twitter.com/feltzine">FELT ZINE TWITTER </a>
          <p></p>
          <p></p>
          <a style={divStyle} href="https://www.feltzine.art/">HOME </a>        
      </div>
    </div>
  );
}
