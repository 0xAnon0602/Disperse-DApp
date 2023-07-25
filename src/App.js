import { Main } from './Main.js';
import { ChakraProvider } from '@chakra-ui/react'
import { ToastContainer} from 'react-toastify';


const App = () => {
  return (
    <ChakraProvider>
        <Main />
        <ToastContainer />
    </ChakraProvider>

  );
};

export default App;
