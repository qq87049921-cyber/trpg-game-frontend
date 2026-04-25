// WebSocket连接
let ws = null;
let playerName = '';
let ruleType = 'COC';
let isConnected = false;

// 连接到后端服务器
function connectToServer() {
    const wsUrl = 'ws://localhost:3000';
    ws = new WebSocket(wsUrl);

    ws.onopen = function() {
        console.log('连接成功');
        document.getElementById('connection-status').textContent = '连接成功！';
        document.getElementById('connection-status').style.color = 'green';
        
        // 发送加入游戏消息
        ws.send(JSON.stringify({
            type: 'join',
            player_name: playerName,
            rule_type: ruleType
        }));
    };

    ws.onmessage = function(event) {
        const data = JSON.parse(event.data);
        console.log('收到消息:', data);

        switch (data.type) {
            case 'join_success':
                isConnected = true;
                // 关闭连接弹窗
                document.getElementById('connection-modal').style.display = 'none';
                // 启用输入框
                enableInputs();
                // 显示玩家列表
                displayPlayers(data.players);
                break;

            case 'player_joined':
                showNotification(`${data.player_name} 加入了游戏`);
                break;

            case 'player_left':
                showNotification(`${data.player_name} 离开了游戏`);
                break;

            case 'new_message':
                addMessage(data.message_type, data.sender_name, data.content);
                break;

            case 'player_updated':
                updatePlayerCard(data);
                break;

            case 'error':
                showNotification('错误: ' + data.message);
                break;
        }
    };

    ws.onclose = function() {
        console.log('连接断开');
        isConnected = false;
        document.getElementById('connection-status').textContent = '连接断开，请刷新页面重试';
        document.getElementById('connection-status').style.color = 'red';
    };

    ws.onerror = function(error) {
        console.error('WebSocket错误:', error);
        document.getElementById('connection-status').textContent = '连接错误，请检查后端服务器是否启动';
        document.getElementById('connection-status').style.color = 'red';
    };
}

// 加入游戏
function joinGame() {
    playerName = document.getElementById('player-name').value.trim();
    ruleType = document.getElementById('rule-type').value;

    if (!playerName) {
        alert('请输入你的名字！');
        return;
    }

    document.getElementById('connection-status').textContent = '正在连接...';
    connectToServer();
}

// 启用输入框
function enableInputs() {
    document.getElementById('public-input').disabled = false;
    document.getElementById('public-input').placeholder = '输入公共消息...';
    document.getElementById('public-input').nextElementSibling.disabled = false;
    
    document.getElementById('private-input').disabled = false;
    document.getElementById('private-input').placeholder = '输入私密行动...';
    document.getElementById('private-input').nextElementSibling.disabled = false;

    // 显示游戏信息
    document.getElementById('scenario-info').innerHTML = `
        <p><strong>规则类型:</strong>${ruleType}</p>
        <p><strong>当前玩家:</strong>${playerName}</p>
        <p><strong>游戏状态:</strong>等待KP开始</p>
    `;
}

// 显示玩家列表
function displayPlayers(players) {
    if (!players || players.length === 0) {
        document.getElementById('players').innerHTML = '<p>暂无玩家</p>';
        return;
    }

    let playersHtml = players.map(player => `
        <div class="player-card" data-name="${player.name}">
            <h3>${player.name}</h3>
            <div class="player-info">
                <p><strong>职业:</strong>${player.role || '新手冒险者'}</p>
                <p><strong>HP:</strong>${player.hp || '10'}</p>
                <p><strong>状态:</strong>${player.status || '正常'}</p>
                <p><strong>规则:</strong>${player.rule_type || 'COC'}</p>
            </div>
        </div>
    `).join('');
    document.getElementById('players').innerHTML = playersHtml;
}

// 更新玩家卡片
function updatePlayerCard(playerData) {
    const card = document.querySelector(`.player-card[data-name="${playerData.player_name}"]`);
    if (card) {
        card.querySelector('.player-info').innerHTML = `
            <p><strong>职业:</strong>${playerData.role}</p>
            <p><strong>HP:</strong>${playerData.hp}</p>
            <p><strong>状态:</strong>${playerData.status}</p>
        `;
    }
}

// 发送公共消息
function sendPublicMessage() {
    if (!isConnected || !ws) {
        alert('未连接到服务器！');
        return;
    }

    let input = document.getElementById('public-input');
    let message = input.value.trim();
    if (!message) return;

    ws.send(JSON.stringify({
        type: 'message',
        sender_name: playerName,
        content: message,
        message_type: 'public'
    }));

    input.value = '';
}

// 发送私聊消息
function sendPrivateMessage() {
    if (!isConnected || !ws) {
        alert('未连接到服务器！');
        return;
    }

    let input = document.getElementById('private-input');
    let message = input.value.trim();
    if (!message) return;

    ws.send(JSON.stringify({
        type: 'message',
        sender_name: playerName,
        content: message,
        message_type: 'private',
        target_name: 'KP'
    }));

    input.value = '';
}

// 添加消息到聊天框
function addMessage(type, sender, text) {
    let container;
    if (type === 'public' || type === 'kp') {
        container = document.getElementById('public-messages');
    } else {
        container = document.getElementById('private-messages');
    }

    let messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.innerHTML = `<strong>${sender}:</strong>${text}`;
    container.appendChild(messageDiv);
    container.scrollTop = container.scrollHeight;
}

// 显示通知
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4CAF50;
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        z-index: 1000;
    `;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}