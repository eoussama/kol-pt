import './App.scss';

import React, { useEffect } from 'react';
import { config } from './config/env';
import { initializeApp } from 'firebase/app';
import { get, getDatabase, ref } from 'firebase/database';



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

  useEffect(() => {
    const app = initializeApp(config);
    const database = getDatabase(app);

    get(ref(database, 'posts')).then(e => console.log(e.val()));
  }, []);

  return (
    <div>KOL Patreon Tracker</div>
  );
}

export default App;
