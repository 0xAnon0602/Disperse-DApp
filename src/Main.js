import { Text , Textarea , Button, Spinner} from '@chakra-ui/react';
import React, { useState } from 'react';
import Papa from "papaparse";
import fromExponential from 'from-exponential';
import {ethers} from 'ethers'
import './Main.css'
import {toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import web3 from 'web3'

export const Main = () => {


	const [mainValue, setValue ] = useState("")
	const [inputError,setInputError]=useState("")
  const [file, setFile] = useState("");
  const [isSending,setIsSending]= useState(false)

  const contract = {
    "abi":[{
      "constant": false,
      "inputs": [
        {
          "name": "recipients",
          "type": "address[]"
        },
        {
          "name": "values",
          "type": "uint256[]"
        }
      ],
      "name": "airdropNative",
      "outputs": [],
      "payable": true,
      "stateMutability": "payable",
      "type": "function"
    }],
    "address":"0xf77ce462b55fc9addf82104adfe0994e61bc2ff7"
  }

  const { ethereum } = window;
  const provider = new ethers.providers.Web3Provider(window.ethereum);


  const abi = contract.abi
  const contractAddress = contract.address
  const chainId = 5

  const [accountAddress, setAccountAddress] = useState('');
  const [accountBalance, setAccountBalance] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  const connectWallet = async () => {

    console.log(window.ethereum.networkVersion)

    if ( parseInt(window.ethereum.networkVersion) !== chainId) {
      await changeNetwork()
    }

    try {
      const accounts = await ethereum.request({
        method: 'eth_requestAccounts',
      });
      let balance = await provider.getBalance(accounts[0]);
      let bal = ethers.utils.formatEther(balance);
      setAccountAddress(accounts[0]);
      setAccountBalance(bal);
      setIsConnected(true);

      } catch (error) {
      setIsConnected(false);
    }
  };

  const changeNetwork = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: web3.utils.toHex(chainId) }]
      });
    } catch (err) {
        // This error code indicates that the chain has not been added to MetaMask
      if (err.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainName: 'Goerli Testnet',
              chainId: web3.utils.toHex(chainId),
              nativeCurrency: { name: 'ETH', decimals: 18, symbol: 'ETH' },
              rpcUrls: ['https://goerli.etherscan.io/']
            }
          ]
        });
      }
    }

    toast.success('Changed network to Goerli Testnet!', {
      position: "top-center",
      autoClose: 4000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "light",
      });
  }


	const toSimplifyInput = async (inputString) => {

		var allAddress=[]
		var allValue=[]

		var address=''
		var value=''
		
		var valueStatus=false

		for(var letter of inputString){


			if(letter!=='\n'){

			if(letter!==',' && !valueStatus){
				address+=letter
			}
			else if(valueStatus){
				value+=letter
			}

			if(letter===','){
				valueStatus=true
			}
	
			}else{
				// console.log(address,value)
				allAddress.push(address)
				allValue.push(parseFloat(value))
				address=''
				value=''
				valueStatus=false
			}

		}


		if(address!==''&&value!==''){
			allAddress.push(address)
			allValue.push(parseFloat(value))
			address=''
			value=''

		}

		return {allAddress,allValue}

	};

  const handleFileChange = (e) => {
    setInputError("");
     
    // Check if user has entered the file
    if (e.target.files.length) {
        const inputFile = e.target.files[0];
         
        // Check the file extensions, if it not
        // included in the allowed extensions
        // we show the error
        const fileExtension = inputFile?.type.split("/")[1];
        const allowedExtensions=['csv']
        if (!allowedExtensions.includes(fileExtension)) {
            setInputError("Please input a csv file");
            return;
        }

        // If input type is correct set the state
        setFile(inputFile);
    }
  };

  const handleParse = () => {
      
    if (!file) return setInputError("Enter a valid file");

    const reader = new FileReader();
      
    reader.onload = async ({ target }) => {
        const csv = Papa.parse(target.result, { header: true });
        const parsedData = csv?.data;
  var keys = Object.keys(parsedData[0])
  var finalData=''
  finalData += keys[1] + ','
  finalData += keys[0]
  for(var inputs of parsedData){
    finalData += '\n'
    finalData += inputs[keys[1]] + ','
    finalData += inputs[keys[0]]
  }
  console.log(finalData)
        const columns = finalData
        setValue(columns);
    };
    reader.readAsText(file);
  };


  const searchFunc = async () => {

		var result = toSimplifyInput(mainValue)
		var Addresses=(await result).allAddress
		var Values=(await result).allValue
		var toSend=0
		var finalValues=[]
		var finalAddresses=[]

		for(var z of Values){
			toSend+=parseFloat(z)
			finalValues.push(ethers.BigNumber.from(String(fromExponential(parseFloat(z)*10**18))))
		}

		toSend = fromExponential((toSend)*10**18)
    console.log(toSend/10**18,accountBalance)

		if(toSend/10**18>accountBalance){
			setInputError('Not enough balance')
		}

		for(var x of Addresses){
      try{
      var tempAdd = ethers.utils.getAddress(x)
		  }catch(e){
        setInputError("Not valid addresses provided!")
      }
      finalAddresses.push(tempAdd)

	}

		console.log(finalAddresses)
		console.log(finalValues)
		console.log(toSend/10**18)
		return {finalAddresses,finalValues,toSend}
	}

	const mainFunc = async () => {
		setInputError('')
		// setSubmitStatus(true)
		var results = await searchFunc()
		var finalAddressesToSend = results.finalAddresses
		var finalValuesToSend = results.finalValues
		var _toSend = results.toSend
    

    if(finalAddressesToSend.length===finalValuesToSend.length && finalAddressesToSend.length!==0 && finalValuesToSend.length!==0 && inputError===''){



      const provider = new ethers.providers.Web3Provider(ethereum)
      const signer = provider.getSigner()
      const tempContract = new ethers.Contract(contractAddress,abi,signer)
      const tx = await tempContract.airdropNative(finalAddressesToSend,finalValuesToSend,{ value: _toSend })
      setIsSending(true)

      toast.success('Waiting for the transaction to get confirmed!', {
        position: "top-center",
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
        });


      try{
      await tx.wait()	
      toast.success('Transaction went through successfully!', {
        position: "top-center",
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
        });
      setIsSending(false)

      }catch(e){
        console.log(e)
        toast.error('Something Went Wrong!', {
          position: "top-center",
          autoClose: 4000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
          });
      setIsSending(false)

      }

    }else{
      toast.error(inputError, {
        position: "top-center",
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
        });
    }

	}


  return (
    
    <div className='container'>
      

        <div className='buttonContainer' >
      
      {isConnected ? (
            <>
            <Button className='xyz' colorScheme='green' size='sm' onClick={connectWallet}>Connected as {accountAddress.slice(0, 4)}...{accountAddress.slice(38, 42)}</Button>
          </>):
        (
          <>
      <Button className='xyz' colorScheme='green' size='sm' onClick={connectWallet}>Connect</Button>
          </>
        )
        }
        </div>
        
        <div  className='main'>
        <Text
        bgGradient='linear(to-l, #39FF14, #0D7377)'
        bgColor='black'
        bgClip='text'
        fontSize='7xl'
        fontWeight='extrabold'
         >
        Token Airdrop Dapp
        </Text>

        <Text
        bgGradient='linear(to-l, #39FF13, #0D7377)'
        bgColor='black'
        bgClip='text'
        fontSize='3xl'
        fontWeight='bold'
         >
        A dapp to airdrop tokens to multiple wallets
        </Text>

        <Text
        bgGradient='linear(to-l, #39FF13, #0D7377)'
        bgColor='black'
        bgClip='text'
        fontSize='s'
        fontWeight='bold'
         >
        Input the addresses and amounts like the given below example
        </Text>

        </div>

        <div>

        <div className='textarea'>
        
        <Textarea 
        placeholder='0xBE4ca24f9c2cEF343e00F50CB99cD0539104BCeD,250
        0x0e7c2692b8e123b2030515a1d45886f9ac37e84c,500' 
        onChange={e => {
          setValue(e.target.value)
        }}
        value={mainValue} 
        />

      <div className='secondButton'>
        <input
						onChange={handleFileChange}
						id="csvInput"
						name="file"
						type="File"
				/>
            

      <Button className='thirdButton' colorScheme='green' size='sm' onClick={handleParse}>Parse data from file</Button>


      </div>

      {!isSending ? (
        <>
      <Button className='fourthButton' colorScheme='green' size='md' onClick={mainFunc}>Sumbit</Button>
        </>
      ):(
        <>
        <Spinner
      className='fourthButton'
      thickness='4px'
      speed='0.65s'
      emptyColor='gray.200'
      color='#1B9F58'
      size='xl'
      />
        </>
      )}

      </div>

        </div>

    </div>

  );
  };
  