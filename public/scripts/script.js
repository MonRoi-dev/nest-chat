const app = () => {
  const socket = io('http://localhost:5000');
  const msgInput = document.querySelector('.messageToSend');
  const msgList = document.querySelector('.messageList');
  const sendBtn = document.querySelector('#sendBtn');
  const msgBody = document.querySelector('.messages');
  const username = document.querySelector('.username');
  const msgBar = document.querySelector('.message-input');
  const contactBar = document.querySelector('.contact-profile');
  const avatar = document.querySelector('.avatar');
  const allMessages = [];
  let userId;
  let roomId;
  let toEdit;

  if (!roomId) {
    msgBar.style.display = 'none';
    contactBar.style.display = 'none';
  }

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
      return userId;
    } catch (error) {
      console.log(error.message);
    }
  }

  function renderMessages(messages, userId) {
    let messagesHtml = '';
    messages.forEach((message) => {
      let time = new Date(message.createdAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
      if (message.roomId == roomId) {
        if (message.userId === userId) {
          messagesHtml += `<li id="${message.id}" class="replies">
          <p><span class="text">${message.content}</span>
            <label class="timeReplied">${time}</label>
          </p>
          <div class="option__buttons">
            <i class="bi bi-trash-fill"></i>
            <i class="bi bi-pencil-fill"></i>
          </div>
        </li>`;
        } else {
          messagesHtml += `<li class="sent">
          <p>${message.content}
            <label class="timeSent">${time}</label>
          </p>
        </li>`;
        }
      }
    });

    msgList.innerHTML = messagesHtml;
    msgBody.scrollTop = msgBody.scrollHeight;
  }

  function handleSendMesage(content) {
    if (!content.trim()) {
      return;
    } else {
      sendMessage({ content, userId, roomId });
      msgInput.value = '';
    }
  }

  function handleEditMesage(content) {
    if (!content.trim()) {
      return;
    } else {
      editMessage({ content, toEdit });
      toEdit = '';
      msgInput.value = '';
    }
  }

  // msgInput.addEventListener('keydown', (e) => {
  //   e.keyCode === 13 && toEdit
  //     ? handleEditMesage(e.target.value)
  //     : handleSendMesage(e.target.value);
  // });

  sendBtn.addEventListener('click', () => {
    toEdit
      ? handleEditMesage(msgInput.value)
      : handleSendMesage(msgInput.value);
  });

  function sendMessage(payload) {
    socket.emit('sendMessage', payload);
  }

  socket.on('recMessage', (createdMessage) => {
    allMessages.push(createdMessage);
    renderMessages(allMessages, userId);
  });

  function joinRoom(roomId, userId) {
    const payload = {
      roomId,
      userId,
    };
    socket.emit('joinRoom', payload);
  }

  document.addEventListener('DOMContentLoaded', function () {
    const contacts = document.querySelectorAll('.contact');

    contacts.forEach((contact) => {
      contact.addEventListener('click', async function () {
        msgBar.style.display = 'block';
        contactBar.style.display = 'block';
        roomId = this.dataset.roomId;
        allMessages.length = 0;
        const userId = await getMessages(roomId);
        joinRoom(roomId, userId);
        messagesOptions();
      });
    });
  });

  socket.on('roomJoining', (room) => {
    username.textContent = room.users[0].users.username;
    avatar.src = `/images/${room.users[0].users.image}`;
  });

  let typing = false;
  let timeout = undefined;

  function timeoutFunction() {
    typing = false;
    socket.emit('notTyping', roomId);
  }

  function onKeyDownNotEnter() {
    if (typing == false) {
      typing = true;
      socket.emit('typing', roomId);
      timeout = setTimeout(timeoutFunction, 1500);
    } else {
      clearTimeout(timeout);
      timeout = setTimeout(timeoutFunction, 1500);
    }
  }

  msgInput.addEventListener('input', () => {
    onKeyDownNotEnter();
  });

  const typingText = document.createElement('p');
  typingText.style.marginLeft = '3px';

  socket.on('isTyping', (serverRoomId) => {
    if (roomId === serverRoomId) {
      typingText.textContent = 'typing...';
      typingText.className = 'typingText';
      contactBar.appendChild(typingText);
    }
  });

  socket.on('notTyping', () => {
    if (contactBar.querySelector('.typingText')) {
      contactBar = contactBar.removeChild(typingText);
    }
  });

  const imageStatus = document.querySelector('#profile-img');

  socket.on('connect', () => {
    imageStatus.className = 'online';
  });

  socket.on('disconnect', () => {
    imageStatus.className = 'offline';
  });

  function messagesOptions() {
    const options = document.querySelectorAll('.option__buttons');
    const newDiv = document.createElement('div');

    options.forEach((btn) => {
      btn.querySelector('.bi-pencil-fill').addEventListener('click', () => {
        newDiv.className = 'messageToEdit';
        newDiv.innerHTML = btn.parentElement.innerHTML;
        msgInput.parentNode.insertBefore(newDiv, msgInput);
        toEdit = btn.parentElement;
      });

      btn.querySelector('.bi-trash-fill').addEventListener('click', () => {
        deleteMessage(btn.parentElement);
      });
    });
  }

  function editMessage(payload) {
    const message = allMessages.find((msg) => msg.id == payload.toEdit.id);
    const edited = toEdit.querySelector('.text');
    edited.textContent = payload.content;
    message.content = payload.content;
    socket.emit('editMessage', message);
  }

  function deleteMessage(messageToDelete) {
    const message = allMessages.find((msg) => msg.id == messageToDelete.id);
    socket.emit('deleteMessage', message);
    messageToDelete.remove();
  }
};

app();
