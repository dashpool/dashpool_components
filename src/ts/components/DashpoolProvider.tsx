// DashpoolContext.tsx
import React, { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react';
import { Toast } from 'primereact/toast';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';
import { DashpoolEvent, setDashpoolEvent } from '../helper';

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

type UserGroup = {
  name: string,
  id: string
}

// Define the type for the shared data
type SharedData = {
  dragElement?: any,
  apps?: AppInfo[],
  frames?: FrameInfo[],
  activeFrame?: any,
  users?: string[],
  groups?: UserGroup[]
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
    * widget events
    */
  widgetEvent?: any;

  /**
   * latest Dashpool Event
   */
  dashpoolEvent?: DashpoolEvent

  /**
   * require login
   */
  requireLogin?: boolean;

  /**
   * default reload after login
   */
  defaultReload?: boolean;

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
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [wasLoggedIn, setWasLoggedIn] = useState(false);

  let lastWidgetEventTimestamp = useRef(0);

  useEffect(() => {

    if (props.initialData && typeof props.initialData === 'object') {
      const newData = props.initialData;

      if ('email' in newData && Array.isArray(newData.apps) && (newData.apps.length === 0)) {
        setWasLoggedIn(true);
        setTimeout(() => {
          window.location.reload();
        }, 500);
      }
    }

    setSharedData(props.initialData);
  }, [props.initialData])

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


  useEffect(() => {

    if (props.widgetEvent && props.widgetEvent.timestamp > lastWidgetEventTimestamp.current) {


      lastWidgetEventTimestamp.current = props.widgetEvent.timestamp;
      if (props.widgetEvent && props.widgetEvent.type === 'lumino:deleted') {
        const updatedFrames = sharedData.frames.filter(frame => frame.id !== props.widgetEvent.id);
        const isCurrentFrameDeleted = sharedData.activeFrame && sharedData.activeFrame.id === props.widgetEvent.id;

        updateSharedData({
          frames: updatedFrames,
          activeFrame: isCurrentFrameDeleted ? {} : sharedData.activeFrame,
        });
      } else if (props.widgetEvent && props.widgetEvent.type === 'lumino:activated') {
        const activatedFrame = sharedData.frames.find(frame => frame.id === props.widgetEvent.id);
        if (activatedFrame) {
          updateSharedData({
            activeFrame: activatedFrame
          });
        }
      }
    }
  }, [sharedData, props.widgetEvent]);


  // /// LOGIN section


  const [reloadPageAfterLogin, setReloadPageAfterLogin] = useState(props.defaultReload ?? true);

  const initLogin = () => {

    // Get the current URL
    const currentUrl = window.location.href;

    // remove subpath from the url
    const url = new URL(currentUrl);

    // Use only the pathname + search + hash (relative URL part)
    const relativePath = url.pathname + url.search + url.hash;

    // Construct the URL for the OAuth2 proxy login
    const oauth2StartUrl = `/oauth2/start?rd=${encodeURIComponent(relativePath)}`;

    // Define popup window options
    const popupWindowOptions = 'width=800,height=600,resizable=no,scrollbars=no';

    // Attempt to open a popup window for OAuth2 login
    const popupWindow = window.open(oauth2StartUrl, 'OAuth2 Login', popupWindowOptions);

    if (popupWindow) {

      console.log('OAuth2 popup opened:', popupWindow);

      // Handle errors gracefully, if necessary
      popupWindow.onerror = (error) => {
        console.error('OAuth2 popup error:', error);
        toast.current?.show({ severity: "error", summary: 'OAuth2 popup error', detail: error, life: 3000 });
      };

      popupWindow.addEventListener("message", (event) => {

        //print the event
        console.log('Popup message received:', event);

        try {
          const popupUrl = new URL(popupWindow.location.href);

          if (popupUrl.origin === url.origin && (
            popupUrl.pathname.replace(/\/$/, '') === url.pathname.replace(/\/$/, '')
            || popupUrl.pathname === '/oauth2/callback' // Handle the OAuth2 callback path
          )
          ) {
            popupWindow.close();
            setShowLoginModal(false);
            if (reloadPageAfterLogin) {
              window.location.reload();
            }
          }

        } catch (e) {
          console.warn('Popup window location parse failed:', e);
        }          
      });

      const intervalId = setInterval(function () {
        // check the location of the popup window
        // If the popup window is closed, clear the interval and hide the login modal
        try {
          console.log('Checking popup window:', popupWindow, popupWindow.location);

        } catch (e) {
          console.warn('Error accessing popup window:', e);
        }

        try {
          if (popupWindow && popupWindow.closed) {
            clearInterval(intervalId);
            setShowLoginModal(false);
          } else if (popupWindow) {

            console.log('Checking popup window location:', popupWindow.location.href);

            try {
              if (popupWindow.location.hostname === window.location.hostname) {
                clearInterval(intervalId);
                popupWindow.close();
                setShowLoginModal(false);
                if (reloadPageAfterLogin) {
                  window.location.reload();
                }
              }
            } catch (e) {
              console.warn('Popup window location check failed:', e);
            }



          }
        } catch (error) {
          console.error('Error checking popup window:', error);
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

      if ('dashpoolEvent' in messageData) {
        const dashpoolEvent = messageData.dashpoolEvent;
        const { type, data } = dashpoolEvent;
        setDashpoolEvent(type, data, props.setProps);
      }

      // Check if the message has the type "fetchError"
      if (messageData.type === 'fetchError') {
        // Show PrimeReact Toast with the message

        if (messageData.status == 401) {
          setShowLoginModal(true);
        }

        toast.current?.show({
          severity: "warn",
          summary: messageData.message || 'Fetch Error',
          detail: messageData.url || '',
          life: 3000
        });

      }
    };

    if (props.requireLogin) {
      // check if the user is logged in
      const userinfourl = `/oauth2/userinfo`;
      // fetch the userinfo and then use it to update the shared data
      fetch(
        userinfourl, {
        credentials: 'include',
        headers: { 'Accept': 'application/json' }
      }
      )
        .then((response) => {
          if (response.status === 401) {
            setShowLoginModal(true);
          } else if (response.ok) {
            return response.json();
          }
        })
        .then((data) => {

          if (data) {
            const new_data = {
              ...sharedData,
              ...data
            }
            updateSharedData(new_data);
            setWasLoggedIn(true);
          }
        })
        .catch((error) => {
          console.error('Error:', error);
        });

    }

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
      <DashpoolContext.Provider value={{ sharedData, updateSharedData }} >
        {children}
      </DashpoolContext.Provider>

      {/* PrimeReact Toast */}
      <Toast ref={toast} position="bottom-right" style={{ zIndex: 5000 }} />

      <Dialog
        visible={showLoginModal}
        onHide={() => { }}
        header="You are not logged in!"
        modal={true}
        closable={false}

        footer={
          <div style={{ marginRight: "-8px" }}>
            {wasLoggedIn && <Button onClick={onHide} className="p-button-secondary">Cancel</Button>}
            <Button onClick={() => initLogin()} className="p-button-primary">OK</Button>
          </div>
        }
        className='login-dialog'
      >
        Click OK to start the login with Azure AD.<br />
        A popup window will appear to create a login request.<br />
        <div className='mt-2 p-2'>
          <Checkbox
            inputId="reloadCheckbox"
            checked={reloadPageAfterLogin}
            onChange={(e) => setReloadPageAfterLogin(e.checked)}
          />
          <label htmlFor="reloadCheckbox">&nbsp;Reload after login</label>
        </div>
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


DashpoolProvider.defaultProps = {
  requireLogin: true,
  defaultReload: true,
};

export { useDashpoolData, FrameInfo, AppInfo };
export default DashpoolProvider;