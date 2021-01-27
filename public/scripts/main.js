// main.js - здесь в основном работа с DOM, уведомления, отправка на данных на сервер.

const pages = ["#main","#reg","#auth","#todo","#admin"]; //массив страниц

//переход на другой раздел
let startPage = (to) => {
    goTo(to,0)
};

startPage("#main") //по умолчанию мы попадаем в основной раздел

//Автоматический вход через куки и хэш
socket.emit("auto_login", {
    id: userId,
    data: {
        email: get_cookie("hash").split('|')[0],
        auth_hash:  get_cookie("hash").split('|')[1],
    },
})

//Получить значение куки с помощью регулярного выражения
function get_cookie (cookie_name)
{
    let results = document.cookie.match ( '(^|;) ?' + cookie_name + '=([^;]*)(;|$)' );

    if ( results )
        return ( unescape ( results[2] ) );
    else
        return null;
}

//Функция для перехода между страницами.
function goTo(to,time) {
    console.log(`to: ${to} // time: ${time}`);
    pages.forEach(function (item) {
        $(item).hide(time); //сначала закрываем абсолютно все блоки (со страницами)
    })
    $(to).show(time); //открываем нужный

    if (to === "#todo") { //если мы зашли в список задач => получаем список наших задач
        socket.emit("getList", {
            id: userId,
            email: get_cookie('hash').split('|')[0],
            role:0
        })
    } else if (to === '#admin') { //если мы зашли в админку, получаем список пользователей
        socket.emit('getUsers', {
            id: userId
        })
    }
}

//функция регистрации
function signUp() {
    //массив ошибок
    const errors = [];

    //Объект с полями
    let userFields =  {
        name: $("#signup_name").val(),
        surname: $("#signup_surname").val(),
        email: $("#signup_email").val(),
        password: $("#signup_pass").val()
    }
    //Проверка полей
    if (userFields.name.length < 3) errors.unshift("Имя должно содержать минимум 3 символа")
    if (userFields.surname.length <3 ) errors.unshift("Фамилия должна содержать минимум 3 символа")
    if (!validateEmail(userFields.email)) errors.unshift("Почта введена неверно")
    if (!validatePassword(userFields.password)) errors.unshift("Пароль должен содержать латинские символы и иметь длину минимум 6 символов")

    //если есть хотя-бы одна ошибка - выводим!
    if (errors.length > 0) {
        errors.forEach(function (item) {
            Show("error",item)
        })
    } else {
        socket.emit("signup_message",{
            id: userId,
            data: userFields
        })
    }
}

//Авторизация пользователя
function Login() {
    //массив ошибок
    const errors = [];


    //Объект с полями
    let userFields =  {
        email: $("#login_email").val(),
        password: $("#login_pass").val()
    }


    if (userFields.email.length > 0 && userFields.password.length > 0) {
        socket.emit("login_message", {
            id: userId,
            data: userFields,
            dttime: new Date().getTime()
        })
    }
}

//валидация пароля
function validatePassword(password)
{
    const re = /^[A-Za-z]\w{6,}/;
    return re.test(password);
}

//валидация почты
function validateEmail(email)
{
    const re = /\S+@\S+\.\S+/;
    return re.test(email);
}


//To-do list: работа с списками  задач
let objectList;
function  updateList(list_d,listName) {
    console.log(list_d);
    const list_tab = $(listName);

    objectList = list_d;

    list_tab.empty();

    list_d.forEach(function(element,index) {
        list_tab.append($('<button class="list-group-item btn-outline-danger  list-group-item-action"  data-toggle="list" value="'+index+'" onclick="ClickTask(this.value)">'+ element.title +'</button>'));
    });
    $("#todo-content").html("");
}

//Обновления списка пользователей для Админа
function  updateUsers(list_d) {
    const list_users = $("#list-tab-users");

    list_users.empty();

    list_d.forEach(function(element,index) {
        list_users.append($('<button class="list-group-item btn-outline-danger  list-group-item-action" data-toggle="list" value="'+element.email+'" onclick="getUserTasks(this.value)">'+ element.email+'</button>'));
    });
    $("#list-tab-tasks").html("");
}

//По клику по задачи открывается ее описание
function ClickTask(index) {
    $("#btn-manage-task").val(objectList[index].id) //кнопка будет содержать email пользователя
    $("#btn-manage-task").attr("data-title",objectList[index].title);

    $("#todo-content").html(objectList[index].text + "<hr>Истекает: "+ objectList[index].expire)
    $("#todo-delete").val(objectList[index].id)
}

//Получить список задач
function getUserTasks(email) {
    $("#btn-manage-user").val(email) //кнопка будет содержать email пользователя
    $("#list-tab-tasks").empty()
    socket.emit("getList", {
        id: userId,
        email: email,
        role: 1
    })
}

//Удаление задачи
function deleteTask(id) {
    if (id > 0) {
        Swal.fire({
            title: 'Вы уверены?',
            text: "Вы хотите удалить задачу?",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Да, удалить'
        }).then((result) => {
            if (result.isConfirmed) {
                socket.emit("delete_task", {
                    id: userId,
                    data: {task_id: id, author: get_cookie('hash').split('|')[0]}
                })
            }
        })
    }
}

//Создание задачи
async function createTask() {
    const { value: formValues } = await Swal.fire({
        title: 'Добавить задачу',
        html:
            '<p>Заголовок</p><input id="swal-input1" class="swal2-input">' +
            '<p>Описание</p><textarea id="swal-input2" class="swal2-input"></textarea>' +
            '<p>Дата завершения</p><input id="swal-input3" type="date" class="swal2-input">',
        focusConfirm: false,
        preConfirm: () => {
            return [
                document.getElementById('swal-input1').value,
                document.getElementById('swal-input2').value,
                document.getElementById('swal-input3').value
            ]
        }
    })

    if (formValues) {
        socket.emit("create_task", {
            id: userId,
            author: get_cookie('hash').split('|')[0],
            data: formValues
        })
    }
}

//Управление пользователем
function manageUser(email) {
    if (email.length > 0) {
        Swal.fire({
            title: 'Пользователь: ' + email,
            showDenyButton: true,
            showCancelButton: true,
            confirmButtonText: `Забанить`,
            denyButtonText: `Удалить`,
        }).then((result) => {
            /* Read more about isConfirmed, isDenied below */
            if (result.isConfirmed) {
                socket.emit('banUser', {
                    id: userId,
                    email: email
                })
            } else if (result.isDenied) {
                console.log("Временно недоступно")
            }
        })
    } else {
        Show("error","Пользователь не выбран")
    }
}

//Управление заданием
function manageTask(id, title) {
    if (title !== undefined) {
        Swal.fire({
            title: 'Задача: ' + title,
            showCancelButton: true,
            confirmButtonText: `Удалить`,
        }).then((result) => {
            /* Read more about isConfirmed, isDenied below */
            if (result.isConfirmed) {
                console.log("Временно недоступно")
            }
        })
    } else {
        Show("error","Задача не выбрана")
    }

}

//Функция выхода из профиля
function Exit() {
    document.cookie = "hash=" + 0 + ";max-age=0;path=/"; //очищаем куки
    goTo('#auth')
}