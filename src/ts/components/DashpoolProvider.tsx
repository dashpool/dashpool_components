// DashpoolContext.tsx
import React, { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react';
import { Toast } from 'primereact/toast';
import { Dialog } from 'primereact/dialog';

type AppInfo = {
  id: string,
  url: string,
  icon: string
}

// Define the type for the shared data
type SharedData = {
  dragElement?: any,
  apps?: AppInfo[]
};

// Define the context type
interface DashpoolContextType {
  sharedData: SharedData;
  updateSharedData: (newData: SharedData) => void;
}

const DashpoolContext = createContext<DashpoolContextType | undefined>(undefined);

type DashpoolProviderProps = {
  /**
  * Array of children
  */
  children: ReactNode[];

  /**
   * The last drag element
   */
  dragElement?: any;

  /**
   * Update props to trigger callbacks.
   */
  setProps?: (props: Record<string, any>) => void;
}

/**
 * Context provider for easy interaction between Dashpool components
 */
const DashpoolProvider = (props: DashpoolProviderProps) => {
  const { children } = props;
  const [sharedData, setSharedData] = useState<SharedData>({});
  const toast = useRef<Toast>(null);

  const updateSharedData = (newData: SharedData) => {
    setSharedData({ ...sharedData, ...newData });
  };


  // /// LOGIN section
  const [showLoginModal, setShowLoginModal] = useState(false);

  const initLogin = () => {
    // Get the current URL
    const currentUrl = window.location.href;

    // Construct the URL for the OAuth2 proxy login
    const oauth2StartUrl = `/oauth2/start?rd=${encodeURIComponent(currentUrl)}`;

    // Attempt to open a popup window for OAuth2 login
    const popupWindow = window.open(oauth2StartUrl, 'OAuth2 Login', 'width=600,height=400');

    if (popupWindow) {
      // Add an event listener to handle when the popup window is closed
      popupWindow.addEventListener('beforeunload', () => {
        setShowLoginModal(false);
      });
    } else {
      // If the browser blocks the popup, perform a redirect instead
      window.location.href = oauth2StartUrl;
    }
  }


  const onHide = () => {
    setShowLoginModal(false);
  };
  // //END Login section




  useEffect(() => {
    // Add event listener for the message event
    const messageEventListener = (event: MessageEvent) => {
      const messageData = event.data;

      // Check if the message has the type "fetchError"
      if (messageData.type === 'fetchError') {
        // Show PrimeReact Toast with the message

        if (messageData.staus == 401) {
          setShowLoginModal(true);
        }

        toast.current?.show({ severity: "warn", summary: messageData.message, detail: messageData.url, life: 3000 });
      }
    };

    navigator.serviceWorker.addEventListener('message', messageEventListener);
    window.addEventListener('message', messageEventListener);

    // Clean up the event listener when the component unmounts
    return () => {
      navigator.serviceWorker.removeEventListener('message', messageEventListener);
      window.removeEventListener('message', messageEventListener);
    };
  }, []); // Empty dependency array means this effect runs once on component mount

  return (
    <div>
      {/* Your other content here */}
      <DashpoolContext.Provider value={{ sharedData, updateSharedData }}>
        {children}
      </DashpoolContext.Provider>

      {/* PrimeReact Toast */}
      <Toast ref={toast} position="bottom-right" />

      <Dialog
        visible={showLoginModal}
        onHide={onHide}
        header="You are not authorized"
        modal={true}
        footer={
          <div>
            <button onClick={initLogin}>OK</button>
            <button onClick={onHide}>Cancel</button>
          </div>
        }
      >
        Do you want to log in?
      </Dialog> 

    </div>
  );
};

const useDashpoolData = (): DashpoolContextType => {
  const context = useContext(DashpoolContext);
  if (context === undefined) {
    throw new Error('useDashpoolData must be used within a DashpoolProvider');
  }
  return context;
};


DashpoolProvider.defaultProps = {};

export { useDashpoolData };
export default DashpoolProvider;