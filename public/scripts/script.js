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
      if (message.userId === userId) {
        if (message.isImage) {
          messagesHtml += `<li id="${message.id}" class="replies">
          <p>
          <img class="sentImage"
  src="/images/messages/${message.content}"/>
            <label class="timeReplied">${time}</label>
            </p>
          <div class="option__buttons">
            <i class="bi bi-trash-fill"></i>
          </div>
        </li>`;
        } else {
          messagesHtml += `<li id="${message.id}" class="replies">
          <p><span class="text">${message.content}</span>
            <label class="timeReplied">${time}</label>
          </p>
          <div class="option__buttons">
            <i class="bi bi-trash-fill"></i>
            <i class="bi bi-pencil-fill"></i>
          </div>
        </li>`;
        }
      } else {
        if (message.isImage) {
          messagesHtml += `<li class="sent">
          <p>
          <img class="sentImage"
          src="/images/messages/${message.content}"/>
            <label class="timeSent">${time}</label>
          </p>
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
      socket.emit('sendMessage', { content, userId, roomId });
      msgInput.value = '';
    }
  }

  function handleEditMesage(content) {
    if (!content.trim()) {
      return;
    } else {
      socket.emit('editMessage', { content, messageId: toEdit.id, roomId });
      clearToEdit();
    }
  }

  msgInput.addEventListener('keydown', (e) => {
    if (e.keyCode === 13) {
      toEdit
        ? handleEditMesage(e.target.value)
        : handleSendMesage(e.target.value);
    } else if (e.keyCode === 27 && toEdit) {
      clearToEdit();
    }
  });

  sendBtn.addEventListener('click', () => {
    toEdit
      ? handleEditMesage(msgInput.value)
      : handleSendMesage(msgInput.value);
  });

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

  function leaveRoom(roomId) {
    socket.emit('leaveRoom', roomId);
  }

  document.addEventListener('DOMContentLoaded', function () {
    const contacts = document.querySelectorAll('.contact');

    contacts.forEach((contact) => {
      contact.addEventListener('click', async function () {
        clearToEdit();
        msgBar.style.display = 'block';
        contactBar.style.display = 'block';
        roomId = this.dataset.roomId;
        allMessages.length = 0;
        const userId = await getMessages(roomId);
        joinRoom(roomId, userId);
        leaveRoom(roomId);
        getOptions();
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

  socket.on('isTyping', (clientId) => {
    if (clientId !== socket.id) {
      typingText.textContent = 'typing...';
      typingText.className = 'typingText';
      contactBar.appendChild(typingText);
    }
  });

  socket.on('notTyping', () => {
    if (contactBar.querySelector('.typingText')) {
      contactBar.removeChild(typingText);
    }
  });

  const imageStatus = document.querySelector('#profile-img');

  socket.on('connect', () => {
    imageStatus.className = 'online';
  });

  socket.on('disconnect', () => {
    imageStatus.className = 'offline';
  });

  socket.on('updateMessage', (editedMessage) => {
    const msgIndex = allMessages.findIndex((msg) => msg.id == editedMessage.id);
    allMessages[msgIndex] = editedMessage;
    renderMessages(allMessages, userId);
  });

  function clearToEdit() {
    msgInput.value = '';
    if (toEdit) {
      document.querySelector('.messageToEdit').remove();
      toEdit = '';
    }
  }

  function getOptions() {
    const newDiv = document.createElement('div');
    msgList.addEventListener('click', (event) => {
      const parrent = event.target.closest('.option__buttons').parentElement;
      if (event.target.classList.contains('bi-trash-fill')) {
        socket.emit('deleteMessage', { messageId: parrent.id, roomId });
      } else if (event.target.classList.contains('bi-pencil-fill')) {
        msgInput.value = '';
        msgInput.focus();
        newDiv.className = 'messageToEdit';
        newDiv.innerHTML = parrent.innerHTML;
        msgInput.parentNode.insertBefore(newDiv, msgInput);
        toEdit = parrent;
      }
    });
  }

  socket.on('deleteMessage', (deletedMessage) => {
    const msgIndex = allMessages.findIndex(
      (msg) => msg.id == deletedMessage.id,
    );
    allMessages.splice(msgIndex, 1);
    renderMessages(allMessages, userId);
    const options = document.querySelectorAll('.option__buttons');
    console.log(options, allMessages);
  });

  const image = document.querySelector('#input__file_att');

  image.addEventListener('change', (event) => {
    const selectedFile = event.target.files[0];

    if (selectedFile.size > 5 * 1024 * 1024) {
      alert('File is too big');
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const payload = {
        userId,
        roomId,
        filename: selectedFile.name,
        data: reader.result,
      };
      socket.emit('sendImage', payload);
    };
    reader.readAsArrayBuffer(selectedFile);
  });
};

app();
