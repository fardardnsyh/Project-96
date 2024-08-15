    async function loadHistory() {
  const token = localStorage.getItem('token'); // Get the token from local storage

  if (!token) {
    console.error('User is not authenticated');
    return;
  }

  try {
    const response = await fetch('/history', {
      headers: {
        'Authorization': `Bearer ${token}` // Add the token in the header
      }
    });

    if (!response.ok) {
      const errorText = await response.text(); // Read the error message
      throw new Error(`HTTP error! Status: ${response.status} - ${errorText}`);
    }

    const text = await response.text(); // Read the response as text
    let messages;
    
    try {
      messages = JSON.parse(text); // Try parsing as JSON
    } catch (error) {
      throw new Error(`Invalid JSON response: ${text}`);
    }
    
    const chatHistory = document.getElementById('chat-history');
    chatHistory.innerHTML = ''; // Clear existing content

    messages.forEach(msg => {
      const messageElement = document.createElement('div');
      messageElement.className = `message ${msg.sender}`;

      const logo = document.createElement('img');
      logo.src = msg.sender === 'user' ? 'assets/user.png' : 'assets/bot.png'; 

      const textElement = document.createElement('span');
      textElement.innerText = `${msg.message || 'No response'}`; 

      messageElement.appendChild(logo);
      messageElement.appendChild(textElement);

      chatHistory.appendChild(messageElement);
    });
  } catch (error) {
    console.error('Error loading chat history:', error);
    const chatHistory = document.getElementById('chat-history');
    chatHistory.innerHTML = '<p>Error loading chat history. Please try again later.</p>';
  }
}


    function goBack() {
      window.location.href = '/home.html';
    }

    loadHistory();
