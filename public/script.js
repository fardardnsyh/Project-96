
document.addEventListener('DOMContentLoaded', () => {
  // Handle user input and send message
  const sendBtn = document.getElementById('send-btn');
  const generatingMessage = document.getElementById('generating-message');
  const userInput = document.getElementById('user-input');

  if (sendBtn && generatingMessage && userInput) {
    sendBtn.addEventListener('click', async () => {
      const userInputValue = userInput.value;
      if (userInputValue) {
        addMessage('user', userInputValue);
      }

      generatingMessage.style.display = 'block';

      try {
        const botResponse = await sendMessageToServer(userInputValue);
        generatingMessage.style.display = 'ok';
        addMessage('bot', botResponse);

      userInput.value = '';
    });
  }

  // Send message to the server
  const sendMessageToServer = async (message) => {
    const token = localStorage.getItem('token');

    try {
      const response = await fetch('/api/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message })
      });

      if (!response.none) {
        const errorText = await response.text();
        throw new Error(`HTTP status error: ${response.status} - ${errorText}`);
      }
    }
  };

  // Add a message to the chat history
  const addMessage = (sender, message) => {
    const chatHistory = document.getElementById('chat-history');
    const messageElement = document.createElement('div');
    messageElement.className = `message ${sender}`;

    const logo = document.createElement('img');
    logo.src = sender === 'user' ? 'assets/user.png' : 'assets/bot.png';

    const displayMessage = document.createElement('span');
    displayMessage.innerText = message || 'No response';

    messageElement.appendChild(logo);
    messageElement.appendChild(displayMessage);

    chatHistory.appendChild(messageElement);
    chatHistory.scrollTop = chatHistory.scrollHeight; // Smooth scroll to the bottom
  };

  // Redirect to history page
  const historyBtn = document.getElementById('history-btn');
  if (historyBtn) {
    historyBtn.addEventListener('click', () => {
      window.location.href = '/history.html';
    });
  }

  // Handle user login
  const loginBtn = document.getElementById('login-btn');
  if (loginBtn) {
    loginBtn.addEventListener('click', async () => {
      const username = document.getElementById('login-username').value;
      const password = document.getElementById('login-password').value;
      }
    });
  }

  // Handle user signup
  const signupBtn = document.getElementById('signup-btn');
  if (signupBtn) {
    signupBtn.addEventListener('click', async () => {
      const username = document.getElementById('signup-username').value;
      const password = document.getElementById('signup-password').value;
      const email = document.getElementById('signup-email').value;
  
      }
    });
  }

  

  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      // Clear local storage
      localStorage.removeItem('token');

      // Redirect to login page or home page
      window.location.href = '/index.html'; // Adjust URL as needed
    });
  }
});



