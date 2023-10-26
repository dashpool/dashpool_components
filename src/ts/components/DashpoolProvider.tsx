// DashpoolContext.tsx
import React, { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react';
import { Toast } from 'primereact/toast';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';

type AppInfo = {
  name: string,
  group: string,
  url: string,
  icon: string
}

type FrameInfo = {
  name: string,
  id: string,
  icon: string,
  group: string,
  url: string
}

// Define the type for the shared data
type SharedData = {
  dragElement?: any,
  apps?: AppInfo[],
  frames?: FrameInfo[]
};

// Define the context type
interface DashpoolContextType {
  sharedData: SharedData;
  updateSharedData: (newData: SharedData) => void;
}

const DashpoolContext = createContext<DashpoolContextType | undefined>(undefined);

type DashpoolProviderProps = {
  /**
   * Unique ID to identify this component in Dash callbacks.
   */
  id: string;

  /**
  * Array of children
  */
  children: ReactNode[];

  /**
   * The last drag element
   */
  dragElement?: any;

  /**
   * The initial state for the user. Note! Not everything is reactive
   */
  initialData?: any;

  /**
   * the shared data
   */
  sharedData?: SharedData;

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
  const [sharedData, setSharedData] = useState<SharedData>({ ...props.initialData });
  const toast = useRef<Toast>(null);

  const updateSharedData = (newData: SharedData) => {
    const newSharedData = { ...sharedData, ...newData }
    if (props.setProps) {
      props.setProps({ sharedData: newSharedData });
    }
    setSharedData(newSharedData);
  };

  useEffect(() => {
    if (props.setProps) {
      props.setProps({ sharedData: sharedData });
    }
  }, [sharedData, props.initialData]);


  // /// LOGIN section
  const [showLoginModal, setShowLoginModal] = useState(false);

  const initLogin = () => {

    // Get the current URL
    const currentUrl = window.location.href;

    // Construct the URL for the OAuth2 proxy login
    const oauth2StartUrl = `/oauth2/start?rd=${encodeURIComponent(currentUrl)}`;

    // Define popup window options
    const popupWindowOptions = 'width=800,height=600,resizable=no,scrollbars=no';

    // Attempt to open a popup window for OAuth2 login
    const popupWindow = window.open(oauth2StartUrl, 'OAuth2 Login', popupWindowOptions);

    if (popupWindow) {

      // Handle errors gracefully, if necessary
      popupWindow.onerror = (error) => {
        console.error('OAuth2 popup error:', error);

        toast.current?.show({ severity: "error", summary: 'OAuth2 popup error', detail: error, life: 3000 });
      };

      popupWindow.addEventListener("message", (event) => {
        if (popupWindow.location.href === currentUrl) {
          popupWindow.close();
          setShowLoginModal(false);
        }
      });

      const intervalId = setInterval(function () {
        if (popupWindow && popupWindow.closed) {
          clearInterval(intervalId);
          popupWindow.close();
          setShowLoginModal(false);
        } else if (popupWindow && popupWindow.location.href === document.location.href) {
          clearInterval(intervalId);
          popupWindow.close();
          setShowLoginModal(false);
        }
      }, 100);


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

        if (messageData.status == 401) {
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
      <Toast ref={toast} position="bottom-right" style={{ zIndex: 5000 }} />

      <Dialog
        visible={showLoginModal}
        onHide={onHide}
        header="You are not authorized"
        modal={true}
        footer={
          <div>
            <Button onClick={initLogin} className="p-button-primary">OK</Button>
            <Button onClick={onHide} className="p-button-secondary">Cancel</Button>
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

export { useDashpoolData, FrameInfo, AppInfo };
export default DashpoolProvider;