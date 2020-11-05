import logo from './logo.svg';
import LoadButton from './components/LoadButton';
import DownloadButton from './components/DownloadButton';
import PasswordsManager, { DUMP_METADATAS_COMMAND, LOAD_METADATAS_COMMAND } from "./controller/PasswordsManager.js";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

function ask_device(device_handler, request, args = {}) {
  return new Promise(async (resolve) => {
    let result = null;
    try {
      if (!device_handler.connected) {
        await device_handler.connect();
      }
      toast.info("Approve action on your device ✨", { autoClose: false });
      result = await device_handler.dispatchRequest(request, args);

      toast.dismiss();
      toast.success("Success ✅");
    }
    catch (error) {
      device_handler.disconnect()
      toast.dismiss();
      toast.error(`${error.toString()} 🙅`);
    }
    finally {
      resolve(result);
    }
  });
}

function App() {
  const passwordsManager = new PasswordsManager()
  return (
    <div className="App">
      <ToastContainer hideProgressBar={true} />
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <div className="Commands">
          <DownloadButton text="Backup" color="#41ccb4" onClick={() => ask_device(passwordsManager, DUMP_METADATAS_COMMAND)} />
          <LoadButton text="Restore" color="#FFB86D" onClick={(metadatas) => ask_device(passwordsManager, LOAD_METADATAS_COMMAND, metadatas)} />
        </div>
        <p>
          Here is a little blob to explain how to use this website to backup and restore you password app.
        </p>
      </header>
    </div>
  );
}

export default App;
