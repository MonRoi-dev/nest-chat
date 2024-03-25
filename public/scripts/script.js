const app = () => {
  const socket = io('http://localhost:5000');
  const msgInput = document.querySelector('.messageToSend');
  const msgList = document.querySelector('.messageList');
  const sendBtn = document.querySelector('#sendBtn');
  const msgBody = document.querySelector('.messages');
  const username = document.querySelector('.username');
  const msgBar = document.querySelector('.message-input');
  const contactBar = document.querySelector('.contact-profile');
  const allMessages = [];
  let userId;
  let roomId = null;

  async function getMessages(roomId) {
    try {
      const { data } = await axios.get(
        `http://localhost:5000/messages?roomId=${roomId}`,
      );
      userId = data.userId;
      renderMessages(data.messages, userId);
      data.messages.forEach((element) => {
        allMessages.push(element);
      });
    } catch (error) {
      msgBar.style.visibility = 'hidden';
      contactBar.style.visibility = 'hidden';
      console.log(error.message);
    }
  }
  getMessages(roomId);

  function renderMessages(messages, userId) {
    let messagesHtml = '';
    if (!roomId) {
      msgBody.innerHTML += `<div class="messages"><h1 style="color: black">Select Room!</h1></div>`;
      msgList.innerHTML = messagesHtml;
    } else {
      username.innerHTML = `<p class="usernam">${messages[messages.length - 1].room.users[0].users.username}</p>`;
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
    }

    msgList.innerHTML = messagesHtml;
    msgBody.scrollTop = msgBody.scrollHeight;
  }

  function handldeSendMesage(content) {
    if (!content.trim()) {
      return;
    } else {
      sendMessage({ content, userId, roomId });
      msgInput.value = '';
    }
  }

  msgInput.addEventListener(
    'keydown',
    (e) => e.keyCode === 13 && handldeSendMesage(e.target.value),
  );

  sendBtn.addEventListener('click', () => handldeSendMesage(msgInput.value));

  function sendMessage(payload) {
    socket.emit('sendMessage', payload);
  }

  socket.on('recMessage', (createdMessage) => {
    allMessages.push(createdMessage);
    renderMessages(allMessages, userId);
  });

  function joinRoom(roomId) {
    socket.emit('joinRoom', roomId);
  }

  document.addEventListener('DOMContentLoaded', function () {
    const contacts = document.querySelectorAll('.contact');

    contacts.forEach((contact) => {
      contact.addEventListener('click', function () {
        msgBar.style.visibility = 'visible';
        contactBar.style.visibility = 'visible';
        roomId = this.dataset.roomId;
        allMessages.length = 0;
        getMessages(roomId);
        joinRoom(roomId);
      });
    });
  });
};

app();
