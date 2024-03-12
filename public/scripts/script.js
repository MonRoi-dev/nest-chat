const app = () => {
  const socket = io('http://localhost:5000');
  const msgInput = document.querySelector('.messageToSend');
  const msgList = document.querySelector('.messageList');
  const sendBtn = document.querySelector('#sendBtn');
  // const userList = document.querySelector('#people-list');
  // const groupFind = document.querySelector('.find');
  const allMessages = [];
  let userId;

  const getMessages = async () => {
    try {
      const { data } = await axios.get('http://localhost:5000/messages');
      userId = data.userId;
      renderMessages(data.messages, userId);

      data.messages.forEach((element) => {
        allMessages.push(element);
      });
    } catch (error) {
      console.log(error.message);
    }
  };
  getMessages();

  const renderMessages = (messages, userId) => {
    let messagesHtml = '';

    messages.forEach((message) => {
      if (message.userId === userId) {
        messagesHtml += `<li class="sent">
          <img src="http://emilcarlsson.se/assets/mikeross.png" alt="" />
          <p>${message.content}</p>
        </li>`;
      } else {
        messagesHtml += `<li class="replies">
          <img src="http://emilcarlsson.se/assets/harveyspecter.png" alt="" />
          <p>${message.content}</p>
        </li>`;
      }
    });

    msgList.innerHTML = messagesHtml;
  };

  const handldeSendMesage = (content) => {
    if (!content.trim()) {
      return;
    } else {
      sendMessage({ content, userId });
      msgInput.value = '';
    }
  };

  msgInput.addEventListener(
    'keydown',
    (e) => e.keyCode === 13 && handldeSendMesage(e.target.value),
  );

  sendBtn.addEventListener('click', () => handldeSendMesage(msgInput.value));

  const sendMessage = (payload) => socket.emit('sendMessage', payload);

  socket.on('recMessage', (createdMessage) => {
    allMessages.push(createdMessage);
    renderMessages(allMessages, userId);
  });
};

app();
