// client.js - здесь идёт прием сообщений от сервера построеных на WebSockets. Промежуточное между server.js и main.js

const socket = io.connect("ws://localhost:4200")
const userId = Math.round(Math.random() * (10000 - 100) + 100)

//Если мы успешно вошли
socket.on('connect',() => {
    console.log(`Вы успешно вошли, ваш id = ${userId}`);

    socket.on('UpdateUsers', (message) => {
        //console.log(message.data);
    })
})

//Если мы отключаемся
socket.on('disconnect', () => {
    console.log('disconnected from server');
});

//Получаем message от сервера
socket.on('message', (message) => {
    if (userId === message.id) {
        Show(message.icon,message.text);
        switch (message.text) {
            case 'Вы успешно зарегистрированы':
                goTo("#auth",500)
                break;
            case 'Вы успешно авторизированы':
                document.cookie = "hash=" + message.hash + ";max-age=2592000;path=/";
                if (message.role === 0) goTo('#todo',500)
                else goTo('#admin',500)
                break;
            case 'Вы были забанены':
                goTo('#auth',500)
                break;
            case 'Задача успешно добавлена':
                socket.emit("getList", {
                    id: userId,
                    email: get_cookie('hash').split('|')[0],
                    role: 0
                })
                break;
        }
    }
});

//Получаем сообщение об автовходе (и сравниваем не забанены ли мы)
socket.on('auto', (message) => {
    if (userId === message.id) {
        if (message.role === 0) goTo('#todo',0)
        else goTo('#admin',0)
    }
});

//Получаем список задач для пользователя
socket.on('getList', (message) => {
    if (userId === message.id) {
        if (message.role === 0) updateList(message.list,"#list-tab")
        else updateList(message.list,"#list-tab-tasks") //если админ - то обновяем совсем другой <div>
    }
})

//Получаем сообщение об удалении задачи. Удаляем ее из DOM и обновляем список -> выводим Notify
socket.on('deletedTask', (message) => {
    console.log(message)
    let newobjectList = objectList.filter(value => value.id !== message.task_id);

    console.log(newobjectList)
    updateList(newobjectList)
    Show('success','Задача успешно удалена');
})

//Получаем сообщение об блокировке пользователя. Сообщение получает Администратор и Пользователь (которого забанили). Выходим из профиля и чистим куки.
socket.on('banUser', (message) => {
    if (userId === message.id) {
        Show('success','Пользователь забанен');
        setTimeout( 'location.reload()', 1000 )
    }
    if (get_cookie('hash').split('|')[0] === message.email) {
        Show('success','Вы были заблокированы')
        document.cookie = "hash=" + 0 + ";max-age=0;path=/"; //очищаем куки
        goTo('#auth')
    }
})


//Получаем список пользователей и отправляем в main.js на обновление
socket.on('getUsers', (message) => {
    if (userId === message.id) {
        updateUsers(message.list);
    }
})