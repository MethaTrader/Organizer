//server.js - сервер на nodeJS. Принимает и отправляет данные, работает с Базой Данных

const mysql = require("mysql2")  //работа с БД
const socketIO = require('socket.io');  //для работы RealTime с клиентом
const path = require('path')  //для роутинга
const WebSocket = require('ws')
const express = require('express')  //для простоты
const http = require('http');

const md5 = require('md5') //для хєширования auth (для куки автовход)

const publicPath = path.join(__dirname, '../public');
const port = process.env.PORT || 4200;

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(express.static(publicPath));

let admins = []; //массив UID администраторов. [не используется]

//Начинаем прослушивание по порту 4200
server.listen(port, () => {
    console.log(`Server has been started on port ${port}`);
});

//Если подключился новый пользователь
io.on('connection', (socket) => {
    console.log("A new user just connected");

    //Если подключенный пользователь отключился
    socket.on("disconnect", () => {
        console.log("User was disconnected");
    });

    //Получение message от клиента и отправка его
    socket.on("message", (message) => {
        console.log(message);
        io.emit('message', {
            id: message.id,
            text: message.message
        });
    });

    //Событие регистрации (сначала проверяем нет ли пользователя, потом регистрируемся). Валидность данных я оставил на клиент.
    socket.on("signup_message", (message) => {
        connection.query('SELECT COUNT(email) FROM accounts WHERE email = ?',[message.data.email], function (error,results){
            if (results[0]['COUNT(email)'] === 0) {
                //Регистрируемся
                connection.query('INSERT INTO accounts (name, surname, email, password, status, role) VALUES (?, ?, ?, ?, ?, ?)',[message.data.name,message.data.surname,message.data.email,message.data.password,1,0], function (error,result){
                    if (result) {
                        io.emit('message', {
                            id: message.id,
                            text: 'Вы успешно зарегистрированы',
                            icon: 'success'
                        })
                    } else {
                        io.emit('message', {
                            id: message.id,
                            text: error,
                            icon: 'error'
                        })
                        console.error(error)
                    }
                })
            } else {
                io.emit('message', {
                    id: message.id,
                    text: "Почта уже зарегистрирована",
                    icon: 'error'
                })
            }
        })
    })

    //Событие авторизации. Мы получаем данные из полей и unixTime даты для генерации хэша для автовхода
    //Устанавливаем в auth наш хєш, он будет служить для проверки подлинности пользователя.
    socket.on("login_message", (message) => {
        let hash = md5(message.dttime);
        connection.query(
            'UPDATE accounts SET auth = ? WHERE email = ? && password = ?',[hash,message.data.email,message.data.password],
            function(err, results, fields) {
                console.log(results)
                if (!err) {
                    if (results.changedRows === 1) {

                        //получаем значение status и role
                        connection.query('SELECT status,role FROM accounts WHERE email = ?', [message.data.email], function (err,result) {
                            if (!err) {
                                if (result.length > 0) {
                                    io.emit('message', {
                                        id: message.id,
                                        text: result[0].status === 1 ? "Вы успешно авторизированы" : "Вы были забанены",
                                        icon: result[0].status === 1 ? 'success' : 'warning',
                                        hash: message.data.email+"|"+hash,
                                        role: result[0].role
                                    });
                                    result[0].role === 1 ? admins.push(message.id) : admins.sort(); //добавляем админа (если он имеет role = 1)
                                }
                            }
                        })
                    } else {
                        io.emit('message', {
                            id: message.id,
                            text: "Логин или пароль указан неверно",
                            icon: 'error'
                        })
                    }
                } else console.log(err)
            }
        );
    });
    //Автоматический вход. Если хэш из базы данных и хэш от клиента совпадают -> входим.
    socket.on("auto_login", (message) =>{
        console.log(message)
        connection.query(
            'SELECT COUNT(email) FROM accounts WHERE auth=? && email = ?',[message.data.auth_hash,message.data.email],
            function(err, results, fields) {
                console.log(results)
                if (!err) {
                    if (results[0]['COUNT(email)'] === 1)
                        connection.query('SELECT status,role FROM accounts WHERE email = ?', [message.data.email], function (err,result) {
                            if (!err) {
                                if (result.length > 0) {
                                    io.emit("auto", {
                                        id: message.id,
                                        role: result[0].role
                                    });
                                    result[0].role === 1 ? admins.push(message.id) : admins.sort(); //добавляем админа (если он имеет role = 1)
                                }
                            }
                        })
                    } else {
                        console.log("Invalid Hash");
                    }
            }
        );
    })

    //Получаем список задач для пользователя (по email)
    socket.on("getList", (message) => {
        connection.query(
            'SELECT * FROM tasks WHERE author = ?',[message.email],
            function(err, results, fields) {
                if (!err) {
                    if (results.length > 0) {
                        io.emit("getList", {
                            id: message.id,
                            list: results,
                            role: message.role
                        })
                    } else {
                        console.log("Данных нет")
                    }
                } else console.log(err)
            }
        );
    })

    //Блокировка пользователя. Установка status = 0 в БД и отправка уведомления клиенту.
    socket.on("banUser", (message) => {
        connection.query(
            'UPDATE accounts SET status = ? WHERE email = ?',[0,message.email],
            function(err, results, fields) {
                if (!err) {
                    if (results.changedRows === 1) {
                        io.emit("banUser", {
                            id: message.id,
                            email: message.email,
                        })
                    } else {
                        console.log("Данных нет или пользователь уже забанен")
                    }
                } else console.log(err)
            }
        );
    })

    //Удаление задачи. Получаем id задачи и автора
    socket.on("delete_task", (message) => {
        connection.query(
            'DELETE FROM tasks WHERE id = ? && author = ?',[message.data.task_id,message.data.author],
            function(err, results, fields) {
                console.log(results)
                if (!err) {
                    if (results.affectedRows > 0) {
                        io.emit("deletedTask", {
                            id: message.id,
                            task_id: message.data.task_id
                        })
                    } else {
                        console.log("Данных нет")
                    }
                } else console.log(err)
            }
        );
    })

    //Создаем задачу добавлением новой записи в таблицу tasks
    socket.on("create_task", (message) => {
        console.log(message.data[0])
        if (message.data[0].length > 0 && message.data[1].length > 0 && message.data[2].length > 0) {
            connection.query('INSERT INTO tasks (title, text, expire, author) VALUES (?, ?, ?, ?)',[message.data[0],message.data[1],message.data[2],message.author], function (error,result){
                if (result) {
                    io.emit('message', {
                        id: message.id,
                        text: 'Задача успешно добавлена',
                        icon: 'success'
                    })
                } else {
                    io.emit('message', {
                        id: message.id,
                        text: error,
                        icon: 'error'
                    })
                    console.error(error)
                }
            })
        } else {
            io.emit('message', {
                id: message.id,
                text: "Поля не заполнены",
                icon: 'error'
            })
        }
    })


    //Админка функции
    socket.on("getUsers", (message) => {
        connection.query(
            'SELECT * FROM accounts WHERE status = ? ORDER by id DESC',[1],
            function(err, results, fields) {
                if (!err) {
                    if (results.length > 0) {
                        io.emit("getUsers", {
                            id: message.id,
                            list: results
                        })
                    } else {
                        console.log("Данных нет")
                    }
                } else console.log(err)
            }
        );
    })
})

//======================================================

//Подключение к базе данных
const connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    database: "organizer",
    password: "root"
});

//Подключение + проверка подключения
connection.connect(function(error){
    if (error) {
        return console.error("Ошибка: " + error.message);
    } else  console.log("Подключение к Базе данных успешно установлено");
});


