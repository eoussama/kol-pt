import './App.scss';

import React, { useEffect } from 'react';
import Feed from './components/pages/Feed';



function App() {
  useEffect(() => {

    chrome.tabs && chrome.tabs.query({
      active: true,
      currentWindow: true
    }, (tabs) => {
      chrome.tabs.sendMessage(
        // Current tab ID
        tabs[0].id || 0,

        // Message type
        { type: 'GET_DOM' } as any,

        // Callback executed when the content script sends a response
        (response: any) => {

        });
    });
  }, []);

  return (
    <>
      <div>KOL Patreon Tracker</div>
      <Feed />
    </>
  );
}

export default App;
