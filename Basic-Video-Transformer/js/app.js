import { MediaProcessorConnector } from '../node_modules/@vonage/media-processor/dist/media-processor.es.js';
import { WorkerMediaProcessor } from './worker-media-processor.js';
/* global OT API_KEY TOKEN SESSION_ID SAMPLE_SERVER_BASE_URL */
/* global MediaProcessorConnector */

let apiKey;
let sessionId;
let token;

const transformStream = async (publisher) => {
  const mediaProcessor = new WorkerMediaProcessor();
  const mediaProcessorConnector = new MediaProcessorConnector(mediaProcessor);

  if (OT.hasMediaProcessorSupport()) {
    publisher
      .setVideoMediaProcessorConnector(mediaProcessorConnector)
      .catch((e) => {
        console.error(e);
      });
  } else {
    console.log('Browser does not support media processors');
  }
};

const handleError = async (error) => {
  if (error) {
    console.error(error);
  }
};

const initializeSession = async () => {
  const session = OT.initSession(apiKey, sessionId);

  // Subscribe to a newly created stream
  session.on('streamCreated', (event) => {
    const subscriberOptions = {
      insertMode: 'append',
      width: '100%',
      height: '100%'
    };
    session.subscribe(
      event.stream,
      'subscriber',
      subscriberOptions,
      handleError
    );
  });

  // initialize the publisher
  const publisherOptions = {
    insertMode: 'append',
    width: '100%',
    height: '100%'
  };
  const publisher = await OT.initPublisher(
    'publisher',
    publisherOptions,
    (error) => {
      if (error) {
        console.warn(error);
      }
    }
  );

  // Connect to the session
  session.connect(token, async (error) => {
    if (error) {
      await handleError(error);
    } else {
      // If the connection is successful, publish the publisher to the session
      // and transform stream
      session.publish(publisher, () => transformStream(publisher));
    }
  });
};

// See the config.js file.
if (API_KEY && TOKEN && SESSION_ID) {
  apiKey = API_KEY;
  sessionId = SESSION_ID;
  token = TOKEN;
  initializeSession();
} else if (SAMPLE_SERVER_BASE_URL) {
  // Make an Ajax request to get the OpenTok API key, session ID, and token from the server
  fetch(SAMPLE_SERVER_BASE_URL + '/session')
    .then(function fetch(res) {
      return res.json();
    })
    .then(function fetchJson(json) {
      apiKey = json.apiKey;
      sessionId = json.sessionId;
      token = json.token;
    })
    .then(() => {
      initializeSession();
    })
    .catch(function catchErr(error) {
      handleError(error);
      alert('Failed to get opentok sessionId and token. Make sure you have updated the config.js file.');
    });
}
