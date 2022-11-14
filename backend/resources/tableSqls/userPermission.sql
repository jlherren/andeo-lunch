CREATE TABLE `userPermission` (
  `user` int(11) NOT NULL,
  `permission` int(11) NOT NULL,
  PRIMARY KEY (`user`,`permission`),
  KEY `userPermission_permission_idx` (`permission`),
  CONSTRAINT `userPermission_ibfk_1` FOREIGN KEY (`user`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `userPermission_ibfk_2` FOREIGN KEY (`permission`) REFERENCES `permission` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
