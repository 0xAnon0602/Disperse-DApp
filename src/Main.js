import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Text , Textarea , Button} from '@chakra-ui/react';
import React, { useState } from 'react';
import Papa from "papaparse";
import './Main.css'

export const Main = () => {

	const [mainValue, setValue ] = useState("")
	const [inputError,setInputError]=useState("")
  const [file, setFile] = useState("");


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


  return (
    
    <div className='container'>

        <div className='buttonContainer' >
        
        <ConnectButton 
        chainStatus="icon"    
        showBalance={true} 
        />

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
        fontSize='xl'
        fontWeight='bold'
         >
        A dapp to airdrop tokens to multiple wallets
        </Text>

        </div>

        <div>

        <div className='textarea'>
        <Textarea 
        placeholder='Here is a sample placeholder' 
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



      
      </div>

        
        </div>

    </div>

  );
  };
  