const cacheName = 'dynamic-agent-v1';

const handlePictureInPictureRequest = async event => {
  if (event.data.type !== 'jf-request-pip-window') {
    return;
  }
  const { url, width, height } = event.data;
  if ('documentPictureInPicture' in window) {
    // return if already in picture in picture mode
    if (window.documentPictureInPicture.window) {
      return;
    }
    const pipWindow = await window.documentPictureInPicture.requestWindow({
      width,
      height,
      disallowReturnToOpener: true
    });
    // copy styles from main window to pip window
    [...document.styleSheets].forEach(styleSheet => {
      try {
        const cssRules = [...styleSheet.cssRules]
          .map(rule => rule.cssText)
          .join('');
        const style = document.createElement('style');
        style.textContent = cssRules;
        pipWindow.document.head.appendChild(style);
      } catch (e) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.type = styleSheet.type;
        link.media = styleSheet.media;
        link.href = styleSheet.href;
        pipWindow.document.head.appendChild(link);
      }
    });
    pipWindow.document.body.innerHTML = `<iframe src="${url}" style="width: ${width}px; height: ${height}px;" allow="microphone *; display-capture *;"></iframe>`;
    return { success: true, isActive: false };
  }
};

window.addEventListener('message', handlePictureInPictureRequest);

const src = "https://www.jotform.com/s/umd/a22b552e46c/for-embedded-agent.js";
const script = document.createElement('script');
script.src = src;
script.async = true;
script.onload = function() {
  window.AgentInitializer.init({
    agentRenderURL: "https://www.jotform.com/agent/019798c1fd517d649e3a7a186e173a31446e",
    rootId: "JotformAgent-019798c1fd517d649e3a7a186e173a31446e",
    formID: "019798c1fd517d649e3a7a186e173a31446e",
    contextID: "01979d2af06777a9beded6472bdad1e99a01",
    initialContext: "",
    queryParams: ["skipWelcome=1","maximizable=1","skipWelcome=1","maximizable=1"],
    domain: "https://www.jotform.com",
    isDraggable: false,
    background: "linear-gradient(180deg, #6C73A8 0%, #6C73A8 100%)",
    buttonBackgroundColor: "#0066C3",
    buttonIconColor: "#FFFFFF",
    inputTextColor: "#01105C",
    variant: false,
    customizations: {"greeting":"Yes","greetingMessage":"Merhaba, size nas\u0131l yard\u0131mc\u0131 olabilirim?","openByDefault":"No","pulse":"Yes","position":"right","autoOpenChatIn":"5000"},
    isVoice: false,
    isVoiceWebCallEnabled: false
  });
};
document.head.appendChild(script);