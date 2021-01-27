-- phpMyAdmin SQL Dump
-- version 5.0.2
-- https://www.phpmyadmin.net/
--
-- Хост: 127.0.0.1:3306
-- Время создания: Янв 27 2021 г., 16:46
-- Версия сервера: 10.3.22-MariaDB
-- Версия PHP: 7.1.33

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- База данных: `organizer`
--

-- --------------------------------------------------------

--
-- Структура таблицы `accounts`
--

CREATE TABLE `accounts` (
  `id` int(11) NOT NULL COMMENT 'айди-пользователя',
  `name` varchar(64) NOT NULL COMMENT 'имя',
  `surname` varchar(64) NOT NULL COMMENT 'фамилия',
  `email` varchar(255) NOT NULL COMMENT 'почта',
  `password` varchar(191) NOT NULL COMMENT 'пароль',
  `status` tinyint(1) NOT NULL COMMENT 'стан (0 - неактив/1 - актив)',
  `role` tinyint(1) NOT NULL COMMENT '1 - админ/ 0 - юзер',
  `auth` varchar(128) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='органайзер ТЕСТОВОЕ ЗАДАНИЕ';

--
-- Дамп данных таблицы `accounts`
--

INSERT INTO `accounts` (`id`, `name`, `surname`, `email`, `password`, `status`, `role`, `auth`) VALUES
(1, 'Роман', 'Иванов', 'roman@gmail.com', 'q123321', 1, 0, ''),
(8, 'Admin', 'Admin', 'Admin@localhost.com', 'Q123321', 1, 1, 'a909da6c854bfc7236b5f48f09c40de9'),
(9, 'User', 'User', 'User@gmail.com', 'Q123321', 1, 0, '1d90d0bc036171b420fa34a0821654ae');

-- --------------------------------------------------------

--
-- Структура таблицы `tasks`
--

CREATE TABLE `tasks` (
  `id` int(11) NOT NULL,
  `title` varchar(64) NOT NULL,
  `text` text NOT NULL,
  `expire` varchar(32) NOT NULL,
  `author` varchar(64) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Дамп данных таблицы `tasks`
--

INSERT INTO `tasks` (`id`, `title`, `text`, `expire`, `author`) VALUES
(14, 'Задача 1', 'LightDesc+', '2021-01-27', 'Test3@gmail.com'),
(19, 'Задача новая', 'sdfsdfsf', '2021-12-31', 'Novikov2@gmail.com'),
(21, 'Задача', 'Задача новая', '2021-01-29', 'User@gmail.com');

--
-- Индексы сохранённых таблиц
--

--
-- Индексы таблицы `accounts`
--
ALTER TABLE `accounts`
  ADD PRIMARY KEY (`id`);

--
-- Индексы таблицы `tasks`
--
ALTER TABLE `tasks`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT для сохранённых таблиц
--

--
-- AUTO_INCREMENT для таблицы `accounts`
--
ALTER TABLE `accounts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'айди-пользователя', AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT для таблицы `tasks`
--
ALTER TABLE `tasks`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
