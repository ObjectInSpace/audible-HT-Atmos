(() => {
  const APP_ID = '111463A9';
  const status = document.getElementById('status');
  const castButton = document.getElementById('castButton');
  const stopButton = document.getElementById('stopButton');

  function setStatus(message) {
    status.textContent = message;
  }

  function describeSession(session) {
    if (!session) return 'No active Cast session.';
    const deviceName = session.getCastDevice?.().friendlyName;
    return deviceName ? `Connected to ${deviceName}.` : 'Cast session connected.';
  }

  window.__onGCastApiAvailable = function(isAvailable) {
    if (!isAvailable) {
      setStatus('Google Cast is not available in this browser.');
      return;
    }

    try {
      const context = cast.framework.CastContext.getInstance();
      context.setOptions({
        receiverApplicationId: APP_ID,
        autoJoinPolicy: chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED
      });

      context.addEventListener(
        cast.framework.CastContextEventType.SESSION_STATE_CHANGED,
        event => {
          switch (event.sessionState) {
            case cast.framework.SessionState.SESSION_STARTED:
            case cast.framework.SessionState.SESSION_RESUMED:
              setStatus(describeSession(context.getCurrentSession()));
              break;
            case cast.framework.SessionState.SESSION_ENDED:
              setStatus('Cast session ended.');
              break;
            case cast.framework.SessionState.SESSION_START_FAILED:
              setStatus('Cast session failed to start.');
              break;
            default:
              break;
          }
        }
      );

      castButton.addEventListener('click', async () => {
        try {
          setStatus('Opening Cast device chooser...');
          await context.requestSession();
          setStatus(describeSession(context.getCurrentSession()));
        } catch (error) {
          if (error !== 'cancel') setStatus(`Could not start Cast session: ${error}`);
          else setStatus('Cast device chooser closed.');
        }
      });

      stopButton.addEventListener('click', async () => {
        const session = context.getCurrentSession();
        if (!session) {
          setStatus('No active Cast session.');
          return;
        }
        try {
          await session.endSession(true);
          setStatus('Cast session ended.');
        } catch (error) {
          setStatus(`Could not end Cast session: ${error}`);
        }
      });

      setStatus('Cast ready. Choose a Cast device to launch the interoperability receiver.');
    } catch (error) {
      setStatus(`Cast initialization failed: ${error}`);
    }
  };
})();
