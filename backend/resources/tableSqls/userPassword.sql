CREATE TABLE `userPassword` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user` int(11) NOT NULL,
  `password` varchar(255) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `lastChange` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `userPassword_user_idx` (`user`),
  CONSTRAINT `userPassword_ibfk_1` FOREIGN KEY (`user`) REFERENCES `user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
