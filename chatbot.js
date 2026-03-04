const OPENAI_API_KEY = "YOUR_OPENAI_API_KEY_HERE";

const conversationHistory = [
  {
    role: "system",
    content: "안녕하세요. 너는 VoiMeow 고객센터의 친절한 상담원이야. 고양이 관련 제품과 서비스에 대해 도움을 주고, 사용자의 질문에 정중하고 도움이 되는 답변을 제공해주세요."
  }
];

const chatbotMessagesContainer = document.getElementById("chatbotMessages");
const userMessageTextarea = document.getElementById("chatbotUserInput");
const sendChatMessageButton = document.getElementById("chatbotSendButton");

async function requestChatCompletionFromOpenAI(userMessageText) {
  conversationHistory.push({
    role: "user",
    content: userMessageText
  });

  try {
    const apiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: conversationHistory,
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!apiResponse.ok) {
      const errorData = await apiResponse.json();
      throw new Error(`API 오류: ${errorData.error?.message || apiResponse.statusText}`);
    }

    const chatCompletionResponse = await apiResponse.json();
    const assistantReplyContent = chatCompletionResponse.choices[0].message.content;
    
    conversationHistory.push({
      role: "assistant",
      content: assistantReplyContent
    });

    return assistantReplyContent;
  } catch (error) {
    console.error("OpenAI API 호출 중 오류 발생:", error);
    throw new Error(`API 요청 실패: ${error.message}`);
  }
}

function createAndAppendChatMessage(messageContent, messageSenderRole) {
  const messageWrapper = document.createElement("div");
  messageWrapper.classList.add("chatbot-message");
  messageWrapper.classList.add(messageSenderRole === "user" ? "user-message" : "assistant-message");
  
  const avatarElement = document.createElement("div");
  avatarElement.classList.add("chatbot-message-avatar");
  avatarElement.textContent = messageSenderRole === "user" ? "👤" : "🤖";
  
  const contentElement = document.createElement("div");
  contentElement.classList.add("chatbot-message-content");
  contentElement.textContent = messageContent;
  
  messageWrapper.appendChild(avatarElement);
  messageWrapper.appendChild(contentElement);
  chatbotMessagesContainer.appendChild(messageWrapper);
  
  chatbotMessagesContainer.scrollTop = chatbotMessagesContainer.scrollHeight;
}

function displayLoadingIndicator() {
  const loadingWrapper = document.createElement("div");
  loadingWrapper.classList.add("chatbot-message", "assistant-message");
  loadingWrapper.id = "chatbotLoadingIndicator";
  
  const avatarElement = document.createElement("div");
  avatarElement.classList.add("chatbot-message-avatar");
  avatarElement.textContent = "🤖";
  
  const loadingContent = document.createElement("div");
  loadingContent.classList.add("chatbot-loading-indicator");
  
  for (let i = 0; i < 3; i++) {
    const dotElement = document.createElement("div");
    dotElement.classList.add("chatbot-loading-dot");
    loadingContent.appendChild(dotElement);
  }
  
  loadingWrapper.appendChild(avatarElement);
  loadingWrapper.appendChild(loadingContent);
  chatbotMessagesContainer.appendChild(loadingWrapper);
  
  chatbotMessagesContainer.scrollTop = chatbotMessagesContainer.scrollHeight;
}

function removeLoadingIndicator() {
  const loadingElement = document.getElementById("chatbotLoadingIndicator");
  if (loadingElement) {
    loadingElement.remove();
  }
}

function toggleChatInputState(isDisabled) {
  sendChatMessageButton.disabled = isDisabled;
  userMessageTextarea.disabled = isDisabled;
}

async function handleSendMessageAction() {
  const userInputText = userMessageTextarea.value.trim();
  
  if (!userInputText) {
    return;
  }
  
  createAndAppendChatMessage(userInputText, "user");
  userMessageTextarea.value = "";
  userMessageTextarea.style.height = "auto";
  
  toggleChatInputState(true);
  displayLoadingIndicator();
  
  try {
    const assistantReply = await requestChatCompletionFromOpenAI(userInputText);
    removeLoadingIndicator();
    createAndAppendChatMessage(assistantReply, "assistant");
  } catch (error) {
    removeLoadingIndicator();
    createAndAppendChatMessage(`죄송합니다. 오류가 발생했습니다: ${error.message}`, "assistant");
  } finally {
    toggleChatInputState(false);
    userMessageTextarea.focus();
  }
}

sendChatMessageButton.addEventListener("click", handleSendMessageAction);

userMessageTextarea.addEventListener("keypress", (keyboardEvent) => {
  if (keyboardEvent.key === "Enter" && !keyboardEvent.shiftKey) {
    keyboardEvent.preventDefault();
    handleSendMessageAction();
  }
});

userMessageTextarea.addEventListener("input", function() {
  this.style.height = "auto";
  this.style.height = Math.min(this.scrollHeight, 120) + "px";
});

createAndAppendChatMessage("안녕하세요! 저는 VoiMeow의 AI 상담원입니다. 고양이 관련 서비스에 대해 궁금하신 점을 물어보세요! 😊", "assistant");
